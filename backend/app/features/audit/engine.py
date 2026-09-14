import json
from typing import List, Dict, Any
from collections import defaultdict
from zxcvbn import zxcvbn

from backend.app.config import ACCOUNTS_FILE, AUDIT_RESULTS_FILE
from backend.app.features.breach_dictionary.service import breach_checker
from backend.app.features.risk_engine.scoring import calculate_baseline_risk
from backend.app.features.risk_engine.policy import check_policy_violations

def run_bulk_audit() -> Dict[str, Any]:
    """
    Run complete deterministic 50,000-account audit pipeline.
    Produces precomputed audit_results.json.
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
        is_priv = acc.get("is_privileged", False)
        grp_id = acc.get("password_group_id")
        cluster_size = group_sizes[grp_id] if grp_id is not None else 1
        
        violations = check_policy_violations(pwd, username, dept)
        total_violations_count += len(violations)
        
        z_score = zxcvbn_cache[pwd]
        
        is_breach = breach_checker.is_breached(pwd)
        if is_breach:
            breached_count += 1
            
        baseline_risk, baseline_tier = calculate_baseline_risk(
            zxcvbn_score=z_score,
            is_breached=is_breach,
            reuse_cluster_size=cluster_size,
            is_privileged=is_priv,
            policy_violations=violations
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
            "first_name": acc.get("first_name", ""),
            "last_name": acc.get("last_name", ""),
            "department": dept,
            "role": acc["role"],
            "is_privileged": is_priv,
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
            "attack_adjustment": 0.0,
            "final_risk": baseline_risk,
            "final_tier": baseline_tier,
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
        "hero_account_id": hero_account_id
    }
    
    print(f"[AuditEngine] Updating {ACCOUNTS_FILE} with audit attributes...")
    with open(str(ACCOUNTS_FILE), "w", encoding="utf-8") as f:
        json.dump(audited_accounts, f)
        
    print(f"[AuditEngine] Writing precomputed summary to {AUDIT_RESULTS_FILE}...")
    with open(str(AUDIT_RESULTS_FILE), "w", encoding="utf-8") as f:
        json.dump(audit_summary, f, indent=2)
        
    print("[AuditEngine] Audit complete!")
    return audit_summary
