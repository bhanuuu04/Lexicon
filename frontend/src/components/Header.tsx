"use client";

import React from "react";
import {
  Shield,
  ShieldAlert,
  UserCheck,
  Compass,
  Layers,
} from "lucide-react";

export type ExperienceMode = "landing" | "user" | "admin";

interface HeaderProps {
  experienceMode: ExperienceMode;
  setExperienceMode: (mode: ExperienceMode) => void;
  onHeroClick: () => void;
  totalAccounts?: number;
}

export const Header: React.FC<HeaderProps> = ({
  experienceMode,
  setExperienceMode,
  onHeroClick,
  totalAccounts = 50000,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-[#F5F5F7]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#F5F5F7]/75 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* ZONE 1: BRAND */}
          <div
            className="flex items-center space-x-3 cursor-pointer shrink-0 group"
            onClick={() => setExperienceMode("landing")}
          >
            <div className="w-8 h-8 rounded-xl bg-[#0071E3] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-base tracking-tight text-[#1D1D1F] font-sans">
                  Lexicon
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/[0.05] text-[#6E6E73] border border-black/[0.06]">
                  Enterprise
                </span>
              </div>
              <span className="text-[11px] text-[#86868B] font-normal hidden sm:block leading-tight">
                Password Risk Intelligence
              </span>
            </div>
          </div>

          {/* ZONE 2: HERO SHORTCUT & TELEMETRY BADGE */}
          <div className="hidden lg:flex items-center space-x-2.5 shrink-0">
            <button
              onClick={() => {
                setExperienceMode("admin");
                onHeroClick();
              }}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#FF3B30]/[0.08] border border-[#FF3B30]/20 text-[#FF3B30] hover:bg-[#FF3B30]/[0.12] hover:border-[#FF3B30]/30 transition-all text-xs font-medium group active:scale-[0.98]"
              title="Jump directly to Attack Lab with Hero Target (alex.morgan - Cluster #42)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF3B30] group-hover:scale-110 transition-transform" />
              <span>Target Hero (alex.morgan)</span>
            </button>
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white border border-black/[0.06] text-xs font-medium text-[#6E6E73] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#34C759]"></span>
              <span>{totalAccounts.toLocaleString()} AD Identities</span>
            </div>
          </div>

          {/* ZONE 3: 3-EXPERIENCE SEGMENTED SELECTOR */}
          <nav className="flex items-center p-1 rounded-xl bg-[#E5E5EA]/80 border border-black/[0.04] shrink-0">
            <button
              onClick={() => setExperienceMode("landing")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                experienceMode === "landing"
                  ? "bg-white text-[#1D1D1F] shadow-xs font-semibold"
                  : "text-[#6E6E73] hover:text-[#1D1D1F]"
              }`}
            >
              <Compass className={`w-3.5 h-3.5 ${experienceMode === "landing" ? "text-[#0071E3]" : "text-[#86868B]"}`} />
              <span className="hidden sm:inline">Public Site</span>
              <span className="sm:hidden">Site</span>
            </button>

            <button
              onClick={() => setExperienceMode("user")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                experienceMode === "user"
                  ? "bg-white text-[#1D1D1F] shadow-xs font-semibold"
                  : "text-[#6E6E73] hover:text-[#1D1D1F]"
              }`}
            >
              <UserCheck className={`w-3.5 h-3.5 ${experienceMode === "user" ? "text-[#0071E3]" : "text-[#86868B]"}`} />
              <span className="hidden sm:inline">Employee View (Alex)</span>
              <span className="sm:hidden">Employee</span>
            </button>

            <button
              onClick={() => setExperienceMode("admin")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                experienceMode === "admin"
                  ? "bg-white text-[#1D1D1F] shadow-xs font-semibold"
                  : "text-[#6E6E73] hover:text-[#1D1D1F]"
              }`}
            >
              <Layers className={`w-3.5 h-3.5 ${experienceMode === "admin" ? "text-[#0071E3]" : "text-[#86868B]"}`} />
              <span className="hidden sm:inline">SOC Operations</span>
              <span className="sm:hidden">SOC</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
