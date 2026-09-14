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
      <div className="apple-card-static p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-500/20 bg-gradient-to-r from-indigo-950/25 via-slate-900/60 to-slate-900/40">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Credential Blast Radius Analysis</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1 font-sans">
            Lateral Movement & Shared Password Clusters
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 font-normal">
            Reused passwords create catastrophic lateral movement pathways. A single compromised credential pattern allows attackers to breach standard workstations and escalate directly into privileged domains.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/25 text-right shrink-0">
          <span className="text-[11px] text-slate-400 block uppercase font-medium">Tracked Clusters</span>
          <span className="text-2xl font-bold text-indigo-300 font-sans">{topClusters.length}+ Major Families</span>
        </div>
      </div>

      {/* Cluster Selector & Visual Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Cluster List */}
        <div className="apple-card-static p-6 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Top Reused Password Families
          </h3>
          <p className="text-xs text-slate-400">
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
                      ? "bg-indigo-500/15 border-indigo-500/40 shadow-[0_2px_12px_rgba(99,102,241,0.25)]"
                      : "bg-slate-800/40 border-white/[0.06] hover:border-white/[0.12]"
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-100 font-sans">
                        Cluster #{cluster.group_id}
                      </span>
                      {isHeroCluster && (
                        <span className="px-2 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold shadow-[0_0_6px_rgba(244,63,94,0.4)]">
                          HERO TARGET
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      Pattern: &quot;<span className="text-indigo-300 font-mono">{cluster.password_sample}</span>&quot;
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="text-indigo-300 font-bold font-sans">{cluster.total_accounts} Accounts</div>
                    <div className="text-[11px] text-cyan-300 font-medium">{cluster.privileged_count} Privileged</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Columns: Blast Radius Visualizer */}
        <div className="lg:col-span-2 apple-card-static p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase text-indigo-400 font-bold">
                    Blast Radius Matrix • Cluster #{selectedClusterId}
                  </span>
                  {selectedClusterId === 42 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-semibold">
                      Domain Admin Exposure
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mt-1 font-sans">
                  {activeClusterSummary?.total_accounts || 31} Accounts Compromised Concurrently
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Shared synthetic credential pattern: &quot;{activeClusterSummary?.password_sample}&quot;
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Privilege Infiltration:</div>
                <div className="text-lg font-bold text-cyan-400 font-sans">
                  {activeClusterSummary?.privileged_count || 1} Admins Exposed
                </div>
              </div>
            </div>

            {/* Department Blast Radius Tree Visualization */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Cross-Departmental Distribution</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeClusterSummary &&
                  Object.entries(activeClusterSummary.departments).map(([dept, count]) => (
                    <div key={dept} className="p-3.5 rounded-xl bg-slate-800/40 border border-white/[0.06]">
                      <span className="text-xs text-slate-400 block truncate font-medium">{dept}</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-lg font-bold text-indigo-300 font-sans">{count}</span>
                        <span className="text-[11px] text-slate-400">
                          {((count / activeClusterSummary.total_accounts) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Cluster Members List */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Sample Accounts in this Blast Radius</h4>
              {loading ? (
                <div className="py-6 text-center text-slate-400 text-xs font-medium">Loading cluster members...</div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 text-xs custom-scrollbar">
                  {clusterDetails?.accounts?.map((acc: Account) => (
                    <div
                      key={acc.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition ${
                        acc.is_privileged
                          ? "bg-rose-500/10 border-rose-500/30"
                          : "bg-slate-800/40 border-white/[0.06] hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {acc.is_privileged && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                            PRIVILEGED
                          </span>
                        )}
                        <span className="text-slate-100 font-medium font-sans">{acc.username}</span>
                        <span className="text-slate-400 text-[11px]">({acc.role})</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-400 text-[11px]">{acc.department}</span>
                        <button
                          onClick={() => onLaunchAttackWithAccount(acc)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/25 hover:bg-rose-500/25 text-[11px] flex items-center space-x-1 font-medium transition"
                        >
                          <Zap className="w-3 h-3 text-rose-400" />
                          <span>Attack</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08] mt-6 text-xs text-slate-400 flex items-center justify-between">
            <span>Critical takeaway:</span>
            <span className="text-rose-400 font-semibold">
              Cracking 1 password compromises all {activeClusterSummary?.total_accounts || 31} accounts simultaneously.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

