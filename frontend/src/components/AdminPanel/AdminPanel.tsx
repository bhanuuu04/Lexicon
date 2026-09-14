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
import { CompromisedAccountsView } from "./CompromisedAccountsView";
import { GenerateDatasetModal } from "./GenerateDatasetModal";
import { AuditSummary, Account, DatasetMetadata, GenerateDatasetResponse } from "../../types";
import { fetchAccountDetail, fetchDatasetMetadata } from "../../lib/api";
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
  Radio,
  Lock,
  ArrowRight,
  TrendingUp,
  Shield,
  Layers,
  ChevronRight,
  Database,
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
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metadata, setMetadata] = useState<DatasetMetadata | null>(null);

  React.useEffect(() => {
    async function loadMeta() {
      try {
        const meta = await fetchDatasetMetadata();
        setMetadata(meta);
      } catch (e) {
        console.error("Failed to load dataset metadata:", e);
      }
    }
    loadMeta();
  }, []);

  const handleDatasetGenerated = (res: GenerateDatasetResponse) => {
    setMetadata(res.metadata);
    window.location.reload();
  };

  const handleCardFilterClick = (filterType: string) => {
    setActiveTierFilter(filterType);
    setActiveAdminTab("accounts");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      window.location.reload();
    }, 800);
  };

  const adminSubNav = [
    { id: "overview", label: "Defense Overview", icon: Activity, badge: null },
    { id: "compromised", label: "Compromised Accounts", icon: ShieldAlert, badge: "Action" },
    { id: "accounts", label: "Corporate Identities", icon: Users, badge: `${summary.total_accounts.toLocaleString()}` },
    { id: "blast-radius", label: "Blast Radius", icon: Network, badge: "805" },
    { id: "attack-lab", label: "Attack Lab", icon: Zap, badge: "Live" },
    { id: "hash-race", label: "Hash Race", icon: Cpu, badge: "5 Algos" },
    { id: "remediation", label: "AI Advisory", icon: FileText, badge: "CISO" },
    { id: "hibp", label: "k-Anonymity HIBP", icon: Globe, badge: null },
    { id: "audit-logs", label: "Audit Trail", icon: History, badge: null },
    { id: "settings", label: "Settings", icon: Settings, badge: null },
  ];

  // Calculate high level security readiness score
  const defenseReadiness = Math.round(
    100 - (summary.critical_count / summary.total_accounts) * 100 * 1.5
  );

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE SOC THREAT & READINESS COCKPIT */}
      <div className="apple-card p-6 sm:p-8 bg-white border border-black/[0.06] rounded-3xl shadow-card overflow-hidden relative">
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0071E3]/[0.03] rounded-full blur-3xl -z-0 pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Overall Health Dial & Defense Status (4 cols) */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 border-b lg:border-b-0 lg:border-r border-black/[0.06] pb-6 lg:pb-0 lg:pr-6">
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#E5E5EA]"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#0071E3]"
                  strokeDasharray={`${defenseReadiness}, 100`}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-semibold text-[#1D1D1F] font-sans">{defenseReadiness}%</span>
                <span className="text-[9px] uppercase font-bold text-[#86868B] tracking-wider">
                  Readiness
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse"></span>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#34C759]">
                  Continuous Defense Active
                </span>
                {metadata && (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-black/[0.05] text-[#86868B]">
                    v{metadata.version} • {metadata.total_accounts.toLocaleString()} AD records
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-[#1D1D1F] tracking-tight">
                Enterprise Identity Safeguard
              </h2>
              <p className="text-xs text-[#6E6E73] leading-relaxed">
                Active Directory scope: <strong>{summary.total_accounts.toLocaleString()} accounts</strong> across {summary.reuse_cluster_count} credential reuse families.
                {metadata?.created_at && (
                  <span className="block text-[11px] text-[#86868B] mt-0.5">
                    Persistent Dataset Synthesized: {new Date(metadata.created_at).toLocaleDateString()} {new Date(metadata.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right: Key Defense Telemetry Metrics & Quick Action Suite (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            {/* 4 Core Posture Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-[#FAFAFC] border border-black/[0.04]">
                <span className="text-[10px] uppercase font-semibold text-[#86868B] block">Critical Tier</span>
                <span className="text-base font-bold text-[#FF3B30] mt-0.5 block">
                  {summary.critical_count.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#86868B]">Immediate Action</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAFAFC] border border-black/[0.04]">
                <span className="text-[10px] uppercase font-semibold text-[#86868B] block">Admins Exposed</span>
                <span className="text-base font-bold text-[#FF9500] mt-0.5 block">
                  {summary.privileged_at_risk_count.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#86868B]">of {summary.privileged_count} Total</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAFAFC] border border-black/[0.04]">
                <span className="text-[10px] uppercase font-semibold text-[#86868B] block">Breach Matches</span>
                <span className="text-base font-bold text-[#5856D6] mt-0.5 block">
                  {summary.breached_count.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#86868B]">Known Leaks</span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAFAFC] border border-black/[0.04]">
                <span className="text-[10px] uppercase font-semibold text-[#86868B] block">Reuse Families</span>
                <span className="text-base font-bold text-[#0071E3] mt-0.5 block">
                  {summary.reuse_cluster_count.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#86868B]">Blast Radius Scope</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-[#EBEBED] text-xs font-medium text-[#1D1D1F] border border-black/[0.06] flex items-center space-x-1.5 transition active:scale-[0.98]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#6E6E73] ${isRefreshing ? "animate-spin text-[#0071E3]" : ""}`} />
                  <span>{isRefreshing ? "Auditing Dataset..." : "Re-evaluate Posture"}</span>
                </button>
                <button
                  onClick={() => setIsGenerateModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#0071E3]/10 hover:bg-[#0071E3]/15 text-xs font-semibold text-[#0071E3] border border-[#0071E3]/20 flex items-center space-x-1.5 transition active:scale-[0.98]"
                  title="Generate new synthetic dataset with custom size"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Generate Synthetic Data</span>
                </button>
                <button
                  onClick={() => setIsHIBPOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-[#EBEBED] text-xs font-medium text-[#1D1D1F] border border-black/[0.06] flex items-center space-x-1.5 transition active:scale-[0.98]"
                >
                  <Globe className="w-3.5 h-3.5 text-[#0071E3]" />
                  <span>k-Anonymity</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={onHeroClick}
                  className="px-4 py-2 rounded-xl bg-[#FF3B30]/10 hover:bg-[#FF3B30]/15 text-xs font-semibold text-[#FF3B30] border border-[#FF3B30]/20 flex items-center space-x-1.5 transition active:scale-[0.98]"
                  title="Simulate attack against hero account alex.morgan (Cluster #42)"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Simulate Hero Breach</span>
                </button>

                <button
                  onClick={() => setActiveAdminTab("remediation")}
                  className="px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-xs font-semibold text-white flex items-center space-x-1.5 shadow-xs transition active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CISO Remediation</span>
                </button>
              </div>
            </div>
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
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 shrink-0 ${
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

      {/* 3. DEFENSE OPERATIONS WORKSPACE (VIEW ROUTING) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeAdminTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* VIEW: Overview */}
          {activeAdminTab === "overview" && (
            <div className="space-y-6">
              <RiskOverviewCards summary={summary} onCardClick={handleCardFilterClick} />
              <RiskDistributionChart summary={summary} />

              {/* High-Priority Immediate Mitigation Focus */}
              <div className="apple-card p-6 bg-white border border-black/[0.06] rounded-3xl shadow-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-black/[0.06]">
                  <div>
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-[#FF3B30]" />
                      <h3 className="text-sm sm:text-base font-semibold text-[#1D1D1F]">
                        Critical Remediation Priorities
                      </h3>
                    </div>
                    <p className="text-xs text-[#6E6E73] mt-0.5">
                      Top high-impact Active Directory accounts with multiple compounding vulnerability vectors
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTierFilter("Critical");
                      setActiveAdminTab("accounts");
                    }}
                    className="text-xs text-[#0071E3] font-semibold hover:underline flex items-center space-x-1"
                  >
                    <span>View All {summary.critical_count.toLocaleString()} Critical Accounts</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Hero Account Priority */}
                  <div className="p-4 rounded-2xl bg-[#FF3B30]/[0.04] border border-[#FF3B30]/20 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-[#FF3B30] text-white text-[9px] font-bold">
                          CRITICAL HERO
                        </span>
                        <span className="text-xs font-bold text-[#FF3B30]">Risk 0.97</span>
                      </div>
                      <h4 className="text-sm font-semibold text-[#1D1D1F]">alex.morgan</h4>
                      <p className="text-xs text-[#6E6E73] mt-0.5">
                        Enterprise Active Directory Admin • IT Ops
                      </p>
                      <p className="text-[11px] text-[#86868B] mt-2">
                        Compromised in 31-account reuse cluster #42 with predictable year suffix.
                      </p>
                    </div>
                    <div className="pt-4 mt-3 border-t border-[#FF3B30]/10 flex items-center justify-between">
                      <button
                        onClick={onHeroClick}
                        className="px-3 py-1.5 rounded-xl bg-[#FF3B30] hover:bg-[#E02E24] text-white text-xs font-semibold flex items-center space-x-1 transition active:scale-[0.98]"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Simulate Attack</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTierFilter("Critical");
                          setActiveAdminTab("accounts");
                        }}
                        className="text-xs text-[#6E6E73] hover:text-[#1D1D1F]"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>

                  {/* Priority 2 */}
                  <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-black/[0.06] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] text-[9px] font-bold border border-[#FF3B30]/20">
                          DOMAIN ADMIN
                        </span>
                        <span className="text-xs font-bold text-[#FF3B30]">Risk 0.89</span>
                      </div>
                      <h4 className="text-sm font-semibold text-[#1D1D1F]">cthompson29113</h4>
                      <p className="text-xs text-[#6E6E73] mt-0.5">
                        Database Administrator • IT Infrastructure
                      </p>
                      <p className="text-[11px] text-[#86868B] mt-2">
                        Known breach match + leetspeak dictionary violation in Cluster #12.
                      </p>
                    </div>
                    <div className="pt-4 mt-3 border-t border-black/[0.04] flex items-center justify-between">
                      <span className="text-[11px] text-[#FF9500] font-medium">FGPP Policy Queued</span>
                      <button
                        onClick={() => {
                          setActiveTierFilter("Critical");
                          setActiveAdminTab("accounts");
                        }}
                        className="text-xs text-[#0071E3] font-medium hover:underline"
                      >
                        View Account →
                      </button>
                    </div>
                  </div>

                  {/* Priority 3 */}
                  <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-black/[0.06] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-[#FF9500]/10 text-[#FF9500] text-[9px] font-bold border border-[#FF9500]/20">
                          EXECUTIVE VIP
                        </span>
                        <span className="text-xs font-bold text-[#FF9500]">Risk 0.74</span>
                      </div>
                      <h4 className="text-sm font-semibold text-[#1D1D1F]">rbrown33583</h4>
                      <p className="text-xs text-[#6E6E73] mt-0.5">
                        Chief Financial Officer • Finance
                      </p>
                      <p className="text-[11px] text-[#86868B] mt-2">
                        Shared password family across 19 accounts + short password length.
                      </p>
                    </div>
                    <div className="pt-4 mt-3 border-t border-black/[0.04] flex items-center justify-between">
                      <span className="text-[11px] text-[#5856D6] font-medium">MFA Enforce Mandate</span>
                      <button
                        onClick={() => {
                          setActiveTierFilter("High");
                          setActiveAdminTab("accounts");
                        }}
                        className="text-xs text-[#0071E3] font-medium hover:underline"
                      >
                        View Account →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Directory preview in Overview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">
                    Corporate Account Directory
                  </h3>
                  <button
                    onClick={() => setActiveAdminTab("accounts")}
                    className="text-xs text-[#0071E3] font-medium hover:underline flex items-center space-x-1"
                  >
                    <span>Full Screen Directory</span>
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

          {/* VIEW: Compromised Accounts */}
          {activeAdminTab === "compromised" && (
            <div className="space-y-6">
              <CompromisedAccountsView
                onSelectAccount={onSelectAccount}
                onLaunchAttack={onLaunchAttack}
                onAccountUpdated={onAccountUpdated}
              />
            </div>
          )}

          {/* VIEW: Accounts */}
          {activeAdminTab === "accounts" && (
            <div className="space-y-6">
              <AccountDirectory
                onSelectAccount={onSelectAccount}
                onLaunchAttack={onLaunchAttack}
                initialTierFilter={activeTierFilter}
              />
            </div>
          )}

          {/* VIEW: Blast Radius */}
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

          {/* VIEW: Attack Lab */}
          {activeAdminTab === "attack-lab" && (
            <div className="space-y-6">
              <AttackLabArena
                targetAccount={attackTargetAccount}
                onAccountUpdated={onAccountUpdated}
                onSelectHeroAccount={onHeroClick}
              />
            </div>
          )}

          {/* VIEW: Hash Race */}
          {activeAdminTab === "hash-race" && (
            <div className="space-y-6">
              <HashRaceArena />
            </div>
          )}

          {/* VIEW: AI Advisory */}
          {activeAdminTab === "remediation" && (
            <div className="space-y-6">
              <AIAdvisoryStudio summary={summary} />
            </div>
          )}

          {/* VIEW: Audit Logs */}
          {activeAdminTab === "audit-logs" && (
            <div className="space-y-6">
              <AuditLogsView />
            </div>
          )}

          {/* VIEW: Settings */}
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

      {/* Generate Synthetic Dataset Modal */}
      <GenerateDatasetModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onDatasetGenerated={handleDatasetGenerated}
        currentCount={summary.total_accounts}
      />
    </div>
  );
};
