"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowRight, ShieldCheck, Zap, Database, Layers, Lock, ShieldAlert, CheckCircle2 } from "lucide-react";

interface LandingHeroProps {
  onExploreClick: () => void;
  onExploreUser?: () => void;
  onSecurityModelClick: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onExploreClick,
  onExploreUser,
  onSecurityModelClick,
}) => {
  const [activeNode, setActiveNode] = useState<"shield" | "containment" | "governance">("shield");

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Product Label */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full bg-white border border-black/[0.08] shadow-xs">
            <div className="w-5 h-5 min-w-[20px] max-w-[20px] min-h-[20px] max-h-[20px] rounded-md overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src="/lexicon-logo.png"
                alt="Lexicon"
                className="w-5 h-5 object-contain block"
                style={{ width: "20px", height: "20px", maxWidth: "20px", maxHeight: "20px" }}
              />
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse shrink-0"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] whitespace-nowrap">
              LEXICON ENTERPRISE
            </span>
            <span className="text-[#86868B] shrink-0">•</span>
            <span className="text-xs text-[#6E6E73] font-medium whitespace-nowrap">Password Risk Intelligence</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="text-center mt-6 max-w-4xl mx-auto space-y-4"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-[#1D1D1F] leading-[1.08] font-sans">
            Safeguard your organization <br className="hidden sm:block" />
            <span className="text-[#6E6E73]">against identity-driven attacks.</span>
          </h1>
          <p className="text-base sm:text-lg text-[#6E6E73] max-w-2xl mx-auto font-normal leading-relaxed">
            Protect your workforce, contain lateral ransomware blast radius, and enforce Zero-Trust credential compliance across every corporate identity before adversaries strike.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.16 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
        >
          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition active:scale-[0.98]"
          >
            <span>Launch SOC Operations</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          {onExploreUser && (
            <button
              onClick={onExploreUser}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-[#FAFAFC] text-[#1D1D1F] font-medium text-sm border border-black/[0.08] shadow-xs flex items-center justify-center space-x-2 transition active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4 text-[#0071E3]" />
              <span>Employee Shield (Alex)</span>
            </button>
          )}
          <button
            onClick={onSecurityModelClick}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#F5F5F7] hover:bg-[#EBEBED] text-[#6E6E73] hover:text-[#1D1D1F] font-medium text-sm border border-black/[0.06] transition active:scale-[0.98]"
          >
            Explore Defense Model
          </button>
        </motion.div>

        {/* Key Capability Badges */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.24 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-10 text-xs text-[#6E6E73]"
        >
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-[#34C759]" />
            <span>50,000 Corporate Identities Protected</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Lock className="w-4 h-4 text-[#0071E3]" />
            <span>NIST 800-63B & SOC 2 Continuous Governance</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Zap className="w-4 h-4 text-[#FF9500]" />
            <span>Proactive Lateral Breach Containment</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Database className="w-4 h-4 text-[#5856D6]" />
            <span>Zero-Exfiltration Enterprise Privacy</span>
          </span>
        </motion.div>

        {/* HERO VISUAL: Organization Defense & Shield Matrix */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          className="mt-14 max-w-4xl mx-auto"
        >
          <div className="apple-card p-8 sm:p-10 border border-black/[0.08] bg-white shadow-card">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Central Shield Hub */}
              <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] shadow-xs flex items-center space-x-3 px-6">
                <div className="w-8 h-8 rounded-xl bg-[#0071E3] flex items-center justify-center text-white shadow-xs">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] uppercase font-semibold text-[#86868B] block tracking-wider">
                    Enterprise Protection Shield
                  </span>
                  <span className="text-sm font-semibold text-[#1D1D1F] font-sans">
                    ORGANIZATIONAL IDENTITY SAFEGUARD
                  </span>
                </div>
              </div>

              {/* Connecting Branches */}
              <div className="w-full max-w-lg h-6 flex items-center justify-center relative">
                <div className="w-3/4 h-[1px] bg-black/[0.1]"></div>
                <div className="absolute w-2 h-2 rounded-full bg-[#0071E3]"></div>
              </div>

              {/* 3 Protection Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                {/* Pillar 1: Identity Threat Detection */}
                <button
                  onClick={() => setActiveNode("shield")}
                  className={`p-4 rounded-xl text-left border transition-all duration-200 ${
                    activeNode === "shield"
                      ? "bg-[#F5F5F7] border-[#0071E3]/40 shadow-xs"
                      : "bg-white border-black/[0.06] hover:bg-[#FAFAFC]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#1D1D1F]">Threat Detection (ITDR)</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0071E3]" />
                  </div>
                  <p className="text-[11px] text-[#6E6E73] leading-relaxed">
                    Continuously scans corporate directories to eliminate weak, breached, and predictable credentials.
                  </p>
                </button>

                {/* Pillar 2: Blast Radius Containment */}
                <button
                  onClick={() => setActiveNode("containment")}
                  className={`p-4 rounded-xl text-left border transition-all duration-200 ${
                    activeNode === "containment"
                      ? "bg-[#F5F5F7] border-[#5856D6]/40 shadow-xs"
                      : "bg-white border-black/[0.06] hover:bg-[#FAFAFC]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#1D1D1F]">Blast Radius Defense</span>
                    <Layers className="w-3.5 h-3.5 text-[#5856D6]" />
                  </div>
                  <p className="text-[11px] text-[#6E6E73] leading-relaxed">
                    Breaks cross-account credential reuse chains to prevent lateral ransomware spread into Domain Admins.
                  </p>
                </button>

                {/* Pillar 3: Automated Governance & Remediation */}
                <button
                  onClick={() => setActiveNode("governance")}
                  className={`p-4 rounded-xl text-left border transition-all duration-200 ${
                    activeNode === "governance"
                      ? "bg-[#F5F5F7] border-[#34C759]/40 shadow-xs"
                      : "bg-white border-black/[0.06] hover:bg-[#FAFAFC]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#1D1D1F]">Automated Remediation</span>
                    <Lock className="w-3.5 h-3.5 text-[#34C759]" />
                  </div>
                  <p className="text-[11px] text-[#6E6E73] leading-relaxed">
                    Generates board-level risk reports, IT PowerShell policies, and targeted employee posture guides.
                  </p>
                </button>
              </div>

              {/* Bottom Surface Flow */}
              <div className="pt-4 border-t border-black/[0.06] w-full flex items-center justify-between text-xs text-[#6E6E73]">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
                  <span>Continuous 24/7 Shield</span>
                </span>
                <span className="font-semibold text-[#1D1D1F]">50,000 Monitored Enterprise Identities</span>
                <span>Active Threat Neutralization</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
