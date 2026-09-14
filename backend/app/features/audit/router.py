import json
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException

from backend.app.config import AUDIT_RESULTS_FILE, ACCOUNTS_FILE
from backend.app.features.audit.engine import (
    run_bulk_audit,
    generate_compliance_scorecard,
    compute_active_directory_threat_surface
)
from backend.app.features.risk_engine.zxcvbn_service import evaluate_password_comprehensive

router = APIRouter(prefix="/api/audit", tags=["audit"])


class EvaluatePasswordLiveRequest(BaseModel):
    password: str = Field(..., min_length=1)
    username: Optional[str] = ""
    department: Optional[str] = ""
    role: Optional[str] = ""
    custom_inputs: Optional[List[str]] = []


@router.get("/summary")
def get_summary():
    """
    Retrieve precomputed enterprise audit summary, compliance scorecards, and threat surface metrics.
    """
    from backend.app.features.dataset_api.router import get_audit_summary
    return get_audit_summary()


@router.get("/compliance")
def get_compliance_scorecard():
    """
    Retrieve Active Directory regulatory compliance scorecard (NIST SP 800-63B, CIS Controls v8, PCI-DSS v4, ISO 27001).
    """
    from backend.app.features.dataset_api.router import get_audit_summary, get_accounts
    summary = get_audit_summary()
    if "compliance_scorecard" in summary:
        return summary["compliance_scorecard"]
    
    accounts = get_accounts()
    return generate_compliance_scorecard(accounts, summary)


@router.get("/threat-surface")
def get_threat_surface():
    """
    Retrieve Active Directory threat surface metrics (Kerberoasting, AS-REP roasting, lateral movement blast radius).
    """
    from backend.app.features.dataset_api.router import get_audit_summary, get_accounts
    summary = get_audit_summary()
    if "active_directory_threat_surface" in summary:
        return summary["active_directory_threat_surface"]
    
    accounts = get_accounts()
    return run_bulk_audit(accounts).get("active_directory_threat_surface", {})


@router.post("/run")
def trigger_bulk_audit():
    """
    Trigger full deterministic Active Directory audit across all existing accounts.
    Updates in-memory caches and persists precomputed results.
    """
    from backend.app.features.dataset_api.router import save_audit_summary, invalidate_cache
    summary = run_bulk_audit()
    save_audit_summary(summary)
    invalidate_cache()
    return {
        "status": "success",
        "message": f"Audit complete for {summary['total_accounts']:,} accounts.",
        "summary": summary
    }


@router.post("/evaluate-password")
def evaluate_password_endpoint(payload: EvaluatePasswordLiveRequest):
    """
    Live comprehensive evaluation of candidate password against NIST SP 800-63B,
    zxcvbn entropy, corporate policy rules, and breach corpus.
    """
    return evaluate_password_comprehensive(
        password=payload.password,
        username=payload.username or "",
        department=payload.department or "",
        role=payload.role or "",
        custom_inputs=payload.custom_inputs or []
    )
