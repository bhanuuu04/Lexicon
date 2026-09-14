from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PolicyViolation(BaseModel):
    rule_id: str
    description: str
    severity: str  # "high", "medium", "low"

class Account(BaseModel):
    id: str
    username: str
    department: str
    role: str
    is_privileged: bool = False

    password_group_id: Optional[int] = None
    plaintext_password: str  # Present strictly because dataset is synthetic

    hash_ntlm: Optional[str] = None
    hash_md5: str
    hash_sha256: str
    hash_bcrypt: str
    hash_argon2id: str

    policy_violations: List[str] = Field(default_factory=list)
    zxcvbn_score: int = 0  # 0 to 4
    breach_match: bool = False

    baseline_risk: float = 0.0
    baseline_tier: str = "Low"  # "Critical", "High", "Medium", "Low"

    attack_adjustment: float = 0.0
    final_risk: float = 0.0
    final_tier: str = "Low"

    is_blocked: bool = False
    blocked_reason: Optional[str] = None
    blocked_at: Optional[str] = None
    last_remediated_at: Optional[str] = None

class DatasetMetadata(BaseModel):
    version: str = "1.0.0"
    created_at: str
    total_accounts: int
    dataset_file: str
    is_custom_generated: bool = False
    blocked_count: int = 0
    generator_config: Dict[str, Any] = Field(default_factory=dict)

class BlockAccountRequest(BaseModel):
    is_blocked: bool
    reason: Optional[str] = "Security Risk Detected"

class ResetPasswordRequest(BaseModel):
    new_password: str

class PasswordCheckDetail(BaseModel):
    rule_name: str
    passed: bool
    message: str
    severity: str = "error"  # error, warning, success

class ResetPasswordResponse(BaseModel):
    success: bool
    account_id: str
    message: str
    checks: List[PasswordCheckDetail]
    account: Optional[Dict[str, Any]] = None

class PasswordGroupSummary(BaseModel):
    group_id: int
    password_sample: str
    total_accounts: int
    privileged_count: int
    departments: Dict[str, int]
    account_ids: List[str]

class RiskDistribution(BaseModel):
    critical: int
    high: int
    medium: int
    low: int

class AuditSummary(BaseModel):
    total_accounts: int
    critical_count: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    breached_count: int
    reuse_cluster_count: int
    total_reused_accounts: int
    privileged_count: int
    privileged_at_risk_count: int  # Critical or High
    policy_violations_count: int
    risk_distribution: RiskDistribution
    department_risk_summary: Dict[str, Dict[str, Any]]
    top_reuse_clusters: List[PasswordGroupSummary]
    hero_account_id: str

class AttackResultPayload(BaseModel):
    account_id: str
    algorithm: str
    candidates_tested: int
    elapsed_ms: float
    matched: bool
    matched_rule: Optional[str] = None
    time_budget_ms: int = 30000

class AttackRunResponse(BaseModel):
    account_id: str
    matched: bool
    baseline_risk: float
    attack_adjustment: float
    final_risk: float
    final_tier: str
    message: str

class RemediationFinding(BaseModel):
    account_id: str
    username: str
    department: str
    role: str
    is_privileged: bool
    risk_tier: str
    baseline_risk: float
    final_risk: float
    zxcvbn_score: int
    breach_match: bool
    reuse_cluster_size: int
    policy_violations: List[str]
    attack_matched: Optional[bool] = None
    attack_elapsed_ms: Optional[float] = None
    matched_rule: Optional[str] = None

class RemediationRequest(BaseModel):
    total_audited: int
    critical_count: int
    high_risk_count: int
    privileged_at_risk: int
    breached_count: int
    sample_findings: List[RemediationFinding]

class PriorityAccountAction(BaseModel):
    username: str
    role: str
    department: str
    risk_tier: str
    immediate_action: str
    recommended_policy: str

class RemediationReport(BaseModel):
    executive_summary: str
    risk_explanation: str
    priority_accounts: List[PriorityAccountAction]
    password_policy_recommendations: List[str]
    mfa_recommendations: List[str]
    org_blocklist_suggestions: List[str]
    remediation_priorities: List[str]
