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
    <div className="mt-8 apple-card p-6">
      {/* SECTION 1: HEADER & SEARCH */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <div className="flex items-center space-x-3">
            <h3 className="text-lg sm:text-xl font-semibold text-[#1D1D1F] tracking-tight font-sans">
              Enterprise Account Risk Directory
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#0071E3]/[0.08] text-[#0071E3] border border-[#0071E3]/20">
              {totalCount.toLocaleString()} Matching
            </span>
          </div>
          <p className="text-xs text-[#6E6E73] font-normal mt-1">
            50,000 accounts analyzed • Instant telemetry search & drilldown
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search username, role, department..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-xs sm:text-sm text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#0071E3] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/15 transition font-sans"
          />
        </div>
      </div>

      {/* SECTION 2: FILTERS TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-4 border-b border-black/[0.06]">
        {/* Tier Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[#6E6E73] mr-1.5 flex items-center font-medium">
            <Filter className="w-3.5 h-3.5 mr-1 text-[#86868B]" /> Tier:
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
                  ? "bg-[#0071E3] text-white shadow-sm font-semibold"
                  : "bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#EBEBED] border border-black/[0.04]"
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
                ? "bg-[#0071E3]/[0.08] text-[#0071E3] border-[#0071E3]/30 font-semibold"
                : "bg-[#F5F5F7] text-[#6E6E73] border-black/[0.04] hover:bg-[#EBEBED] hover:text-[#1D1D1F]"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>Privileged Only</span>
          </button>

          <button
            onClick={() => {
              setBreachFilter(breachFilter ? undefined : true);
              setPage(1);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition font-medium ${
              breachFilter
                ? "bg-[#FF3B30]/[0.08] text-[#FF3B30] border-[#FF3B30]/30 font-semibold"
                : "bg-[#F5F5F7] text-[#6E6E73] border-black/[0.04] hover:bg-[#EBEBED] hover:text-[#1D1D1F]"
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#FF3B30]" />
            <span>Breached Only</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: ACCOUNT DATA TABLE */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left text-xs min-w-[760px]">
          <thead className="text-[#86868B] font-semibold uppercase tracking-wider text-[11px] border-b border-black/[0.06]">
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
          <tbody className="divide-y divide-black/[0.04]">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#86868B]">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-[#0071E3] border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-medium">Querying 50,000-account index...</span>
                  </div>
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#86868B] font-medium">
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
                    className={`hover:bg-[#F5F5F7]/80 transition-colors cursor-pointer ${
                      acc.is_hero ? "bg-[#FF3B30]/[0.04] border-l-2 border-l-[#FF3B30]" : ""
                    }`}
                    onClick={() => onSelectAccount(acc)}
                  >
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-2">
                        {acc.is_hero && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FF3B30] text-white text-[10px] font-semibold shadow-sm">
                            HERO TARGET
                          </span>
                        )}
                        <span className="font-semibold text-[#1D1D1F] font-sans">{acc.username}</span>
                      </div>
                      <div className="text-[11px] text-[#86868B] mt-0.5 font-mono">{acc.id}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-[#1D1D1F] font-medium">{acc.role}</div>
                      <div className="text-[11px] text-[#6E6E73] mt-0.5">{acc.department}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      {acc.is_privileged ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#0071E3]/[0.08] text-[#0071E3] border border-[#0071E3]/20 text-[10px] font-semibold">
                          <ShieldAlert className="w-3 h-3 text-[#0071E3]" />
                          <span>ADMIN</span>
                        </span>
                      ) : (
                        <span className="text-[#86868B] text-xs">Standard</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`font-semibold text-xs ${
                          acc.zxcvbn_score <= 1
                            ? "text-[#FF3B30]"
                            : acc.zxcvbn_score === 2
                            ? "text-[#FF9500]"
                            : "text-[#34C759]"
                        }`}
                      >
                        Score {acc.zxcvbn_score}/4
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-1.5">
                        {acc.breach_match && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FF3B30]/[0.08] text-[#FF3B30] border border-[#FF3B30]/20 text-[10px] font-semibold">
                            BREACH
                          </span>
                        )}
                        {acc.password_group_id !== null ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#5856D6]/[0.08] text-[#5856D6] border border-[#5856D6]/20 text-[10px] font-semibold">
                            Cluster #{acc.password_group_id}
                          </span>
                        ) : (
                          <span className="text-[#86868B] text-xs">Unique</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${tierStyle.badge}`}>
                          {tier}
                        </span>
                        <span className="text-[#1D1D1F] font-semibold font-sans">
                          {((acc.final_risk || acc.baseline_risk) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onLaunchAttack(acc)}
                          className="px-3 py-1 rounded-lg bg-[#FF3B30]/[0.08] hover:bg-[#FF3B30]/[0.15] border border-[#FF3B30]/20 text-[#FF3B30] text-xs flex items-center space-x-1.5 transition font-medium"
                          title="Launch Bounded Web Worker Attack on this account"
                        >
                          <Zap className="w-3 h-3 text-[#FF3B30]" />
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
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-black/[0.06] text-xs text-[#6E6E73]">
        <div>
          Page {page} of {totalPages} ({totalCount.toLocaleString()} accounts)
        </div>
        <div className="flex items-center space-x-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg bg-[#F5F5F7] border border-black/[0.08] disabled:opacity-30 hover:bg-[#EBEBED] transition text-[#1D1D1F]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg bg-[#F5F5F7] border border-black/[0.08] disabled:opacity-30 hover:bg-[#EBEBED] transition text-[#1D1D1F]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};


