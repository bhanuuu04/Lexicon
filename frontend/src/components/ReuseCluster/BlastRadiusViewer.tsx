"use client";

import React, { useState, useEffect } from "react";
import { Layers, Zap } from "lucide-react";
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
      <div className="apple-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#5856D6]/20 bg-gradient-to-r from-[#5856D6]/[0.06] via-white to-white">
        <div>
          <div className="flex items-center space-x-2 text-[#5856D6] text-xs font-semibold uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Credential Blast Radius Analysis</span>
          </div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mt-1 font-sans">
            Lateral Movement & Shared Password Clusters
          </h2>
          <p className="text-xs text-[#6E6E73] max-w-2xl mt-1 font-normal">
            Reused passwords create catastrophic lateral movement pathways. A single compromised credential pattern allows attackers to breach standard workstations and escalate directly into privileged domains.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#5856D6]/20 text-right shrink-0 shadow-sm">
          <span className="text-[11px] text-[#86868B] block uppercase font-medium">Tracked Clusters</span>
          <span className="text-2xl font-semibold text-[#5856D6] font-sans">{topClusters.length}+ Major Families</span>
        </div>
      </div>

      {/* Cluster Selector & Visual Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Cluster List */}
        <div className="apple-card p-6 space-y-3">
          <h3 className="text-sm font-semibold text-[#1D1D1F] uppercase tracking-wider">
            Top Reused Password Families
          </h3>
          <p className="text-xs text-[#6E6E73]">
            Select a cluster to trace its blast radius across departments:
          </p>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {topClusters.map((cluster) => {
              const isHeroCluster = cluster.group_id === 42;
              const isSelected = cluster.group_id === selectedClusterId;
              return (
                <div
                  key={cluster.group_id}
                  onClick={() => setSelectedClusterId(cluster.group_id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-[#5856D6]/[0.08] border-[#5856D6]/40 shadow-sm"
                      : "bg-[#F5F5F7] border-black/[0.04] hover:border-black/[0.08] hover:bg-[#EBEBED]"
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-[#1D1D1F] font-sans">
                        Cluster #{cluster.group_id}
                      </span>
                      {isHeroCluster && (
                        <span className="px-2 py-0.2 rounded-full bg-[#FF3B30] text-white text-[9px] font-semibold shadow-sm">
                          HERO TARGET
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#86868B] font-mono mt-1">
                      Pattern: &quot;<span className="text-[#5856D6] font-mono font-medium">{cluster.password_sample}</span>&quot;
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="text-[#5856D6] font-semibold font-sans">{cluster.total_accounts} Accounts</div>
                    <div className="text-[11px] text-[#0071E3] font-medium">{cluster.privileged_count} Privileged</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Columns: Blast Radius Visualizer */}
        <div className="lg:col-span-2 apple-card p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-black/[0.06]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase text-[#5856D6] font-semibold">
                    Blast Radius Matrix • Cluster #{selectedClusterId}
                  </span>
                  {selectedClusterId === 42 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FF3B30]/[0.08] text-[#FF3B30] border border-[#FF3B30]/20 text-[10px] font-semibold">
                      Domain Admin Exposure
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-[#1D1D1F] mt-1 font-sans">
                  {activeClusterSummary?.total_accounts || 31} Accounts Compromised Concurrently
                </h3>
                <p className="text-xs text-[#86868B] font-mono mt-0.5">
                  Shared synthetic credential pattern: &quot;{activeClusterSummary?.password_sample}&quot;
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-[#6E6E73]">Privilege Infiltration:</div>
                <div className="text-lg font-semibold text-[#0071E3] font-sans">
                  {activeClusterSummary?.privileged_count || 1} Admins Exposed
                </div>
              </div>
            </div>

            {/* Department Blast Radius Tree Visualization */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase text-[#86868B] font-semibold tracking-wider">Cross-Departmental Distribution</h4>
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
              <h4 className="text-xs uppercase text-[#86868B] font-semibold tracking-wider">Sample Accounts in this Blast Radius</h4>
              {loading ? (
                <div className="py-6 text-center text-[#86868B] text-xs font-medium">Loading cluster members...</div>
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
                            PRIVILEGED
                          </span>
                        )}
                        <span className="text-[#1D1D1F] font-medium font-sans">{acc.username}</span>
                        <span className="text-[#86868B] text-[11px]">({acc.role})</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-[#6E6E73] text-[11px]">{acc.department}</span>
                        <button
                          onClick={() => onLaunchAttackWithAccount(acc)}
                          className="px-2.5 py-1 rounded-lg bg-[#FF3B30]/[0.08] text-[#FF3B30] border border-[#FF3B30]/20 hover:bg-[#FF3B30]/[0.15] text-[11px] flex items-center space-x-1 font-medium transition"
                        >
                          <Zap className="w-3 h-3 text-[#FF3B30]" />
                          <span>Attack</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-black/[0.06] mt-6 text-xs text-[#6E6E73] flex items-center justify-between">
            <span>Critical takeaway:</span>
            <span className="text-[#FF3B30] font-semibold">
              Cracking 1 password compromises all {activeClusterSummary?.total_accounts || 31} accounts simultaneously.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


