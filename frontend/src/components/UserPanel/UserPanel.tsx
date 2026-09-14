"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
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
} from "lucide-react";
import { HIBPLiveModal } from "../HIBPCheck/HIBPLiveModal";

interface UserPanelProps {
  onSwitchToAdmin: () => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({ onSwitchToAdmin }) => {
  const [isHIBPOpen, setIsHIBPOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "settings">("overview");
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // User details
  const user = {
    name: "Alex Morgan",
    email: "alex.morgan@lexicon.corp",
    role: "Senior Product Designer",
    department: "Product & Experience",
    score: 78,
    scoreStatus: "Protected Posture",
    lastAudited: "Today at 09:14 AM",
    entropy: 58.4,
    length: 14,
    breached: false,
    reuseClusters: 0,
    mfaMethod: "FIDO2 WebAuthn (YubiKey 5C)",
    passwordAgeDays: 42,
  };

  const activityLog = [
    {
      id: "act-1",
      action: "SSO Authentication via Okta",
      device: "MacBook Pro (macOS 14.5)",
      location: "San Francisco, CA, US",
      time: "10 minutes ago",
      status: "Verified",
    },
    {
      id: "act-2",
      action: "Continuous Posture Evaluation (Lexicon Shield)",
      device: "Background Automated Scan",
      location: "Corporate Security Perimeter",
      time: "Today at 09:14 AM",
      status: "Protected (0 Threats)",
    },
    {
      id: "act-3",
      action: "FIDO2 Hardware Key Authenticated",
      device: "YubiKey 5C NFC",
      location: "San Francisco, CA, US",
      time: "3 days ago",
      status: "Verified",
    },
    {
      id: "act-4",
      action: "Scheduled Password Policy Refresh",
      device: "MacBook Pro (macOS 14.5)",
      location: "San Francisco, CA, US",
      time: "42 days ago",
      status: "Applied",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#F5F5F7] text-[#1D1D1F] pb-24">
      {/* Header Banner */}
      <div className="bg-white border-b border-black/[0.06] sticky top-14 z-20 backdrop-blur-md bg-white/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#0071E3]/10 border border-[#0071E3]/20 flex items-center justify-center font-semibold text-[#0071E3] text-sm">
              AM
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-semibold text-[#1D1D1F]">
                  {user.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Shielded Identity</span>
                </span>
              </div>
              <p className="text-xs text-[#86868B]">
                {user.email} • {user.role} ({user.department})
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 bg-[#F5F5F7] p-1 rounded-xl border border-black/[0.04]">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "overview"
                  ? "bg-white text-[#1D1D1F] shadow-xs"
                  : "text-[#6E6E73] hover:text-[#1D1D1F]"
              }`}
            >
              Security Posture
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "activity"
                  ? "bg-white text-[#1D1D1F] shadow-xs"
                  : "text-[#6E6E73] hover:text-[#1D1D1F]"
              }`}
            >
              Activity & Log
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "settings"
                  ? "bg-white text-[#1D1D1F] shadow-xs"
                  : "text-[#6E6E73] hover:text-[#1D1D1F]"
              }`}
            >
              Safeguard Settings
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === "overview" && (
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
                        className="text-[#34C759]"
                        strokeDasharray={`${user.score}, 100`}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-semibold text-[#1D1D1F]">{user.score}</span>
                      <span className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                        / 100
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#34C759] mt-3">
                    Healthy Organizational Posture
                  </span>
                  <span className="text-[11px] text-[#86868B] mt-0.5">
                    Continuous monitoring active
                  </span>
                </div>

                {/* Score Breakdown Metrics */}
                <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3.5 bg-[#FAFAFC] rounded-xl border border-black/[0.04]">
                    <span className="text-[11px] text-[#86868B] block">Entropy Strength</span>
                    <span className="text-base font-semibold text-[#1D1D1F] mt-1 block">
                      {user.entropy} bits
                    </span>
                    <span className="text-[10px] text-[#34C759]">High Resistance (zxcvbn 4/4)</span>
                  </div>

                  <div className="p-3.5 bg-[#FAFAFC] rounded-xl border border-black/[0.04]">
                    <span className="text-[11px] text-[#86868B] block">Breach Immunity</span>
                    <span className="text-base font-semibold text-[#34C759] mt-1 block">
                      0 Found
                    </span>
                    <span className="text-[10px] text-[#6E6E73]">Clean in 12B corpus</span>
                  </div>

                  <div className="p-3.5 bg-[#FAFAFC] rounded-xl border border-black/[0.04]">
                    <span className="text-[11px] text-[#86868B] block">Lateral Exposure</span>
                    <span className="text-base font-semibold text-[#1D1D1F] mt-1 block">
                      Isolated
                    </span>
                    <span className="text-[10px] text-[#34C759]">0 Reuse Clusters</span>
                  </div>

                  <div className="p-3.5 bg-[#FAFAFC] rounded-xl border border-black/[0.04]">
                    <span className="text-[11px] text-[#86868B] block">Rotation Interval</span>
                    <span className="text-base font-semibold text-[#1D1D1F] mt-1 block">
                      {user.passwordAgeDays} days
                    </span>
                    <span className="text-[10px] text-[#FF9500]">Quarterly SOC 2 cycle</span>
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
                    Test password resistance using Troy Hunt&apos;s HaveIBeenPwned API with zero data exposure. Only the first 5 SHA-1 characters leave your browser.
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

              {/* Tool 2: Password Policy & MFA status */}
              <div className="apple-card p-6 bg-white border border-black/[0.06] rounded-2xl shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-semibold text-[#34C759] uppercase tracking-wider mb-2">
                    <Lock className="w-4 h-4" />
                    <span>Corporate Security Mandate</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">
                    Your account protects the organizational perimeter
                  </h3>
                  <div className="space-y-2.5 mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6E6E73] flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
                        <span>Minimum Length: 14 characters</span>
                      </span>
                      <span className="font-semibold text-[#1D1D1F]">Passed (14 chars)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6E6E73] flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
                        <span>Entropy & Diversity Standard</span>
                      </span>
                      <span className="font-semibold text-[#1D1D1F]">Passed (4/4)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6E6E73] flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
                        <span>Banned Patterns & Dictionary Shield</span>
                      </span>
                      <span className="font-semibold text-[#1D1D1F]">Passed</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-black/[0.04] flex items-center justify-between text-[11px] text-[#86868B]">
                  <span>Enforced by Lexicon FGPP Governance</span>
                  <span className="text-[#34C759] font-medium">100% Compliant</span>
                </div>
              </div>
            </div>

            {/* Recommendations Banner */}
            <div className="apple-card p-6 bg-white border border-black/[0.06] rounded-2xl shadow-card">
              <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4">
                Recommended Workforce Protections
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#FAFAFC] border border-black/[0.04]">
                  <div className="w-7 h-7 rounded-lg bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center mb-2">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-[#1D1D1F]">
                    Hardware Passkey Active
                  </h4>
                  <p className="text-[11px] text-[#6E6E73] mt-1 leading-relaxed">
                    FIDO2 YubiKey is registered, protecting against real-time phishing and proxy attacks.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAFC] border border-black/[0.04]">
                  <div className="w-7 h-7 rounded-lg bg-[#34C759]/10 text-[#34C759] flex items-center justify-center mb-2">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-[#1D1D1F]">
                    Corporate Vault Sync
                  </h4>
                  <p className="text-[11px] text-[#6E6E73] mt-1 leading-relaxed">
                    Enterprise password manager sync active, eliminating clipboard leaks and unsafe notes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFAFC] border border-black/[0.04]">
                  <div className="w-7 h-7 rounded-lg bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center mb-2">
                    <History className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-[#1D1D1F]">
                    Scheduled Audit Cycle
                  </h4>
                  <p className="text-[11px] text-[#6E6E73] mt-1 leading-relaxed">
                    Next automatic posture audit scheduled in 48 days for continuous SOC 2 verification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="apple-card p-6 bg-white border border-black/[0.06] rounded-2xl shadow-card space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
              <div>
                <h3 className="text-base font-semibold text-[#1D1D1F]">
                  Identity Telemetry & Audit History
                </h3>
                <p className="text-xs text-[#6E6E73]">
                  All login events, audit telemetry, and safeguard activations for {user.email}
                </p>
              </div>
            </div>

            <div className="divide-y divide-black/[0.04]">
              {activityLog.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] flex items-center justify-center text-[#1D1D1F] mt-0.5">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-[#1D1D1F] block">{item.action}</span>
                      <span className="text-[11px] text-[#86868B]">
                        {item.device} • {item.location}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#34C759]/10 text-[#34C759]">
                      {item.status}
                    </span>
                    <span className="text-[11px] text-[#86868B] block mt-1">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
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
      </div>

      {/* HIBP Live Modal */}
      <HIBPLiveModal
        isOpen={isHIBPOpen}
        onClose={() => setIsHIBPOpen(false)}
      />
    </div>
  );
};
