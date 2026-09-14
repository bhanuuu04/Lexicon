export interface ZxcvbnSequenceItem {
  pattern: string;
  token: string;
  matched_word?: string;
  dictionary_name?: string;
  guesses_log10?: number;
}

export interface ZxcvbnCrackTimes {
  online_throttling_100_per_hour: string;
  online_no_throttling_10_per_second: string;
  offline_slow_hashing_1e4_per_second: string;
  offline_fast_hashing_1e10_per_second: string;
}

export interface ZxcvbnFeedback {
  warning: string;
  suggestions: string[];
}

export interface ZxcvbnAnalysis {
  score: number;
  guesses: string;
  guesses_log10: number;
  entropy_bits: number;
  sequence: ZxcvbnSequenceItem[];
  crack_times_display: ZxcvbnCrackTimes;
  crack_times_seconds: Record<string, number>;
  feedback: ZxcvbnFeedback;
}

export interface PasswordEvaluationResult {
  password: string;
  zxcvbn: ZxcvbnAnalysis;
  policy_violations: string[];
  password_weakness: number;
  is_policy_compliant: boolean;
}

export interface Account {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  sid?: string;
  password_age_days?: number;
  mfa_enabled?: boolean;
  failed_login_count?: number;
  department: string;
  role: string;
  is_privileged: boolean;
  password_group_id: number | null;
  plaintext_password: string; // Synthetic only
  hash_ntlm?: string;
  hash_md5: string;
  hash_sha256: string;
  hash_bcrypt: string;
  hash_argon2id: string;
  policy_violations: string[];
  zxcvbn_score: number;
  zxcvbn_analysis?: ZxcvbnAnalysis;
  breach_match: boolean;
  baseline_risk: number;
  baseline_tier: "Critical" | "High" | "Medium" | "Low";
  attack_adjustment: number;
  final_risk: number;
  final_tier: "Critical" | "High" | "Medium" | "Low";
  is_hero?: boolean;
  hero_compromised?: boolean;
  is_breached?: boolean;
  is_blocked?: boolean;
  blocked_reason?: string;
  blocked_at?: string;
  last_remediated_at?: string;
  attack_evidence?: {
    algorithm: string;
    candidates_tested: number;
    elapsed_ms: number;
    matched: boolean;
    matched_rule?: string;
  };
}

export interface DatasetMetadata {
  version: string;
  created_at: string;
  total_accounts: number;
  dataset_file: string;
  is_custom_generated: boolean;
  blocked_count: number;
  generator_config?: {
    reused_ratio: number;
    unique_weak_ratio: number;
    strong_unique_ratio: number;
    seed: number;
  };
}

export interface PasswordCheckDetail {
  rule_name: string;
  passed: boolean;
  message: string;
  severity: "error" | "warning" | "success";
}

export interface ResetPasswordResponse {
  success: boolean;
  account_id: string;
  message: string;
  checks: PasswordCheckDetail[];
  account?: Account;
}

export interface CompromisedAccountsResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  stats: {
    total_compromised: number;
    breached_count: number;
    attack_cracked_count: number;
    critical_tier_count: number;
    blocked_count: number;
  };
  accounts: Account[];
}

export interface GenerateDatasetResponse {
  status: string;
  message: string;
  metadata: DatasetMetadata;
  summary: AuditSummary;
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

export interface OrganizationHealth {
  organization_risk_score: number;
  security_readiness_pct: number;
  admin_exposure_pct: number;
  workforce_exposure_pct: number;
  top_admin_compromised: boolean;
  hero_compromised?: boolean;
  top_admin_compromised_count: number;
  status: "Healthy" | "Elevated Risk" | "Critical Danger";
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
  organization_health?: OrganizationHealth;
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
  algorithm: "NTLM" | "MD5" | "SHA-256" | "bcrypt" | "Argon2id";
  candidates_tested: number;
  elapsed_ms: number;
  throughput: number; // hashes per second
  memory_cost?: string;
  iterations?: string | number;
  status: "pending" | "running" | "completed";
}

export interface CrackTimeEstimate {
  entropy_bits: number;
  total_combinations: string;
  hardware_rig: string;
  hash_rate_per_sec: number;
  estimated_seconds: number;
  human_readable: string;
}

export interface AlgorithmMetadata {
  name: string;
  category: string;
  work_factor: string;
  memory_cost: string;
  gpu_resistance: string;
  standard: string;
  description: string;
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

export interface LoginResponse {
  status: "authenticated" | "blocked" | "invalid_credentials";
  message: string;
  account?: Account | null;
}

export interface DatabaseStatus {
  connected: boolean;
  provider: string;
  url: string;
  total_local_accounts: number;
  total_summary_accounts: number;
  last_sync: string;
}

export interface AuditLogEntry {
  id: number;
  enterprise_id: string;
  action: string;
  actor: string;
  target_account_id?: string | null;
  details: Record<string, any>;
  created_at: string;
}

export interface BlockAllSensitiveResponse {
  status: string;
  blocked_count: number;
  total_sensitive: number;
  message: string;
}

export interface RealtimeEvent {
  type: "CONNECTED" | "ACCOUNT_BLOCKED" | "BULK_SENSITIVE_BLOCKED" | "PASSWORD_REMEDIATED" | "AUDIT_COMPLETED" | "DATABASE_SYNCED" | "DATASET_GENERATED";
  timestamp: string;
  data?: any;
  message?: string;
}



