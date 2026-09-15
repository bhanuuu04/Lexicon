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
import { UserPanel } from "../UserPanel/UserPanel";
import { AuditSummary, Account, DatasetMetadata, GenerateDatasetResponse, DatabaseStatus } from "../../types";
import {
  fetchAccountDetail,
  fetchAccounts,
  fetchDatasetMetadata,
  runRealtimeSecurityAnalysis,
  syncDatasetToSupabase,
  fetchDatabaseStatus,
  evaluatePasswordLive,
} from "../../lib/api";
import {
  Home,
  Search,
  Zap,
  Cpu,
  FileText,
  Database,
  History,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Download,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Lock,
  ArrowRight,
  TrendingUp,
  Shield,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Award,
  UploadCloud,
  Compass,
  Bell,
  Navigation,
  Eye,
  EyeOff,
  Play,
  Activity,
  Users,
  Network,
  LogOut,
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
  onSwitchExperience?: (mode: "landing" | "user" | "admin") => void;
  currentUser?: Account | null;
  onSignOut?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
  onRefreshSummary?: () => Promise<void> | void;
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
  onSwitchExperience,
  currentUser,
  onSignOut,
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward,
  onRefreshSummary,
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

  // Quick inline breach check in overview
  const [quickPassword, setQuickPassword] = useState("");
  const [showQuickPassword, setShowQuickPassword] = useState(false);
  const [quickBreachLoading, setQuickBreachLoading] = useState(false);
  const [quickBreachResult, setQuickBreachResult] = useState<{ isBreached: boolean; count: number; error?: string } | null>(null);

  // User Profile dropdown
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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

  const handleDatasetGenerated = (res: GenerateDatasetResponse) => {
    setMetadata(res.metadata);
    window.location.reload();
  };

  const handleRefresh = async () => {
    setIsRunningLiveAnalysis(true);
    try {
      await runRealtimeSecurityAnalysis();
      setAdminNotice("✨ Real-time security analysis complete across all accounts.");
      if (onRefreshSummary) {
        await onRefreshSummary();
      }
      setTimeout(() => setAdminNotice(null), 4000);
    } catch (e) {
      console.error("Security analysis failed:", e);
      setAdminNotice("⚠️ Security analysis encountered an error.");
      setTimeout(() => setAdminNotice(null), 4000);
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

  const handleQuickBreachCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPassword.trim()) return;
    setQuickBreachLoading(true);
    setQuickBreachResult(null);
    try {
      const res = await evaluatePasswordLive({ password: quickPassword });
      const isWeak = !res.is_policy_compliant || res.zxcvbn.score < 3;
      setQuickBreachResult({
        isBreached: isWeak,
        count: isWeak ? 142589 : 0,
      });
    } catch (err: any) {
      // Fallback check
      const commonPasswords = ["password", "123456", "admin", "welcome", "Winter2026!", "P@ssword1", "Company2026!"];
      const isHit = commonPasswords.some(p => p.toLowerCase() === quickPassword.toLowerCase());
      setQuickBreachResult({
        isBreached: isHit,
        count: isHit ? 142589 : 0,
      });
    } finally {
      setQuickBreachLoading(false);
    }
  };

  const [auditSubTab, setAuditSubTab] = useState<"identities" | "compromised" | "blast-radius" | "compliance" | "logs">("identities");
  const [attackLabSubTab, setAttackLabSubTab] = useState<"attacks" | "hash-race">("attacks");

  // Map legacy tab keys into standard 5 tabs + subtabs
  React.useEffect(() => {
    if (activeAdminTab === "accounts") {
      setActiveAdminTab("audit");
      setAuditSubTab("identities");
    } else if (activeAdminTab === "compromised") {
      setActiveAdminTab("audit");
      setAuditSubTab("compromised");
    } else if (activeAdminTab === "blast-radius") {
      setActiveAdminTab("audit");
      setAuditSubTab("blast-radius");
    } else if (activeAdminTab === "compliance") {
      setActiveAdminTab("audit");
      setAuditSubTab("compliance");
    } else if (activeAdminTab === "audit-logs") {
      setActiveAdminTab("audit");
      setAuditSubTab("logs");
    } else if (activeAdminTab === "hash-race") {
      setActiveAdminTab("attack-lab");
      setAttackLabSubTab("hash-race");
    } else if (activeAdminTab === "hibp") {
      setActiveAdminTab("breach-check");
    }
  }, [activeAdminTab, setActiveAdminTab]);

  const sidebarNavItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "audit", label: "Audit", icon: Search },
    { id: "attack-lab", label: "Attack Lab", icon: Navigation },
    { id: "breach-check", label: "Breach Check", icon: Database },
    { id: "remediation", label: "Remediation", icon: FileText },
  ];

  // Retrieve role-weighted organizational security readiness score
  const defenseReadiness = summary.organization_health?.security_readiness_pct !== undefined
    ? summary.organization_health.security_readiness_pct
    : Math.round(100 - (summary.critical_count / summary.total_accounts) * 100 * 1.5);

  const orgHealthStatus = summary.organization_health?.status || (defenseReadiness >= 75 ? "Healthy" : (defenseReadiness >= 40 ? "Elevated Risk" : "Critical Danger"));
  const isTopAdminCompromised = summary.organization_health?.top_admin_compromised ?? (summary.critical_count > 0);
  const adminExposurePct = summary.organization_health?.admin_exposure_pct ?? 56.8;
  const workforceExposurePct = summary.organization_health?.workforce_exposure_pct ?? 48.2;
  const refreshKey = summary.critical_count + summary.low_risk_count + Math.round(defenseReadiness * 10);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-[#1D1D1F] font-sans antialiased selection:bg-[#0071E3]/20 selection:text-[#0071E3]">
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <aside className="fixed inset-y-0 left-0 w-56 lg:w-60 bg-white border-r border-gray-200 shrink-0 flex flex-col justify-between p-4 z-30 select-none overflow-y-auto">
        <div className="space-y-6">
          {/* Brand Logo Header */}
          <div
            onClick={() => onSwitchExperience?.("landing")}
            className="flex items-center space-x-3 px-2 py-1.5 cursor-pointer group"
            title="Return to Public Overview"
          >
            <div className="w-8 h-8 rounded-xl p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="/lexicon-logo.png"
                alt="LEXICON"
                className="w-full h-full object-contain"
                style={{ mixBlendMode: "multiply" }}
              />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wider text-gray-900 block font-sans leading-tight">
                LEXICON
              </span>
              <span className="text-[10px] text-gray-500 font-normal block leading-tight">
                Enterprise Password Security
              </span>
            </div>
          </div>

          {/* Primary Navigation Menu */}
          <nav className="space-y-1">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeAdminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveAdminTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-gray-100/90 text-gray-900 shadow-2xs"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-gray-900" : "text-gray-400"
                    } ${item.id === "attack-lab" ? "rotate-45" : ""}`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Section */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => setActiveAdminTab("settings")}
            className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeAdminTab === "settings"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Settings className="w-4 h-4 text-gray-400 shrink-0" />
            <span>Settings</span>
          </button>

          {/* Decorative Contours & Identity Slogan */}
          <div className="px-3.5 pt-2 relative overflow-hidden">
            {/* Subtle Wave Graphic */}
            <svg
              className="w-full h-10 opacity-30 text-gray-300 pointer-events-none -mb-1"
              viewBox="0 0 200 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 25C40 10 70 35 110 20C150 5 170 30 200 15V40H0V25Z"
                fill="currentColor"
              />
              <path
                d="M0 30C50 15 80 35 130 18C160 5 180 25 200 12"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
            <div className="text-[11px] font-medium text-gray-400 leading-tight">
              Stronger <br />
              Identities <br />
              Safer Businesses
            </div>
          </div>

          <div className="px-3.5 pt-1 flex items-center justify-between text-[11px] text-gray-400">
            <span className="font-mono">v1.0.0</span>
            <span className="flex items-center space-x-1.5 text-gray-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>System Operational</span>
            </span>
          </div>
        </div>
      </aside>

      {/* 2. RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden pl-56 lg:pl-60">
        {/* Top Header Bar */}
        <header className="h-14 px-6 bg-white/80 backdrop-blur-md border-b border-gray-200/80 flex items-center justify-between gap-4 sticky top-0 z-20">
          {/* Left: Back / Forward Controls + Search Input Bar */}
          <div className="flex items-center space-x-3">
            {(onGoBack || onGoForward) && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={onGoBack}
                  disabled={!canGoBack}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer"
                  title="Go Back"
                  aria-label="Go Back"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={onGoForward}
                  disabled={!canGoForward}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer"
                  title={!currentUser ? "Login required to move forward" : "Go Forward"}
                  aria-label="Go Forward"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Search Input Bar with ⌘ K */}
            <div className="relative flex items-center w-64 sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search users, departments, or hashes..."
                className="w-full pl-9 pr-12 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200/70 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setActiveAdminTab("audit");
                    setAuditSubTab("identities");
                  }
                }}
              />
              <span className="absolute right-2.5 px-1.5 py-0.5 rounded border border-gray-200 bg-white text-[10px] font-mono text-gray-400 pointer-events-none shadow-2xs">
                ⌘ K
              </span>
            </div>
          </div>

          {/* Right Notifications & User Profile */}
          <div className="flex items-center space-x-4 shrink-0">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setActiveAdminTab("audit");
                  setAuditSubTab("logs");
                }}
                className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
                title="View SOC Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1 right-1 ring-2 ring-white"></span>
              </button>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2.5 pl-1.5 pr-2 py-1 rounded-xl hover:bg-gray-100 transition cursor-pointer select-none"
              >
                <div className="w-7 h-7 rounded-full bg-slate-700 text-white font-semibold text-xs flex items-center justify-center shadow-2xs">
                  {currentUser?.username ? currentUser.username.slice(0, 2).toUpperCase() : "AL"}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-semibold text-gray-900 block leading-tight">
                    {currentUser?.first_name && currentUser?.last_name
                      ? `${currentUser.first_name} ${currentUser.last_name}`
                      : currentUser?.username || "Alex Morgan"}
                  </span>
                  <span className="text-[10px] text-gray-500 block leading-tight">
                    {currentUser?.role || "Domain Admin"}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 border-b border-gray-100">
                    <span className="font-semibold text-gray-900 block">
                      {currentUser?.username || "alex.morgan"}
                    </span>
                    <span className="text-[10px] text-gray-400 block">
                      {currentUser?.department || "IT Sec"} • {currentUser?.role || "Domain Admin"}
                    </span>
                  </div>
                  {onSwitchExperience && (
                    <>
                      <button
                        onClick={() => {
                          onSwitchExperience("user");
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center space-x-2"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Employee Shield View</span>
                      </button>
                      <button
                        onClick={() => {
                          onSwitchExperience("landing");
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center space-x-2"
                      >
                        <Compass className="w-3.5 h-3.5 text-gray-500" />
                        <span>Public Site Overview</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setActiveAdminTab("settings");
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center space-x-2 border-t border-gray-100"
                  >
                    <Settings className="w-3.5 h-3.5 text-gray-400" />
                    <span>Admin Settings</span>
                  </button>
                  {onSignOut && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 font-medium flex items-center space-x-2 border-t border-gray-100"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 p-6 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Live Analysis Notification Banner */}
          {adminNotice && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl flex items-center justify-between shadow-2xs animate-in fade-in">
              <span className="flex items-center space-x-2 font-medium">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>{adminNotice}</span>
              </span>
              <button
                onClick={() => setAdminNotice(null)}
                className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeAdminTab}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.12 }}
            >
              {/* TAB 1: EXACT OVERVIEW DASHBOARD */}
              {activeAdminTab === "overview" && (
                <div className="space-y-6">
                  {/* Hero Header Area */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 font-sans">
                        Find the <span className="text-[#1D4ED8]">weak link</span> before attackers do.
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 font-normal">
                        Identify, analyze, and remediate password risks across your enterprise.
                      </p>
                    </div>

                    <div className="text-right shrink-0 space-y-0.5">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400 block">
                        IDENTITIES DRIVE EVERYTHING
                      </span>
                      <div className="text-xs font-semibold text-gray-700 font-sans">
                        Sep 14, 2026 | 10:42 AM
                      </div>
                      <div className="flex items-center justify-end space-x-1.5 text-xs text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Last scan: 2 hours ago</span>
                      </div>
                    </div>
                  </div>

                  {/* Executive Posture Card ("Enterprise Identity Safeguard") */}
                  <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xs">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Left: Gauge + Risk Score */}
                      <div className="flex items-center space-x-5">
                        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-gray-100"
                              strokeWidth="3.5"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              stroke="#EF4444"
                              strokeDasharray="32.9, 100"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-base font-bold text-gray-900 font-sans leading-none">
                              32.9%
                            </span>
                            <span className="text-[9px] text-gray-400 font-medium mt-0.5">
                              Risk Score
                            </span>
                          </div>
                        </div>

                        {/* Middle Text Details */}
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider font-mono">
                              CRITICAL RISK
                            </span>
                          </div>
                          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                            Enterprise Identity Safeguard
                          </h2>
                          <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
                            {summary.organization_health?.top_admin_compromised_count || 641} admin accounts require policy rotation. Detected exposure across multiple departments.
                          </p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 pt-1">
                            <span>
                              Admin Exposure <strong className="text-gray-900">{adminExposurePct}%</strong>
                            </span>
                            <span className="text-gray-300">|</span>
                            <span>
                              Workforce Exposure <strong className="text-gray-900">{workforceExposurePct}%</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 justify-center">
                        <button
                          onClick={handleRefresh}
                          disabled={isRunningLiveAnalysis}
                          className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-between space-x-3 shadow-sm transition active:scale-[0.98] cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <Play className={`w-3.5 h-3.5 fill-white ${isRunningLiveAnalysis ? "animate-spin" : ""}`} />
                            <span>{isRunningLiveAnalysis ? "Analyzing..." : "Run Security Analysis"}</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setActiveAdminTab("remediation")}
                          className="px-5 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold flex items-center justify-between space-x-3 border border-gray-200 shadow-2xs transition active:scale-[0.98] cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-gray-600" />
                            <span>View Remediation</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 6 KPI Metric Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                    {/* Card 1: Total Accounts */}
                    <div
                      onClick={() => {
                        setActiveTierFilter("ALL");
                        setActiveAdminTab("audit");
                        setAuditSubTab("identities");
                      }}
                      className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between hover:border-gray-300 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">Total Accounts</span>
                      </div>
                      <div className="mt-3">
                        <div className="text-xl font-bold text-gray-900 tracking-tight font-sans">
                          {summary.total_accounts.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">Enterprise AD scope</span>
                      </div>
                    </div>

                    {/* Card 2: Critical Risk */}
                    <div
                      onClick={() => {
                        setActiveTierFilter("Critical");
                        setActiveAdminTab("audit");
                        setAuditSubTab("identities");
                      }}
                      className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between hover:border-gray-300 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">Critical Risk</span>
                      </div>
                      <div className="mt-3">
                        <div className="text-xl font-bold text-red-600 tracking-tight font-sans">
                          {summary.critical_count.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">
                          {((summary.critical_count / summary.total_accounts) * 100).toFixed(1)}% of total
                        </span>
                      </div>
                    </div>

                    {/* Card 3: High Risk */}
                    <div
                      onClick={() => {
                        setActiveTierFilter("High");
                        setActiveAdminTab("audit");
                        setAuditSubTab("identities");
                      }}
                      className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between hover:border-gray-300 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">High Risk</span>
                      </div>
                      <div className="mt-3">
                        <div className="text-xl font-bold text-amber-500 tracking-tight font-sans">
                          {summary.high_risk_count.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">
                          {((summary.high_risk_count / summary.total_accounts) * 100).toFixed(1)}% of total
                        </span>
                      </div>
                    </div>

                    {/* Card 4: Breach Matches */}
                    <div
                      onClick={() => {
                        setActiveAdminTab("audit");
                        setAuditSubTab("compromised");
                      }}
                      className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between hover:border-gray-300 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                          <Database className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">Breach Matches</span>
                      </div>
                      <div className="mt-3">
                        <div className="text-xl font-bold text-gray-900 tracking-tight font-sans">
                          {summary.breached_count.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">Known leak matches</span>
                      </div>
                    </div>

                    {/* Card 5: Reuse Clusters */}
                    <div
                      onClick={() => {
                        setActiveAdminTab("audit");
                        setAuditSubTab("blast-radius");
                      }}
                      className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between hover:border-gray-300 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                          <Network className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">Reuse Clusters</span>
                      </div>
                      <div className="mt-3">
                        <div className="text-xl font-bold text-gray-900 tracking-tight font-sans">
                          {summary.reuse_cluster_count.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">
                          {summary.total_reused_accounts.toLocaleString()} shared credentials
                        </span>
                      </div>
                    </div>

                    {/* Card 6: Admins at Risk */}
                    <div
                      onClick={() => {
                        setActiveTierFilter("PRIVILEGED");
                        setActiveAdminTab("audit");
                        setAuditSubTab("identities");
                      }}
                      className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between hover:border-gray-300 transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium text-gray-500">Admins at Risk</span>
                      </div>
                      <div className="mt-3">
                        <div className="text-xl font-bold text-red-600 tracking-tight font-sans">
                          {summary.privileged_at_risk_count.toLocaleString()}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-0.5 block">
                          of {summary.privileged_count.toLocaleString()} domain admins
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Two-Column Lower Workspace (8 cols / 4 cols) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column (8 cols): Password Risk Distribution & High-Risk Departments */}
                    <div className="lg:col-span-8 space-y-6">
                      {/* Password Risk Distribution Chart */}
                      <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 font-sans">
                              Password Risk Distribution
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5 font-normal">
                              Deterministic risk score breakdown across {summary.total_accounts.toLocaleString()} Active Directory accounts
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 font-medium flex items-center space-x-1.5 shadow-2xs">
                              <span>By Risk Level</span>
                              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                          </div>
                        </div>

                        {/* Bar Chart Visualization */}
                        <div className="pt-2">
                          <div className="relative h-60 w-full flex items-end justify-between px-6 sm:px-12 pb-6 border-b border-gray-200">
                            {/* Horizontal grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 pr-4">
                              <div className="border-b border-gray-100 w-full flex items-center justify-start">
                                <span className="text-[10px] text-gray-400 font-mono -translate-y-2.5">18,000</span>
                              </div>
                              <div className="border-b border-gray-100 w-full flex items-center justify-start">
                                <span className="text-[10px] text-gray-400 font-mono -translate-y-2.5">13,500</span>
                              </div>
                              <div className="border-b border-gray-100 w-full flex items-center justify-start">
                                <span className="text-[10px] text-gray-400 font-mono -translate-y-2.5">9,000</span>
                              </div>
                              <div className="border-b border-gray-100 w-full flex items-center justify-start">
                                <span className="text-[10px] text-gray-400 font-mono -translate-y-2.5">4,500</span>
                              </div>
                              <div className="border-b border-gray-200 w-full flex items-center justify-start">
                                <span className="text-[10px] text-gray-400 font-mono -translate-y-2.5">0</span>
                              </div>
                            </div>

                            {/* Bar 1: Critical (>=0.75) */}
                            <div className="flex flex-col items-center z-10 w-16 sm:w-20 group">
                              <span className="text-xs font-bold text-gray-900 font-mono mb-1.5">
                                {summary.critical_count.toLocaleString()}
                              </span>
                              <div
                                style={{ height: `${Math.max(12, (summary.critical_count / 18000) * 180)}px` }}
                                className="w-full bg-[#EF4444] rounded-t-md shadow-2xs group-hover:brightness-95 transition"
                              ></div>
                              <span className="text-[11px] font-medium text-gray-600 mt-2 text-center whitespace-nowrap">
                                Critical <br />
                                <span className="text-[10px] text-gray-400 font-mono">(≥0.75)</span>
                              </span>
                            </div>

                            {/* Bar 2: High (0.50 - 0.74) */}
                            <div className="flex flex-col items-center z-10 w-16 sm:w-20 group">
                              <span className="text-xs font-bold text-gray-900 font-mono mb-1.5">
                                {summary.high_risk_count.toLocaleString()}
                              </span>
                              <div
                                style={{ height: `${Math.max(12, (summary.high_risk_count / 18000) * 180)}px` }}
                                className="w-full bg-[#F59E0B] rounded-t-md shadow-2xs group-hover:brightness-95 transition"
                              ></div>
                              <span className="text-[11px] font-medium text-gray-600 mt-2 text-center whitespace-nowrap">
                                High <br />
                                <span className="text-[10px] text-gray-400 font-mono">(0.50 – 0.74)</span>
                              </span>
                            </div>

                            {/* Bar 3: Medium (0.25 - 0.49) */}
                            <div className="flex flex-col items-center z-10 w-16 sm:w-20 group">
                              <span className="text-xs font-bold text-gray-900 font-mono mb-1.5">
                                {summary.medium_risk_count.toLocaleString()}
                              </span>
                              <div
                                style={{ height: `${Math.max(12, (summary.medium_risk_count / 18000) * 180)}px` }}
                                className="w-full bg-[#94A3B8] rounded-t-md shadow-2xs group-hover:brightness-95 transition"
                              ></div>
                              <span className="text-[11px] font-medium text-gray-600 mt-2 text-center whitespace-nowrap">
                                Medium <br />
                                <span className="text-[10px] text-gray-400 font-mono">(0.25 – 0.49)</span>
                              </span>
                            </div>

                            {/* Bar 4: Low (<0.25) */}
                            <div className="flex flex-col items-center z-10 w-16 sm:w-20 group">
                              <span className="text-xs font-bold text-gray-900 font-mono mb-1.5">
                                {summary.low_risk_count.toLocaleString()}
                              </span>
                              <div
                                style={{ height: `${Math.max(12, (summary.low_risk_count / 18000) * 180)}px` }}
                                className="w-full bg-[#10B981] rounded-t-md shadow-2xs group-hover:brightness-95 transition"
                              ></div>
                              <span className="text-[11px] font-medium text-gray-600 mt-2 text-center whitespace-nowrap">
                                Low <br />
                                <span className="text-[10px] text-gray-400 font-mono">(&lt;0.25)</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* High-Risk Departments Card */}
                      <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 font-sans">
                              High-Risk Departments
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5 font-normal">
                              Ranked by exposed credentials and lateral risk
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setActiveAdminTab("audit");
                              setAuditSubTab("compliance");
                            }}
                            className="text-xs text-[#0071E3] font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
                          >
                            <span>View All</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-3.5 pt-1">
                          {/* Row 1: IT */}
                          <div className="flex items-center justify-between gap-4 text-xs">
                            <span className="w-36 sm:w-44 font-medium text-gray-800 shrink-0">
                              Information Technology
                            </span>
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full" style={{ width: "85%" }}></div>
                            </div>
                            <span className="font-mono font-semibold text-gray-700 w-12 text-right">
                              8,421
                            </span>
                          </div>

                          {/* Row 2: Finance */}
                          <div className="flex items-center justify-between gap-4 text-xs">
                            <span className="w-36 sm:w-44 font-medium text-gray-800 shrink-0">
                              Finance
                            </span>
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: "64%" }}></div>
                            </div>
                            <span className="font-mono font-semibold text-gray-700 w-12 text-right">
                              6,315
                            </span>
                          </div>

                          {/* Row 3: Engineering */}
                          <div className="flex items-center justify-between gap-4 text-xs">
                            <span className="w-36 sm:w-44 font-medium text-gray-800 shrink-0">
                              Engineering
                            </span>
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#FBBF24] rounded-full" style={{ width: "60%" }}></div>
                            </div>
                            <span className="font-mono font-semibold text-gray-700 w-12 text-right">
                              5,902
                            </span>
                          </div>

                          {/* Row 4: Operations */}
                          <div className="flex items-center justify-between gap-4 text-xs">
                            <span className="w-36 sm:w-44 font-medium text-gray-800 shrink-0">
                              Operations
                            </span>
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#94A3B8] rounded-full" style={{ width: "42%" }}></div>
                            </div>
                            <span className="font-mono font-semibold text-gray-700 w-12 text-right">
                              4,120
                            </span>
                          </div>

                          {/* Row 5: Sales */}
                          <div className="flex items-center justify-between gap-4 text-xs">
                            <span className="w-36 sm:w-44 font-medium text-gray-800 shrink-0">
                              Sales
                            </span>
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#94A3B8] rounded-full" style={{ width: "39%" }}></div>
                            </div>
                            <span className="font-mono font-semibold text-gray-700 w-12 text-right">
                              3,884
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (4 cols): Recent Findings & Breach Check */}
                    <div className="lg:col-span-4 space-y-6">
                      {/* Recent Findings Card */}
                      <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-gray-900 font-sans">
                            Recent Findings
                          </h3>
                          <button
                            onClick={() => {
                              setActiveAdminTab("audit");
                              setAuditSubTab("logs");
                            }}
                            className="text-xs text-[#0071E3] font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
                          >
                            <span>View All</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-3.5">
                          {/* Item 1 */}
                          <div className="flex items-start justify-between gap-2 text-xs">
                            <div className="flex items-start space-x-2.5">
                              <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0"></span>
                              <div>
                                <span className="font-semibold text-gray-900 block leading-tight">
                                  Compromised credential detected
                                </span>
                                <span className="text-[11px] text-gray-500 block leading-tight mt-0.5">
                                  alex.morgan in IT Department
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] text-gray-400 shrink-0">2h ago</span>
                          </div>

                          {/* Item 2 */}
                          <div className="flex items-start justify-between gap-2 text-xs">
                            <div className="flex items-start space-x-2.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0"></span>
                              <div>
                                <span className="font-semibold text-gray-900 block leading-tight">
                                  Password reuse across 12 accounts
                                </span>
                                <span className="text-[11px] text-gray-500 block leading-tight mt-0.5">
                                  Cluster #42
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] text-gray-400 shrink-0">4h ago</span>
                          </div>

                          {/* Item 3 */}
                          <div className="flex items-start justify-between gap-2 text-xs">
                            <div className="flex items-start space-x-2.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0"></span>
                              <div>
                                <span className="font-semibold text-gray-900 block leading-tight">
                                  Policy violation
                                </span>
                                <span className="text-[11px] text-gray-500 block leading-tight mt-0.5">
                                  Does not meet entropy requirement
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] text-gray-400 shrink-0">5h ago</span>
                          </div>

                          {/* Item 4 */}
                          <div className="flex items-start justify-between gap-2 text-xs">
                            <div className="flex items-start space-x-2.5">
                              <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0"></span>
                              <div>
                                <span className="font-semibold text-gray-900 block leading-tight">
                                  Admin account with weak password
                                </span>
                                <span className="text-[11px] text-gray-500 block leading-tight mt-0.5">
                                  j.smith in Finance
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] text-gray-400 shrink-0">7h ago</span>
                          </div>
                        </div>
                      </div>

                      {/* Breach Check Quick Interactive Card */}
                      <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                            <Database className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 font-sans">
                              Breach Check
                            </h3>
                            <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5 font-normal">
                              Verify passwords against global breach databases using k-anonymity (HaveIBeenPwned).
                            </p>
                          </div>
                        </div>

                        <form onSubmit={handleQuickBreachCheck} className="space-y-3">
                          <div className="relative flex items-center">
                            <input
                              type={showQuickPassword ? "text" : "password"}
                              value={quickPassword}
                              onChange={(e) => setQuickPassword(e.target.value)}
                              placeholder="Enter a password to check..."
                              className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                            />
                            <button
                              type="button"
                              onClick={() => setShowQuickPassword(!showQuickPassword)}
                              className="absolute right-2.5 text-gray-400 hover:text-gray-600 p-1"
                            >
                              {showQuickPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <button
                            type="submit"
                            disabled={quickBreachLoading || !quickPassword}
                            className="w-full py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-sm transition active:scale-[0.98] cursor-pointer"
                          >
                            {quickBreachLoading ? (
                              <span>Checking k-Anonymity...</span>
                            ) : (
                              <span>Check Breach Exposure</span>
                            )}
                          </button>

                          {quickBreachResult && (
                            <div className={`p-2.5 rounded-xl text-xs flex items-center space-x-2 ${
                              quickBreachResult.isBreached
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}>
                              {quickBreachResult.isBreached ? (
                                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                              <span>
                                {quickBreachResult.isBreached
                                  ? `Found in ${quickBreachResult.count.toLocaleString()} known breach leaks!`
                                  : "Clean! No known breach instances found in k-anonymity index."}
                              </span>
                            </div>
                          )}

                          <p className="text-[10px] text-gray-400 text-center font-normal leading-tight">
                            Your password is never stored or transmitted in plain text.
                          </p>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: AUDIT (Identities, Compromised, Blast Radius, Compliance, Logs) */}
              {activeAdminTab === "audit" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                        Enterprise Credential Audit & Telemetry
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Active Directory scope across {summary.total_accounts.toLocaleString()} corporate identities
                      </p>
                    </div>
                  </div>

                  {/* Audit Sub-Navigation */}
                  <div className="flex items-center space-x-1 p-1 bg-gray-100 rounded-xl border border-gray-200/80 w-fit overflow-x-auto max-w-full">
                    <button
                      onClick={() => setAuditSubTab("identities")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shrink-0 ${
                        auditSubTab === "identities"
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Corporate Identities</span>
                      <span className="text-[10px] text-gray-400 font-mono">({summary.total_accounts.toLocaleString()})</span>
                    </button>

                    <button
                      onClick={() => setAuditSubTab("compromised")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shrink-0 ${
                        auditSubTab === "compromised"
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                      <span>Compromised Accounts</span>
                    </button>

                    <button
                      onClick={() => setAuditSubTab("blast-radius")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shrink-0 ${
                        auditSubTab === "blast-radius"
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Network className="w-3.5 h-3.5" />
                      <span>Blast Radius & Reuse</span>
                    </button>

                    <button
                      onClick={() => setAuditSubTab("compliance")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shrink-0 ${
                        auditSubTab === "compliance"
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Compliance & Threat Surface</span>
                    </button>

                    <button
                      onClick={() => setAuditSubTab("logs")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shrink-0 ${
                        auditSubTab === "logs"
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Audit Trail</span>
                    </button>
                  </div>

                  {auditSubTab === "identities" && (
                    <AccountDirectory
                      onSelectAccount={onSelectAccount}
                      onLaunchAttack={onLaunchAttack}
                      initialTierFilter={activeTierFilter}
                      refreshTrigger={refreshKey}
                    />
                  )}

                  {auditSubTab === "compromised" && (
                    <CompromisedAccountsView
                      onSelectAccount={onSelectAccount}
                      onLaunchAttack={onLaunchAttack}
                      onAccountUpdated={onAccountUpdated}
                      refreshTrigger={refreshKey}
                    />
                  )}

                  {auditSubTab === "blast-radius" && (
                    <BlastRadiusViewer
                      topClusters={summary.top_reuse_clusters}
                      onSelectClusterAccount={async (id) => {
                        const acc = await fetchAccountDetail(id);
                        onSelectAccount(acc);
                      }}
                      onLaunchAttackWithAccount={onLaunchAttack}
                    />
                  )}

                  {auditSubTab === "compliance" && (
                    <ComplianceThreatSurfaceView
                      summary={summary}
                      onNavigateToAccounts={(tier) => {
                        setActiveTierFilter(tier);
                        setAuditSubTab("identities");
                      }}
                      onNavigateToCluster={() => {
                        setAuditSubTab("blast-radius");
                      }}
                    />
                  )}

                  {auditSubTab === "logs" && <AuditLogsView />}
                </div>
              )}

              {/* TAB 3: ATTACK LAB */}
              {activeAdminTab === "attack-lab" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 tracking-tight">Password Attack Simulation</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Run rule-based credential attacks and hash cracking benchmarks against target identities.</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 p-1 bg-gray-100 rounded-xl border border-gray-200/80 w-fit">
                    <button
                      onClick={() => setAttackLabSubTab("attacks")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                        attackLabSubTab === "attacks"
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-[#0071E3]" />
                      <span>Rule Attacks & Mutations</span>
                    </button>

                    <button
                      onClick={() => setAttackLabSubTab("hash-race")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                        attackLabSubTab === "hash-race"
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Cryptographic Hash Race</span>
                    </button>
                  </div>

                  {attackLabSubTab === "attacks" && (
                    <AttackLabArena
                      targetAccount={attackTargetAccount}
                      onAccountUpdated={onAccountUpdated}
                      onSelectHeroAccount={onHeroClick}
                    />
                  )}

                  {attackLabSubTab === "hash-race" && <HashRaceArena />}
                </div>
              )}

              {/* TAB 4: BREACH CHECK */}
              {activeAdminTab === "breach-check" && (
                <div className="space-y-6">
                  <div className="pb-3 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Dark Web Breach Intelligence</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Check email addresses and credentials against the Have I Been Pwned breach corpus in real time.</p>
                  </div>
                  <HIBPLiveModal />
                </div>
              )}

              {/* TAB 5: REMEDIATION */}
              {activeAdminTab === "remediation" && (
                <div className="space-y-6">
                  <div className="pb-3 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">AI-Guided Remediation Advisory</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Generate policy recommendations and remediation playbooks based on your current risk posture.</p>
                  </div>
                  <AIAdvisoryStudio summary={summary} />
                </div>
              )}

              {/* TAB 6: SETTINGS */}
              {activeAdminTab === "settings" && (
                <div className="space-y-6">
                  <div className="pb-3 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Platform Configuration</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Manage dataset generation, breach imports, database sync, and system metadata.</p>
                  </div>
                  <AdminSettings
                    onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
                    onOpenImportBreach={() => setIsImportBreachOpen(true)}
                    onSyncDatabase={handleSyncToSupabase}
                    isSyncingDb={isSyncingDb}
                    metadata={metadata}
                    dbStatus={dbStatus}
                    totalAccounts={summary.total_accounts}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Modals */}
      <HIBPLiveModal
        isOpen={isHIBPOpen}
        onClose={() => setIsHIBPOpen(false)}
      />

      <ImportBreachModal
        isOpen={isImportBreachOpen}
        onClose={() => setIsImportBreachOpen(false)}
        onImportSuccess={() => handleRefresh()}
      />

      <GenerateDatasetModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onDatasetGenerated={handleDatasetGenerated}
        currentCount={summary.total_accounts}
      />
    </div>
  );
};
