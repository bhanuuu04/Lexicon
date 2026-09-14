import json
import uuid
from typing import List, Dict, Any
from collections import defaultdict
from pathlib import Path
from zxcvbn import zxcvbn

from backend.app.config import ACCOUNTS_FILE, AUDIT_RESULTS_FILE
from backend.app.features.breach_dictionary.service import breach_checker
from backend.app.features.risk_engine.scoring import (
    calculate_baseline_risk_detailed,
    compute_risk_radar_vector,
    calculate_baseline_risk,
    calculate_organization_health
)
from backend.app.features.risk_engine.policy import check_policy_violations

def _atomic_write_json(file_path: Path, data: Any, indent: int = None):
    """Safely write JSON to disk with atomic replacement."""
    file_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = file_path.with_name(f"{file_path.name}.{uuid.uuid4().hex[:8]}.tmp")
    with open(str(tmp_path), "w", encoding="utf-8") as f:
        if indent:
            json.dump(data, f, indent=indent)
        else:
            json.dump(data, f)
    try:
        tmp_path.replace(file_path)
    except Exception:
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception:
                pass
        tmp_path.rename(file_path)

def run_bulk_audit() -> Dict[str, Any]:
    """
    Run complete deterministic enterprise Active Directory credential audit pipeline.
    Produces precomputed audit_results.json and updates accounts with factor breakdowns and radar vectors.
    """
    print(f"[AuditEngine] Loading accounts from {ACCOUNTS_FILE}...")
    with open(ACCOUNTS_FILE, "r", encoding="utf-8") as f:
        accounts: List[Dict[str, Any]] = json.load(f)
        
    breach_checker.load_corpus()
    
    print(f"[AuditEngine] Analyzing {len(accounts)} accounts...")
    
    group_sizes = defaultdict(int)
    group_members = defaultdict(list)
    group_privileged = defaultdict(int)
    group_departments = defaultdict(lambda: defaultdict(int))
    
    for acc in accounts:
        grp_id = acc.get("password_group_id")
        if grp_id is not None:
            group_sizes[grp_id] += 1
            group_members[grp_id].append(acc["id"])
            if acc.get("is_privileged"):
                group_privileged[grp_id] += 1
            group_departments[grp_id][acc["department"]] += 1
            
    distinct_passwords = list(set(a["plaintext_password"] for a in accounts))
    print(f"[AuditEngine] Running zxcvbn evaluation on {len(distinct_passwords)} distinct passwords...")
    zxcvbn_cache = {}
    for pwd in distinct_passwords:
        res = zxcvbn(pwd)
        zxcvbn_cache[pwd] = res["score"]
        
    audited_accounts = []
    critical_count = 0
    high_count = 0
    medium_count = 0
    low_count = 0
    breached_count = 0
    privileged_at_risk_count = 0
    total_violations_count = 0
    
    dept_summary = defaultdict(lambda: {
        "total": 0,
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
        "privileged": 0,
        "breached": 0,
        "avg_risk": 0.0,
        "total_risk_sum": 0.0
    })
    
    hero_account_id = "ACC-00042"
    
    for acc in accounts:
        pwd = acc["plaintext_password"]
        username = acc["username"]
        dept = acc["department"]
        role = acc.get("role", "")
        is_priv = acc.get("is_privileged", False)
        grp_id = acc.get("password_group_id")
        cluster_size = group_sizes[grp_id] if grp_id is not None else 1
        dept_count = len(group_departments[grp_id]) if grp_id is not None else 1
        priv_in_cluster = group_privileged[grp_id] if grp_id is not None else (1 if is_priv else 0)
        
        violations = check_policy_violations(pwd, username=username, department=dept, role=role)
        total_violations_count += len(violations)
        
        z_score = zxcvbn_cache[pwd]
        
        is_breach = breach_checker.is_breached(pwd)
        if is_breach:
            breached_count += 1
            
        baseline_risk, baseline_tier, factors = calculate_baseline_risk_detailed(
            zxcvbn_score=z_score,
            is_breached=is_breach,
            reuse_cluster_size=cluster_size,
            is_privileged=is_priv,
            policy_violations=violations,
            department_count=dept_count,
            privileged_in_cluster=priv_in_cluster,
            password_age_days=acc.get("password_age_days")
        )
        radar = compute_risk_radar_vector(
            zxcvbn_score=z_score,
            is_breached=is_breach,
            reuse_cluster_size=cluster_size,
            is_privileged=is_priv,
            policy_violations=violations,
            department_count=dept_count,
            privileged_in_cluster=priv_in_cluster
        )
        
        if baseline_tier == "Critical":
            critical_count += 1
        elif baseline_tier == "High":
            high_count += 1
        elif baseline_tier == "Medium":
            medium_count += 1
        else:
            low_count += 1
            
        if is_priv and (baseline_tier in ["Critical", "High"]):
            privileged_at_risk_count += 1
            
        d_stat = dept_summary[dept]
        d_stat["total"] += 1
        d_stat[baseline_tier.lower()] += 1
        if is_priv:
            d_stat["privileged"] += 1
        if is_breach:
            d_stat["breached"] += 1
        d_stat["total_risk_sum"] += baseline_risk
        
        if acc.get("is_hero"):
            hero_account_id = acc["id"]
            
        audited_accounts.append({
            "id": acc["id"],
            "username": acc["username"],
            "email": acc.get("email", f"{username}@lexicon.corp"),
            "first_name": acc.get("first_name", ""),
            "last_name": acc.get("last_name", ""),
            "department": dept,
            "role": role,
            "is_privileged": is_priv,
            "sid": acc.get("sid"),
            "password_age_days": acc.get("password_age_days"),
            "mfa_enabled": acc.get("mfa_enabled", False),
            "failed_login_count": acc.get("failed_login_count", 0),
            "password_group_id": grp_id,
            "plaintext_password": pwd,
            "hash_ntlm": acc.get("hash_ntlm", ""),
            "hash_md5": acc["hash_md5"],
            "hash_sha256": acc["hash_sha256"],
            "hash_bcrypt": acc["hash_bcrypt"],
            "hash_argon2id": acc["hash_argon2id"],

            "policy_violations": violations,
            "zxcvbn_score": z_score,
            "breach_match": is_breach,
            "baseline_risk": baseline_risk,
            "baseline_tier": baseline_tier,
            "attack_adjustment": acc.get("attack_adjustment", 0.0),
            "final_risk": baseline_risk,
            "final_tier": baseline_tier,
            "factors": factors,
            "radar": radar,
            "is_hero": acc.get("is_hero", False),
            "is_blocked": acc.get("is_blocked", False),
            "blocked_reason": acc.get("blocked_reason"),
            "blocked_at": acc.get("blocked_at"),
            "last_remediated_at": acc.get("last_remediated_at")
        })

    for d, s in dept_summary.items():
        s["avg_risk"] = round(s["total_risk_sum"] / max(1, s["total"]), 4)
        del s["total_risk_sum"]
        
    top_clusters = []
    sorted_group_ids = sorted(group_sizes.keys(), key=lambda gid: (gid == 42, group_sizes[gid]), reverse=True)
    
    for gid in sorted_group_ids[:20]:
        sample_acc_id = group_members[gid][0]
        sample_acc = next(a for a in audited_accounts if a["id"] == sample_acc_id)
        top_clusters.append({
            "group_id": gid,
            "password_sample": sample_acc["plaintext_password"],
            "total_accounts": group_sizes[gid],
            "privileged_count": group_privileged[gid],
            "departments": dict(group_departments[gid]),
            "account_ids": group_members[gid][:15]
        })
        
    audit_summary = {
        "total_accounts": len(audited_accounts),
        "critical_count": critical_count,
        "high_risk_count": high_count,
        "medium_risk_count": medium_count,
        "low_risk_count": low_count,
        "breached_count": breached_count,
        "reuse_cluster_count": len(group_sizes),
        "total_reused_accounts": sum(group_sizes.values()),
        "privileged_count": sum(1 for a in audited_accounts if a["is_privileged"]),
        "privileged_at_risk_count": privileged_at_risk_count,
        "policy_violations_count": total_violations_count,
        "risk_distribution": {
            "critical": critical_count,
            "high": high_count,
            "medium": medium_count,
            "low": low_count
        },
        "department_risk_summary": dict(dept_summary),
        "top_reuse_clusters": top_clusters,
        "hero_account_id": hero_account_id,
        "organization_health": calculate_organization_health(audited_accounts)
    }
    
    print(f"[AuditEngine] Updating {ACCOUNTS_FILE} with audit attributes...")
    _atomic_write_json(ACCOUNTS_FILE, audited_accounts)
        
    print(f"[AuditEngine] Writing precomputed summary to {AUDIT_RESULTS_FILE}...")
    _atomic_write_json(AUDIT_RESULTS_FILE, audit_summary, indent=2)

    # Persist summary to Supabase
    try:
        from backend.app.supabase_client import supabase_service
        supabase_service.sync_audit_summary(audit_summary)
        supabase_service.log_audit_action(
            action="RUN_AUDIT",
            actor="Auditor SOC Engine",
            details={
                "total_accounts": len(audited_accounts),
                "critical_count": critical_count,
                "breached_count": breached_count
            }
        )
    except Exception as e:
        print(f"[AuditEngine] Supabase sync notice: {e}")
        
    print("[AuditEngine] Audit complete!")
    return audit_summary


