"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowRight, ShieldCheck, Zap, Database, Layers, Lock } from "lucide-react";

interface LandingHeroProps {
  onExploreClick: () => void;
  onSecurityModelClick: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onExploreClick,
  onSecurityModelClick,
}) => {
  const [activeNode, setActiveNode] = useState<"risk" | "reuse" | "breach">("risk");

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
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#0071E3] animate-pulse"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1D1D1F]">
              Lexicon Enterprise
            </span>
            <span className="text-[#86868B]">•</span>
            <span className="text-xs text-[#6E6E73]">Password Risk Intelligence</span>
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
            Understand password risk <br className="hidden sm:block" />
            <span className="text-[#6E6E73]">before attackers exploit it.</span>
          </h1>
          <p className="text-base sm:text-lg text-[#6E6E73] max-w-2xl mx-auto font-normal leading-relaxed">
            Deterministic credential risk analysis, client-side bounded attack telemetry, and AI-assisted remediation across 50,000 Active Directory accounts.
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
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition active:scale-[0.98]"
          >
            <span>Explore Platform</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onSecurityModelClick}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-[#FAFAFC] text-[#1D1D1F] font-medium text-sm border border-black/[0.08] shadow-xs transition active:scale-[0.98]"
          >
            View Security Model
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
            <span>50,000+ Synthetic Accounts</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Lock className="w-4 h-4 text-[#0071E3]" />
            <span>Deterministic Risk Scoring</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Zap className="w-4 h-4 text-[#FF9500]" />
            <span>Client-Side Attack Simulation</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Database className="w-4 h-4 text-[#5856D6]" />
            <span>Multi-Algorithm Hash Analysis</span>
          </span>
        </motion.div>

        {/* HERO VISUAL: Sophisticated Interactive Security Engine Diagram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          className="mt-14 max-w-4xl mx-auto"
        >
          <div className="apple-card p-8 sm:p-10 border border-black/[0.08] bg-white shadow-card">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Central Core Engine Node */}
              <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] shadow-xs flex items-center space-x-3 px-6">
                <div className="w-8 h-8 rounded-xl bg-[#0071E3] flex items-center justify-center text-white shadow-xs">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] uppercase font-semibold text-[#86868B] block tracking-wider">
                    Core Platform
                  </span>
                  <span className="text-sm font-semibold text-[#1D1D1F] font-sans">
                    LEXICON RISK ENGINE
                  </span>
                </div>
              </div>

              {/* Connecting Branches */}
              <div className="w-full max-w-lg h-6 flex items-center justify-center relative">
                <div className="w-3/4 h-[1px] bg-black/[0.1]"></div>
                <div className="absolute w-2 h-2 rounded-full bg-[#0071E3]"></div>
              </div>

              {/* 3 Intelligence Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                {/* Node 1: Deterministic Risk */}
                <button
                  onClick={() => setActiveNode("risk")}
                  className={`p-4 rounded-xl text-left border transition-all duration-200 ${
                    activeNode === "risk"
                      ? "bg-[#F5F5F7] border-[#0071E3]/40 shadow-xs"
                      : "bg-white border-black/[0.06] hover:bg-[#FAFAFC]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#1D1D1F]">Risk Scoring</span>
                    <Lock className="w-3.5 h-3.5 text-[#0071E3]" />
                  </div>
                  <p className="text-[11px] text-[#6E6E73] leading-relaxed">
                    0.30 Entropy + 0.25 Policy + 0.20 Breach + 0.15 Privilege + 0.10 Reuse
                  </p>
                </button>

                {/* Node 2: Credential Reuse */}
                <button
                  onClick={() => setActiveNode("reuse")}
                  className={`p-4 rounded-xl text-left border transition-all duration-200 ${
                    activeNode === "reuse"
                      ? "bg-[#F5F5F7] border-[#5856D6]/40 shadow-xs"
                      : "bg-white border-black/[0.06] hover:bg-[#FAFAFC]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#1D1D1F]">Reuse Clusters</span>
                    <Layers className="w-3.5 h-3.5 text-[#5856D6]" />
                  </div>
                  <p className="text-[11px] text-[#6E6E73] leading-relaxed">
                    805 Families across 30,000 accounts with lateral movement blast radius.
                  </p>
                </button>

                {/* Node 3: Breach Matching */}
                <button
                  onClick={() => setActiveNode("breach")}
                  className={`p-4 rounded-xl text-left border transition-all duration-200 ${
                    activeNode === "breach"
                      ? "bg-[#F5F5F7] border-[#FF3B30]/40 shadow-xs"
                      : "bg-white border-black/[0.06] hover:bg-[#FAFAFC]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#1D1D1F]">Breach Lookup</span>
                    <Database className="w-3.5 h-3.5 text-[#FF3B30]" />
                  </div>
                  <p className="text-[11px] text-[#6E6E73] leading-relaxed">
                    O(1) in-memory synthetic dictionary corpus matching 26,889 compromised accounts.
                  </p>
                </button>
              </div>

              {/* Bottom Surface Flow */}
              <div className="pt-4 border-t border-black/[0.06] w-full flex items-center justify-between text-xs text-[#6E6E73]">
                <span>Enterprise Attack Surface</span>
                <span className="font-semibold text-[#1D1D1F]">Active Directory 50,000 Identities</span>
                <span>Controlled Remediation</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
