"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ShieldAlert,
  Shield,
  Database,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Account } from "../../types";
import { fetchAccounts } from "../../lib/api";
import { getTierColor } from "../../lib/riskFormat";

interface AccountDirectoryProps {
  onSelectAccount: (account: Account) => void;
  onLaunchAttack: (account: Account) => void;
  initialTierFilter?: string;
}

export const AccountDirectory: React.FC<AccountDirectoryProps> = ({
  onSelectAccount,
  onLaunchAttack,
  initialTierFilter = "ALL",
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState(initialTierFilter);
  const [privFilter, setPrivFilter] = useState<boolean | undefined>(undefined);
  const [breachFilter, setBreachFilter] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setTierFilter(initialTierFilter);
    setPage(1);
  }, [initialTierFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchAccounts({
        search,
        tier: tierFilter,
        is_privileged: privFilter,
        is_breached: breachFilter,
        page,
        page_size: pageSize,
      });
      setAccounts(res.accounts);
      setTotalPages(res.total_pages);
      setTotalCount(res.total);
    } catch (err) {
      console.error("Failed to load accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, tierFilter, privFilter, breachFilter, page, pageSize]);

  return (
    <div className="mt-8 apple-card-static p-6">
      {/* SECTION 1: HEADER & SEARCH */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center space-x-3">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight font-sans">
              Enterprise Account Risk Directory
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {totalCount.toLocaleString()} Matching
            </span>
          </div>
          <p className="text-xs text-slate-400 font-normal mt-1">
            50,000 accounts analyzed • Instant telemetry search & drilldown
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search username, role, department..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/60 border border-white/[0.08] text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition font-sans"
          />
        </div>
      </div>

      {/* SECTION 2: FILTERS TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-4 border-b border-white/[0.08]">
        {/* Tier Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 mr-1.5 flex items-center font-medium">
            <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" /> Tier:
          </span>
          {["ALL", "Critical", "High", "Medium", "Low"].map((tier) => (
            <button
              key={tier}
              onClick={() => {
                setTierFilter(tier);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition font-medium text-xs ${
                tierFilter === tier
                  ? "bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]"
                  : "bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-white/[0.05]"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>

        {/* Checkbox / Toggle Flags */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => {
              setPrivFilter(privFilter ? undefined : true);
              setPage(1);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition font-medium ${
              privFilter
                ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                : "bg-slate-800/50 text-slate-400 border-white/[0.05] hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Privileged Only</span>
          </button>

          <button
            onClick={() => {
              setBreachFilter(breachFilter ? undefined : true);
              setPage(1);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition font-medium ${
              breachFilter
                ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                : "bg-slate-800/50 text-slate-400 border-white/[0.05] hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Database className="w-3.5 h-3.5 text-rose-400" />
            <span>Breached Only</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: ACCOUNT DATA TABLE */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left text-xs min-w-[760px]">
          <thead className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-white/[0.08]">
            <tr>
              <th className="py-3 px-3">Identity</th>
              <th className="py-3 px-3">Department & Role</th>
              <th className="py-3 px-3">Privilege</th>
              <th className="py-3 px-3">Entropy (zxcvbn)</th>
              <th className="py-3 px-3">Breach / Reuse</th>
              <th className="py-3 px-3">Risk Score & Tier</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-medium">Querying 50,000-account index...</span>
                  </div>
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                  No accounts found matching filter criteria.
                </td>
              </tr>
            ) : (
              accounts.map((acc) => {
                const tier = acc.final_tier || acc.baseline_tier;
                const tierStyle = getTierColor(tier);
                return (
                  <tr
                    key={acc.id}
                    className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${
                      acc.is_hero ? "bg-rose-500/10 border-l-2 border-l-rose-500" : ""
                    }`}
                    onClick={() => onSelectAccount(acc)}
                  >
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-2">
                        {acc.is_hero && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-[0_0_8px_rgba(244,63,94,0.5)]">
                            HERO TARGET
                          </span>
                        )}
                        <span className="font-semibold text-slate-100 font-sans">{acc.username}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{acc.id}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-slate-200 font-medium">{acc.role}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{acc.department}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      {acc.is_privileged ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-semibold">
                          <ShieldAlert className="w-3 h-3 text-cyan-400" />
                          <span>ADMIN</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Standard</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`font-semibold text-xs ${
                          acc.zxcvbn_score <= 1
                            ? "text-rose-400"
                            : acc.zxcvbn_score === 2
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        Score {acc.zxcvbn_score}/4
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-1.5">
                        {acc.breach_match && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-semibold">
                            BREACH
                          </span>
                        )}
                        {acc.password_group_id !== null ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-semibold">
                            Cluster #{acc.password_group_id}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Unique</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${tierStyle.badge}`}>
                          {tier}
                        </span>
                        <span className="text-slate-100 font-bold font-sans">
                          {((acc.final_risk || acc.baseline_risk) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onLaunchAttack(acc)}
                          className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs flex items-center space-x-1.5 transition font-medium"
                          title="Launch Bounded Web Worker Attack on this account"
                        >
                          <Zap className="w-3 h-3 text-rose-400" />
                          <span>Attack Lab</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* SECTION 4: PAGINATION CONTROLS */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.08] text-xs text-slate-400">
        <div>
          Page {page} of {totalPages} ({totalCount.toLocaleString()} accounts)
        </div>
        <div className="flex items-center space-x-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg bg-slate-800/60 border border-white/[0.08] disabled:opacity-30 hover:bg-slate-800 transition text-slate-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg bg-slate-800/60 border border-white/[0.08] disabled:opacity-30 hover:bg-slate-800 transition text-slate-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

