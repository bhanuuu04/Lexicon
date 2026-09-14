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
import { ComplianceScorecardView } from "../Dashboard/ComplianceScorecardView";
import { AuditLogsView } from "./AuditLogsView";
import { AdminSettings } from "./AdminSettings";
import { CompromisedAccountsView } from "./CompromisedAccountsView";
import { ComplianceThreatSurfaceView } from "./ComplianceThreatSurfaceView";
import { GenerateDatasetModal } from "./GenerateDatasetModal";
import { ImportBreachModal } from "./ImportBreachModal";
import { AuditSummary, Account, DatasetMetadata, GenerateDatasetResponse, DatabaseStatus } from "../../types";
import {
  fetchAccountDetail,
  fetchAccounts,
  fetchDatasetMetadata,
  runRealtimeSecurityAnalysis,
  syncDatasetToSupabase,
  fetchDatabaseStatus
} from "../../lib/api";
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
  Cloud,
  Award,
  UploadCloud,
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
  const [isImportBreachOpen, setIsImportBreachOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [isRunningLiveAnalysis, setIsRunningLiveAnalysis] = useState(false);
  const [metadata, setMetadata] = useState<DatasetMetadata | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);
  const [priorityAccounts, setPriorityAccounts] = useState<Account[]>([]);
  const [isLoadingPriorities, setIsLoadingPriorities] = useState(false);

  React.useEffect(() => {
    async function loadMeta() {
      try {
        const meta = await fetchDatasetMetadata();
        setMetadata(meta);
        const db = await fetchDatabaseStatus();
        setDbStatus(db);
      } catch (e) {
        console.error("Failed to load metadata/db status:", e);
      }
    }
    loadMeta();
  }, []);

  const loadPriorities = async () => {
    setIsLoadingPriorities(true);
    try {
      const res = await fetchAccounts({ tier: "Critical", page_size: 3 });
      if (res.accounts && res.accounts.length > 0) {
        setPriorityAccounts(res.accounts);
      } else {
        const resHigh = await fetchAccounts({ tier: "High", page_size: 3 });
        setPriorityAccounts(resHigh.accounts || []);
      }
    } catch (e) {
      console.error("Failed to load priority accounts:", e);
    } finally {
      setIsLoadingPriorities(false);
    }
  };

  React.useEffect(() => {
    loadPriorities();
  }, [summary.critical_count, summary.high_risk_count, summary.low_risk_count]);

  const handleDatasetGenerated = (res: GenerateDatasetResponse) => {
    setMetadata(res.metadata);
    window.location.reload();
  };

  const handleCardFilterClick = (filterType: string) => {
    setActiveTierFilter(filterType);
    setActiveAdminTab("accounts");
  };

  const handleRefresh = async () => {
    setIsRunningLiveAnalysis(true);
    try {
      await runRealtimeSecurityAnalysis();
      setAdminNotice("✨ Real-time security analysis complete across all accounts.");
      setTimeout(() => setAdminNotice(null), 4000);
    } catch (e) {
      console.error("Security analysis failed:", e);
    } finally {
      setIsRunningLiveAnalysis(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSyncingDb(true);
    try {
      const res = await syncDatasetToSupabase(5000);
      setAdminNotice(`⚡ Synced ${res.synced_accounts?.toLocaleString()} accounts to Supabase Cloud Database.`);
      setTimeout(() => setAdminNotice(null), 5000);
      const db = await fetchDatabaseStatus();
      setDbStatus(db);
    } catch (e) {
      console.error("Supabase sync failed:", e);
    } finally {
      setIsSyncingDb(false);
    }
  };


  const adminSubNav = [
    { id: "overview", label: "Defense Overview", icon: Activity, badge: null },
    { id: "compliance", label: "Compliance & AD Threat Surface", icon: Award, badge: "NIST/CIS" },
    { id: "compromised", label: "Compromised Accounts", icon: ShieldAlert, badge: "Action" },
    { id: "accounts", label: "Corporate Identities", icon: Users, badge: `${summary.total_accounts.toLocaleString()}` },
    { id: "blast-radius", label: "Blast Radius", icon: Network, badge: "805" },
    { id: "attack-lab", label: "Attack Lab", icon: Zap, badge: "Live" },
    { id: "hash-race", label: "Hash Race", icon: Cpu, badge: "5 Algos" },
    { id: "remediation", label: "AI Advisory & GPO", icon: FileText, badge: "CISO" },
    { id: "hibp", label: "k-Anonymity HIBP", icon: Globe, badge: null },
    { id: "audit-logs", label: "Audit Trail", icon: History, badge: null },
    { id: "settings", label: "Settings", icon: Settings, badge: null },
  ];

  // Retrieve role-weighted organizational security readiness score
  const defenseReadiness = summary.organization_health?.security_readiness_pct !== undefined
    ? summary.organization_health.security_readiness_pct
    : Math.round(100 - (summary.critical_count / summary.total_accounts) * 100 * 1.5);

  const orgHealthStatus = summary.organization_health?.status || (defenseReadiness >= 75 ? "Healthy" : (defenseReadiness >= 40 ? "Elevated Risk" : "Critical Danger"));
  const isTopAdminCompromised = summary.organization_health?.top_admin_compromised ?? (summary.critical_count > 0);
  const adminExposurePct = summary.organization_health?.admin_exposure_pct ?? Math.round((summary.privileged_at_risk_count / Math.max(1, summary.privileged_count)) * 100);
  const workforceExposurePct = summary.organization_health?.workforce_exposure_pct ?? 25.0;

  const dialColor = defenseReadiness >= 75 ? "#34C759" : (defenseReadiness >= 40 ? "#FF9500" : "#FF3B30");
  const refreshKey = summary.critical_count + summary.low_risk_count + Math.round(defenseReadiness * 10);

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE SOC THREAT & READINESS COCKPIT */}
      <div className="apple-card p-6 sm:p-8 bg-white border border-black/[0.06] rounded-3xl shadow-card overflow-hidden relative">
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0071E3]/[0.03] rounded-full blur-3xl -z-0 pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          {/* Top Row: Cockpit Readiness Dial (5 cols) & 4 Defense Telemetry Badges (7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Overall Health Dial & Defense Status (5 cols) */}
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
                    stroke={dialColor}
                    strokeDasharray={`${defenseReadiness}, 100`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
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
                  <span className={`w-2 h-2 rounded-full animate-pulse ${defenseReadiness >= 75 ? "bg-[#34C759]" : (defenseReadiness >= 40 ? "bg-[#FF9500]" : "bg-[#FF3B30]")}`}></span>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${defenseReadiness >= 75 ? "text-[#34C759]" : (defenseReadiness >= 40 ? "text-[#FF9500]" : "text-[#FF3B30]")}`}>
                    {orgHealthStatus} Posture
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
                  {summary.organization_health?.hero_compromised ? (
                    <span className="text-[#FF3B30] font-medium block">
                      ⚠️ Top-Level Domain Admin (alex.morgan / Root) is insecure or blocked — existential root takeover threat active.
                    </span>
                  ) : isTopAdminCompromised ? (
                    <span className="text-[#FF9500] font-medium block">
                      ⚠️ Root Hero (alex.morgan) is secured. {summary.organization_health?.top_admin_compromised_count || 1} Domain Admin account(s) require policy rotation.
                    </span>
                  ) : (
                    <span className="text-[#34C759] font-medium block">
                      🛡️ Top-Level Domain Admins & Root infrastructure are fully secured — domain shielded.
                    </span>
                  )}
                  <span className="text-[11px] text-[#86868B] block mt-1">
                    Admin Exposure: <strong>{adminExposurePct}%</strong> (75% domain weight) • Workforce Exposure: <strong>{workforceExposurePct}%</strong> (25% weight)
                  </span>
                </p>
              </div>
            </div>

            {/* Right: Key Defense Telemetry Metrics (7 cols) */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FAFAFC] border border-black/[0.04]">
                  <span className="text-[10px] uppercase font-semibold text-[#86868B] block">Critical Tier</span>
                  <span className="text-base font-bold text-[#FF3B30] mt-0.5 block">
                    {summary.critical_count.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#86868B]">Immediate Action</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAFAFC] border border-black/[0.04]">
                  <span className="text-[10px] uppercase font-semibold text-[#86868B] block">Admins Exposed</span>
                  <span className="text-base font-bold text-[#FF9500] mt-0.5 block">
                    {summary.privileged_at_risk_count.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#86868B]">of {summary.privileged_count} Total</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAFAFC] border border-black/[0.04]">
                  <span className="text-[10px] uppercase font-semibold text-[#86868B] block">Breach Matches</span>
                  <span className="text-base font-bold text-[#5856D6] mt-0.5 block">
                    {summary.breached_count.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#86868B]">Known Leaks</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAFAFC] border border-black/[0.04]">
                  <span className="text-[10px] uppercase font-semibold text-[#86868B] block">Reuse Families</span>
                  <span className="text-base font-bold text-[#0071E3] mt-0.5 block">
                    {summary.reuse_cluster_count.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#86868B]">Blast Radius Scope</span>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width Apple-Style SOC Operations Toolbar */}
          <div className="border-t border-black/[0.06] pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Primary Operations & Data Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRunningLiveAnalysis}
                className="px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-2 shadow-xs transition active:scale-[0.98] cursor-pointer"
              >
                <Zap className={`w-3.5 h-3.5 ${isRunningLiveAnalysis ? "animate-spin" : ""}`} />
                <span>{isRunningLiveAnalysis ? "Running Real-Time Analysis..." : "Run Security Analysis"}</span>
              </button>

              <button
                onClick={handleSyncToSupabase}
                disabled={isSyncingDb}
                className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-[#EBEBED] text-xs font-semibold text-[#1D1D1F] border border-black/[0.06] flex items-center space-x-2 transition active:scale-[0.98] cursor-pointer"
                title="Sync active dataset to Supabase PostgreSQL"
              >
                <Database className={`w-3.5 h-3.5 text-[#34C759] ${isSyncingDb ? "animate-spin" : ""}`} />
                <span>{isSyncingDb ? "Syncing..." : "Sync Database"}</span>
              </button>

              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-[#EBEBED] text-xs font-semibold text-[#1D1D1F] border border-black/[0.06] flex items-center space-x-2 transition active:scale-[0.98] cursor-pointer"
                title="Generate new synthetic dataset with custom size"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0071E3]" />
                <span>Generate Dataset</span>
              </button>

              <button
                onClick={() => setIsImportBreachOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#FF3B30]/[0.08] hover:bg-[#FF3B30]/[0.15] text-[#FF3B30] text-xs font-semibold flex items-center space-x-2 border border-[#FF3B30]/20 transition active:scale-[0.98] cursor-pointer"
                title="Import custom threat intelligence wordlists or breach dumps"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Import Threat Dump</span>
              </button>
            </div>

            {/* Tactical Actions & Supabase Live Status Chip */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={onHeroClick}
                className="px-3.5 py-2 rounded-xl bg-[#FF3B30]/10 hover:bg-[#FF3B30]/15 text-xs font-semibold text-[#FF3B30] border border-[#FF3B30]/20 flex items-center space-x-2 transition active:scale-[0.98] cursor-pointer"
                title="Simulate attack against hero account alex.morgan (Cluster #42)"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Simulate Hero Breach</span>
              </button>

              <button
                onClick={() => setIsHIBPOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#0071E3]/[0.08] hover:bg-[#0071E3]/[0.15] text-[#0071E3] text-xs font-semibold flex items-center space-x-2 border border-[#0071E3]/20 transition active:scale-[0.98] cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Live HIBP</span>
              </button>

              <button
                onClick={() => setActiveAdminTab("remediation")}
                className="px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-xs font-semibold text-white flex items-center space-x-2 shadow-xs transition active:scale-[0.98] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>CISO Remediation</span>
              </button>

              <div className="px-3 py-1.5 rounded-full bg-[#34C759]/10 border border-[#34C759]/20 text-[11px] font-semibold text-[#248A3D] flex items-center space-x-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse" />
                <span>{dbStatus?.connected ? "Supabase Cloud Active" : "Supabase PostgreSQL Ready"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 🌟 4-STEP GOLDEN PATH JURY EVALUATION WORKFLOW */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-[#0071E3]/[0.05] via-[#5856D6]/[0.03] to-[#0071E3]/[0.05] border border-[#0071E3]/15 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#0071E3] text-white text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 shadow-xs">
              <Sparkles className="w-3 h-3" />
              <span>4-Step Golden Path</span>
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-[#1D1D1F]">
              PS-11 Evaluator Guided Sequence
            </h3>
          </div>
          <span className="text-[11px] text-[#86868B] font-medium">
            Follow this 4-step live sequence for the complete PS-11 problem-solution narrative
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Step 1: Overview */}
          <button
            onClick={() => setActiveAdminTab("overview")}
            className={`p-3 rounded-2xl text-left transition-all border cursor-pointer ${
              activeAdminTab === "overview"
                ? "bg-white border-[#0071E3] shadow-md ring-2 ring-[#0071E3]/20"
                : "bg-white/80 hover:bg-white border-black/[0.06] hover:border-black/[0.12]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-[#0071E3] uppercase tracking-wider">Step 1 • 60s</span>
              <Activity className="w-3.5 h-3.5 text-[#0071E3]" />
            </div>
            <h4 className="text-xs font-bold text-[#1D1D1F]">50k Directory Audit</h4>
            <p className="text-[11px] text-[#6E6E73] mt-0.5 line-clamp-2">
              Explore 20k+ high-risk accounts & department posture concentration.
            </p>
          </button>

          {/* Step 2: Blast Radius */}
          <button
            onClick={() => setActiveAdminTab("blast-radius")}
            className={`p-3 rounded-2xl text-left transition-all border cursor-pointer ${
              activeAdminTab === "blast-radius"
                ? "bg-white border-[#5856D6] shadow-md ring-2 ring-[#5856D6]/20"
                : "bg-white/80 hover:bg-white border-black/[0.06] hover:border-black/[0.12]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-[#5856D6] uppercase tracking-wider">Step 2 • 60s</span>
              <Network className="w-3.5 h-3.5 text-[#5856D6]" />
            </div>
            <h4 className="text-xs font-bold text-[#1D1D1F]">Blast Radius (Cluster #42)</h4>
            <p className="text-[11px] text-[#6E6E73] mt-0.5 line-clamp-2">
              31 users in Cluster #42 sharing password across IT & Domain Admins.
            </p>
          </button>

          {/* Step 3: Attack Lab */}
          <button
            onClick={onHeroClick}
            className={`p-3 rounded-2xl text-left transition-all border cursor-pointer ${
              activeAdminTab === "attack-lab"
                ? "bg-white border-[#FF3B30] shadow-md ring-2 ring-[#FF3B30]/20"
                : "bg-white/80 hover:bg-white border-black/[0.06] hover:border-black/[0.12]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-[#FF3B30] uppercase tracking-wider">Step 3 • 90s</span>
              <Zap className="w-3.5 h-3.5 text-[#FF3B30]" />
            </div>
            <h4 className="text-xs font-bold text-[#1D1D1F]">Attack Lab & GPU Rigs</h4>
            <p className="text-[11px] text-[#6E6E73] mt-0.5 line-clamp-2">
              Simulate rule attack against alex.morgan & benchmark 8x RTX 4090 GPUs.
            </p>
          </button>

          {/* Step 4: AI Advisory */}
          <button
            onClick={() => setActiveAdminTab("remediation")}
            className={`p-3 rounded-2xl text-left transition-all border cursor-pointer ${
              activeAdminTab === "remediation"
                ? "bg-white border-[#34C759] shadow-md ring-2 ring-[#34C759]/20"
                : "bg-white/80 hover:bg-white border-black/[0.06] hover:border-black/[0.12]"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-[#34C759] uppercase tracking-wider">Step 4 • 60s</span>
              <FileText className="w-3.5 h-3.5 text-[#34C759]" />
            </div>
            <h4 className="text-xs font-bold text-[#1D1D1F]">CISO Advisory & AD GPO</h4>
            <p className="text-[11px] text-[#6E6E73] mt-0.5 line-clamp-2">
              Generate NIST SP 800-63B policy brief & download PowerShell GPO script.
            </p>
          </button>
        </div>
      </div>

      {/* 3. SUB-NAVIGATION TABS */}
      <div className="flex items-center justify-between overflow-x-auto pb-2 border-b border-black/[0.06]">
        <div className="flex items-center space-x-1 sm:space-x-2">
          {adminSubNav.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeAdminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "hibp") {
                    setIsHIBPOpen(true);
                  } else {
                    setActiveAdminTab(tab.id);
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center space-x-2 transition shrink-0 ${
                  isActive
                    ? "bg-[#0071E3] text-white shadow-xs font-semibold"
                    : "text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.03]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-[#86868B]"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-black/[0.05] text-[#6E6E73]"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. DYNAMIC TAB VIEW CONTENT */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeAdminTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {/* VIEW: Overview */}
          {activeAdminTab === "overview" && (
            <div className="space-y-6">
              {/* 4 Interactive Risk Cards with Drilldown Trigger */}
              <RiskOverviewCards
                summary={summary}
                onCardClick={handleCardFilterClick}
              />

              {/* Middle Section: Distribution Breakdown + Lateral Blast Radius Spotlight */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7">
                  <RiskDistributionChart summary={summary} />
                </div>

                <div className="lg:col-span-5 apple-card p-6 bg-white border border-black/[0.06] rounded-3xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-black/[0.04]">
                    <div className="flex items-center space-x-2 text-[#FF3B30] text-xs font-semibold uppercase">
                      <Network className="w-4 h-4" />
                      <span>Lateral Movement Exposure</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] text-[10px] font-bold">
                      Critical Risk
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-[#1D1D1F]">
                      Enterprise Credential Reuse Blast Radius
                    </h3>
                    <p className="text-xs text-[#6E6E73] leading-relaxed">
                      Password family analysis identified <strong>{summary.reuse_cluster_count} cross-department clusters</strong>. Single-credential compromise in lower tiers enables immediate lateral movement into privileged Domain Controller administration.
                    </p>
                  </div>

                  {/* Spotlight Top Cluster */}
                  {summary.top_reuse_clusters && summary.top_reuse_clusters.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-black/[0.04] space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-[#FF3B30]">
                          Cluster #{summary.top_reuse_clusters[0].group_id} (Alex Morgan DC Hero Group)
                        </span>
                        <span className="text-[#86868B]">
                          {summary.top_reuse_clusters[0].total_accounts} Linked Accounts
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-[#1D1D1F]">
                        <span className="text-[#86868B]">Departments Bridged:</span>
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(summary.top_reuse_clusters[0].departments).map((dept) => (
                            <span
                              key={dept}
                              className="px-2 py-0.5 rounded-md bg-white border border-black/[0.06] text-[10px] font-medium"
                            >
                              {dept} ({summary.top_reuse_clusters[0].departments[dept]})
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveAdminTab("blast-radius")}
                        className="w-full py-2 rounded-xl bg-[#FF3B30]/[0.08] hover:bg-[#FF3B30]/[0.15] text-[#FF3B30] font-semibold text-xs transition flex items-center justify-center space-x-1.5"
                      >
                        <span>Inspect Interactive Blast Graph</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Priority Remediation Queue Snapshot */}
              <div className="apple-card p-6 bg-white border border-black/[0.06] rounded-3xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.04]">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-[#FF9500]" />
                    <h3 className="text-sm font-semibold text-[#1D1D1F]">
                      High-Risk Identity Intervention Queue
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveAdminTab("remediation")}
                    className="text-xs text-[#0071E3] font-medium hover:underline flex items-center space-x-1"
                  >
                    <span>Launch AI Remediation Studio</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {priorityAccounts.length > 0 ? (
                    priorityAccounts.map((acc, idx) => {
                      const isHero = acc.is_hero || acc.id === "ACC-00042" || acc.username === "alex.morgan";
                      const risk = acc.final_risk !== undefined ? acc.final_risk : (acc.baseline_risk || 0);
                      const isCritical = (acc.final_tier || acc.baseline_tier) === "Critical" || risk >= 0.70;

                      return (
                        <div
                          key={acc.id || idx}
                          className={`p-4 rounded-2xl flex flex-col justify-between transition-all ${
                            isHero
                              ? "bg-[#FF3B30]/[0.04] border border-[#FF3B30]/20"
                              : "bg-[#FAFAFC] border border-black/[0.06] hover:border-black/[0.12]"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    isHero
                                      ? "bg-[#FF3B30] text-white"
                                      : isCritical
                                      ? "bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20"
                                      : "bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20"
                                  }`}
                                >
                                  {isHero ? "CRITICAL HERO" : acc.is_privileged ? "DOMAIN ADMIN" : "HIGH EXPOSURE"}
                                </span>
                                {acc.is_blocked && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] text-[8px] font-bold border border-[#FF3B30]/20">
                                    BLOCKED
                                  </span>
                                )}
                              </div>
                              <span
                                className={`text-xs font-bold ${
                                  risk >= 0.70 ? "text-[#FF3B30]" : risk >= 0.40 ? "text-[#FF9500]" : "text-[#34C759]"
                                }`}
                              >
                                Risk {risk.toFixed(2)}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-[#1D1D1F] font-mono">{acc.username}</h4>
                            <p className="text-xs text-[#6E6E73] mt-0.5 truncate">
                              {acc.role || "Staff"} • {acc.department || "Enterprise"}
                            </p>
                            <p className="text-[11px] text-[#86868B] mt-2 line-clamp-2">
                              {acc.breach_match
                                ? "⚠️ Known dark web breach dump match"
                                : acc.password_group_id
                                ? `Reused credential in cluster #${acc.password_group_id}`
                                : acc.policy_violations?.length
                                ? acc.policy_violations.slice(0, 2).join("; ")
                                : "Compromised or non-compliant Active Directory credential."}
                            </p>
                          </div>

                          <div className="pt-4 mt-3 border-t border-black/[0.04] flex items-center justify-between">
                            <button
                              onClick={() => {
                                if (isHero) {
                                  onHeroClick();
                                } else {
                                  onLaunchAttack(acc);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition active:scale-[0.98] ${
                                isHero
                                  ? "bg-[#FF3B30] hover:bg-[#E02E24] text-white"
                                  : "bg-[#0071E3] hover:bg-[#0077ED] text-white"
                              }`}
                            >
                              <Zap className="w-3 h-3" />
                              <span>Simulate Attack</span>
                            </button>
                            <button
                              onClick={() => onSelectAccount(acc)}
                              className="text-xs text-[#6E6E73] hover:text-[#1D1D1F] font-medium cursor-pointer"
                            >
                              Inspect →
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-1 md:col-span-3 p-8 rounded-2xl bg-[#34C759]/[0.05] border border-[#34C759]/20 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#34C759]/10 text-[#34C759] flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-[#1D1D1F]">All High-Risk Priorities Remediated</h4>
                      <p className="text-xs text-[#6E6E73] max-w-md mx-auto">
                        There are currently no critical Active Directory identity vulnerabilities detected. Enterprise credential hygiene is optimal.
                      </p>
                    </div>
                  )}
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
                  refreshTrigger={refreshKey}
                />
              </div>
            </div>
          )}

          {/* VIEW: Compliance & AD Threat Surface */}
          {activeAdminTab === "compliance" && (
            <div className="space-y-6">
              <ComplianceThreatSurfaceView
                summary={summary}
                onNavigateToAccounts={(tier) => {
                  setActiveTierFilter(tier);
                  setActiveAdminTab("accounts");
                }}
                onNavigateToCluster={(grpId) => {
                  setActiveAdminTab("blast-radius");
                }}
              />
            </div>
          )}

          {/* VIEW: Compromised Accounts */}
          {activeAdminTab === "compromised" && (
            <div className="space-y-6">
              <CompromisedAccountsView
                onSelectAccount={onSelectAccount}
                onLaunchAttack={onLaunchAttack}
                onAccountUpdated={onAccountUpdated}
                refreshTrigger={refreshKey}
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
                refreshTrigger={refreshKey}
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

      {/* Import Custom Threat Dump Modal */}
      <ImportBreachModal
        isOpen={isImportBreachOpen}
        onClose={() => setIsImportBreachOpen(false)}
        onImportSuccess={() => handleRefresh()}
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
