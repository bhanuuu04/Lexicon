"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  BarChart3,
  Users,
  AlertCircle,
  X,
  CheckCircle2,
  Building2,
  ExternalLink,
} from "lucide-react";
import { loginUser } from "../../lib/api";
import { Account } from "../../types";

interface EnterpriseLoginProps {
  onLoginSuccess: (account: Account, notice?: string) => void;
  onReturnToPlatform?: () => void;
  initialUsername?: string;
}

export const EnterpriseLogin: React.FC<EnterpriseLoginProps> = ({
  onLoginSuccess,
  onReturnToPlatform,
  initialUsername = "alex.morgan@lexicon.com",
}) => {
  const [emailInput, setEmailInput] = useState(initialUsername);
  const [passwordInput, setPasswordInput] = useState("Company2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Microsoft Entra ID SSO Modal State
  const [isSSOModalOpen, setIsSSOModalOpen] = useState(false);
  const [isSSOAuthenticating, setIsSSOAuthenticating] = useState(false);
  const [ssoStatusText, setSsoStatusText] = useState<string>("");

  // Quick select helper for demo identities
  const handleSelectQuickIdentity = (username: string, defaultPass: string) => {
    setEmailInput(username.includes("@") ? username : `${username}@lexicon.com`);
    setPasswordInput(defaultPass);
    setErrorMessage(null);
  };

  const handleExecuteLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsLoggingIn(true);
    setErrorMessage(null);

    // Extract clean username if full email was entered (e.g. alex.morgan@lexicon.com -> alex.morgan)
    const cleanUsername = emailInput.trim().split("@")[0];

    try {
      const res = await loginUser(cleanUsername, passwordInput);
      if (res.status === "authenticated" && res.account) {
        onLoginSuccess(
          res.account,
          `Identity authenticated. Welcome back, ${res.account.first_name || res.account.username}!`
        );
      } else if (res.status === "blocked" && res.account) {
        onLoginSuccess(
          res.account,
          "Access Suspended: Account flagged by enterprise security policy. Remediation required."
        );
      } else {
        setErrorMessage(res.message || "Invalid corporate credentials. Please verify and try again.");
      }
    } catch (err: any) {
      console.error("Enterprise authentication failed:", err);
      setErrorMessage(err.message || "Authentication gateway unreachable. Ensure directory services are active.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Trigger Microsoft SSO Interactive Account Picker
  const handleOpenMicrosoftSSO = () => {
    setIsSSOModalOpen(true);
    setIsSSOAuthenticating(false);
    setSsoStatusText("");
  };

  const handleExecuteMicrosoftSSO = async (username: string, defaultPass: string) => {
    setIsSSOAuthenticating(true);
    setSsoStatusText("Negotiating SAML 2.0 token with Microsoft Entra ID...");

    setTimeout(async () => {
      setSsoStatusText("Validating conditional access & Kerberos ticket...");
      try {
        const res = await loginUser(username, defaultPass);
        if (res.status === "authenticated" && res.account) {
          setIsSSOModalOpen(false);
          onLoginSuccess(
            res.account,
            `✨ Signed in via Microsoft Entra ID SSO as ${res.account.username}@lexicon.com`
          );
        } else if (res.status === "blocked" && res.account) {
          setIsSSOModalOpen(false);
          onLoginSuccess(
            res.account,
            "Access Suspended: Account flagged by enterprise security policy. Remediation required."
          );
        } else {
          setIsSSOAuthenticating(false);
          setSsoStatusText("SSO authentication failed. Please verify credentials.");
        }
      } catch (err) {
        setIsSSOAuthenticating(false);
        setSsoStatusText("Directory unreachable. Please retry.");
      }
    }, 900);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full flex flex-col lg:flex-row bg-white text-[#0F172A] font-sans selection:bg-[#0071E3]/20 selection:text-[#0071E3]">
      {/* ========================================================================= */}
      {/* 1. LEFT COLUMN: CLEAN ENTERPRISE BRANDING & VALUE PROPOSITION */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[46%] xl:w-[44%] bg-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 z-10 shrink-0">
        {/* Top: Brand Header */}
        <div>
          <div
            onClick={onReturnToPlatform}
            className="flex items-center space-x-3.5 cursor-pointer group select-none"
            title="Return to Lexicon Platform"
          >
            <div className="w-9 h-9 relative shrink-0">
              <Image
                src="/lexicon-logo.png"
                alt="LEXICON"
                width={36}
                height={36}
                className="w-9 h-9 object-contain"
                style={{ mixBlendMode: "multiply" }}
                priority
              />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-gray-900 block leading-tight font-sans">
                LEXICON
              </span>
              <span className="text-[11px] text-gray-500 font-normal block leading-tight">
                Enterprise Password Security
              </span>
            </div>
          </div>

          {/* Separator & Kicker */}
          <div className="mt-12 pt-6 border-t border-gray-100">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 block font-sans">
              SECURE IDENTITIES. STRONGER ENTERPRISES.
            </span>
          </div>

          {/* Hero Headline */}
          <div className="mt-8 space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[#0F172A] leading-[1.15] font-sans">
              Protect what <br />
              powers your people.
            </h1>
            <p className="text-sm sm:text-base text-gray-500 font-normal leading-relaxed max-w-md">
              Identify risks. Prevent breaches. <br />
              Build a safer organization.
            </p>
          </div>

          {/* Value Prop Features */}
          <div className="mt-10 space-y-6">
            {/* Feature 1: Analyze */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200/70 flex items-center justify-center text-gray-700 shadow-2xs shrink-0 mt-0.5">
                <Shield className="w-4.5 h-4.5 text-gray-700" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-sans">
                  Analyze
                </h3>
                <p className="text-xs text-gray-500 font-normal mt-0.5 leading-relaxed">
                  Detect weak and compromised passwords across your enterprise.
                </p>
              </div>
            </div>

            {/* Feature 2: Mitigate */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200/70 flex items-center justify-center text-gray-700 shadow-2xs shrink-0 mt-0.5">
                <BarChart3 className="w-4.5 h-4.5 text-gray-700" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-sans">
                  Mitigate
                </h3>
                <p className="text-xs text-gray-500 font-normal mt-0.5 leading-relaxed">
                  Reduce risk with actionable insights and policy enforcement.
                </p>
              </div>
            </div>

            {/* Feature 3: Empower */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200/70 flex items-center justify-center text-gray-700 shadow-2xs shrink-0 mt-0.5">
                <Users className="w-4.5 h-4.5 text-gray-700" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-sans">
                  Empower
                </h3>
                <p className="text-xs text-gray-500 font-normal mt-0.5 leading-relaxed">
                  Enable a culture of stronger password hygiene for a safer future.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Tagline */}
        <div className="mt-12 pt-8 flex items-center space-x-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
          <span className="w-4 h-px bg-gray-300 inline-block" />
          <span>TRUSTED BY SECURITY-FOCUSED ORGANIZATIONS</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RIGHT COLUMN: CORPORATE BUILDING PHOTO & FLOATING LOGIN CARD */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[54%] xl:w-[56%] relative flex items-center justify-center p-6 sm:p-10 lg:p-12 min-h-[560px] bg-slate-900 overflow-hidden">
        {/* Background Building Image with Subtle Dark Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
          style={{
            backgroundImage: "url('/images/enterprise-building-bg.jpg')",
          }}
        >
          {/* Subtle gradient vignette to guarantee card contrast */}
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
        </div>

        {/* Top-Right Ambient Corner Text */}
        <div className="absolute top-8 right-8 text-right hidden sm:block pointer-events-none select-none z-10">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80 leading-relaxed block font-sans drop-shadow-sm">
            A SAFER
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80 leading-relaxed block font-sans drop-shadow-sm">
            TOMORROW,
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80 leading-relaxed block font-sans drop-shadow-sm">
            TOGETHER.
          </span>
        </div>

        {/* Bottom-Right Ambient Corner Text */}
        <div className="absolute bottom-8 right-8 text-right hidden sm:block pointer-events-none select-none z-10">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80 leading-relaxed block font-sans drop-shadow-sm">
            PEOPLE
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80 leading-relaxed block font-sans drop-shadow-sm">
            DATA
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80 leading-relaxed block font-sans drop-shadow-sm">
            POSSIBILITIES
          </span>
        </div>

        {/* CENTERED FLOATING LOGIN CARD */}
        <div className="relative z-20 w-full max-w-[420px] bg-white rounded-[26px] p-8 sm:p-9 shadow-2xl border border-black/[0.06] animate-in fade-in zoom-in-95 duration-400">
          {/* Card Header */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">
              Welcome Back
            </h2>
            <p className="text-xs text-gray-500 font-normal">
              Sign in to your enterprise account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleExecuteLogin} className="mt-6 space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 block">
                Email address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="alex.morgan@lexicon.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition shadow-2xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 block">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition shadow-2xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none transition"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-start space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Sign In CTA Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-[#0B132B] hover:bg-[#1C2541] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-sm transition active:scale-[0.99] cursor-pointer mt-5"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="w-full border-t border-gray-200" />
              <span className="absolute bg-white px-3 text-[11px] text-gray-400 font-medium">
                Or continue with
              </span>
            </div>

            {/* Microsoft SSO Button - Opens Enterprise IdP Handshake */}
            <button
              type="button"
              onClick={handleOpenMicrosoftSSO}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold border border-gray-200 shadow-2xs flex items-center justify-center space-x-2.5 transition active:scale-[0.99] cursor-pointer"
            >
              {/* Microsoft 4-square logo */}
              <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5 shrink-0">
                <div className="bg-[#F25022] rounded-[0.5px]" />
                <div className="bg-[#7FBA00] rounded-[0.5px]" />
                <div className="bg-[#00A4EF] rounded-[0.5px]" />
                <div className="bg-[#FFB900] rounded-[0.5px]" />
              </div>
              <span>Sign in with Microsoft (SSO)</span>
            </button>

            {/* SSO Security Notice */}
            <div className="pt-2 text-center">
              <div className="inline-flex items-center space-x-1.5 text-[11px] text-gray-400">
                <Lock className="w-3 h-3 text-gray-400" />
                <span>Protected by enterprise SSO</span>
              </div>
            </div>
          </form>

          {/* Quick Demo Identities Chips */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-2">
              Demo Identity Fill:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectQuickIdentity("alex.morgan", "Company2026!")}
                className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[10px] font-medium text-gray-700 transition cursor-pointer"
              >
                Alex Morgan (Admin)
              </button>
              <button
                type="button"
                onClick={() => handleSelectQuickIdentity("marcus.chen", "Summer2024!")}
                className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[10px] font-medium text-gray-700 transition cursor-pointer"
              >
                Marcus Chen
              </button>
              <button
                type="button"
                onClick={() => handleSelectQuickIdentity("elena.rostova", "P@ssw0rd2025")}
                className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[10px] font-medium text-gray-700 transition cursor-pointer"
              >
                Elena Rostova
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE MICROSOFT ENTRA ID SSO MODAL / HANDSHAKE DIALOG */}
      {/* ========================================================================= */}
      {isSSOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-6 relative animate-in zoom-in-95 duration-200">
            {/* Modal Close Button */}
            <button
              onClick={() => {
                if (!isSSOAuthenticating) setIsSSOModalOpen(false);
              }}
              disabled={isSSOAuthenticating}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition disabled:opacity-30 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Microsoft Tenant Branding Header */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="grid grid-cols-2 gap-0.5 w-4 h-4 shrink-0">
                  <div className="bg-[#F25022] rounded-[0.5px]" />
                  <div className="bg-[#7FBA00] rounded-[0.5px]" />
                  <div className="bg-[#00A4EF] rounded-[0.5px]" />
                  <div className="bg-[#FFB900] rounded-[0.5px]" />
                </div>
                <span className="font-semibold text-xs text-gray-700 font-sans tracking-wide">
                  Microsoft Entra ID
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight font-sans">
                Pick an account
              </h3>
              <p className="text-xs text-gray-500">
                to continue to <strong className="text-gray-800">Lexicon Enterprise Platform</strong>
              </p>
            </div>

            {/* SSO Live Status Message */}
            {isSSOAuthenticating ? (
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200/80 space-y-2.5 text-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-blue-900 font-mono">
                  {ssoStatusText}
                </p>
                <span className="text-[10px] text-blue-600 block">
                  Tenant: lexicon.onmicrosoft.com • ADFS 4.0
                </span>
              </div>
            ) : (
              /* Identity List */
              <div className="space-y-2">
                {/* Identity 1 */}
                <button
                  type="button"
                  onClick={() => handleExecuteMicrosoftSSO("alex.morgan", "Company2026!")}
                  className="w-full p-3 rounded-xl border border-gray-200 hover:border-blue-500/50 hover:bg-gray-50/80 flex items-center justify-between text-left transition group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-[#0F172A] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      AM
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-900 block group-hover:text-blue-600 transition">
                        Alex Morgan
                      </span>
                      <span className="text-[11px] text-gray-500 block">
                        alex.morgan@lexicon.com
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        Domain Admin • IT Security
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition" />
                </button>

                {/* Identity 2 */}
                <button
                  type="button"
                  onClick={() => handleExecuteMicrosoftSSO("marcus.chen", "Summer2024!")}
                  className="w-full p-3 rounded-xl border border-gray-200 hover:border-blue-500/50 hover:bg-gray-50/80 flex items-center justify-between text-left transition group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      MC
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-900 block group-hover:text-blue-600 transition">
                        Marcus Chen
                      </span>
                      <span className="text-[11px] text-gray-500 block">
                        marcus.chen@lexicon.com
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        Senior Software Engineer • Engineering
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition" />
                </button>

                {/* Identity 3 */}
                <button
                  type="button"
                  onClick={() => handleExecuteMicrosoftSSO("elena.rostova", "P@ssw0rd2025")}
                  className="w-full p-3 rounded-xl border border-gray-200 hover:border-blue-500/50 hover:bg-gray-50/80 flex items-center justify-between text-left transition group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      ER
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-900 block group-hover:text-blue-600 transition">
                        Elena Rostova
                      </span>
                      <span className="text-[11px] text-gray-500 block">
                        elena.rostova@lexicon.com
                      </span>
                      <span className="text-[10px] text-amber-600 font-medium">
                        SecOps Risk Analyst • SOC
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition" />
                </button>
              </div>
            )}

            {/* Footer Notice */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
              <span>SAML 2.0 / OpenID Connect</span>
              <button
                type="button"
                onClick={() => setIsSSOModalOpen(false)}
                className="text-gray-500 hover:text-gray-800 font-medium transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
