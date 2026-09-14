export interface Account {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  department: string;
  role: string;
  is_privileged: boolean;
  password_group_id: number | null;
  plaintext_password: string; // Synthetic only
  hash_md5: string;
  hash_sha256: string;
  hash_bcrypt: string;
  hash_argon2id: string;
  policy_violations: string[];
  zxcvbn_score: number;
  breach_match: boolean;
  baseline_risk: number;
  baseline_tier: "Critical" | "High" | "Medium" | "Low";
  attack_adjustment: number;
  final_risk: number;
  final_tier: "Critical" | "High" | "Medium" | "Low";
  is_hero?: boolean;
  attack_evidence?: {
    algorithm: string;
    candidates_tested: number;
    elapsed_ms: number;
    matched: boolean;
    matched_rule?: string;
  };
}

export interface PasswordGroupSummary {
  group_id: number;
  password_sample: string;
  total_accounts: number;
  privileged_count: number;
  departments: Record<string, number>;
  account_ids: string[];
}

export interface DepartmentRiskStat {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  privileged: number;
  breached: number;
  avg_risk: number;
}

export interface AuditSummary {
  total_accounts: number;
  critical_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  breached_count: number;
  reuse_cluster_count: number;
  total_reused_accounts: number;
  privileged_count: number;
  privileged_at_risk_count: number;
  policy_violations_count: number;
  risk_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  department_risk_summary: Record<string, DepartmentRiskStat>;
  top_reuse_clusters: PasswordGroupSummary[];
  hero_account_id: string;
}

export interface AttackCandidateProgress {
  candidates_tested: number;
  elapsed_ms: number;
  current_rate: number;
  current_candidate: string;
  matched: boolean;
  matched_password?: string;
  matched_rule?: string;
  status: "IDLE" | "RUNNING" | "MATCHED" | "BUDGET_EXHAUSTED" | "RESET";
}

export interface HashRaceResult {
  algorithm: "MD5" | "SHA-256" | "bcrypt" | "Argon2id";
  candidates_tested: number;
  elapsed_ms: number;
  throughput: number; // hashes per second
  memory_cost?: string;
  iterations?: string | number;
  status: "pending" | "running" | "completed";
}

export interface PriorityAccountAction {
  username: string;
  role: string;
  department: string;
  risk_tier: string;
  immediate_action: string;
  recommended_policy: string;
}

export interface RemediationReport {
  executive_summary: string;
  risk_explanation: string;
  priority_accounts: PriorityAccountAction[];
  password_policy_recommendations: string[];
  mfa_recommendations: string[];
  org_blocklist_suggestions: string[];
  remediation_priorities: string[];
}
