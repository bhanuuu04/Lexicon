"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowRight, ShieldCheck, Layers, Lock, CheckCircle2, Compass, UserCheck } from "lucide-react";

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
    <section className="relative pt-12 pb-24 md:pt-16 md:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Headline & Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center max-w-4xl mx-auto space-y-6"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.12] font-sans">
            Safeguard your organization <br className="hidden sm:block" />
            <span className="text-gray-500 font-semibold">against identity-driven attacks.</span>
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto font-normal leading-relaxed">
            Protect your workforce, contain lateral ransomware blast radius, and enforce Zero-Trust credential compliance across every corporate identity before adversaries strike.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
        >
          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#0071E3] hover:bg-[#0062C4] text-white font-semibold text-sm flex items-center justify-center space-x-2.5 shadow-sm transition active:scale-[0.98] cursor-pointer"
          >
            <span>Launch SOC Operations</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onSecurityModelClick}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200/80 text-gray-700 font-medium text-sm border border-gray-200/60 transition active:scale-[0.98] cursor-pointer"
          >
            Explore Defense Model
          </button>
        </motion.div>

        {/* HERO VISUAL: Enterprise Protection Shield & Matrix */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 max-w-5xl mx-auto"
        >
          <div className="p-8 sm:p-12 border border-gray-200 bg-white rounded-2xl shadow-sm">
            <div className="flex flex-col items-center text-center space-y-8">
              {/* Central Shield Hub */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center space-x-3.5 px-6 shadow-2xs">
                <div className="w-10 h-10 rounded-xl p-1 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src="/lexicon-logo.png"
                    alt="LEXICON"
                    className="w-full h-full object-contain"
                    style={{ mixBlendMode: "multiply" }}
                  />
                </div>
                <div className="text-left">
                  <span className="text-[10px] uppercase font-semibold text-gray-500 block tracking-wider font-mono">
                    Enterprise Protection Shield
                  </span>
                  <span className="text-sm font-bold text-gray-900 tracking-tight">
                    ORGANIZATIONAL IDENTITY SAFEGUARD
                  </span>
                </div>
              </div>

              {/* Connecting Horizontal Line with Central Node */}
              <div className="w-full max-w-md h-6 flex items-center justify-center relative">
                <div className="w-full h-[1px] bg-gray-200"></div>
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#0071E3] ring-4 ring-white shadow-2xs"></div>
              </div>

              {/* 3 Protection Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
                {/* Pillar 1: Identity Threat Detection */}
                <button
                  onClick={() => setActiveNode("shield")}
                  className={`p-5 rounded-xl text-left border transition-all cursor-pointer ${
                    activeNode === "shield"
                      ? "bg-gray-50/90 border-[#0071E3] shadow-2xs ring-1 ring-[#0071E3]/20"
                      : "bg-white border-gray-200 hover:bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-gray-900">Identity Threat Detection</span>
                    <ShieldCheck className="w-4 h-4 text-[#0071E3]" />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Continuously scans corporate Active Directory to identify weak, breached, and predictable credentials.
                  </p>
                </button>

                {/* Pillar 2: Blast Radius Containment */}
                <button
                  onClick={() => setActiveNode("containment")}
                  className={`p-5 rounded-xl text-left border transition-all cursor-pointer ${
                    activeNode === "containment"
                      ? "bg-gray-50/90 border-[#0071E3] shadow-2xs ring-1 ring-[#0071E3]/20"
                      : "bg-white border-gray-200 hover:bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-gray-900">Blast Radius Defense</span>
                    <Layers className="w-4 h-4 text-gray-700" />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Maps cross-account password reuse families to block lateral privilege escalation into Domain Admins.
                  </p>
                </button>

                {/* Pillar 3: Automated Governance & Remediation */}
                <button
                  onClick={() => setActiveNode("governance")}
                  className={`p-5 rounded-xl text-left border transition-all cursor-pointer ${
                    activeNode === "governance"
                      ? "bg-gray-50/90 border-[#0071E3] shadow-2xs ring-1 ring-[#0071E3]/20"
                      : "bg-white border-gray-200 hover:bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-gray-900">Automated Remediation</span>
                    <Lock className="w-4 h-4 text-gray-700" />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Generates executive risk posture reports, automated Active Directory GPO scripts, and targeted guidance.
                  </p>
                </button>
              </div>

              {/* Bottom Surface Flow */}
              <div className="pt-5 border-t border-gray-100 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-500">
                <span className="flex items-center space-x-1.5 self-center sm:self-auto">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Continuous 24/7 Identity Protection</span>
                </span>
                <span className="font-semibold text-gray-900 self-center sm:self-auto">
                  50,000 Monitored Enterprise Identities
                </span>
                <span className="self-center sm:self-auto">Active Zero-Trust Guard</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
