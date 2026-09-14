from typing import List, Tuple, Dict, Any, Optional

# ---------------------------------------------------------------------------
# Deterministic Mathematical Scoring Weights (Total Sum = 1.00)
# ---------------------------------------------------------------------------
WEIGHT_WEAKNESS = 0.30       # zxcvbn entropy & pattern weakness (0-4 normalized)
WEIGHT_BREACH = 0.25         # Known compromised corpus match
WEIGHT_REUSE = 0.20          # Password reuse group size & lateral blast radius
WEIGHT_PRIVILEGE = 0.15      # Domain Admin / Privileged tier status
WEIGHT_POLICY = 0.10         # Active Directory GPO policy violation count

TIER_CRITICAL_THRESHOLD = 0.75
TIER_HIGH_THRESHOLD = 0.50
TIER_MEDIUM_THRESHOLD = 0.25

def get_risk_tier(risk_score: float) -> str:
    """Return categorical risk tier based on deterministic score thresholds."""
    if risk_score >= TIER_CRITICAL_THRESHOLD:
        return "Critical"
    elif risk_score >= TIER_HIGH_THRESHOLD:
        return "High"
    elif risk_score >= TIER_MEDIUM_THRESHOLD:
        return "Medium"
    else:
        return "Low"

def compute_policy_violation_score(violations: List[str]) -> float:
    """
    Normalize policy violations to [0.0, 1.0].
    3 or more violations yield maximum 1.0 penalty.
    """
    return round(min(1.0, len(violations) / 3.0), 4)

def compute_normalized_reuse(
    cluster_size: int,
    department_count: int = 1,
    privileged_count: int = 0
) -> float:
    """
    Normalize reuse cluster size to [0.0, 1.0] with lateral movement blast radius amplification.
    - 1 (unique password) -> 0.0
    - 30+ accounts -> 1.0
    - Cross-department multiplier: Credentials spanning multiple departments expand attack surface
    - Privileged multiplier: Reuse clusters containing Domain Admins multiply lateral risk
    """
    if cluster_size <= 1:
        return 0.0

    base_reuse = (cluster_size - 1) / 30.0

    # Lateral movement bonus if spanning across multiple business units
    lateral_bonus = min(0.15, max(0, department_count - 1) * 0.03)

    # Privileged account presence bonus in reuse cluster
    priv_bonus = min(0.10, max(0, privileged_count) * 0.05)

    return round(min(1.0, base_reuse + lateral_bonus + priv_bonus), 4)

def calculate_baseline_risk(
    zxcvbn_score: int,
    is_breached: bool,
    reuse_cluster_size: int,
    is_privileged: bool,
    policy_violations: List[str],
    department_count: int = 1,
    privileged_in_cluster: int = 0,
    password_age_days: Optional[int] = None
) -> Tuple[float, str]:
    """
    Calculate deterministic baseline risk score and tier:
    baseline_risk =
        0.30 × password_weakness
      + 0.25 × breach_match
      + 0.20 × normalized_reuse (with lateral blast radius)
      + 0.15 × privilege_weight
      + 0.10 × policy_violation_score
    Returns: (baseline_risk: float, baseline_tier: str)
    """
    score, tier, _ = calculate_baseline_risk_detailed(
        zxcvbn_score=zxcvbn_score,
        is_breached=is_breached,
        reuse_cluster_size=reuse_cluster_size,
        is_privileged=is_privileged,
        policy_violations=policy_violations,
        department_count=department_count,
        privileged_in_cluster=privileged_in_cluster,
        password_age_days=password_age_days
    )
    return score, tier

def calculate_baseline_risk_detailed(
    zxcvbn_score: int,
    is_breached: bool,
    reuse_cluster_size: int,
    is_privileged: bool,
    policy_violations: List[str],
    department_count: int = 1,
    privileged_in_cluster: int = 0,
    password_age_days: Optional[int] = None
) -> Tuple[float, str, Dict[str, float]]:
    """
    Calculate baseline risk and return exact mathematical breakdown per factor.
    """
    normalized_zxcvbn = max(0, min(4, zxcvbn_score)) / 4.0
    password_weakness = 1.0 - normalized_zxcvbn

    breach_val = 1.0 if is_breached else 0.0
    reuse_val = compute_normalized_reuse(reuse_cluster_size, department_count, privileged_in_cluster)
    privilege_val = 1.0 if is_privileged else 0.0
    violation_val = compute_policy_violation_score(policy_violations)

    weakness_contrib = round(WEIGHT_WEAKNESS * password_weakness, 4)
    breach_contrib = round(WEIGHT_BREACH * breach_val, 4)
    reuse_contrib = round(WEIGHT_REUSE * reuse_val, 4)
    privilege_contrib = round(WEIGHT_PRIVILEGE * privilege_val, 4)
    violation_contrib = round(WEIGHT_POLICY * violation_val, 4)

    total_score = round(
        weakness_contrib + breach_contrib + reuse_contrib + privilege_contrib + violation_contrib,
        4
    )

    # Optional CIS benchmark password staleness factor (accounts not rotated in > 180 or > 365 days)
    if password_age_days is not None and password_age_days > 90:
        age_penalty = min(0.08, (password_age_days - 90) / 365.0 * 0.08)
        total_score = round(total_score + age_penalty, 4)

    baseline_risk = min(1.0, max(0.0, total_score))
    tier = get_risk_tier(baseline_risk)

    factor_breakdown = {
        "password_weakness_contribution": weakness_contrib,
        "breach_match_contribution": breach_contrib,
        "reuse_blast_radius_contribution": reuse_contrib,
        "privilege_tier_contribution": privilege_contrib,
        "policy_violation_contribution": violation_contrib,
    }

    return baseline_risk, tier, factor_breakdown

def compute_risk_radar_vector(
    zxcvbn_score: int,
    is_breached: bool,
    reuse_cluster_size: int,
    is_privileged: bool,
    policy_violations: List[str],
    department_count: int = 1,
    privileged_in_cluster: int = 0
) -> Dict[str, float]:
    """
    Generate normalized 5-axis SIEM / radar coordinates [0.0 to 1.0] for radar chart visualization.
    """
    normalized_zxcvbn = max(0, min(4, zxcvbn_score)) / 4.0
    entropy_deficit = round(1.0 - normalized_zxcvbn, 4)
    breach_exposure = 1.0 if is_breached else 0.0
    lateral_blast_radius = compute_normalized_reuse(reuse_cluster_size, department_count, privileged_in_cluster)
    privilege_exposure = 1.0 if is_privileged else 0.0
    policy_noncompliance = compute_policy_violation_score(policy_violations)

    baseline_risk, _ = calculate_baseline_risk(
        zxcvbn_score=zxcvbn_score,
        is_breached=is_breached,
        reuse_cluster_size=reuse_cluster_size,
        is_privileged=is_privileged,
        policy_violations=policy_violations,
        department_count=department_count,
        privileged_in_cluster=privileged_in_cluster
    )

    return {
        "entropy_deficit": entropy_deficit,
        "breach_exposure": breach_exposure,
        "lateral_blast_radius": lateral_blast_radius,
        "privilege_exposure": privilege_exposure,
        "policy_noncompliance": policy_noncompliance,
        "composite_risk": baseline_risk
    }

def calculate_attack_adjustment(
    matched: bool,
    candidates_tested: int,
    elapsed_ms: float,
    algorithm: str = ""
) -> float:
    """
    Calculate empirical attack adjustment:
    +0.15 base modifier if matched
    + up to 0.05 speed/efficiency confidence modifier based on mutation efficiency
    """
    if not matched:
        return 0.0

    confidence_modifier = 0.0
    if candidates_tested < 2500 or elapsed_ms < 1500:
        confidence_modifier = 0.05
    elif candidates_tested < 10000:
        confidence_modifier = 0.03
    elif candidates_tested < 30000:
        confidence_modifier = 0.01

    return round(0.15 + confidence_modifier, 4)

def calculate_final_risk(
    baseline_risk: float,
    attack_adjustment: float
) -> Tuple[float, str]:
    """Calculate final risk and tier with attack evidence applied."""
    final_score = round(min(1.0, max(0.0, baseline_risk + attack_adjustment)), 4)
    tier = get_risk_tier(final_score)
    return final_score, tier

def get_risk_weights() -> Dict[str, Any]:
    """Return dictionary of official risk weighting constants and tier thresholds."""
    return {
        "weights": {
            "password_weakness": WEIGHT_WEAKNESS,
            "breach_match": WEIGHT_BREACH,
            "reuse_blast_radius": WEIGHT_REUSE,
            "privilege_tier": WEIGHT_PRIVILEGE,
            "policy_violations": WEIGHT_POLICY,
        },
        "thresholds": {
            "critical": TIER_CRITICAL_THRESHOLD,
            "high": TIER_HIGH_THRESHOLD,
            "medium": TIER_MEDIUM_THRESHOLD,
            "low": 0.0,
        },
        "attack_modifier_baseline": 0.15,
        "attack_modifier_max": 0.20,
    }

TOP_LEVEL_ADMIN_ROLES = {
    "Domain Admin",
    "Enterprise Admin",
    "Global Admin",
    "IT Administrator",
    "Chief Information Security Officer",
    "CISO",
    "Chief Technology Officer",
    "CTO",
    "CIO",
    "System Administrator",
}

def calculate_organization_health(accounts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compute domain-level organization risk and readiness scores with privilege-tier weighting.
    - Top-Level Domain Admins & Tier-0 Root accounts (e.g. alex.morgan, Domain Admin) represent
      the keys to the kingdom. If any top-level admin account has an insecure password,
      breach exposure, or is blocked for compromise, an existential root domain compromise
      penalty is applied (+0.35 risk / massive health drop), threatening enterprise security.
    - General workforce accounts represent standard endpoint exposure (25% weight) where
      individual employee compromises do not jeopardize the overall organization infrastructure.
    - Once top-level admins are secured (strong password, clean breach record, unblocked),
      the root penalty is eliminated and overall organization risk drops significantly.
    """
    if not accounts:
        return {
            "organization_risk_score": 0.0,
            "security_readiness_pct": 100.0,
            "admin_exposure_pct": 0.0,
            "workforce_exposure_pct": 0.0,
            "top_admin_compromised": False,
            "top_admin_compromised_count": 0,
            "status": "Healthy"
        }

    admin_scores = []
    workforce_scores = []
    top_admin_compromised_count = 0
    total_top_admins = 0
    hero_compromised = False

    for acc in accounts:
        role = acc.get("role", "")
        is_hero = acc.get("is_hero", False) or acc.get("id") == "ACC-00042" or acc.get("username") == "alex.morgan"
        is_top_admin = is_hero or role in TOP_LEVEL_ADMIN_ROLES or "Domain Admin" in role or "Enterprise Admin" in role
        is_priv = acc.get("is_privileged", False) or is_top_admin
        
        is_blocked = acc.get("is_blocked", False)
        is_breached = acc.get("breach_match", False) or acc.get("is_breached", False)
        raw_risk = acc.get("final_risk") if acc.get("final_risk") is not None else acc.get("baseline_risk", 0.0)
        
        # Effective risk considers blocked state & breach
        effective_risk = 1.0 if is_blocked else (max(raw_risk, 0.85) if is_breached else raw_risk)

        if is_priv:
            admin_scores.append(effective_risk)
            if is_top_admin:
                total_top_admins += 1
                if is_blocked or is_breached or raw_risk >= 0.40:
                    top_admin_compromised_count += 1
                    if is_hero:
                        hero_compromised = True
        else:
            workforce_scores.append(effective_risk)

    avg_admin_risk = sum(admin_scores) / len(admin_scores) if admin_scores else 0.0
    avg_workforce_risk = sum(workforce_scores) / len(workforce_scores) if workforce_scores else 0.0

    # 70% Admin Risk + 30% Workforce Risk
    composite_risk = (0.70 * avg_admin_risk) + (0.30 * avg_workforce_risk)

    # Existential root admin compromise penalty
    # If the Tier-0 Domain Root Admin (alex.morgan) or top admins are compromised, domain risk surges
    if hero_compromised:
        composite_risk = min(0.95, composite_risk + 0.35)
    elif top_admin_compromised_count > 0:
        top_admin_ratio = top_admin_compromised_count / max(1, total_top_admins)
        composite_risk = min(0.90, composite_risk + (top_admin_ratio * 0.20))

    org_risk = round(min(1.0, max(0.05, composite_risk)), 4)
    readiness_pct = round(max(0.0, (1.0 - org_risk) * 100.0), 1)

    status = "Healthy" if org_risk < 0.35 else ("Elevated Risk" if org_risk < 0.65 else "Critical Danger")

    return {
        "organization_risk_score": org_risk,
        "security_readiness_pct": readiness_pct,
        "admin_exposure_pct": round(avg_admin_risk * 100.0, 1),
        "workforce_exposure_pct": round(avg_workforce_risk * 100.0, 1),
        "top_admin_compromised": hero_compromised or (top_admin_compromised_count > 0),
        "top_admin_compromised_count": top_admin_compromised_count,
        "status": status
    }

