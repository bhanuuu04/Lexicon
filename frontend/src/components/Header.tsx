"use client";

import React from "react";
import { Shield, ShieldAlert, Cpu, Network, Zap, FileText, Activity, Globe } from "lucide-react";

interface HeaderProps {
  activeTab: "dashboard" | "blast-radius" | "attack-lab" | "hash-race" | "remediation" | "hibp";
  setActiveTab: (tab: "dashboard" | "blast-radius" | "attack-lab" | "hash-race" | "remediation" | "hibp") => void;
  onHeroClick: () => void;
  totalAccounts?: number;
  criticalCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onHeroClick,
  totalAccounts = 50000,
  criticalCount = 3018,
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "blast-radius", label: "Blast Radius", icon: Network },
    { id: "attack-lab", label: "Attack Lab", icon: Zap },
    { id: "hash-race", label: "Hash Race", icon: Cpu },
    { id: "remediation", label: "AI Advisory", icon: FileText },
    { id: "hibp", label: "Live HIBP", icon: Globe },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0f172a]/85 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0f172a]/75 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* ZONE 1: BRAND */}
          <div
            className="flex items-center space-x-3 cursor-pointer shrink-0 group"
            onClick={() => setActiveTab("dashboard")}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-[0_2px_12px_rgba(16,185,129,0.35)] group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white font-sans">
                  LEXICON
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Enterprise SOC
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal hidden sm:block leading-tight">
                Password Risk Intelligence
              </span>
            </div>
          </div>

          {/* ZONE 2: CONTEXT & QUICK TARGET */}
          <div className="hidden lg:flex items-center space-x-2.5 shrink-0">
            <button
              onClick={onHeroClick}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/40 transition-all text-xs font-medium shadow-[0_2px_10px_rgba(244,63,94,0.15)] group"
              title="Jump directly to Attack Lab with Hero Target (alex.morgan - Cluster #42)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
              <span>Target Hero Account (alex.morgan)</span>
            </button>
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-white/[0.08] text-xs font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]"></span>
              <span>{totalAccounts.toLocaleString()} AD Accounts</span>
            </div>
          </div>

          {/* ZONE 3: NAVIGATION TABS */}
          <nav className="flex items-center p-1 rounded-xl bg-slate-800/40 border border-white/[0.06] overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 shrink-0 ${
                    isActive
                      ? "bg-emerald-500 text-white shadow-[0_2px_10px_rgba(16,185,129,0.35)]"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

