"use client";

import React from "react";
import { Users, AlertTriangle, ShieldAlert, Database, Layers, ShieldCheck } from "lucide-react";
import { AuditSummary } from "../../types";

interface RiskOverviewCardsProps {
  summary: AuditSummary;
  onCardClick?: (filterType: string) => void;
}

export const RiskOverviewCards: React.FC<RiskOverviewCardsProps> = ({ summary, onCardClick }) => {
  const cards = [
    {
      id: "total",
      title: "Total Accounts",
      value: summary.total_accounts.toLocaleString(),
      subtitle: "Active Directory Corpus",
      icon: Users,
      valueColor: "text-[#1D1D1F]",
      badgeColor: "bg-[#F5F5F7] text-[#6E6E73] border-black/[0.06]",
      iconColor: "text-[#6E6E73]",
      filter: "ALL",
    },
    {
      id: "critical",
      title: "Critical Tier",
      value: summary.critical_count.toLocaleString(),
      subtitle: `${((summary.critical_count / summary.total_accounts) * 100).toFixed(1)}% of total scope`,
      icon: ShieldAlert,
      valueColor: "text-[#FF3B30]",
      badgeColor: "bg-[#FF3B30]/[0.08] text-[#FF3B30] border-[#FF3B30]/20",
      iconColor: "text-[#FF3B30]",
      filter: "Critical",
    },
    {
      id: "high",
      title: "High Risk Tier",
      value: summary.high_risk_count.toLocaleString(),
      subtitle: `${((summary.high_risk_count / summary.total_accounts) * 100).toFixed(1)}% elevated tier`,
      icon: AlertTriangle,
      valueColor: "text-[#FF9500]",
      badgeColor: "bg-[#FF9500]/[0.08] text-[#FF9500] border-[#FF9500]/20",
      iconColor: "text-[#FF9500]",
      filter: "High",
    },
    {
      id: "breach",
      title: "Breach Matches",
      value: summary.breached_count.toLocaleString(),
      subtitle: "Compromised credential corpus",
      icon: Database,
      valueColor: "text-[#FF2D55]",
      badgeColor: "bg-[#FF2D55]/[0.08] text-[#FF2D55] border-[#FF2D55]/20",
      iconColor: "text-[#FF2D55]",
      filter: "BREACHED",
    },
    {
      id: "reuse",
      title: "Reuse Clusters",
      value: summary.reuse_cluster_count.toLocaleString(),
      subtitle: `${summary.total_reused_accounts.toLocaleString()} shared accounts`,
      icon: Layers,
      valueColor: "text-[#5856D6]",
      badgeColor: "bg-[#5856D6]/[0.08] text-[#5856D6] border-[#5856D6]/20",
      iconColor: "text-[#5856D6]",
      filter: "REUSED",
    },
    {
      id: "privileged",
      title: "Admins At Risk",
      value: summary.privileged_at_risk_count.toLocaleString(),
      subtitle: `Out of ${summary.privileged_count.toLocaleString()} total admins`,
      icon: ShieldCheck,
      valueColor: "text-[#34C759]",
      badgeColor: "bg-[#34C759]/[0.08] text-[#34C759] border-[#34C759]/20",
      iconColor: "text-[#34C759]",
      filter: "PRIVILEGED",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => onCardClick && onCardClick(card.filter)}
            className="apple-card p-4 cursor-pointer flex flex-col justify-between min-h-[128px] group active:scale-[0.99]"
          >
            {/* Header: Title + Icon Badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#6E6E73] font-sans tracking-tight">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg border ${card.badgeColor} shrink-0 group-hover:scale-105 transition-transform duration-200`}>
                <IconComponent className={`w-3.5 h-3.5 ${card.iconColor}`} />
              </div>
            </div>

            {/* Value & Subtitle */}
            <div className="mt-3">
              <div className={`text-2xl sm:text-3xl font-semibold tracking-tight font-sans ${card.valueColor}`}>
                {card.value}
              </div>
              <p className="text-[11px] text-[#86868B] mt-1 font-normal tracking-tight truncate">
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};


