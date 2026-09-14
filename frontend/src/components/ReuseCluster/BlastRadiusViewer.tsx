"use client";

import React, { useState, useEffect } from "react";
import { Layers, Zap, ShieldAlert, ShieldCheck, ArrowRight, Network, UserCheck } from "lucide-react";
import { PasswordGroupSummary, Account } from "../../types";
import { fetchReuseCluster } from "../../lib/api";

interface BlastRadiusViewerProps {
  topClusters: PasswordGroupSummary[];
  onSelectClusterAccount: (accountId: string) => void;
  onLaunchAttackWithAccount: (account: Account) => void;
}

export const BlastRadiusViewer: React.FC<BlastRadiusViewerProps> = ({
  topClusters,
  onSelectClusterAccount,
  onLaunchAttackWithAccount,
}) => {
  const [selectedClusterId, setSelectedClusterId] = useState<number>(42);
  const [clusterDetails, setClusterDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCluster() {
      setLoading(true);
      try {
        const data = await fetchReuseCluster(selectedClusterId);
        setClusterDetails(data);
      } catch (e) {
        console.error("Failed to load cluster details:", e);
      } finally {
        setLoading(false);
      }
    }
    loadCluster();
  }, [selectedClusterId]);

  const activeClusterSummary = topClusters.find((c) => c.group_id === selectedClusterId) || topClusters[0];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="apple-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#5856D6]/20 bg-gradient-to-r from-[#5856D6]/[0.06] via-white to-white rounded-2xl shadow-card">
        <div>
          <div className="flex items-center space-x-2 text-[#5856D6] text-xs font-semibold uppercase tracking-wider">
            <Network className="w-4 h-4" />
            <span>Lateral Movement & Blast Radius Defense</span>
          </div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mt-1 font-sans">
            Credential Reuse Chains & Lateral Attack Paths
          </h2>
          <p className="text-xs text-[#6E6E73] max-w-2xl mt-1 font-normal leading-relaxed">
            Shared credentials allow single-workstation phish attacks to escalate laterally into Domain Controllers. Lexicon discovers and isolates these reuse families to contain the organizational blast radius.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#5856D6]/20 text-right shrink-0 shadow-xs">
          <span className="text-[11px] text-[#86868B] block uppercase font-medium">Monitored Families</span>
          <span className="text-2xl font-semibold text-[#5856D6] font-sans">{topClusters.length}+ Reuse Clusters</span>
        </div>
      </div>

      {/* Cluster Selector & Visual Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Cluster List */}
        <div className="apple-card p-6 space-y-3 bg-white border border-black/[0.06] rounded-2xl shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider">
              Top Reuse Families
            </h3>
            <span className="text-[10px] text-[#86868B]">Select to inspect</span>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
            {topClusters.map((cluster) => {
              const isHeroCluster = cluster.group_id === 42;
              const isSelected = cluster.group_id === selectedClusterId;
              return (
                <div
                  key={cluster.group_id}
                  onClick={() => setSelectedClusterId(cluster.group_id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-[#5856D6]/[0.08] border-[#5856D6]/40 shadow-xs"
                      : "bg-[#F5F5F7] border-black/[0.04] hover:border-black/[0.08] hover:bg-[#EBEBED]"
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-[#1D1D1F] font-sans">
                        Cluster #{cluster.group_id}
                      </span>
                      {isHeroCluster && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FF3B30] text-white text-[9px] font-semibold shadow-xs">
                          HIGH RISK HERO
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#86868B] font-mono mt-1">
                      Pattern: &quot;<span className="text-[#5856D6] font-mono font-medium">{cluster.password_sample}</span>&quot;
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="text-[#5856D6] font-semibold font-sans">{cluster.total_accounts} Accounts</div>
                    <div className="text-[11px] text-[#FF3B30] font-medium">{cluster.privileged_count} Admins</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Columns: Blast Radius Visualizer */}
        <div className="lg:col-span-2 apple-card p-6 flex flex-col justify-between bg-white border border-black/[0.06] rounded-2xl shadow-card">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-black/[0.06]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase text-[#5856D6] font-semibold">
                    Blast Radius Matrix • Cluster #{selectedClusterId}
                  </span>
                  {selectedClusterId === 42 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FF3B30]/[0.08] text-[#FF3B30] border border-[#FF3B30]/20 text-[10px] font-semibold">
                      Critical Domain Escalation
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-[#1D1D1F] mt-1 font-sans">
                  {activeClusterSummary?.total_accounts || 31} Accounts Compromised Concurrently
                </h3>
                <p className="text-xs text-[#86868B] font-mono mt-0.5">
                  Shared password pattern: &quot;{activeClusterSummary?.password_sample}&quot;
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <div className="text-xs text-[#6E6E73]">Domain Infiltration:</div>
                <div className="text-lg font-semibold text-[#FF3B30] font-sans">
                  {activeClusterSummary?.privileged_count || 1} Admins Exposed
                </div>
              </div>
            </div>

            {/* Department Blast Radius Tree Visualization */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase text-[#86868B] font-semibold tracking-wider">
                Cross-Department Lateral Spread
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeClusterSummary &&
                  Object.entries(activeClusterSummary.departments).map(([dept, count]) => (
                    <div key={dept} className="p-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.04]">
                      <span className="text-xs text-[#6E6E73] block truncate font-medium">{dept}</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-lg font-semibold text-[#5856D6] font-sans">{count}</span>
                        <span className="text-[11px] text-[#86868B]">
                          {((count / activeClusterSummary.total_accounts) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Cluster Members List */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase text-[#86868B] font-semibold tracking-wider">
                Sample Accounts in this Blast Radius
              </h4>
              {loading ? (
                <div className="py-8 text-center text-[#86868B] text-xs font-medium animate-pulse">
                  Tracing lateral propagation tree...
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 text-xs custom-scrollbar">
                  {clusterDetails?.accounts?.map((acc: Account) => (
                    <div
                      key={acc.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition ${
                        acc.is_privileged
                          ? "bg-[#FF3B30]/[0.05] border-[#FF3B30]/20"
                          : "bg-[#F5F5F7] border-black/[0.04] hover:border-black/[0.08] hover:bg-[#EBEBED]"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {acc.is_privileged && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FF3B30] text-white text-[9px] font-semibold">
                            DOMAIN ADMIN
                          </span>
                        )}
                        <span className="text-[#1D1D1F] font-medium font-sans">{acc.username}</span>
                        <span className="text-[#86868B] text-[11px]">({acc.role})</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-[#6E6E73] text-[11px]">{acc.department}</span>
                        <button
                          onClick={() => onLaunchAttackWithAccount(acc)}
                          className="px-2.5 py-1 rounded-lg bg-[#FF3B30]/[0.08] text-[#FF3B30] border border-[#FF3B30]/20 hover:bg-[#FF3B30]/[0.15] text-[11px] flex items-center space-x-1 font-medium transition active:scale-[0.98]"
                        >
                          <Zap className="w-3 h-3 text-[#FF3B30]" />
                          <span>Simulate Attack</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-black/[0.06] mt-6 text-xs text-[#6E6E73] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-medium text-[#1D1D1F]">Organizational Takeaway:</span>
            <span className="text-[#FF3B30] font-semibold">
              Compromising 1 workstation password grants lateral access across {activeClusterSummary?.total_accounts || 31} accounts.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
