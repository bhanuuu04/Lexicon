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
