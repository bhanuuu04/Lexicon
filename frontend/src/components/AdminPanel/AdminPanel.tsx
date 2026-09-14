"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiskOverviewCards } from "../RiskCards/RiskOverviewCards";
import { RiskDistributionChart } from "../Dashboard/RiskDistributionChart";
import { AccountDirectory } from "../Dashboard/AccountDirectory";
import { BlastRadiusViewer } from "../ReuseCluster/BlastRadiusViewer";
import { AttackLabArena } from "../AttackLab/AttackLabArena";
import { HashRaceArena } from "../HashRace/HashRaceArena";
import { AIAdvisoryStudio } from "../Remediation/AIAdvisoryStudio";
import { HIBPLiveModal } from "../HIBPCheck/HIBPLiveModal";
import { AuditLogsView } from "./AuditLogsView";
import { AdminSettings } from "./AdminSettings";
import { AuditSummary, Account } from "../../types";
import { fetchAccountDetail } from "../../lib/api";
import {
  Activity,
  Users,
  Network,
  Zap,
  Cpu,
  FileText,
  Globe,
  History,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Download,
  RefreshCw,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface AdminPanelProps {
  summary: AuditSummary;
  activeAdminTab: string;
  setActiveAdminTab: (tab: string) => void;
  selectedAccount: Account | null;
  attackTargetAccount: Account | null;
  onSelectAccount: (account: Account) => void;
  onLaunchAttack: (account: Account) => void;
  onHeroClick: () => void;
  onAccountUpdated: (updated: Account) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  summary,
  activeAdminTab,
  setActiveAdminTab,
  selectedAccount,
  attackTargetAccount,
  onSelectAccount,
  onLaunchAttack,
  onHeroClick,
  onAccountUpdated,
}) => {
  const [activeTierFilter, setActiveTierFilter] = useState<string>("ALL");
  const [isHIBPOpen, setIsHIBPOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCardFilterClick = (filterType: string) => {
    setActiveTierFilter(filterType);
    setActiveAdminTab("accounts");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const adminSubNav = [
    { id: "overview", label: "Overview", icon: Activity, badge: null },
    { id: "accounts", label: "Identities", icon: Users, badge: "50k" },
    { id: "blast-radius", label: "Blast Radius", icon: Network, badge: "805" },
    { id: "attack-lab", label: "Attack Lab", icon: Zap, badge: "Live" },
    { id: "hash-race", label: "Hash Race", icon: Cpu, badge: "4 Algos" },
    { id: "remediation", label: "AI Advisory", icon: FileText, badge: "CISO" },
    { id: "hibp", label: "Live HIBP", icon: Globe, badge: null },
    { id: "audit-logs", label: "Audit Logs", icon: History, badge: null },
    { id: "settings", label: "Settings", icon: Settings, badge: null },
  ];

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE SOC COMMAND & THREAT HEADER */}
      <div className="apple-card p-5 sm:p-6 bg-white border border-black/[0.06] rounded-2xl shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: SOC Identity Defense Status */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0071E3] flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-lg sm:text-xl font-semibold text-[#1D1D1F] tracking-tight font-sans">
                  Enterprise SOC Defense Operations
                </h1>
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse"></span>
                  <span>Continuous Shield Active</span>
                </span>
              </div>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                Monitoring 50,000 corporate identities • Zero unmitigated lateral escalation paths
              </p>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRefresh}
              className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-[#EBEBED] text-xs font-medium text-[#1D1D1F] border border-black/[0.06] flex items-center space-x-1.5 transition active:scale-[0.98]"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#6E6E73] ${isRefreshing ? "animate-spin text-[#0071E3]" : ""}`} />
              <span>{isRefreshing ? "Auditing..." : "Re-evaluate Posture"}</span>
            </button>

            <button
              onClick={() => setActiveAdminTab("remediation")}
              className="px-3.5 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-xs font-medium text-white flex items-center space-x-1.5 shadow-xs transition active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>CISO Advisory</span>
            </button>

            <button
              onClick={onHeroClick}
              className="px-3.5 py-2 rounded-xl bg-[#FF3B30]/10 hover:bg-[#FF3B30]/15 text-xs font-medium text-[#FF3B30] border border-[#FF3B30]/20 flex items-center space-x-1.5 transition active:scale-[0.98]"
              title="Target High-Risk Account in Attack Lab"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulate Hero Breach</span>
              <span className="sm:hidden">Hero Target</span>
            </button>
          </div>
        </div>

        {/* Live Defense Ticker / Safeguard Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-4 border-t border-black/[0.04] text-xs">
          <div className="flex items-center space-x-2 text-[#6E6E73]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759] shrink-0" />
            <span><strong>AD Scope:</strong> 50,000 Accounts</span>
          </div>
          <div className="flex items-center space-x-2 text-[#6E6E73]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759] shrink-0" />
            <span><strong>NIST 800-63B:</strong> Enforced</span>
          </div>
          <div className="flex items-center space-x-2 text-[#6E6E73]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#FF9500] shrink-0" />
            <span><strong>FGPP Queued:</strong> 3,018 Critical</span>
          </div>
          <div className="flex items-center space-x-2 text-[#6E6E73]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0071E3] shrink-0" />
            <span><strong>Data Sovereignty:</strong> 100% Client-Side</span>
          </div>
        </div>
      </div>

      {/* 2. APPLE-STYLE SEGMENTED DEFENSE SUBNAV */}
      <div className="flex items-center justify-between bg-white border border-black/[0.06] p-1.5 rounded-2xl shadow-card overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-1">
          {adminSubNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeAdminTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "hibp") {
                    setIsHIBPOpen(true);
                  } else {
                    setActiveAdminTab(item.id);
                  }
                }}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 shrink-0 ${
                  isActive
                    ? "bg-[#0071E3] text-white shadow-xs font-semibold"
                    : "text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-[#86868B]"}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-black/[0.05] text-[#86868B]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SUBVIEW ROUTING WITH MOTION TRANSITIONS */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeAdminTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {activeAdminTab === "overview" && (
            <div className="space-y-6">
              <RiskOverviewCards summary={summary} onCardClick={handleCardFilterClick} />
              <RiskDistributionChart summary={summary} />
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">
                    Protected Identity Directory
                  </h3>
                  <button
                    onClick={() => setActiveAdminTab("accounts")}
                    className="text-xs text-[#0071E3] font-medium hover:underline flex items-center space-x-1"
                  >
                    <span>View All 50,000 Accounts</span>
                    <span>→</span>
                  </button>
                </div>
                <AccountDirectory
                  onSelectAccount={onSelectAccount}
                  onLaunchAttack={onLaunchAttack}
                  initialTierFilter={activeTierFilter}
                />
              </div>
            </div>
          )}

          {activeAdminTab === "accounts" && (
            <div className="space-y-6">
              <AccountDirectory
                onSelectAccount={onSelectAccount}
                onLaunchAttack={onLaunchAttack}
                initialTierFilter={activeTierFilter}
              />
            </div>
          )}

          {activeAdminTab === "blast-radius" && (
            <div className="space-y-6">
              <BlastRadiusViewer
                topClusters={summary.top_reuse_clusters}
                onSelectClusterAccount={async (id) => {
                  const acc = await fetchAccountDetail(id);
                  onSelectAccount(acc);
                }}
                onLaunchAttackWithAccount={onLaunchAttack}
              />
            </div>
          )}

          {activeAdminTab === "attack-lab" && (
            <div className="space-y-6">
              <AttackLabArena
                targetAccount={attackTargetAccount}
                onAccountUpdated={onAccountUpdated}
                onSelectHeroAccount={onHeroClick}
              />
            </div>
          )}

          {activeAdminTab === "hash-race" && (
            <div className="space-y-6">
              <HashRaceArena />
            </div>
          )}

          {activeAdminTab === "remediation" && (
            <div className="space-y-6">
              <AIAdvisoryStudio summary={summary} />
            </div>
          )}

          {activeAdminTab === "audit-logs" && (
            <div className="space-y-6">
              <AuditLogsView />
            </div>
          )}

          {activeAdminTab === "settings" && (
            <div className="space-y-6">
              <AdminSettings />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* HIBP Live Modal */}
      <HIBPLiveModal
        isOpen={isHIBPOpen}
        onClose={() => setIsHIBPOpen(false)}
      />
    </div>
  );
};
