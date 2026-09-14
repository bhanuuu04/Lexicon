import { Account, AuditSummary, RemediationReport } from "../types";

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
