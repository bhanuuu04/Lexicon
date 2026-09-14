import time
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.features.risk_engine.scoring import (
    calculate_baseline_risk_detailed,
    compute_risk_radar_vector,
    get_risk_weights,
    get_risk_tier,
)
from backend.app.features.risk_engine.policy import (
    check_dual_policy_compliance,
    check_policy_violations,
    check_nist_sp800_63b_violations,
    normalize_leetspeak,
    is_multiword_passphrase,
)
from backend.app.features.risk_engine.zxcvbn_service import (
    evaluate_password_comprehensive,
    analyze_password_zxcvbn,
)
from backend.app.features.risk_engine.models import (
    RiskCalculationRequest,
    RiskCalculationResponse,
    RiskFactorBreakdown,
    RiskRadarVector,
    ComprehensiveEvaluationRequest,
    ComprehensiveEvaluationResponse,
    PolicyComplianceReport,
    RiskWeightsResponse,
    BatchEvaluationRequest,
    BatchEvaluationResponse,
    BatchEvaluationResultItem,
)

router = APIRouter(prefix="/api/risk", tags=["risk_engine"])

@router.post("/calculate-score", response_model=RiskCalculationResponse)
def calculate_risk_score_endpoint(payload: RiskCalculationRequest):
    """
    Calculate deterministic baseline risk score with granular factor contribution breakdown and 5-axis radar vector.
    Formula: 0.30*Weakness + 0.25*Breach + 0.20*Reuse + 0.15*Privilege + 0.10*Policy
    """
    score, tier, breakdown = calculate_baseline_risk_detailed(
        zxcvbn_score=payload.zxcvbn_score,
        is_breached=payload.is_breached,
        reuse_cluster_size=payload.reuse_cluster_size,
        is_privileged=payload.is_privileged,
        policy_violations=payload.policy_violations,
        department_count=payload.department_count,
        privileged_in_cluster=payload.privileged_in_cluster,
        password_age_days=payload.password_age_days,
    )

    radar_dict = compute_risk_radar_vector(
        zxcvbn_score=payload.zxcvbn_score,
        is_breached=payload.is_breached,
        reuse_cluster_size=payload.reuse_cluster_size,
        is_privileged=payload.is_privileged,
        policy_violations=payload.policy_violations,
        department_count=payload.department_count,
        privileged_in_cluster=payload.privileged_in_cluster,
    )

    return RiskCalculationResponse(
        baseline_risk=score,
        baseline_tier=tier,
        factors=RiskFactorBreakdown(**breakdown),
        radar=RiskRadarVector(**radar_dict)
    )

@router.post("/radar", response_model=RiskRadarVector)
def get_radar_vector_endpoint(payload: RiskCalculationRequest):
    """
    Generate normalized 5-axis SIEM / radar coordinates [0.0 to 1.0] for radar chart visualization.
    """
    radar_dict = compute_risk_radar_vector(
        zxcvbn_score=payload.zxcvbn_score,
        is_breached=payload.is_breached,
        reuse_cluster_size=payload.reuse_cluster_size,
        is_privileged=payload.is_privileged,
        policy_violations=payload.policy_violations,
        department_count=payload.department_count,
        privileged_in_cluster=payload.privileged_in_cluster,
    )
    return RiskRadarVector(**radar_dict)

@router.post("/evaluate", response_model=ComprehensiveEvaluationResponse)
def evaluate_password_endpoint(payload: ComprehensiveEvaluationRequest):
    """
    Comprehensive live password security evaluation combining zxcvbn-python entropy,
    pattern decomposition sequence, multi-hardware crack times, and AD/NIST policy compliance.
    """
    res = evaluate_password_comprehensive(
        password=payload.password,
        username=payload.username or "",
        department=payload.department or "",
        role=payload.role or "",
        custom_inputs=payload.custom_inputs or [],
        breach_match=payload.breach_match or False
    )
    return res

@router.post("/batch-evaluate", response_model=BatchEvaluationResponse)
def batch_evaluate_endpoint(payload: BatchEvaluationRequest):
    """
    High-performance batch password evaluation processing up to 500 items concurrently with LRU caching.
    """
    start_time = time.perf_counter()

    def process_item(item):
        eval_res = evaluate_password_comprehensive(
            password=item.password,
            username=item.username or "",
            department=item.department or "",
            role=item.role or "",
            breach_match=item.is_breached or False
        )
        z_score = eval_res["zxcvbn"]["score"]
        violations = eval_res["policy_violations"]

        score, tier, _ = calculate_baseline_risk_detailed(
            zxcvbn_score=z_score,
            is_breached=item.is_breached or False,
            reuse_cluster_size=item.reuse_cluster_size or 1,
            is_privileged=item.is_privileged or False,
            policy_violations=violations
        )

        return BatchEvaluationResultItem(
            password=item.password,
            username=item.username or "user",
            department=item.department or "General",
            zxcvbn_score=z_score,
            entropy_bits=eval_res["zxcvbn"]["entropy_bits"],
            baseline_risk=score,
            baseline_tier=tier,
            policy_violations=violations,
            is_compliant=eval_res["is_policy_compliant"]
        )

    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(process_item, payload.items))

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return BatchEvaluationResponse(
        total_evaluated=len(results),
        processing_time_ms=elapsed_ms,
        results=results
    )

class PolicyCheckRequest(BaseModel):
    password: str
    username: Optional[str] = ""
    department: Optional[str] = ""
    role: Optional[str] = ""
    is_breached: Optional[bool] = False

@router.post("/policy-check", response_model=PolicyComplianceReport)
def policy_check_endpoint(payload: PolicyCheckRequest):
    """
    Evaluate password compliance against both Active Directory GPO and NIST SP 800-63B standards.
    """
    report = check_dual_policy_compliance(
        password=payload.password,
        username=payload.username or "",
        department=payload.department or "",
        role=payload.role or "",
        breach_match=payload.is_breached or False
    )
    return PolicyComplianceReport(**report)

class DeobfuscateRequest(BaseModel):
    text: str

class DeobfuscateResponse(BaseModel):
    original: str
    deobfuscated: str
    is_passphrase: bool

@router.post("/deobfuscate", response_model=DeobfuscateResponse)
def deobfuscate_endpoint(payload: DeobfuscateRequest):
    """
    Utility endpoint to normalize leetspeak and check multi-word passphrase structure.
    """
    return DeobfuscateResponse(
        original=payload.text,
        deobfuscated=normalize_leetspeak(payload.text),
        is_passphrase=is_multiword_passphrase(payload.text)
    )

@router.get("/weights", response_model=RiskWeightsResponse)
def get_weights_endpoint():
    """
    Retrieve active deterministic scoring weights and risk tier categorization thresholds.
    """
    data = get_risk_weights()
    return RiskWeightsResponse(**data)
