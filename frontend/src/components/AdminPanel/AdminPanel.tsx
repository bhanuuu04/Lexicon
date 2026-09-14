"use client";

import React, { useState } from "react";
import { RiskOverviewCards } from "../RiskCards/RiskOverviewCards";
import { RiskDistributionChart } from "../Dashboard/RiskDistributionChart";
import { AccountDirectory } from "../Dashboard/AccountDirectory";
import { BlastRadiusViewer } from "../ReuseCluster/BlastRadiusViewer";
import { AttackLabArena } from "../AttackLab/AttackLabArena";
import { HashRaceArena } from "../HashRace/HashRaceArena";
import { AIAdvisoryStudio } from "../Remediation/AIAdvisoryStudio";
import { HIBPLiveModal } from "../HIBPCheck/HIBPLiveModal";
import { AuditLogsView } from "./AuditLogsView";
import { AdminSettings } from "./AdminSettings";
import { AuditSummary, Account } from "../../types";
import { fetchAccountDetail } from "../../lib/api";
import {
  Activity,
  Users,
  Network,
  Zap,
  Cpu,
  FileText,
  Globe,
  History,
  Settings,
} from "lucide-react";

interface AdminPanelProps {
  summary: AuditSummary;
  activeAdminTab: string;
  setActiveAdminTab: (tab: string) => void;
  selectedAccount: Account | null;
  attackTargetAccount: Account | null;
  onSelectAccount: (account: Account) => void;
  onLaunchAttack: (account: Account) => void;
  onHeroClick: () => void;
  onAccountUpdated: (updated: Account) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  summary,
  activeAdminTab,
  setActiveAdminTab,
  selectedAccount,
  attackTargetAccount,
  onSelectAccount,
  onLaunchAttack,
  onHeroClick,
  onAccountUpdated,
}) => {
  const [activeTierFilter, setActiveTierFilter] = useState<string>("ALL");
  const [isHIBPOpen, setIsHIBPOpen] = useState(false);

  const handleCardFilterClick = (filterType: string) => {
    setActiveTierFilter(filterType);
    setActiveAdminTab("accounts");
  };

  const adminSubNav = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "accounts", label: "Accounts", icon: Users },
    { id: "blast-radius", label: "Blast Radius", icon: Network },
    { id: "attack-lab", label: "Attack Lab", icon: Zap },
    { id: "hash-race", label: "Hash Race", icon: Cpu },
    { id: "remediation", label: "AI Advisory", icon: FileText },
    { id: "hibp", label: "Live HIBP", icon: Globe },
    { id: "audit-logs", label: "Audit Logs", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Secondary Subnav Bar */}
      <div className="flex items-center justify-between bg-white border border-black/[0.06] p-1.5 rounded-2xl shadow-card overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-1">
          {adminSubNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeAdminTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "hibp") {
                    setIsHIBPOpen(true);
                  } else {
                    setActiveAdminTab(item.id);
                  }
                }}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 shrink-0 ${
                  isActive
                    ? "bg-[#0071E3] text-white shadow-xs font-semibold"
                    : "text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-[#86868B]"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subview Routing */}
      {activeAdminTab === "overview" && (
        <div className="space-y-6">
          <RiskOverviewCards summary={summary} onCardClick={handleCardFilterClick} />
          <RiskDistributionChart summary={summary} />
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-[#1D1D1F]">
                Active Directory Account Directory
              </h3>
              <button
                onClick={() => setActiveAdminTab("accounts")}
                className="text-xs text-[#0071E3] font-medium hover:underline"
              >
                View Full Table →
              </button>
            </div>
            <AccountDirectory
              onSelectAccount={onSelectAccount}
              onLaunchAttack={onLaunchAttack}
              initialTierFilter={activeTierFilter}
            />
          </div>
        </div>
      )}

      {activeAdminTab === "accounts" && (
        <div className="space-y-6">
          <AccountDirectory
            onSelectAccount={onSelectAccount}
            onLaunchAttack={onLaunchAttack}
            initialTierFilter={activeTierFilter}
          />
        </div>
      )}

      {activeAdminTab === "blast-radius" && (
        <div className="space-y-6">
          <BlastRadiusViewer
            topClusters={summary.top_reuse_clusters}
            onSelectClusterAccount={async (id) => {
              const acc = await fetchAccountDetail(id);
              onSelectAccount(acc);
            }}
            onLaunchAttackWithAccount={onLaunchAttack}
          />
        </div>
      )}

      {activeAdminTab === "attack-lab" && (
        <div className="space-y-6">
          <AttackLabArena
            targetAccount={attackTargetAccount}
            onAccountUpdated={onAccountUpdated}
            onSelectHeroAccount={onHeroClick}
          />
        </div>
      )}

      {activeAdminTab === "hash-race" && (
        <div className="space-y-6">
          <HashRaceArena />
        </div>
      )}

      {activeAdminTab === "remediation" && (
        <div className="space-y-6">
          <AIAdvisoryStudio summary={summary} />
        </div>
      )}

      {activeAdminTab === "audit-logs" && (
        <div className="space-y-6">
          <AuditLogsView />
        </div>
      )}

      {activeAdminTab === "settings" && (
        <div className="space-y-6">
          <AdminSettings />
        </div>
      )}

      {/* HIBP Live Modal */}
      <HIBPLiveModal
        isOpen={isHIBPOpen}
        onClose={() => setIsHIBPOpen(false)}
      />
    </div>
  );
};
