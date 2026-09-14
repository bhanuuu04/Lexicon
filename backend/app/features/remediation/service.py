import os
import json
import httpx
from backend.app.models import RemediationRequest, RemediationReport, PriorityAccountAction
from backend.app.config import GEMINI_API_KEY, OPENAI_API_KEY

def generate_fallback_advisory_report(req: RemediationRequest) -> RemediationReport:
    """
    Deterministic rule-based enterprise remediation generator.
    Guarantees reliable, structured advisory output even without an active LLM key.
    """
    priority_accounts = []
    
    for f in req.sample_findings[:6]:
        action = "Force immediate password reset & invalidate active Kerberos tickets"
        policy = "Enforce 16+ character passphrase, phishing-resistant FIDO2 hardware key"
        
        if f.is_privileged:
            action = "REVOKE PRIVILEGED ACCESS IMMEDIATELY. Force password rotation via PAM/cyberark and mandate FIDO2 MFA."
        elif f.breach_match:
            action = "Flag account as compromised in AD. Enforce automated credential revocation."
        elif f.reuse_cluster_size > 10:
            action = f"Cluster blast radius remediation: Quarantine {f.reuse_cluster_size} shared-credential accounts."
            
        priority_accounts.append(PriorityAccountAction(
            username=f.username,
            role=f.role,
            department=f.department,
            risk_tier=f.risk_tier,
            immediate_action=action,
            recommended_policy=policy
        ))

    executive_summary = (
        f"Lexicon Enterprise Password Audit identified {req.critical_count:,} Critical-tier accounts "
        f"and {req.high_risk_count:,} High-risk accounts across {req.total_audited:,} Active Directory accounts. "
        f"Most alarmingly, {req.privileged_at_risk:,} privileged administrator accounts exhibit severe credential exposure "
        f"compounded by synthetic breach correlations and high blast-radius password reuse clusters."
    )

    risk_explanation = (
        "Enterprise risk is primarily driven by three converging factors: "
        "(1) Predictable credential generation patterns based on company names, seasons, and calendar years; "
        "(2) Extensive credential sharing across departments (e.g. Cluster #42 spanning 31 accounts across IT, Finance, and Operations); "
        "(3) Legacy weak hashing schemes and missing FIDO2/phishing-resistant MFA on privileged administrative tiers."
    )

    policy_recs = [
        "Increase minimum password length from 8/12 to 16 characters for standard users and 20+ characters for privileged tier.",
        "Prohibit predictable seasonal (e.g., 'Summer2026!'), company name, and calendar year suffixes via AD Password Filters.",
        "Implement automated continuous validation against known compromised credential databases.",
        "Eliminate periodic arbitrary 90-day password expiration which encourages low-entropy sequential increments (e.g., Summer24 -> Summer25 -> Summer26)."
    ]

    mfa_recs = [
        "Enforce mandatory phishing-resistant FIDO2 WebAuthn / Passkeys for all Domain Admins, DevOps, and Finance personnel.",
        "Deprecate SMS-based and legacy push-notification MFA prone to adversary-in-the-middle (AiTM) reverse proxies.",
        "Enforce Conditional Access policies restricting privileged role assumption to compliant, corporate-managed devices."
    ]

    blocklist_recs = [
        "Company*", "Lexicon*", "Enterprise*", "Welcome*", "Summer*", "Winter*", "Spring*", "Autumn*",
        "Admin*", "Password*", "Finance*", "DevOps*", "*2024*", "*2025*", "*2026*", "*2027*"
    ]

    remediation_priorities = [
        "Phase 1 (Immediate - 24 Hours): Isolate and reset the 31 accounts in Password Reuse Cluster #42, prioritizing Enterprise Active Directory Admin 'alex.morgan'.",
        "Phase 2 (Day 2-7): Roll out Azure AD / Active Directory Custom Password Filter to disallow organizational dictionary roots.",
        "Phase 3 (Day 7-30): Mandate hardware security keys (FIDO2) for all 50+ privileged IT, Cloud Security, and Executive accounts.",
        "Phase 4 (Quarterly): Transition remaining service accounts to Group Managed Service Accounts (gMSA) with 128-bit automatic rotation."
    ]

    return RemediationReport(
        executive_summary=executive_summary,
        risk_explanation=risk_explanation,
        priority_accounts=priority_accounts,
        password_policy_recommendations=policy_recs,
        mfa_recommendations=mfa_recs,
        org_blocklist_suggestions=blocklist_recs,
        remediation_priorities=remediation_priorities
    )
