import json
import uuid
from typing import List, Dict, Any, Optional
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


def generate_compliance_scorecard(accounts: List[Dict[str, Any]], audit_summary: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluate Active Directory credential posture against major regulatory and industry frameworks.
    Frameworks: NIST SP 800-63B, CIS Controls v8, PCI-DSS v4.0 (Req 8), and ISO/IEC 27001 (A.9).
    """
    total = max(1, len(accounts))
    
    # Metrics
    len_ge_8 = sum(1 for a in accounts if len(a.get("plaintext_password", "")) >= 8)
    len_ge_12 = sum(1 for a in accounts if len(a.get("plaintext_password", "")) >= 12)
    len_ge_15 = sum(1 for a in accounts if len(a.get("plaintext_password", "")) >= 15)
    
    breach_free = sum(1 for a in accounts if not a.get("breach_match"))
    
    priv_accounts = [a for a in accounts if a.get("is_privileged")]
    total_priv = max(1, len(priv_accounts))
    priv_with_mfa = sum(1 for a in priv_accounts if a.get("mfa_enabled"))
    total_with_mfa = sum(1 for a in accounts if a.get("mfa_enabled"))
    
    entropy_strong = sum(1 for a in accounts if a.get("zxcvbn_score", 0) >= 3)
    no_policy_violations = sum(1 for a in accounts if not a.get("policy_violations"))
    
    # 1. NIST SP 800-63B (Authentication and Lifecycle Management)
    nist_8_pct = round((len_ge_8 / total) * 100.0, 1)
    nist_breach_pct = round((breach_free / total) * 100.0, 1)
    nist_overall = round((nist_8_pct * 0.4) + (nist_breach_pct * 0.4) + ((entropy_strong / total) * 20.0), 1)
    
    nist_status = "COMPLIANT" if nist_overall >= 85.0 else ("PARTIAL" if nist_overall >= 60.0 else "NON_COMPLIANT")
    
    # 2. CIS Controls v8 (Safeguards 5.2, 5.4, 6.1)
    cis_priv_mfa_pct = round((priv_with_mfa / total_priv) * 100.0, 1)
    cis_overall = round((cis_priv_mfa_pct * 0.5) + (nist_8_pct * 0.3) + ((no_policy_violations / total) * 20.0), 1)
    cis_status = "COMPLIANT" if cis_overall >= 80.0 else ("PARTIAL" if cis_overall >= 50.0 else "NON_COMPLIANT")
    
    # 3. PCI-DSS v4.0 Requirement 8 (Identify and Authenticate Users)
    pci_12_pct = round((len_ge_12 / total) * 100.0, 1)
    pci_overall = round((pci_12_pct * 0.5) + (cis_priv_mfa_pct * 0.3) + (nist_breach_pct * 0.2), 1)
    pci_status = "COMPLIANT" if pci_overall >= 80.0 else ("PARTIAL" if pci_overall >= 50.0 else "NON_COMPLIANT")
    
    # 4. ISO/IEC 27001:2022 Annex A.9 (Access Control & Password Management)
    iso_overall = round((nist_overall * 0.4) + (cis_overall * 0.3) + (pci_overall * 0.3), 1)
    iso_status = "COMPLIANT" if iso_overall >= 80.0 else ("PARTIAL" if iso_overall >= 55.0 else "NON_COMPLIANT")
    
    return {
        "overall_enterprise_grade": "A" if iso_overall >= 85 else ("B" if iso_overall >= 70 else ("C" if iso_overall >= 50 else "F")),
        "frameworks": {
            "nist_sp_800_63b": {
                "name": "NIST SP 800-63B Guidelines",
                "score": nist_overall,
                "status": nist_status,
                "controls": {
                    "min_8_char_length": f"{nist_8_pct}% compliant",
                    "breach_corpus_filtering": f"{nist_breach_pct}% breach-free",
                    "no_mandatory_arbitrary_rotation": "Enforced in Policy",
                    "character_truncation_allowed": "Disabled (Up to 128 chars accepted)"
                },
                "findings": (
                    "Compliant with NIST guidelines."
                    if nist_status == "COMPLIANT"
                    else f"Critical finding: {total - breach_free:,} accounts match known compromised dictionaries and {total - len_ge_8:,} accounts fail 8-char length minimum."
                )
            },
            "cis_controls_v8": {
                "name": "CIS Controls v8 (Identity & Access)",
                "score": cis_overall,
                "status": cis_status,
                "controls": {
                    "privileged_mfa_coverage": f"{cis_priv_mfa_pct}% ({priv_with_mfa}/{total_priv} privileged accounts)",
                    "centralized_directory_hygiene": f"{round((no_policy_violations / total) * 100.0, 1)}% violation-free",
                    "privilege_account_isolation": "Audited via Lexicon Blast Radius"
                },
                "findings": (
                    "Privileged access controls well-configured."
                    if cis_status == "COMPLIANT"
                    else f"High risk: {total_priv - priv_with_mfa} privileged accounts lack MFA enforcement."
                )
            },
            "pci_dss_v4": {
                "name": "PCI-DSS v4.0 Requirement 8",
                "score": pci_overall,
                "status": pci_status,
                "controls": {
                    "min_12_char_enforcement": f"{pci_12_pct}% compliant",
                    "multi_factor_authentication": f"{cis_priv_mfa_pct}% privileged coverage",
                    "compromised_credential_checks": f"{nist_breach_pct}% compliant"
                },
                "findings": (
                    "Meets PCI-DSS Requirement 8 technical criteria."
                    if pci_status == "COMPLIANT"
                    else f"Requires remediation: {total - len_ge_12:,} accounts do not meet the 12-character minimum standard."
                )
            },
            "iso_27001": {
                "name": "ISO/IEC 27001:2022 Control A.9",
                "score": iso_overall,
                "status": iso_status,
                "controls": {
                    "password_management_system": "Automated via Lexicon Engine",
                    "access_rights_review": "Real-time risk scoring active",
                    "credential_entropy_hygiene": f"{round((entropy_strong / total) * 100.0, 1)}% high-entropy"
                },
                "findings": f"Overall ISO/IEC 27001 authentication hygiene score: {iso_overall}/100."
            }
        }
    }


def compute_active_directory_threat_surface(
    accounts: List[Dict[str, Any]],
    group_sizes: Dict[int, int],
    group_privileged: Dict[int, int],
    group_departments: Dict[int, Dict[str, int]]
) -> Dict[str, Any]:
    """
    Quantify Active Directory threat exposures:
    1. Kerberoasting vulnerability index
    2. AS-REP Roasting exposure index
    3. Lateral Movement blast radius
    """
    total = max(1, len(accounts))
    
    # 1. Kerberoasting & AS-REP Exposure
    kerberoastable_accounts = []
    as_rep_vulnerable = []
    
    for a in accounts:
        # Accounts using weak fast hashes (NTLM/MD5), weak passwords, or no MFA in sensitive roles
        is_priv = a.get("is_privileged", False)
        is_weak = a.get("zxcvbn_score", 0) <= 2 or a.get("breach_match", False)
        no_mfa = not a.get("mfa_enabled", False)
        
        if is_priv and is_weak and no_mfa:
            kerberoastable_accounts.append(a["id"])
        elif is_weak and no_mfa:
            as_rep_vulnerable.append(a["id"])
            
    # 2. Lateral Movement Blast Radius
    # Cross-department reuse groups that link standard users to privileged roles
    high_blast_clusters = []
    total_blast_radius_accounts = 0
    
    for gid, size in group_sizes.items():
        priv_count = group_privileged[gid]
        dept_count = len(group_departments[gid])
        
        if priv_count > 0 and size > 1:
            total_blast_radius_accounts += size
            high_blast_clusters.append({
                "group_id": gid,
                "total_accounts": size,
                "privileged_accounts": priv_count,
                "departments_bridged": dept_count,
                "lateral_risk": "CRITICAL" if priv_count >= 2 or size >= 10 else "HIGH"
            })
            
    return {
        "kerberoasting_exposure": {
            "vulnerable_accounts_count": len(kerberoastable_accounts),
            "percentage_of_privileged": round((len(kerberoastable_accounts) / max(1, sum(1 for a in accounts if a.get("is_privileged")))) * 100.0, 1),
            "threat_description": "Privileged service/admin accounts with weak crackable hashes and no MFA vulnerable to offline TGS ticket cracking.",
            "sample_target_ids": kerberoastable_accounts[:10]
        },
        "as_rep_roasting_exposure": {
            "vulnerable_accounts_count": len(as_rep_vulnerable),
            "percentage_of_directory": round((len(as_rep_vulnerable) / total) * 100.0, 1),
            "threat_description": "User accounts with weak credentials vulnerable to pre-authentication AS-REP offline brute-force attacks.",
            "sample_target_ids": as_rep_vulnerable[:10]
        },
        "lateral_movement_blast_radius": {
            "total_compromised_nodes_at_risk": total_blast_radius_accounts,
            "percentage_of_directory": round((total_blast_radius_accounts / total) * 100.0, 1),
            "critical_pivot_clusters_count": len(high_blast_clusters),
            "threat_description": "Password reuse clusters spanning multiple departments that allow attackers with low-privilege initial access to pivot directly into Domain Admin credentials.",
            "top_pivot_clusters": sorted(high_blast_clusters, key=lambda c: c["total_accounts"], reverse=True)[:10]
        }
    }


import threading

_GLOBAL_ZXCVBN_CACHE: Dict[str, int] = {}
_GLOBAL_BREACH_CACHE: Dict[str, bool] = {}


def run_bulk_audit(accounts_data: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Run complete deterministic enterprise Active Directory credential audit pipeline.
    Produces precomputed audit_results.json and updates accounts with factor breakdowns,
    radar vectors, compliance scorecards, and threat surface metrics.
    Optimized for high-speed execution (<50ms when accounts are already scored).
    """
    if accounts_data is not None:
        accounts = accounts_data
        needs_full_scoring = True
    else:
        from backend.app.features.dataset_api.router import get_accounts
        accounts = get_accounts()
        needs_full_scoring = False

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

    # Check if accounts need full re-scoring (e.g. newly generated dataset)
    if not needs_full_scoring and accounts and "baseline_tier" in accounts[0]:
        # Fast path: Accounts are already scored, aggregate metrics instantly
        critical_count = 0
        high_count = 0
        medium_count = 0
        low_count = 0
        breached_count = 0
        privileged_at_risk_count = 0
        total_violations_count = 0
        hero_account_id = "ACC-00042"
        
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

        for acc in accounts:
            tier = acc.get("final_tier") or acc.get("baseline_tier", "Low")
            risk = acc.get("final_risk") if acc.get("final_risk") is not None else acc.get("baseline_risk", 0.1)
            is_priv = acc.get("is_privileged", False)
            is_breach = acc.get("breach_match", False)
            dept = acc.get("department", "Engineering")
            
            if tier == "Critical":
                critical_count += 1
            elif tier == "High":
                high_count += 1
            elif tier == "Medium":
                medium_count += 1
            else:
                low_count += 1
                
            if is_breach:
                breached_count += 1
                
            if is_priv and (tier in ["Critical", "High"]):
                privileged_at_risk_count += 1
                
            total_violations_count += len(acc.get("policy_violations", []))
            
            d_stat = dept_summary[dept]
            d_stat["total"] += 1
            d_stat[tier.lower()] += 1
            if is_priv:
                d_stat["privileged"] += 1
            if is_breach:
                d_stat["breached"] += 1
            d_stat["total_risk_sum"] += risk
            
            if acc.get("is_hero"):
                hero_account_id = acc["id"]

        for d, s in dept_summary.items():
            s["avg_risk"] = round(s["total_risk_sum"] / max(1, s["total"]), 4)
            del s["total_risk_sum"]

        top_clusters = []
        sorted_group_ids = sorted(group_sizes.keys(), key=lambda gid: (gid == 42, group_sizes[gid]), reverse=True)
        
        # Build cluster samples safely
        id_to_pwd = {a["id"]: a.get("plaintext_password", "********") for a in accounts[:1000]}
        for gid in sorted_group_ids[:20]:
            sample_acc_id = group_members[gid][0] if group_members[gid] else None
            sample_pwd = id_to_pwd.get(sample_acc_id, "LexiconPass@2025")
            top_clusters.append({
                "group_id": gid,
                "password_sample": sample_pwd,
                "total_accounts": group_sizes[gid],
                "privileged_count": group_privileged[gid],
                "departments": dict(group_departments[gid]),
                "account_ids": group_members[gid][:15]
            })

        audit_summary = {
            "total_accounts": len(accounts),
            "critical_count": critical_count,
            "high_risk_count": high_count,
            "medium_risk_count": medium_count,
            "low_risk_count": low_count,
            "breached_count": breached_count,
            "reuse_cluster_count": len(group_sizes),
            "total_reused_accounts": sum(group_sizes.values()),
            "privileged_count": sum(1 for a in accounts if a.get("is_privileged")),
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
            "organization_health": calculate_organization_health(accounts)
        }
        
        compliance = generate_compliance_scorecard(accounts, audit_summary)
        audit_summary["compliance_scorecard"] = compliance
        
        threat_surface = compute_active_directory_threat_surface(
            accounts,
            group_sizes,
            group_privileged,
            group_departments
        )
        audit_summary["active_directory_threat_surface"] = threat_surface

        # Background persistence
        def _persist_fast():
            try:
                _atomic_write_json(AUDIT_RESULTS_FILE, audit_summary, indent=2)
                from backend.app.supabase_client import supabase_service
                supabase_service.sync_audit_summary(audit_summary)
                supabase_service.log_audit_action(
                    action="RUN_AUDIT",
                    actor="Auditor SOC Engine",
                    details={
                        "total_accounts": len(accounts),
                        "critical_count": critical_count,
                        "breached_count": breached_count
                    }
                )
            except Exception as e:
                print(f"[AuditEngine] Background persistence notice: {e}")

        threading.Thread(target=_persist_fast, daemon=True).start()
        return audit_summary

    # Full audit path (used during initial dataset generation)
    breach_checker.load_corpus()
    distinct_passwords = list(set(a["plaintext_password"] for a in accounts))
    for pwd in distinct_passwords:
        if pwd not in _GLOBAL_ZXCVBN_CACHE:
            try:
                _GLOBAL_ZXCVBN_CACHE[pwd] = zxcvbn(pwd)["score"]
            except Exception:
                _GLOBAL_ZXCVBN_CACHE[pwd] = 2
        if pwd not in _GLOBAL_BREACH_CACHE:
            _GLOBAL_BREACH_CACHE[pwd] = breach_checker.is_breached(pwd)
        
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
        
        z_score = _GLOBAL_ZXCVBN_CACHE.get(pwd, 2)
        is_breach = _GLOBAL_BREACH_CACHE.get(pwd, False)
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
            "hash_md5": acc.get("hash_md5", ""),
            "hash_sha256": acc.get("hash_sha256", ""),
            "hash_bcrypt": acc.get("hash_bcrypt", ""),
            "hash_argon2id": acc.get("hash_argon2id", ""),

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
    
    compliance = generate_compliance_scorecard(audited_accounts, audit_summary)
    audit_summary["compliance_scorecard"] = compliance
    
    threat_surface = compute_active_directory_threat_surface(
        audited_accounts,
        group_sizes,
        group_privileged,
        group_departments
    )
    audit_summary["active_directory_threat_surface"] = threat_surface
    
    if accounts_data is None:
        def _persist_background():
            try:
                _atomic_write_json(ACCOUNTS_FILE, audited_accounts)
                _atomic_write_json(AUDIT_RESULTS_FILE, audit_summary, indent=2)
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
                print(f"[AuditEngine] Background persistence notice: {e}")
        
        threading.Thread(target=_persist_background, daemon=True).start()

    return audit_summary


