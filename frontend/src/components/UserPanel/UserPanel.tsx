"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  Unlock,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  History,
  Settings,
  RefreshCw,
  ExternalLink,
  Laptop,
  Check,
  Bell,
  Eye,
  EyeOff,
  Building2,
  Cpu,
  Clock,
  Sparkles,
  ArrowRight,
  User,
  Users,
  Search,
  XCircle,
  Wand2,
} from "lucide-react";
import { HIBPLiveModal } from "../HIBPCheck/HIBPLiveModal";
import { generateUltraStrongPassword } from "../../lib/passwordGenerator";
import {
  evaluatePasswordLive,
  fetchAccountDetail,
  fetchAccounts,
  resetAccountPassword,
  blockAccount,
} from "../../lib/api";
import {
  Account,
  PasswordEvaluationResult,
  PasswordCheckDetail,
  ResetPasswordResponse,
} from "../../types";

interface UserPanelProps {
  onSwitchToAdmin: () => void;
  onAccountRemediated?: (account: Account) => void;
  onSummaryUpdated?: () => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({
  onSwitchToAdmin,
  onAccountRemediated,
  onSummaryUpdated,
}) => {
  const [isHIBPOpen, setIsHIBPOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "precheck" | "reset" | "activity" | "settings">("overview");
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Active User State
  const [currentUsername, setCurrentUsername] = useState("alex.morgan");
  const [account, setAccount] = useState<Account | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Identity switcher state
  const [isSwitchingUser, setIsSwitchingUser] = useState(false);
  const [quickAccounts, setQuickAccounts] = useState<Account[]>([]);

  // Password Reset Flow State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<ResetPasswordResponse | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Live Pre-Check test state
  const [testPassword, setTestPassword] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<PasswordEvaluationResult | null>(null);

  // Suggest Strong Password notification state
  const [suggestedNotice, setSuggestedNotice] = useState<string | null>(null);

  const handleSuggestStrongPassword = (target: "blocked" | "reset" | "precheck") => {
    const generated = generateUltraStrongPassword(18);
    if (target === "blocked" || target === "reset") {
      setNewPassword(generated);
      setConfirmPassword(generated);
      setShowPassword(true);
      setResetError(null);
      setSuggestedNotice("✨ Generated ultra-strong password (18 chars, high cryptographic entropy)");
      setTimeout(() => setSuggestedNotice(null), 4000);
    } else if (target === "precheck") {
      setTestPassword(generated);
      setSuggestedNotice("✨ Generated candidate password for entropy analysis");
      setTimeout(() => setSuggestedNotice(null), 4000);
    }
  };

  // Load active account data
  const loadAccount = async (username: string) => {
    setLoadingUser(true);
    setResetResult(null);
    setResetError(null);
    try {
      const acc = await fetchAccountDetail(username);
      setAccount(acc);
      if (acc.is_blocked) {
        setActiveTab("overview");
      }
    } catch (err) {
      console.error("Failed to load user account:", err);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    loadAccount(currentUsername);
  }, [currentUsername]);

  // Load quick accounts for identity switcher
  useEffect(() => {
    async function loadQuick() {
      try {
        const res = await fetchAccounts({ page: 1, page_size: 10 });
        setQuickAccounts(res.accounts);
      } catch (e) {
        console.error("Failed to load quick accounts:", e);
      }
    }
    loadQuick();
  }, []);

  const handleEvaluateTestPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPassword) return;

    setIsTesting(true);
    try {
      const res = await evaluatePasswordLive({
        password: testPassword,
        username: account?.username || "user",
        department: account?.department || "Corporate",
        role: account?.role || "Staff",
        custom_inputs: ["Lexicon", "Admin", "Corporate"],
      });
      setTestResult(res);
    } catch (err) {
      console.error("Evaluation failed:", err);
    } finally {
      setIsTesting(false);
    }
  };

  const handleExecutePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    if (newPassword !== confirmPassword) {
      setResetError("New password and confirmation do not match.");
      return;
    }

    setResetError(null);
    setIsResetting(true);

    try {
      const res = await resetAccountPassword(account.id, newPassword);
      setResetResult(res);
      if (res.success && res.account) {
        setAccount(res.account);
        setNewPassword("");
        setConfirmPassword("");
        onAccountRemediated?.(res.account);
        onSummaryUpdated?.();
      }
    } catch (err: any) {
      setResetError(err.message || "Failed to reset password.");
    } finally {
      setIsResetting(false);
    }
  };

  // Demo toggle block state for testing the blocked screen
  const handleSimulateBlockToggle = async () => {
    if (!account) return;
    const targetState = !account.is_blocked;
    try {
      await blockAccount(
        account.id,
        targetState,
        targetState ? "Breach Correlation & High Risk Detected" : undefined
      );
      const updated = {
        ...account,
        is_blocked: targetState,
        blocked_reason: targetState ? "Breach Correlation & High Risk Detected" : undefined,
      };
      setAccount(updated);
      onAccountRemediated?.(updated);
      onSummaryUpdated?.();
    } catch (e) {
      console.error("Toggle block failed:", e);
    }
  };

  if (loadingUser && !account) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#0071E3] flex items-center justify-center shadow-md animate-pulse">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-semibold text-[#1D1D1F]">
            Authenticating Employee Identity
          </h2>
          <p className="text-xs text-[#6E6E73]">
            Retrieving Active Directory profile for {currentUsername}...
          </p>
        </div>
      </div>
    );
  }

  const isBlocked = account?.is_blocked;

  // Dynamic Risk Theme Calculus based on authentic backend final_risk & final_tier
  const getAccountRiskTheme = () => {
    if (!account) {
      return {
        tier: "Low",
        score: 85,
        color: "#34C759",
        textColor: "text-[#34C759]",
        bgColor: "bg-[#34C759]/10",
        borderColor: "border-[#34C759]/20",
        strokeColor: "#34C759",
        badgeText: "Shielded Identity",
        statusLabel: "Healthy Organizational Posture",
        subtext: "Continuous monitoring active",
        icon: ShieldCheck,
      };
    }

    const score = Math.max(5, Math.min(100, Math.round((1 - account.final_risk) * 100)));
    const tier = account.final_tier || (account.final_risk < 0.25 ? "Low" : account.final_risk < 0.5 ? "Medium" : account.final_risk < 0.75 ? "High" : "Critical");

    if (tier === "Critical" || account.final_risk >= 0.75) {
      return {
        tier: "Critical",
        score,
        color: "#FF3B30",
        textColor: "text-[#FF3B30]",
        bgColor: "bg-[#FF3B30]/10",
        borderColor: "border-[#FF3B30]/20",
        strokeColor: "#FF3B30",
        badgeText: "Critical Risk • Action Required",
        statusLabel: "Critical Exposure Detected",
        subtext: "Compounding Active Directory vulnerabilities",
        icon: ShieldAlert,
      };
    } else if (tier === "High" || account.final_risk >= 0.5) {
      return {
        tier: "High",
        score,
        color: "#FF9500",
        textColor: "text-[#FF9500]",
        bgColor: "bg-[#FF9500]/10",
        borderColor: "border-[#FF9500]/20",
        strokeColor: "#FF9500",
        badgeText: "High Risk • Action Queued",
        statusLabel: "Elevated Security Exposure",
        subtext: "Credential update recommended by SOC",
        icon: AlertTriangle,
      };
    } else if (tier === "Medium" || account.final_risk >= 0.25) {
      return {
        tier: "Medium",
        score,
        color: "#F59E0B",
        textColor: "text-[#D97706]",
        bgColor: "bg-[#F59E0B]/10",
        borderColor: "border-[#F59E0B]/20",
        strokeColor: "#F59E0B",
        badgeText: "Moderate Risk • Policy Review",
        statusLabel: "Moderate Exposure Posture",
        subtext: "Password hardening suggested",
        icon: AlertTriangle,
      };
    } else {
      return {
        tier: "Low",
        score,
        color: "#34C759",
        textColor: "text-[#34C759]",
        bgColor: "bg-[#34C759]/10",
        borderColor: "border-[#34C759]/20",
        strokeColor: "#34C759",
        badgeText: "Shielded Identity",
        statusLabel: "Healthy Organizational Posture",
        subtext: "Continuous monitoring active",
        icon: ShieldCheck,
      };
    }
  };

  const riskTheme = getAccountRiskTheme();
  const StatusIcon = riskTheme.icon;

  return (
    <div className="w-full min-h-screen bg-[#F5F5F7] text-[#1D1D1F] pb-24">
      {/* Header Banner */}
      <div className="bg-white border-b border-black/[0.06] sticky top-16 z-20 backdrop-blur-md bg-white/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-semibold text-sm ${
              isBlocked
                ? "bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20"
                : `${riskTheme.bgColor} ${riskTheme.textColor} border ${riskTheme.borderColor}`
            }`}>
              {account?.username ? account.username.slice(0, 2).toUpperCase() : "US"}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-semibold text-[#1D1D1F]">
                  {account?.first_name && account?.last_name
                    ? `${account.first_name} ${account.last_name}`
                    : account?.username || "Employee"}
                </h1>
                {isBlocked ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 flex items-center space-x-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Access Suspended</span>
                  </span>
                ) : (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${riskTheme.bgColor} ${riskTheme.textColor} border ${riskTheme.borderColor} flex items-center space-x-1`}>
                    <StatusIcon className="w-3 h-3" />
                    <span>{riskTheme.badgeText}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#86868B]">
                {account?.username}@lexicon.corp • {account?.role} ({account?.department})
              </p>
            </div>
          </div>

          {/* Identity Switcher & Controls */}
          <div className="flex items-center space-x-2">
            {/* Quick Switch Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSwitchingUser(!isSwitchingUser)}
                className="px-3 py-1.5 rounded-xl bg-[#F5F5F7] hover:bg-[#EBEBED] text-xs font-medium text-[#1D1D1F] border border-black/[0.06] flex items-center space-x-1.5 transition"
              >
                <Users className="w-3.5 h-3.5 text-[#0071E3]" />
                <span>Switch Identity</span>
              </button>

              {isSwitchingUser && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-black/[0.08] shadow-xl p-2 z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-[#86868B]">
                    Select Identity to Test
                  </div>
                  {/* Hero Account */}
                  <button
                    onClick={() => {
                      setCurrentUsername("alex.morgan");
                      setIsSwitchingUser(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                      currentUsername === "alex.morgan"
                        ? "bg-[#0071E3] text-white"
                        : "hover:bg-[#F5F5F7] text-[#1D1D1F]"
                    }`}
                  >
                    <span>alex.morgan (Hero Target)</span>
                    <span className="text-[10px] opacity-75">Admin</span>
                  </button>
                  {/* Other accounts */}
                  {quickAccounts.slice(0, 5).map((qa) => (
                    <button
                      key={qa.id}
                      onClick={() => {
                        setCurrentUsername(qa.username);
                        setIsSwitchingUser(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                        currentUsername === qa.username
                          ? "bg-[#0071E3] text-white"
                          : "hover:bg-[#F5F5F7] text-[#1D1D1F]"
                      }`}
                    >
                      <span className="truncate">{qa.username}</span>
                      <span className="text-[10px] opacity-75">{qa.department.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Test Block Toggle */}
            <button
              onClick={handleSimulateBlockToggle}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
                isBlocked
                  ? "bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20 hover:bg-[#34C759]/20"
                  : "bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 hover:bg-[#FF3B30]/20"
              }`}
              title="Simulate blocking or unblocking this employee account"
            >
              {isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isBlocked ? "Simulate Unblock" : "Simulate Block"}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        {!isBlocked && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 pt-1 flex items-center space-x-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                activeTab === "overview"
                  ? "bg-[#0071E3] text-white shadow-xs font-semibold"
                  : "text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
              }`}
            >
              Security Posture
            </button>
            <button
              onClick={() => setActiveTab("reset")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center space-x-1 ${
                activeTab === "reset"
                  ? "bg-[#0071E3] text-white shadow-xs font-semibold"
                  : "text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Reset Password</span>
            </button>
            <button
              onClick={() => setActiveTab("precheck")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center space-x-1 ${
                activeTab === "precheck"
                  ? "bg-[#0071E3] text-white shadow-xs font-semibold"
                  : "text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>zxcvbn Pre-Check</span>
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                activeTab === "activity"
                  ? "bg-[#0071E3] text-white shadow-xs font-semibold"
                  : "text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
              }`}
            >
              Activity & Log
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                activeTab === "settings"
                  ? "bg-[#0071E3] text-white shadow-xs font-semibold"
                  : "text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
              }`}
            >
              Safeguard Settings
            </button>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* ========================================================================= */}
        {/* SCREEN 1: BLOCKED REMEDIATION & RESTORATION SCREEN (WHEN is_blocked === true) */}
        {/* ========================================================================= */}
        {isBlocked ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 max-w-3xl mx-auto"
          >
            <div className="apple-card p-6 sm:p-10 bg-white border border-[#FF3B30]/30 rounded-3xl shadow-2xl space-y-6">
              {/* Header Status */}
              <div className="text-center space-y-3 pb-6 border-b border-black/[0.06]">
                <div className="w-16 h-16 rounded-3xl bg-[#FF3B30]/10 border border-[#FF3B30]/30 text-[#FF3B30] flex items-center justify-center mx-auto shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 inline-block mb-2">
                    Access Suspended • Security Risk Detected
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] tracking-tight font-sans">
                    Account Blocked
                  </h2>
                  <p className="text-sm font-medium text-[#FF3B30] mt-1">
                    Your account has been temporarily blocked by Lexicon Risk Intelligence.
                  </p>
                  <p className="text-xs text-[#6E6E73] max-w-md mx-auto leading-relaxed mt-1">
                    Reason: {account?.blocked_reason || "Compounding Active Directory vulnerabilities or dark web breach match detected."}
                  </p>
                </div>
              </div>

              {/* Compromise Telemetry Details */}
              <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-black/[0.06] text-left space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#86868B] block">
                  Compromise Telemetry & Exposure Scope:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-black/[0.04]">
                    <span className="text-[10px] text-[#86868B] block">Corporate Identity</span>
                    <span className="font-semibold text-[#1D1D1F] truncate block">{account?.username}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-black/[0.04]">
                    <span className="text-[10px] text-[#86868B] block">Calculated Risk Tier</span>
                    <span className="font-bold text-[#FF3B30] block">Critical ({account?.final_risk ? (account.final_risk * 100).toFixed(0) : "97"}%)</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-black/[0.04]">
                    <span className="text-[10px] text-[#86868B] block">Blast Radius Cluster</span>
                    <span className="font-semibold text-[#0071E3] block">
                      {account?.password_group_id ? `Cluster #${account.password_group_id}` : "Isolated"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Embedded Remediation & Password Reset Form */}
              <div className="p-6 rounded-2xl bg-[#0071E3]/[0.03] border border-[#0071E3]/20 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-[#0071E3] uppercase tracking-wider">
                    <KeyRound className="w-4 h-4" />
                    <span>Mandatory Account Remediation</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSuggestStrongPassword("blocked")}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
                    title="Generate an ultra-strong high-entropy password (NIST 800-63B compliant)"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Suggest Strong Password</span>
                  </button>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">
                    Create a Compliant Password to Restore Access
                  </h3>
                  <p className="text-xs text-[#6E6E73] mt-0.5 leading-relaxed">
                    Set a new password meeting the 8-point enterprise NIST policy. Upon validation, your account will be immediately unblocked and restored to safe status.
                  </p>
                </div>

                {suggestedNotice && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-[#34C759]/10 text-[#248A3D] text-xs font-medium border border-[#34C759]/20 flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4 text-[#34C759] shrink-0" />
                    <span>{suggestedNotice}</span>
                  </motion.div>
                )}

                <form onSubmit={handleExecutePasswordReset} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[#86868B] block">
                          New Enterprise Password
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="e.g. Xk9#vP!qR7$wL2zM"
                          disabled={isResetting}
                          className="w-full px-4 py-3 bg-white border border-black/[0.08] rounded-xl text-xs sm:text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3] transition font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F]"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="mb-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[#86868B] block">
                          Confirm New Password
                        </label>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        disabled={isResetting}
                        className="w-full px-4 py-3 bg-white border border-black/[0.08] rounded-xl text-xs sm:text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3] transition font-mono"
                      />
                    </div>
                  </div>

                  {resetError && (
                    <div className="p-3 rounded-xl bg-[#FF3B30]/10 text-[#FF3B30] text-xs font-medium border border-[#FF3B30]/20 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[11px] text-[#86868B]">
                      Zero Plaintext Stored • 8-Point Deterministic Verification • Instant Unblock
                    </span>
                    <button
                      type="submit"
                      disabled={isResetting || !newPassword || !confirmPassword}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-40 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-md transition active:scale-[0.98]"
                    >
                      {isResetting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Validating Security Engine...</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4" />
                          <span>Validate & Restore Account Access</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Live Policy Feedback Checklist if rejected */}
                {resetResult && !resetResult.success && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-[#FF3B30]/[0.06] border border-[#FF3B30]/20 space-y-3"
                  >
                    <div className="flex items-center space-x-2 text-xs font-semibold text-[#FF3B30]">
                      <XCircle className="w-4 h-4" />
                      <span>{resetResult.message}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {resetResult.checks.map((chk, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border text-xs flex items-start space-x-2 ${
                            chk.passed
                              ? "bg-white/80 border-black/[0.04] text-[#1D1D1F]"
                              : "bg-white border-[#FF3B30]/30 text-[#FF3B30]"
                          }`}
                        >
                          {chk.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759] shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-[#FF3B30] shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-semibold block">{chk.rule_name}</span>
                            <span className="text-[11px] text-[#6E6E73]">{chk.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* SCREEN 2: DETERMINISTIC PASSWORD RESET FLOW (VOLUNTARY ROTATION)          */}
            {/* ========================================================================= */}
            {activeTab === "reset" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 max-w-3xl mx-auto"
              >
                <div className="apple-card p-6 sm:p-8 bg-white border border-black/[0.06] rounded-3xl shadow-card space-y-6">
                  <div className="pb-4 border-b border-black/[0.06] flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 text-xs font-semibold text-[#0071E3] uppercase tracking-wider mb-1">
                        <KeyRound className="w-4 h-4" />
                        <span>Deterministic Enterprise Password Policy</span>
                      </div>
                      <h3 className="text-lg font-semibold text-[#1D1D1F]">
                        Secure Credential Rotation
                      </h3>
                      <p className="text-xs text-[#6E6E73] mt-1">
                        The new password must pass all 8 deterministic Lexicon security standards to be accepted.
                      </p>
                    </div>
                  </div>

                  {/* Password Reset Form */}
                  {suggestedNotice && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-[#34C759]/10 text-[#248A3D] text-xs font-medium border border-[#34C759]/20 flex items-center space-x-2"
                    >
                      <Sparkles className="w-4 h-4 text-[#34C759] shrink-0" />
                      <span>{suggestedNotice}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleExecutePasswordReset} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-[#86868B] block">
                            New Enterprise Password
                          </label>
                          <button
                            type="button"
                            onClick={() => handleSuggestStrongPassword("reset")}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#0071E3]/10 hover:bg-[#0071E3]/15 text-[#0071E3] text-[11px] font-semibold border border-[#0071E3]/20 transition active:scale-95 cursor-pointer shadow-2xs"
                            title="Generate an ultra-strong high-entropy password (NIST 800-63B compliant)"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                            <span>Suggest Strong Password</span>
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter compliant new password"
                            disabled={isResetting}
                            className="w-full px-4 py-3 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs sm:text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:bg-white transition font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F]"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="mb-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-[#86868B] block">
                            Confirm New Password
                          </label>
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          disabled={isResetting}
                          className="w-full px-4 py-3 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs sm:text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:bg-white transition font-mono"
                        />
                      </div>
                    </div>

                    {resetError && (
                      <div className="p-3 rounded-xl bg-[#FF3B30]/10 text-[#FF3B30] text-xs font-medium border border-[#FF3B30]/20 flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{resetError}</span>
                      </div>
                    )}

                    {/* Submit CTA */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-[#86868B]">
                        Deterministic verification • 0 Plaintext Stored • Genuine Hash Recomputation
                      </span>
                      <button
                        type="submit"
                        disabled={isResetting || !newPassword || !confirmPassword}
                        className="px-6 py-3 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-40 text-white font-semibold text-xs flex items-center space-x-2 shadow-xs transition active:scale-[0.98]"
                      >
                        {isResetting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Evaluating Security Engine...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Validate & Update Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Reset Evaluation Results Checklist */}
                  {resetResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-6 border-t border-black/[0.06] space-y-4"
                    >
                      <div className={`p-4 rounded-2xl border flex items-start space-x-3 ${
                        resetResult.success
                          ? "bg-[#34C759]/10 border-[#34C759]/30 text-[#34C759]"
                          : "bg-[#FF3B30]/10 border-[#FF3B30]/30 text-[#FF3B30]"
                      }`}>
                        {resetResult.success ? (
                          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <h4 className="text-sm font-semibold text-[#1D1D1F]">
                            {resetResult.success ? "Password Updated Successfully!" : "Password Policy Rejection"}
                          </h4>
                          <p className="text-xs mt-0.5 opacity-90">{resetResult.message}</p>
                        </div>
                      </div>

                      {/* 8-Point Compliance Checklist */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B] block">
                          Deterministic Security Engine Checklist
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {resetResult.checks.map((chk, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 ${
                                chk.passed
                                  ? "bg-[#FAFAFC] border-black/[0.04] text-[#1D1D1F]"
                                  : "bg-[#FF3B30]/[0.04] border-[#FF3B30]/20 text-[#FF3B30]"
                              }`}
                            >
                              {chk.passed ? (
                                <CheckCircle2 className="w-4 h-4 text-[#34C759] shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-[#FF3B30] shrink-0 mt-0.5" />
                              )}
                              <div>
                                <span className="font-semibold block">{chk.rule_name}</span>
                                <span className="text-[11px] text-[#6E6E73] block mt-0.5">
                                  {chk.message}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {resetResult.success && (
                        <div className="pt-2 text-center">
                          <button
                            onClick={() => setActiveTab("overview")}
                            className="px-6 py-2.5 rounded-xl bg-[#34C759] hover:bg-[#2FB34F] text-white text-xs font-semibold transition"
                          >
                            Return to Security Posture Overview →
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

        {/* ========================================================================= */}
        {/* SCREEN 3: NORMAL POSTURE OVERVIEW (WHEN is_blocked === false)              */}
        {/* ========================================================================= */}
        {activeTab === "overview" && !isBlocked && (
          <div className="space-y-6">
            {/* Top Score Banner */}
            <div className="apple-card p-6 sm:p-8 bg-white border border-black/[0.06] rounded-2xl shadow-card">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Score Dial */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-black/[0.06]">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-[#E5E5EA]"
                        strokeWidth="3.2"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        stroke={riskTheme.strokeColor}
                        strokeDasharray={`${riskTheme.score}, 100`}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-semibold text-[#1D1D1F]">{riskTheme.score}</span>
                      <span className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                        / 100
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold ${riskTheme.textColor} mt-3`}>
                    {riskTheme.statusLabel}
                  </span>
                  <span className="text-[11px] text-[#86868B] mt-0.5 text-center">
                    {riskTheme.subtext}
                  </span>
                </div>

                {/* Score Breakdown Metrics */}
                <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Entropy Card */}
                  <div className="p-3.5 bg-[#FAFAFC] rounded-xl border border-black/[0.04]">
                    <span className="text-[11px] text-[#86868B] block">Entropy Strength</span>
                    <span className="text-base font-semibold text-[#1D1D1F] mt-1 block">
                      {account?.zxcvbn_analysis?.entropy_bits ? `${account.zxcvbn_analysis.entropy_bits.toFixed(1)} bits` : (account?.zxcvbn_score ? `${account.zxcvbn_score * 18} bits` : "58.4 bits")}
                    </span>
                    <span className={`text-[10px] font-medium ${
                      (account?.zxcvbn_score ?? 3) >= 3
                        ? "text-[#34C759]"
                        : (account?.zxcvbn_score === 2 ? "text-[#F59E0B]" : "text-[#FF3B30]")
                    }`}>
                      {(account?.zxcvbn_score ?? 3) >= 3
                        ? "High Resistance"
                        : ((account?.zxcvbn_score === 2) ? "Moderate Entropy" : "Vulnerable Entropy")}
                    </span>
                  </div>

                  {/* Breach Immunity Card */}
                  <div className="p-3.5 bg-[#FAFAFC] rounded-xl border border-black/[0.04]">
                    <span className="text-[11px] text-[#86868B] block">Breach Immunity</span>
                    <span className={`text-base font-semibold mt-1 block ${account?.breach_match ? "text-[#FF3B30]" : "text-[#34C759]"}`}>
                      {account?.breach_match ? "Breach Match" : "0 Found"}
                    </span>
                    <span className={`text-[10px] ${account?.breach_match ? "text-[#FF3B30] font-medium" : "text-[#6E6E73]"}`}>
                      {account?.breach_match ? "Found in Known Dumps" : "Clean in 12B corpus"}
                    </span>
                  </div>

                  {/* Lateral Exposure Card */}
                  <div className="p-3.5 bg-[#FAFAFC] rounded-xl border border-black/[0.04]">
                    <span className="text-[11px] text-[#86868B] block">Lateral Exposure</span>
                    <span className="text-base font-semibold text-[#1D1D1F] mt-1 block">
                      {account?.password_group_id ? `Cluster #${account.password_group_id}` : "Isolated"}
                    </span>
                    <span className={`text-[10px] font-medium ${account?.password_group_id ? "text-[#FF3B30]" : "text-[#34C759]"}`}>
                      {account?.password_group_id ? "Reused in AD Family" : "0 Lateral Links"}
                    </span>
                  </div>

                  {/* Rotation Interval Card */}
                  <div className="p-3.5 bg-[#FAFAFC] rounded-xl border border-black/[0.04]">
                    <span className="text-[11px] text-[#86868B] block">Rotation Interval</span>
                    <span className="text-base font-semibold text-[#1D1D1F] mt-1 block">
                      {account?.last_remediated_at
                        ? "Recently Updated"
                        : (riskTheme.tier === "Critical" || riskTheme.tier === "High" ? "Action Mandated" : "Quarterly Cycle")}
                    </span>
                    <span className={`text-[10px] font-medium ${
                      account?.last_remediated_at
                        ? "text-[#34C759]"
                        : (riskTheme.tier === "Critical" ? "text-[#FF3B30]" : (riskTheme.tier === "High" ? "text-[#FF9500]" : "text-[#86868B]"))
                    }`}>
                      {account?.last_remediated_at
                        ? "Remediated & Verified"
                        : (riskTheme.tier === "Critical" || riskTheme.tier === "High" ? "Immediate Reset Required" : "Quarterly SOC 2 cycle")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action & Security Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tool 1: Live k-Anonymity Checker */}
              <div className="apple-card p-6 bg-white border border-black/[0.06] rounded-2xl shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-semibold text-[#0071E3] uppercase tracking-wider mb-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>k-Anonymity Privacy Audit</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">
                    Safely verify your credentials against global breach dumps
                  </h3>
                  <p className="text-xs text-[#6E6E73] mt-2 leading-relaxed">
                    Test password resistance using HaveIBeenPwned API with zero data exposure. Only the first 5 SHA-1 characters leave your browser.
                  </p>
                </div>
                <div className="pt-6">
                  <button
                    onClick={() => setIsHIBPOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium flex items-center justify-center space-x-2 shadow-xs transition active:scale-[0.98]"
                  >
                    <span>Launch Private Breach Verification</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tool 2: Password Policy & Compliance status */}
              <div className="apple-card p-6 bg-white border border-black/[0.06] rounded-2xl shadow-card flex flex-col justify-between">
                <div>
                  <div className={`flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider mb-2 ${
                    account?.policy_violations && account.policy_violations.length > 0
                      ? "text-[#FF3B30]"
                      : "text-[#34C759]"
                  }`}>
                    <Lock className="w-4 h-4" />
                    <span>
                      {account?.policy_violations && account.policy_violations.length > 0
                        ? "Policy Enforcement Required"
                        : "Corporate Security Mandate"}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">
                    {account?.policy_violations && account.policy_violations.length > 0
                      ? "Credential Policy Discrepancies Identified"
                      : "Your account protects the organizational perimeter"}
                  </h3>
                  <div className="space-y-2.5 mt-4">
                    {/* Check 1: Length */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6E6E73] flex items-center space-x-1.5">
                        {account?.policy_violations?.some(v => v.toLowerCase().includes("length") || v.toLowerCase().includes("short")) ? (
                          <XCircle className="w-3.5 h-3.5 text-[#FF3B30]" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
                        )}
                        <span>Minimum Length: 12 characters</span>
                      </span>
                      <span className={`font-semibold ${
                        account?.policy_violations?.some(v => v.toLowerCase().includes("length") || v.toLowerCase().includes("short"))
                          ? "text-[#FF3B30]"
                          : "text-[#1D1D1F]"
                      }`}>
                        {account?.policy_violations?.some(v => v.toLowerCase().includes("length") || v.toLowerCase().includes("short"))
                          ? "Failed (< 12)"
                          : "Passed"}
                      </span>
                    </div>

                    {/* Check 2: Entropy */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6E6E73] flex items-center space-x-1.5">
                        {(account?.zxcvbn_score ?? 3) < 3 || account?.policy_violations?.some(v => v.toLowerCase().includes("entropy") || v.toLowerCase().includes("complexity")) ? (
                          <XCircle className="w-3.5 h-3.5 text-[#FF3B30]" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
                        )}
                        <span>Entropy & Diversity Standard</span>
                      </span>
                      <span className={`font-semibold ${
                        (account?.zxcvbn_score ?? 3) < 3
                          ? "text-[#FF3B30]"
                          : "text-[#1D1D1F]"
                      }`}>
                        {(account?.zxcvbn_score ?? 3) < 3
                          ? `Failed (zxcvbn ${account?.zxcvbn_score || 1}/4)`
                          : "Passed (zxcvbn 4/4)"}
                      </span>
                    </div>

                    {/* Check 3: Banned patterns / dictionary */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6E6E73] flex items-center space-x-1.5">
                        {account?.policy_violations?.some(v => v.toLowerCase().includes("pattern") || v.toLowerCase().includes("brand") || v.toLowerCase().includes("dictionary") || v.toLowerCase().includes("leetspeak")) || account?.breach_match ? (
                          <XCircle className="w-3.5 h-3.5 text-[#FF3B30]" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
                        )}
                        <span>Banned Patterns & Dictionary Shield</span>
                      </span>
                      <span className={`font-semibold ${
                        account?.policy_violations?.some(v => v.toLowerCase().includes("pattern") || v.toLowerCase().includes("brand") || v.toLowerCase().includes("dictionary") || v.toLowerCase().includes("leetspeak")) || account?.breach_match
                          ? "text-[#FF3B30]"
                          : "text-[#1D1D1F]"
                      }`}>
                        {account?.policy_violations?.some(v => v.toLowerCase().includes("pattern") || v.toLowerCase().includes("brand") || v.toLowerCase().includes("dictionary") || v.toLowerCase().includes("leetspeak")) || account?.breach_match
                          ? "Violation Detected"
                          : "Passed"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-black/[0.04] flex items-center justify-between text-[11px] text-[#86868B]">
                  <span>Enforced by Lexicon FGPP Governance</span>
                  <span className={`font-medium ${
                    account?.policy_violations && account.policy_violations.length > 0
                      ? "text-[#FF3B30]"
                      : "text-[#34C759]"
                  }`}>
                    {account?.policy_violations && account.policy_violations.length > 0
                      ? `${account.policy_violations.length} Policy Violations`
                      : "100% Compliant"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 4: ZXCVBN PRE-CHECK TAB                                            */}
        {/* ========================================================================= */}
        {activeTab === "precheck" && !isBlocked && (
          <div className="space-y-6">
            <div className="apple-card p-6 sm:p-8 bg-white border border-black/[0.06] rounded-2xl shadow-card space-y-6">
              <div className="pb-4 border-b border-black/[0.06]">
                <div className="flex items-center space-x-2 text-xs font-semibold text-[#0071E3] uppercase tracking-wider mb-1">
                  <Cpu className="w-4 h-4" />
                  <span>dwolfhub/zxcvbn-python Engine</span>
                </div>
                <h3 className="text-lg font-semibold text-[#1D1D1F]">
                  Enterprise Password Pre-Check & Pattern Analyzer
                </h3>
                <p className="text-xs text-[#6E6E73] mt-1 leading-relaxed">
                  Evaluate potential new passwords against corporate brand word dictionaries, spatial keyboard walks, date patterns, and Active Directory policy rules before updating your credentials.
                </p>
              </div>

              <form onSubmit={handleEvaluateTestPassword} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase text-[#86868B] block">
                      Candidate Password to Test
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSuggestStrongPassword("precheck")}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#0071E3]/10 hover:bg-[#0071E3]/15 text-[#0071E3] text-[11px] font-semibold border border-[#0071E3]/20 transition active:scale-95 cursor-pointer shadow-2xs"
                      title="Generate an ultra-strong high-entropy candidate password"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Suggest Strong Password</span>
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={testPassword}
                        onChange={(e) => setTestPassword(e.target.value)}
                        placeholder="Try entering a password (e.g. LexiconDesign2026!)"
                        className="w-full px-4 py-3 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs sm:text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:bg-white transition font-mono"
                      />
                      <Lock className="w-4 h-4 text-[#86868B] absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <button
                      type="submit"
                      disabled={isTesting || !testPassword}
                      className="px-6 py-3 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-xs transition active:scale-[0.98]"
                    >
                      {isTesting ? (
                        <span>Analyzing...</span>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Evaluate Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5 pt-4 border-t border-black/[0.06]"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#FAFAFC] border border-black/[0.04]">
                      <span className="text-[10px] text-[#86868B] uppercase font-semibold block">zxcvbn Strength</span>
                      <span
                        className={`text-lg font-bold mt-1 block ${
                          testResult.zxcvbn.score >= 3
                            ? "text-[#34C759]"
                            : testResult.zxcvbn.score === 2
                            ? "text-[#FF9500]"
                            : "text-[#FF3B30]"
                        }`}
                      >
                        Score {testResult.zxcvbn.score} / 4
                      </span>
                      <span className="text-[10px] text-[#86868B]">
                        {testResult.zxcvbn.score >= 3 ? "Enterprise Strong" : "Vulnerable"}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FAFAFC] border border-black/[0.04]">
                      <span className="text-[10px] text-[#86868B] uppercase font-semibold block">Entropy Value</span>
                      <span className="text-lg font-bold text-[#1D1D1F] mt-1 block font-mono">
                        {testResult.zxcvbn.entropy_bits} bits
                      </span>
                      <span className="text-[10px] text-[#86868B]">log10: {testResult.zxcvbn.guesses_log10}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FAFAFC] border border-black/[0.04]">
                      <span className="text-[10px] text-[#86868B] uppercase font-semibold block">Fast Hash Crack</span>
                      <span className="text-sm font-bold text-[#FF3B30] mt-1 block truncate">
                        {testResult.zxcvbn.crack_times_display.offline_fast_hashing_1e10_per_second}
                      </span>
                      <span className="text-[10px] text-[#86868B]">NTLM Offline GPU</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FAFAFC] border border-black/[0.04]">
                      <span className="text-[10px] text-[#86868B] uppercase font-semibold block">Memory-Hard Crack</span>
                      <span className="text-sm font-bold text-[#34C759] mt-1 block truncate">
                        {testResult.zxcvbn.crack_times_display.offline_slow_hashing_1e4_per_second}
                      </span>
                      <span className="text-[10px] text-[#86868B]">Argon2id Resistance</span>
                    </div>
                  </div>

                  {testResult.zxcvbn.sequence && testResult.zxcvbn.sequence.length > 0 && (
                    <div className="p-4 rounded-xl bg-[#F5F5F7] border border-black/[0.04] space-y-2">
                      <span className="text-xs font-semibold text-[#1D1D1F] block">
                        Pattern Sequence Breakdown:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {testResult.zxcvbn.sequence.map((seq, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-1.5 rounded-lg bg-white border border-black/[0.06] text-xs font-mono shadow-xs flex items-center space-x-1.5"
                          >
                            <span className="font-semibold text-[#0071E3]">{seq.token}</span>
                            <span className="text-[10px] text-[#86868B] uppercase">
                              [{seq.pattern}{seq.matched_word ? `: "${seq.matched_word}"` : ""}]
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 5: ACTIVITY LOG TAB                                                */}
        {/* ========================================================================= */}
        {activeTab === "activity" && !isBlocked && (
          <div className="apple-card p-6 bg-white border border-black/[0.06] rounded-2xl shadow-card space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
              <div>
                <h3 className="text-base font-semibold text-[#1D1D1F]">
                  Identity Telemetry & Audit History
                </h3>
                <p className="text-xs text-[#6E6E73]">
                  All login events, audit telemetry, and safeguard activations for {account?.username}
                </p>
              </div>
            </div>

            <div className="divide-y divide-black/[0.04]">
              <div className="py-3.5 flex items-center justify-between text-xs">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] flex items-center justify-center text-[#1D1D1F] mt-0.5">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#1D1D1F] block">SSO Authentication via Okta</span>
                    <span className="text-[11px] text-[#86868B]">MacBook Pro (macOS 14.5) • San Francisco, CA, US</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#34C759]/10 text-[#34C759]">
                    Verified
                  </span>
                  <span className="text-[11px] text-[#86868B] block mt-1">10 minutes ago</span>
                </div>
              </div>

              <div className="py-3.5 flex items-center justify-between text-xs">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] flex items-center justify-center text-[#1D1D1F] mt-0.5">
                    <ShieldCheck className="w-4 h-4 text-[#34C759]" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#1D1D1F] block">Continuous Posture Evaluation (Lexicon Shield)</span>
                    <span className="text-[11px] text-[#86868B]">Background Automated Scan • Corporate Security Perimeter</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#34C759]/10 text-[#34C759]">
                    Protected
                  </span>
                  <span className="text-[11px] text-[#86868B] block mt-1">Today at 09:14 AM</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 6: SETTINGS TAB                                                    */}
        {/* ========================================================================= */}
        {activeTab === "settings" && !isBlocked && (
          <div className="apple-card p-6 bg-white border border-black/[0.06] rounded-2xl shadow-card space-y-6">
            <div>
              <h3 className="text-base font-semibold text-[#1D1D1F]">
                Organizational Protection Preferences
              </h3>
              <p className="text-xs text-[#6E6E73]">
                Configure continuous threat notifications and hardware authentication mandates.
              </p>
            </div>

            <div className="space-y-4 divide-y divide-black/[0.04]">
              <div className="pt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#1D1D1F] block">
                    Two-Factor Hardware Enforcement
                  </span>
                  <span className="text-[11px] text-[#86868B]">
                    Enforce FIDO2 physical key or biometric Touch ID for sensitive corporate systems.
                  </span>
                </div>
                <button
                  onClick={() => setMfaEnabled(!mfaEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    mfaEnabled ? "bg-[#34C759]" : "bg-[#E5E5EA]"
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                      mfaEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#1D1D1F] block">
                    Instant Threat & Breach Alerts
                  </span>
                  <span className="text-[11px] text-[#86868B]">
                    Receive immediate alerts if your password pattern appears in dark web credential dumps.
                  </span>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    notificationsEnabled ? "bg-[#34C759]" : "bg-[#E5E5EA]"
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${
                      notificationsEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* HIBP Live Modal */}
      <HIBPLiveModal
        isOpen={isHIBPOpen}
        onClose={() => setIsHIBPOpen(false)}
      />
    </div>
  );
};

