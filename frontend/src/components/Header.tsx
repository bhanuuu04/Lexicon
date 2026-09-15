"use client";

import React from "react";
import { Shield, ShieldCheck, LogOut, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Account } from "../types";

export type ExperienceMode = "landing" | "user" | "admin";

interface HeaderProps {
  experienceMode?: ExperienceMode;
  setExperienceMode?: (mode: ExperienceMode) => void;
  onHeroClick?: () => void;
  totalAccounts?: number;
  currentUser?: Account | null;
  onRequestLogin?: (targetMode?: ExperienceMode) => void;
  onSignOut?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  experienceMode,
  setExperienceMode,
  onHeroClick,
  totalAccounts = 50000,
  currentUser,
  onRequestLogin,
  onSignOut,
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* ZONE 1: BRAND + BACK/FORWARD CONTROLS */}
          <div className="flex items-center space-x-3 shrink-0">
            <div
              className="flex items-center space-x-3 cursor-pointer group select-none"
              onClick={() => setExperienceMode && setExperienceMode("landing")}
              title="Return to Lexicon Platform"
            >
              <div className="w-11 h-11 rounded-xl p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src="/lexicon-logo.png"
                  alt="LEXICON"
                  className="w-full h-full object-contain"
                  style={{ mixBlendMode: "multiply" }}
                />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="font-bold text-sm tracking-tight text-gray-900 font-sans">
                  LEXICON
                </span>
                <span className="text-[11px] text-gray-500 font-normal hidden sm:inline">
                  Enterprise Password Security
                </span>
              </div>
            </div>

            {/* Back & Forward Navigation Controls */}
            {(onGoBack || onGoForward) && (
              <div className="flex items-center space-x-1 pl-2.5 ml-1 border-l border-gray-200">
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
          </div>

          {/* ZONE 2: TOP RIGHT USER / LOGIN BUTTON */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-xl bg-gray-50 border border-gray-200/80 text-xs text-gray-800">
                  <div className="w-5 h-5 rounded-md bg-[#0F172A] text-white flex items-center justify-center text-[10px] font-bold">
                    {currentUser.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold text-gray-900">{currentUser.username}</span>
                  <span className="text-[10px] text-gray-400">({currentUser.role || "User"})</span>
                </div>
                <button
                  onClick={onSignOut}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200/80 text-gray-700 text-xs font-medium border border-gray-200/60 transition cursor-pointer"
                  title="Sign out of enterprise account"
                >
                  <LogOut className="w-3.5 h-3.5 text-gray-500" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onRequestLogin?.("admin")}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold shadow-2xs transition active:scale-[0.98] cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-white" />
                <span>Enterprise Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

