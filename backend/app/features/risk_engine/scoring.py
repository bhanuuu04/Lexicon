from typing import List, Tuple

def get_risk_tier(risk_score: float) -> str:
    """Return categorical risk tier based on deterministic score thresholds."""
    if risk_score >= 0.75:
        return "Critical"
    elif risk_score >= 0.50:
        return "High"
    elif risk_score >= 0.25:
        return "Medium"
    else:
        return "Low"

def compute_policy_violation_score(violations: List[str]) -> float:
    """
    Normalize policy violations to [0.0, 1.0].
    3 or more violations yield 1.0.
    """
    return min(1.0, len(violations) / 3.0)

def compute_normalized_reuse(cluster_size: int) -> float:
    """
    Normalize reuse cluster size to [0.0, 1.0].
    1 (unique password) -> 0.0
    30+ accounts -> 1.0
    """
    if cluster_size <= 1:
        return 0.0
    return min(1.0, (cluster_size - 1) / 30.0)

def calculate_baseline_risk(
    zxcvbn_score: int,
    is_breached: bool,
    reuse_cluster_size: int,
    is_privileged: bool,
    policy_violations: List[str]
) -> Tuple[float, str]:
    """
    Calculate deterministic baseline risk score and tier:
    baseline_risk =
        0.30 × password_weakness
      + 0.25 × breach_match
      + 0.20 × normalized_reuse
      + 0.15 × privilege_weight
      + 0.10 × policy_violation_score
    """
    normalized_zxcvbn = max(0, min(4, zxcvbn_score)) / 4.0
    password_weakness = 1.0 - normalized_zxcvbn

    breach_val = 1.0 if is_breached else 0.0
    reuse_val = compute_normalized_reuse(reuse_cluster_size)
    privilege_val = 1.0 if is_privileged else 0.0
    violation_val = compute_policy_violation_score(policy_violations)

    score = (
        0.30 * password_weakness
        + 0.25 * breach_val
        + 0.20 * reuse_val
        + 0.15 * privilege_val
        + 0.10 * violation_val
    )

    baseline_risk = round(min(1.0, max(0.0, score)), 4)
    tier = get_risk_tier(baseline_risk)
    return baseline_risk, tier

def calculate_attack_adjustment(
    matched: bool,
    candidates_tested: int,
    elapsed_ms: float
) -> float:
    """
    Calculate empirical attack adjustment:
    +0.15 base modifier if matched
    + up to 0.05 speed/efficiency confidence modifier
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
