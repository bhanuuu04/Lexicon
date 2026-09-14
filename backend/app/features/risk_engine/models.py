from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class RiskFactorBreakdown(BaseModel):
    """Granular breakdown of mathematical risk contributions (summing to baseline score)."""
    password_weakness_contribution: float = Field(
        ..., description="0.30 * (1 - normalized_zxcvbn)"
    )
    breach_match_contribution: float = Field(
        ..., description="0.25 * is_breached"
    )
    reuse_blast_radius_contribution: float = Field(
        ..., description="0.20 * normalized_reuse"
    )
    privilege_tier_contribution: float = Field(
        ..., description="0.15 * is_privileged"
    )
    policy_violation_contribution: float = Field(
        ..., description="0.10 * normalized_policy_violations"
    )
    raw_formula: str = Field(
        default="0.30*Weakness + 0.25*Breach + 0.20*Reuse + 0.15*Privilege + 0.10*Policy",
        description="Mathematical risk equation"
    )

class RiskRadarVector(BaseModel):
    """Normalized 5-axis SIEM dimensional radar vector (0.0 to 1.0 per dimension)."""
    entropy_deficit: float = Field(..., description="Weakness based on zxcvbn entropy deficit [0-1]")
    breach_exposure: float = Field(..., description="Breach status penalty [0-1]")
    lateral_blast_radius: float = Field(..., description="Credential reuse and cross-department footprint [0-1]")
    privilege_exposure: float = Field(..., description="Administrative and privilege level [0-1]")
    policy_noncompliance: float = Field(..., description="Active Directory and NIST policy violation penalty [0-1]")
    composite_risk: float = Field(..., description="Calculated overall baseline risk [0-1]")

class RiskCalculationRequest(BaseModel):
    """Request payload to calculate deterministic baseline risk score."""
    zxcvbn_score: int = Field(ge=0, le=4, description="zxcvbn score from 0 (weak) to 4 (strong)")
    is_breached: bool = Field(default=False, description="Whether credential is in breach corpus")
    reuse_cluster_size: int = Field(default=1, ge=1, description="Number of accounts sharing this password")
    is_privileged: bool = Field(default=False, description="Whether account has Domain Admin / privileged rights")
    policy_violations: List[str] = Field(default_factory=list, description="List of policy violations")
    department_count: int = Field(default=1, ge=1, description="Number of unique departments affected by reuse")
    privileged_in_cluster: int = Field(default=0, ge=0, description="Number of privileged accounts in reuse group")
    password_age_days: Optional[int] = Field(default=None, ge=0, description="Days since last password change")

class RiskCalculationResponse(BaseModel):
    """Response payload with computed risk score, categorical tier, factor breakdown, and radar vector."""
    baseline_risk: float = Field(..., description="Normalized baseline risk score in range [0.0, 1.0]")
    baseline_tier: str = Field(..., description="Categorical risk tier: Critical, High, Medium, Low")
    factors: RiskFactorBreakdown = Field(..., description="Detailed contribution per risk factor")
    radar: Optional[RiskRadarVector] = Field(default=None, description="5-axis SIEM radar coordinates")

class ZxcvbnSequenceMatch(BaseModel):
    pattern: str
    token: str
    matched_word: Optional[str] = None
    dictionary_name: Optional[str] = None
    guesses_log10: float

class ZxcvbnFeedbackModel(BaseModel):
    warning: str = ""
    suggestions: List[str] = Field(default_factory=list)

class ZxcvbnAnalysisResponse(BaseModel):
    score: int
    guesses: str
    guesses_log10: float
    entropy_bits: float
    sequence: List[ZxcvbnSequenceMatch]
    crack_times_display: Dict[str, str]
    crack_times_seconds: Dict[str, float]
    hardware_crack_times: Dict[str, str] = Field(
        default_factory=dict,
        description="Crack time estimates across specific hardware (8x RTX 4090 cluster, single GPU, CPU)"
    )
    feedback: ZxcvbnFeedbackModel

class PolicyComplianceReport(BaseModel):
    is_ad_compliant: bool
    ad_violations: List[str]
    is_nist_compliant: bool
    nist_violations: List[str]
    is_passphrase: bool = False
    leetspeak_deobfuscated: Optional[str] = None

class ComprehensiveEvaluationRequest(BaseModel):
    password: str
    username: Optional[str] = ""
    department: Optional[str] = ""
    role: Optional[str] = ""
    custom_inputs: Optional[List[str]] = Field(default_factory=list)
    breach_match: Optional[bool] = False

class ComprehensiveEvaluationResponse(BaseModel):
    password: str
    zxcvbn: ZxcvbnAnalysisResponse
    policy_violations: List[str]
    compliance: PolicyComplianceReport
    password_weakness: float
    is_policy_compliant: bool

class BatchEvaluationItem(BaseModel):
    password: str
    username: Optional[str] = ""
    department: Optional[str] = ""
    role: Optional[str] = ""
    is_privileged: Optional[bool] = False
    reuse_cluster_size: Optional[int] = 1
    is_breached: Optional[bool] = False

class BatchEvaluationResultItem(BaseModel):
    password: str
    username: str
    department: str
    zxcvbn_score: int
    entropy_bits: float
    baseline_risk: float
    baseline_tier: str
    policy_violations: List[str]
    is_compliant: bool

class BatchEvaluationRequest(BaseModel):
    items: List[BatchEvaluationItem] = Field(..., max_length=500, description="List of items to evaluate in bulk")

class BatchEvaluationResponse(BaseModel):
    total_evaluated: int
    processing_time_ms: float
    results: List[BatchEvaluationResultItem]

class RiskWeightsResponse(BaseModel):
    weights: Dict[str, float]
    thresholds: Dict[str, float]
    attack_modifier_baseline: float
    attack_modifier_max: float
