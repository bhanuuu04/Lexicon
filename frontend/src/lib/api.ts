import { Account, AuditSummary, RemediationReport, PasswordEvaluationResult } from "../types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : typeof window !== "undefined"
    ? ""
    : "http://127.0.0.1:8000";

export async function fetchAuditSummary(): Promise<AuditSummary> {
  const res = await fetch(`${API_BASE}/api/dataset/summary`);
  if (!res.ok) {
    throw new Error(`Failed to fetch audit summary: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchHeroAccount(): Promise<Account> {
  const res = await fetch(`${API_BASE}/api/dataset/hero-account`);
  if (!res.ok) {
    throw new Error(`Failed to fetch hero account: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAccounts(params: {
  search?: string;
  tier?: string;
  department?: string;
  is_privileged?: boolean;
  is_breached?: boolean;
  group_id?: number;
  page?: number;
  page_size?: number;
}): Promise<{ total: number; page: number; page_size: number; total_pages: number; accounts: Account[] }> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.tier && params.tier !== "ALL") query.set("tier", params.tier);
  if (params.department && params.department !== "ALL") query.set("department", params.department);
  if (params.is_privileged !== undefined) query.set("is_privileged", String(params.is_privileged));
  if (params.is_breached !== undefined) query.set("is_breached", String(params.is_breached));
  if (params.group_id !== undefined) query.set("group_id", String(params.group_id));
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));

  const res = await fetch(`${API_BASE}/api/dataset/accounts?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch accounts: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAccountDetail(accountId: string): Promise<Account> {
  const res = await fetch(`${API_BASE}/api/dataset/accounts/${accountId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch account ${accountId}`);
  }
  return res.json();
}

export async function fetchReuseCluster(groupId: number): Promise<any> {
  const res = await fetch(`${API_BASE}/api/dataset/reuse-clusters/${groupId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch reuse cluster ${groupId}`);
  }
  return res.json();
}

export async function submitAttackResult(payload: {
  account_id: string;
  algorithm: string;
  candidates_tested: number;
  elapsed_ms: number;
  matched: boolean;
  matched_rule?: string | null;
  time_budget_ms?: number;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/attack/result`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to record attack result`);
  }
  return res.json();
}

export async function generateRemediationReport(payload: any): Promise<RemediationReport> {
  const res = await fetch(`${API_BASE}/api/remediation/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to generate remediation report`);
  }
  return res.json();
}

export async function checkHIBPPrefix(prefix: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/hibp/check-range/${prefix}`);
  if (!res.ok) {
    throw new Error(`HIBP lookup failed`);
  }
  return res.json();
}

export async function evaluatePasswordLive(payload: {
  password: string;
  username?: string;
  department?: string;
  role?: string;
  custom_inputs?: string[];
}): Promise<PasswordEvaluationResult> {
  const res = await fetch(`${API_BASE}/api/audit/evaluate-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Password evaluation failed`);
  }
  return res.json();
}

export async function fetchDatasetMetadata(): Promise<import("../types").DatasetMetadata> {
  const res = await fetch(`${API_BASE}/api/dataset/metadata`);
  if (!res.ok) {
    throw new Error(`Failed to fetch dataset metadata`);
  }
  return res.json();
}

export async function generateNewDataset(
  params: number | {
    count: number;
    enterprise_id?: string;
    enterprise_name?: string;
    domain?: string;
    archetype?: string;
    replace_supabase?: boolean;
  }
): Promise<import("../types").GenerateDatasetResponse> {
  const payload = typeof params === "number" ? { count: params, replace_supabase: true } : { replace_supabase: true, ...params };
  const res = await fetch(`${API_BASE}/api/dataset/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate new synthetic dataset");
  }
  return res.json();
}

export async function fetchCompromisedAccounts(params: {
  search?: string;
  vector?: string;
  department?: string;
  page?: number;
  page_size?: number;
}): Promise<import("../types").CompromisedAccountsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.vector && params.vector !== "ALL") query.set("vector", params.vector);
  if (params.department && params.department !== "ALL") query.set("department", params.department);
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));

  const res = await fetch(`${API_BASE}/api/dataset/compromised-accounts?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch compromised accounts`);
  }
  return res.json();
}

export async function blockAccount(accountId: string, isBlocked: boolean, reason?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/accounts/${accountId}/block`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_blocked: isBlocked, reason: reason || "Security Risk Detected" }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update block status for account ${accountId}`);
  }
  return res.json();
}

export async function resetAccountPassword(
  accountId: string,
  newPassword: string
): Promise<import("../types").ResetPasswordResponse> {
  const res = await fetch(`${API_BASE}/api/accounts/${accountId}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_password: newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Password reset request failed");
  }
  return res.json();
}

export async function fetchAlgorithmMetadata(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/hashing/algorithms`);
  if (!res.ok) {
    throw new Error(`Failed to fetch algorithm metadata`);
  }
  return res.json();
}

export async function estimateCrackTimeAPI(payload: {
  password?: string;
  entropy_bits?: number;
  algorithm?: string;
  hardware_rig?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/hashing/estimate-crack-time`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Crack time estimation failed`);
  }
  return res.json();
}

export async function computeHashesAPI(password: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/hashing/compute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    throw new Error(`Hash computation failed`);
  }
  return res.json();
}

export async function loginUser(
  username: string,
  password: string
): Promise<import("../types").LoginResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Login request failed");
  }
  return res.json();
}

export async function runRealtimeSecurityAnalysis(): Promise<{
  status: string;
  message: string;
  summary: AuditSummary;
}> {
  const res = await fetch(`${API_BASE}/api/audit/run-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error("Failed to run real-time security analysis");
  }
  return res.json();
}

export async function blockAllSensitiveAccounts(
  reason: string = "Auditor Bulk Sensitive Lockdown",
  scope: string = "critical_and_breached"
): Promise<import("../types").BlockAllSensitiveResponse> {
  const res = await fetch(`${API_BASE}/api/accounts/block-all-sensitive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, scope }),
  });
  if (!res.ok) {
    throw new Error("Failed to execute bulk sensitive lockdown");
  }
  return res.json();
}

export async function syncDatasetToSupabase(limit?: number): Promise<any> {
  const res = await fetch(`${API_BASE}/api/database/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit }),
  });
  if (!res.ok) {
    throw new Error("Failed to synchronize dataset to Supabase");
  }
  return res.json();
}

export async function fetchDatabaseStatus(): Promise<import("../types").DatabaseStatus> {
  const res = await fetch(`${API_BASE}/api/database/status`);
  if (!res.ok) {
    throw new Error("Failed to fetch database status");
  }
  return res.json();
}

export async function fetchAuditLogs(limit: number = 50): Promise<import("../types").AuditLogEntry[]> {
  const res = await fetch(`${API_BASE}/api/audit/logs?limit=${limit}`);
  if (!res.ok) {
    throw new Error("Failed to fetch audit logs");
  }
  return res.json();
}

export function subscribeToRealtimeEvents(
  onEvent: (event: import("../types").RealtimeEvent) => void
): () => void {
  if (typeof window === "undefined" || !("EventSource" in window)) {
    return () => {};
  }

  let eventSource: EventSource | null = null;
  let isClosed = false;

  function connect() {
    if (isClosed) return;
    try {
      eventSource = new EventSource(`${API_BASE}/api/realtime/events`);

      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          onEvent(parsed);
        } catch (err) {
          // ignore non-json pings
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!isClosed) {
          setTimeout(connect, 3000);
        }
      };
    } catch (e) {
      if (!isClosed) {
        setTimeout(connect, 5000);
      }
    }
  }

  connect();

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}


