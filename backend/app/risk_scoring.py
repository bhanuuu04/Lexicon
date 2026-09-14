"""Feature re-export for backward compatibility."""
from backend.app.features.risk_engine.scoring import (
    get_risk_tier,
    compute_policy_violation_score,
    compute_normalized_reuse,
    calculate_baseline_risk,
    calculate_attack_adjustment,
    calculate_final_risk,
)

__all__ = [
    "get_risk_tier",
    "compute_policy_violation_score",
    "compute_normalized_reuse",
    "calculate_baseline_risk",
    "calculate_attack_adjustment",
    "calculate_final_risk",
]
