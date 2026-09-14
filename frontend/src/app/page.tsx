"use client";

import React, { useState, useEffect } from "react";
import { Header, ExperienceMode } from "../components/Header";
import { LandingPage } from "../components/Landing/LandingPage";
import { UserPanel } from "../components/UserPanel/UserPanel";
import { AdminPanel } from "../components/AdminPanel/AdminPanel";
import { AccountDetailDrawer } from "../components/Dashboard/AccountDetailDrawer";
import { fetchAuditSummary, fetchHeroAccount, subscribeToRealtimeEvents } from "../lib/api";
import { AuditSummary, Account, RealtimeEvent } from "../types";
import { Shield, AlertCircle, Zap, Bell } from "lucide-react";

export default function HomePage() {
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>("landing");
  const [activeAdminTab, setActiveAdminTab] = useState<string>("overview");

  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [attackTargetAccount, setAttackTargetAccount] = useState<Account | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Live Real-Time Toast
  const [realtimeNotice, setRealtimeNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const sum = await fetchAuditSummary();
        setSummary(sum);
        const hero = await fetchHeroAccount();
        setAttackTargetAccount(hero);
      } catch (err: any) {
        console.error("Failed to load initial audit data:", err);
        setError(
          "Unable to connect to Lexicon API backend. Ensure FastAPI server is running on http://127.0.0.1:8000."
        );
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();

    // Subscribe to backend Realtime SSE stream
    const unsubscribe = subscribeToRealtimeEvents((event: RealtimeEvent) => {
      if (event.type === "PASSWORD_REMEDIATED") {
        setRealtimeNotice(`⚡ Real-Time Remediation: Account ${event.data?.username || "Employee"} hardened and unblocked!`);
        if (event.data?.summary) {
          setSummary(event.data.summary);
        } else {
          refreshSummary();
        }
        setTimeout(() => setRealtimeNotice(null), 5000);
      } else if (event.type === "ACCOUNT_BLOCKED") {
        const statusText = event.data?.is_blocked ? "blocked / access suspended" : "unblocked";
        setRealtimeNotice(`🔒 Real-Time Security Action: Account ${event.data?.username} ${statusText}.`);
        if (event.data?.summary) {
          setSummary(event.data.summary);
        } else {
          refreshSummary();
        }
        setTimeout(() => setRealtimeNotice(null), 5000);
      } else if (event.type === "BULK_SENSITIVE_BLOCKED") {
        setRealtimeNotice(`🚨 Real-Time SOC Event: Locked down ${event.data?.blocked_count} sensitive accounts in Supabase DB.`);
        if (event.data?.summary) {
          setSummary(event.data.summary);
        } else {
          refreshSummary();
        }
        setTimeout(() => setRealtimeNotice(null), 6000);
      } else if (event.type === "AUDIT_COMPLETED") {
        setRealtimeNotice("⚡ Real-Time Security Intelligence Audit Completed!");
        if (event.data?.summary) {
          setSummary(event.data.summary);
        } else {
          refreshSummary();
        }
        setTimeout(() => setRealtimeNotice(null), 5000);
      } else if (event.type === "DATASET_GENERATED") {
        setRealtimeNotice("✨ Real-Time: Enterprise Active Directory dataset regenerated and synchronized!");
        if (event.data?.summary) {
          setSummary(event.data.summary);
        } else {
          refreshSummary();
        }
        setTimeout(() => setRealtimeNotice(null), 5000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [experienceMode]);

  const handleHeroClick = async () => {
    try {
      const hero = await fetchHeroAccount();
      setAttackTargetAccount(hero);
      setSelectedAccount(hero);
      setExperienceMode("admin");
      setActiveAdminTab("attack-lab");
    } catch (e) {
      console.error("Failed to load hero account:", e);
    }
  };

  const handleSelectAccount = (account: Account) => {
    setSelectedAccount(account);
    setIsDrawerOpen(true);
  };

  const handleLaunchAttack = (account: Account) => {
    setAttackTargetAccount(account);
    setExperienceMode("admin");
    setActiveAdminTab("attack-lab");
    setIsDrawerOpen(false);
  };

  const refreshSummary = async () => {
    try {
      const sum = await fetchAuditSummary();
      setSummary(sum);
    } catch (e) {
      console.error("Failed to refresh audit summary:", e);
    }
  };

  const handleAccountUpdated = (updatedAccount: Account) => {
    setSelectedAccount(updatedAccount);
    setAttackTargetAccount(updatedAccount);
    refreshSummary();
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 min-w-[64px] max-w-[64px] min-h-[64px] max-h-[64px] rounded-2xl bg-white border border-black/[0.08] flex items-center justify-center shadow-md p-2 animate-pulse overflow-hidden shrink-0">
          <img
            src="/lexicon-logo.png"
            alt="Lexicon"
            className="w-full h-full object-contain block"
            style={{ width: "48px", height: "48px", maxWidth: "48px", maxHeight: "48px" }}
          />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold text-[#1D1D1F] tracking-tight font-sans">
            LEXICON
          </h2>
          <p className="text-xs text-[#6E6E73] font-normal">
            Enterprise Password Risk Intelligence • Active Directory Scope
          </p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-6 rounded-2xl border border-black/[0.08] bg-white shadow-card space-y-4">
          <AlertCircle className="w-10 h-10 text-[#FF3B30] mx-auto" />
          <h3 className="text-base font-semibold text-[#1D1D1F] font-sans">
            Backend Connection Required
          </h3>
          <p className="text-xs text-[#6E6E73] font-normal">{error}</p>
          <div className="pt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium shadow-sm transition active:scale-[0.98]"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col selection:bg-[#0071E3]/20 selection:text-[#0071E3]">
      {/* Universal Apple Header */}
      <Header
        experienceMode={experienceMode}
        setExperienceMode={setExperienceMode}
        onHeroClick={handleHeroClick}
        totalAccounts={summary.total_accounts}
      />

      {/* Experience 1: Public Landing Page */}
      {experienceMode === "landing" && (
        <LandingPage
          onExploreAdmin={() => {
            setExperienceMode("admin");
            setActiveAdminTab("overview");
          }}
          onExploreUser={() => {
            setExperienceMode("user");
          }}
        />
      )}

      {/* Experience 2: User Security Panel */}
      {experienceMode === "user" && (
        <UserPanel
          onSwitchToAdmin={() => {
            setExperienceMode("admin");
            setActiveAdminTab("overview");
          }}
          onAccountRemediated={handleAccountUpdated}
          onSummaryUpdated={refreshSummary}
        />
      )}

      {/* Experience 3: Admin / SOC Operations Panel */}
      {experienceMode === "admin" && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <AdminPanel
            summary={summary}
            activeAdminTab={activeAdminTab}
            setActiveAdminTab={setActiveAdminTab}
            selectedAccount={selectedAccount}
            attackTargetAccount={attackTargetAccount}
            onSelectAccount={handleSelectAccount}
            onLaunchAttack={handleLaunchAttack}
            onHeroClick={handleHeroClick}
            onAccountUpdated={handleAccountUpdated}
          />
        </main>
      )}

      {/* Account Detail Drawer Modal */}
      {isDrawerOpen && selectedAccount && (
        <AccountDetailDrawer
          account={selectedAccount}
          onClose={() => setIsDrawerOpen(false)}
          onLaunchAttack={handleLaunchAttack}
        />
      )}

      {/* Global Real-Time Event Notification Toast */}
      {realtimeNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl bg-white border border-[#0071E3]/30 shadow-2xl flex items-center space-x-3.5 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-9 h-9 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center font-bold text-base shrink-0">
            ⚡
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0071E3] block">
              Lexicon Real-Time Engine
            </span>
            <p className="text-xs font-semibold text-[#1D1D1F] mt-0.5">
              {realtimeNotice}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

