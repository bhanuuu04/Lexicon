"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Zap,
  Lock,
  Unlock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Globe,
  Radio,
  UserX,
  UserCheck,
} from "lucide-react";
import { Account, CompromisedAccountsResponse } from "../../types";
import { fetchCompromisedAccounts, blockAccount } from "../../lib/api";
import { getTierColor } from "../../lib/riskFormat";

interface CompromisedAccountsViewProps {
  onSelectAccount: (account: Account) => void;
  onLaunchAttack: (account: Account) => void;
  onAccountUpdated?: (account: Account) => void;
}

export const CompromisedAccountsView: React.FC<CompromisedAccountsViewProps> = ({
  onSelectAccount,
  onLaunchAttack,
  onAccountUpdated,
}) => {
  const [data, setData] = useState<CompromisedAccountsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [vectorFilter, setVectorFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchCompromisedAccounts({
        search,
        vector: vectorFilter,
        department: deptFilter !== "ALL" ? deptFilter : undefined,
        page,
        page_size: pageSize,
      });
      setData(res);
    } catch (err) {
      console.error("Failed to load compromised accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, vectorFilter, deptFilter, page, pageSize]);

  const handleToggleBlock = async (account: Account) => {
    setActionInProgressId(account.id);
    const targetState = !account.is_blocked;
    try {
      const res = await blockAccount(
        account.id,
        targetState,
        targetState ? "Breach & High Risk Compromise Mitigation" : undefined
      );
      
      // Update local state
      if (data) {
        setData({
          ...data,
          stats: {
            ...data.stats,
            blocked_count: targetState
              ? data.stats.blocked_count + 1
              : Math.max(0, data.stats.blocked_count - 1),
          },
          accounts: data.accounts.map((a) =>
            a.id === account.id
              ? {
                  ...a,
                  is_blocked: targetState,
                  blocked_reason: targetState ? "Breach & High Risk Compromise Mitigation" : undefined,
                  blocked_at: targetState ? new Date().toISOString() : undefined,
                }
              : a
          ),
        });
      }

      if (onAccountUpdated) {
        onAccountUpdated({
          ...account,
          is_blocked: targetState,
          blocked_reason: targetState ? "Breach & High Risk Compromise Mitigation" : undefined,
          blocked_at: targetState ? new Date().toISOString() : undefined,
        });
      }
    } catch (err) {
      console.error("Failed to update block state:", err);
    } finally {
      setActionInProgressId(null);
    }
  };

  const departments = [
    "ALL",
    "Information Technology",
    "Security Operations",
    "Engineering",
    "Finance",
    "Human Resources",
    "Product & Experience",
    "Legal & Compliance",
    "Sales & Marketing",
  ];

  const stats = data?.stats || {
    total_compromised: 0,
    breached_count: 0,
    attack_cracked_count: 0,
    critical_tier_count: 0,
    blocked_count: 0,
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP SUMMARY METRIC BANNER */}
      <div className="apple-card p-6 bg-white border border-black/[0.06] rounded-3xl shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06]">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-ping" />
              <h3 className="text-lg font-semibold text-[#1D1D1F] tracking-tight">
                Compromised & High-Risk Account Management
              </h3>
            </div>
            <p className="text-xs text-[#6E6E73]">
              Active Directory accounts flagged via breach correlation, empirical attack lab cracking, or compound critical risk
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              className="px-3 py-1.5 rounded-xl bg-[#F5F5F7] hover:bg-[#EBEBED] text-xs font-medium text-[#1D1D1F] border border-black/[0.06] flex items-center space-x-1.5 transition active:scale-[0.98]"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#6E6E73] ${loading ? "animate-spin text-[#0071E3]" : ""}`} />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </div>

        {/* 5 Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => {
              setVectorFilter("all");
              setPage(1);
            }}
            className={`p-3.5 rounded-2xl border text-left transition ${
              vectorFilter === "all"
                ? "bg-[#0071E3]/[0.06] border-[#0071E3]/30"
                : "bg-[#FAFAFC] border-black/[0.04] hover:bg-[#F5F5F7]"
            }`}
          >
            <span className="text-[10px] uppercase font-semibold text-[#86868B] block">Total Flagged</span>
            <span className="text-xl font-bold text-[#1D1D1F] mt-0.5 block">
              {stats.total_compromised.toLocaleString()}
            </span>
            <span className="text-[10px] text-[#0071E3] font-medium">All Risk Vectors</span>
          </button>

          <button
            onClick={() => {
              setVectorFilter("breached");
              setPage(1);
            }}
            className={`p-3.5 rounded-2xl border text-left transition ${
              vectorFilter === "breached"
                ? "bg-[#5856D6]/[0.06] border-[#5856D6]/30"
                : "bg-[#FAFAFC] border-black/[0.04] hover:bg-[#F5F5F7]"
            }`}
          >
            <span className="text-[10px] uppercase font-semibold text-[#86868B] block">Breach Correlated</span>
            <span className="text-xl font-bold text-[#5856D6] mt-0.5 block">
              {stats.breached_count.toLocaleString()}
            </span>
            <span className="text-[10px] text-[#86868B]">In 12B Dark Web Dump</span>
          </button>

          <button
            onClick={() => {
              setVectorFilter("attack_cracked");
              setPage(1);
            }}
            className={`p-3.5 rounded-2xl border text-left transition ${
              vectorFilter === "attack_cracked"
                ? "bg-[#FF9500]/[0.06] border-[#FF9500]/30"
                : "bg-[#FAFAFC] border-black/[0.04] hover:bg-[#F5F5F7]"
            }`}
          >
            <span className="text-[10px] uppercase font-semibold text-[#86868B] block">Attack Lab Cracked</span>
            <span className="text-xl font-bold text-[#FF9500] mt-0.5 block">
              {stats.attack_cracked_count.toLocaleString()}
            </span>
            <span className="text-[10px] text-[#86868B]">Empirically Verified</span>
          </button>

          <button
            onClick={() => {
              setVectorFilter("critical_tier");
              setPage(1);
            }}
            className={`p-3.5 rounded-2xl border text-left transition ${
              vectorFilter === "critical_tier"
                ? "bg-[#FF3B30]/[0.06] border-[#FF3B30]/30"
                : "bg-[#FAFAFC] border-black/[0.04] hover:bg-[#F5F5F7]"
            }`}
          >
            <span className="text-[10px] uppercase font-semibold text-[#86868B] block">Critical Tier</span>
            <span className="text-xl font-bold text-[#FF3B30] mt-0.5 block">
              {stats.critical_tier_count.toLocaleString()}
            </span>
            <span className="text-[10px] text-[#FF3B30] font-medium">Risk Score ≥ 0.70</span>
          </button>

          <button
            onClick={() => {
              setVectorFilter("blocked");
              setPage(1);
            }}
            className={`p-3.5 rounded-2xl border text-left transition ${
              vectorFilter === "blocked"
                ? "bg-[#FF3B30]/10 border-[#FF3B30]/40"
                : "bg-[#FAFAFC] border-black/[0.04] hover:bg-[#F5F5F7]"
            }`}
          >
            <span className="text-[10px] uppercase font-semibold text-[#86868B] block">Blocked Identities</span>
            <span className="text-xl font-bold text-[#FF3B30] mt-0.5 block">
              {stats.blocked_count.toLocaleString()}
            </span>
            <span className="text-[10px] text-[#FF3B30] font-medium">Access Suspended</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH & FILTER BAR */}
      <div className="apple-card p-4 bg-white border border-black/[0.06] rounded-2xl shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#86868B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search account ID, username, role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] focus:outline-none"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === "ALL" ? "All Departments" : dept}
              </option>
            ))}
          </select>

          <span className="text-xs text-[#86868B] px-2 whitespace-nowrap">
            {data?.total ? `${data.total.toLocaleString()} accounts` : "0 accounts"}
          </span>
        </div>
      </div>

      {/* 3. COMPROMISED ACCOUNTS TABLE / CARDS */}
      <div className="apple-card bg-white border border-black/[0.06] rounded-3xl shadow-card overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#0071E3] animate-spin" />
            <p className="text-xs text-[#6E6E73]">Filtering compromised identities...</p>
          </div>
        ) : !data || data.accounts.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-center px-4">
            <ShieldCheck className="w-12 h-12 text-[#34C759]" />
            <h4 className="text-base font-semibold text-[#1D1D1F]">
              No Compromised Accounts Found
            </h4>
            <p className="text-xs text-[#6E6E73] max-w-sm">
              All accounts in this filter view meet enterprise compliance or have been successfully remediated.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04]">
            {data.accounts.map((account) => {
              const tierBadge = getTierColor(account.final_tier || account.baseline_tier);
              const isBlocked = account.is_blocked;
              const isActing = actionInProgressId === account.id;

              return (
                <div
                  key={account.id}
                  className={`p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition hover:bg-[#FAFAFC] ${
                    isBlocked ? "bg-[#FF3B30]/[0.02]" : ""
                  }`}
                >
                  {/* Left Info */}
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isBlocked
                          ? "bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20"
                          : account.is_hero
                          ? "bg-[#FF3B30] text-white"
                          : "bg-[#F5F5F7] text-[#1D1D1F]"
                      }`}
                    >
                      {isBlocked ? (
                        <Lock className="w-4 h-4" />
                      ) : account.is_privileged ? (
                        <ShieldAlert className="w-4 h-4 text-[#FF3B30]" />
                      ) : (
                        <UserX className="w-4 h-4 text-[#86868B]" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[#1D1D1F]">
                          {account.username}
                        </span>
                        <span className="font-mono text-[11px] text-[#86868B]">
                          ({account.id})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tierBadge.bg} ${tierBadge.text}`}
                        >
                          {account.final_tier || account.baseline_tier} • Risk{" "}
                          {account.final_risk?.toFixed(2) || account.baseline_risk?.toFixed(2)}
                        </span>

                        {account.is_hero && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FF3B30] text-white">
                            HERO TARGET
                          </span>
                        )}

                        {isBlocked && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/30 flex items-center space-x-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>BLOCKED / ACCESS SUSPENDED</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#6E6E73]">
                        {account.role} • <strong>{account.department}</strong>
                      </p>

                      {/* Compromise Trigger Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {account.breach_match && (
                          <span className="px-2 py-0.5 rounded-md bg-[#5856D6]/10 text-[#5856D6] text-[10px] font-semibold border border-[#5856D6]/20">
                            Breach Correlated
                          </span>
                        )}
                        {account.password_group_id && (
                          <span className="px-2 py-0.5 rounded-md bg-[#0071E3]/10 text-[#0071E3] text-[10px] font-semibold border border-[#0071E3]/20">
                            Cluster #{account.password_group_id} Reuse
                          </span>
                        )}
                        {account.attack_adjustment > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-[#FF9500]/10 text-[#FF9500] text-[10px] font-semibold border border-[#FF9500]/20">
                            Attack Lab Cracked (+{account.attack_adjustment.toFixed(2)})
                          </span>
                        )}
                        {account.policy_violations && account.policy_violations.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-[#FF3B30]/10 text-[#FF3B30] text-[10px] font-semibold border border-[#FF3B30]/20">
                            {account.policy_violations.length} Policy Violations
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                    {/* Block / Unblock Button */}
                    <button
                      onClick={() => handleToggleBlock(account)}
                      disabled={isActing}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition active:scale-[0.98] ${
                        isBlocked
                          ? "bg-[#34C759] hover:bg-[#2FB34F] text-white shadow-xs"
                          : "bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/30"
                      }`}
                    >
                      {isActing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : isBlocked ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Unblock Account</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Block Account</span>
                        </>
                      )}
                    </button>

                    {/* Simulate Attack */}
                    <button
                      onClick={() => onLaunchAttack(account)}
                      className="px-3 py-2 rounded-xl bg-[#F5F5F7] hover:bg-[#EBEBED] text-xs font-medium text-[#1D1D1F] border border-black/[0.06] flex items-center space-x-1 transition active:scale-[0.98]"
                      title="Launch Bounded Attack Simulation in Attack Lab"
                    >
                      <Zap className="w-3.5 h-3.5 text-[#FF9500]" />
                      <span>Attack Lab</span>
                    </button>

                    {/* Inspect Details Drawer */}
                    <button
                      onClick={() => onSelectAccount(account)}
                      className="px-3 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-xs font-semibold text-white flex items-center space-x-1 shadow-xs transition active:scale-[0.98]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {data && data.total_pages > 1 && (
          <div className="p-4 bg-[#FAFAFC] border-t border-black/[0.06] flex items-center justify-between">
            <span className="text-xs text-[#86868B]">
              Page {data.page} of {data.total_pages} ({data.total.toLocaleString()} total)
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1}
                className="p-1.5 rounded-lg bg-white border border-black/[0.08] disabled:opacity-40 hover:bg-[#F5F5F7] transition"
              >
                <ChevronLeft className="w-4 h-4 text-[#1D1D1F]" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={data.page >= data.total_pages}
                className="p-1.5 rounded-lg bg-white border border-black/[0.08] disabled:opacity-40 hover:bg-[#F5F5F7] transition"
              >
                <ChevronRight className="w-4 h-4 text-[#1D1D1F]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
