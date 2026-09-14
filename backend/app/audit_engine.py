"""
Audit Engine - Backward compatibility re-export wrapper.
Main implementation moved to backend.app.features.audit.
"""
from backend.app.features.audit.engine import run_bulk_audit
from backend.app.features.risk_engine.policy import check_policy_violations

__all__ = ["run_bulk_audit", "check_policy_violations"]

if __name__ == "__main__":
    run_bulk_audit()

