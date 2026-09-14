from backend.app.features.risk_engine.scoring import (
    get_risk_tier,
    compute_policy_violation_score,
    compute_normalized_reuse,
    compute_risk_radar_vector,
    calculate_baseline_risk,
    calculate_baseline_risk_detailed,
    calculate_attack_adjustment,
    calculate_final_risk,
    get_risk_weights,
    WEIGHT_WEAKNESS,
    WEIGHT_BREACH,
    WEIGHT_REUSE,
    WEIGHT_PRIVILEGE,
    WEIGHT_POLICY,
)
from backend.app.features.risk_engine.policy import (
    check_policy_violations,
    check_nist_sp800_63b_violations,
    check_dual_policy_compliance,
    normalize_leetspeak,
    is_multiword_passphrase,
)
from backend.app.features.risk_engine.zxcvbn_service import (
    analyze_password_zxcvbn,
    evaluate_password_comprehensive,
)
from backend.app.features.risk_engine.router import router

__all__ = [
    "get_risk_tier",
    "compute_policy_violation_score",
    "compute_normalized_reuse",
    "compute_risk_radar_vector",
    "calculate_baseline_risk",
    "calculate_baseline_risk_detailed",
    "calculate_attack_adjustment",
    "calculate_final_risk",
    "get_risk_weights",
    "WEIGHT_WEAKNESS",
    "WEIGHT_BREACH",
    "WEIGHT_REUSE",
    "WEIGHT_PRIVILEGE",
    "WEIGHT_POLICY",
    "check_policy_violations",
    "check_nist_sp800_63b_violations",
    "check_dual_policy_compliance",
    "normalize_leetspeak",
    "is_multiword_passphrase",
    "analyze_password_zxcvbn",
    "evaluate_password_comprehensive",
    "router",
]
