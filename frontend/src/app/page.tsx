"use client";

import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { RiskOverviewCards } from "../components/RiskCards/RiskOverviewCards";
import { RiskDistributionChart } from "../components/Dashboard/RiskDistributionChart";
import { AccountDirectory } from "../components/Dashboard/AccountDirectory";
import { AccountDetailDrawer } from "../components/Dashboard/AccountDetailDrawer";
import { BlastRadiusViewer } from "../components/ReuseCluster/BlastRadiusViewer";
import { AttackLabArena } from "../components/AttackLab/AttackLabArena";
import { HashRaceArena } from "../components/HashRace/HashRaceArena";
import { AIAdvisoryStudio } from "../components/Remediation/AIAdvisoryStudio";
import { HIBPLiveModal } from "../components/HIBPCheck/HIBPLiveModal";
import { fetchAuditSummary, fetchHeroAccount, fetchAccountDetail } from "../lib/api";
import { AuditSummary, Account } from "../types";
import { Shield, AlertCircle } from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "blast-radius" | "attack-lab" | "hash-race" | "remediation" | "hibp"
  >("dashboard");

  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [attackTargetAccount, setAttackTargetAccount] = useState<Account | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTierFilter, setActiveTierFilter] = useState<string>("ALL");

  useEffect(() => {
    async function loadInitialData() {
      try {
        const sum = await fetchAuditSummary();
        setSummary(sum);
        const hero = await fetchHeroAccount();
        setAttackTargetAccount(hero);
      } catch (err: any) {
        console.error("Failed to load initial audit data:", err);
        setError("Unable to connect to Lexicon API backend. Ensure FastAPI server is running on http://127.0.0.1:8000.");
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const handleHeroClick = async () => {
    try {
      const hero = await fetchHeroAccount();
      setAttackTargetAccount(hero);
      setSelectedAccount(hero);
      setActiveTab("attack-lab");
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
    setActiveTab("attack-lab");
    setIsDrawerOpen(false);
  };

  const handleCardFilterClick = (filterType: string) => {
    setActiveTierFilter(filterType);
    setActiveTab("dashboard");
  };

  const handleAccountUpdated = (updatedAccount: Account) => {
    setSelectedAccount(updatedAccount);
    setAttackTargetAccount(updatedAccount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#0071E3] flex items-center justify-center shadow-md animate-pulse">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-semibold text-[#1D1D1F] tracking-tight font-sans">Lexicon Enterprise</h2>
          <p className="text-xs text-[#6E6E73] font-normal">Analyzing 50,000-Account Active Directory Telemetry...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-6 rounded-2xl border border-black/[0.08] bg-white shadow-card space-y-4">
          <AlertCircle className="w-10 h-10 text-[#FF3B30] mx-auto" />
          <h3 className="text-base font-semibold text-[#1D1D1F] font-sans">Backend Connection Required</h3>
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
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onHeroClick={handleHeroClick}
        totalAccounts={summary.total_accounts}
        criticalCount={summary.critical_count}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Tab 1: Dashboard View */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <RiskOverviewCards summary={summary} onCardClick={handleCardFilterClick} />
            <RiskDistributionChart summary={summary} />
            <AccountDirectory
              onSelectAccount={handleSelectAccount}
              onLaunchAttack={handleLaunchAttack}
              initialTierFilter={activeTierFilter}
            />
          </div>
        )}

        {/* Tab 2: Blast Radius & Reuse Clusters */}
        {activeTab === "blast-radius" && (
          <BlastRadiusViewer
            topClusters={summary.top_reuse_clusters}
            onSelectClusterAccount={async (id) => {
              const acc = await fetchAccountDetail(id);
              handleSelectAccount(acc);
            }}
            onLaunchAttackWithAccount={handleLaunchAttack}
          />
        )}

        {/* Tab 3: Attack Lab */}
        {activeTab === "attack-lab" && (
          <AttackLabArena
            targetAccount={attackTargetAccount}
            onAccountUpdated={handleAccountUpdated}
            onSelectHeroAccount={handleHeroClick}
          />
        )}

        {/* Tab 4: Hash Race */}
        {activeTab === "hash-race" && <HashRaceArena />}

        {/* Tab 5: AI Advisory & Remediation */}
        {activeTab === "remediation" && <AIAdvisoryStudio summary={summary} />}

        {/* Tab 6: Live HIBP k-Anonymity Check */}
        {activeTab === "hibp" && <HIBPLiveModal />}
      </main>

      {/* Account Detail Drawer Modal */}
      {isDrawerOpen && selectedAccount && (
        <AccountDetailDrawer
          account={selectedAccount}
          onClose={() => setIsDrawerOpen(false)}
          onLaunchAttack={handleLaunchAttack}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-black/[0.06] bg-white/75 backdrop-blur-md py-6 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#6E6E73] gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#1D1D1F]">Lexicon</span>
            <span>•</span>
            <span>Enterprise Password Risk Intelligence</span>
            <span>•</span>
            <span className="text-[#34C759] font-medium">100% Synthetic Dataset</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Deterministic Risk Engine</span>
            <span>•</span>
            <span>Client-Side WASM Web Workers</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


