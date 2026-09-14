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
      valueColor: "text-white",
      badgeColor: "bg-slate-800 text-slate-300 border-white/[0.08]",
      filter: "ALL",
    },
    {
      id: "critical",
      title: "Critical Tier",
      value: summary.critical_count.toLocaleString(),
      subtitle: `${((summary.critical_count / summary.total_accounts) * 100).toFixed(1)}% of total scope`,
      icon: ShieldAlert,
      valueColor: "text-rose-400",
      badgeColor: "bg-rose-500/10 text-rose-300 border-rose-500/20",
      filter: "Critical",
    },
    {
      id: "high",
      title: "High Risk Tier",
      value: summary.high_risk_count.toLocaleString(),
      subtitle: `${((summary.high_risk_count / summary.total_accounts) * 100).toFixed(1)}% elevated tier`,
      icon: AlertTriangle,
      valueColor: "text-amber-400",
      badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/20",
      filter: "High",
    },
    {
      id: "breach",
      title: "Breach Matches",
      value: summary.breached_count.toLocaleString(),
      subtitle: "Compromised credential corpus",
      icon: Database,
      valueColor: "text-rose-300",
      badgeColor: "bg-rose-500/10 text-rose-300 border-rose-500/20",
      filter: "BREACHED",
    },
    {
      id: "reuse",
      title: "Reuse Clusters",
      value: summary.reuse_cluster_count.toLocaleString(),
      subtitle: `${summary.total_reused_accounts.toLocaleString()} shared accounts`,
      icon: Layers,
      valueColor: "text-indigo-300",
      badgeColor: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
      filter: "REUSED",
    },
    {
      id: "privileged",
      title: "Admins At Risk",
      value: summary.privileged_at_risk_count.toLocaleString(),
      subtitle: `Out of ${summary.privileged_count.toLocaleString()} total admins`,
      icon: ShieldCheck,
      valueColor: "text-emerald-400",
      badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
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
            className="apple-card p-4 cursor-pointer flex flex-col justify-between min-h-[128px] group"
          >
            {/* Header: Title + Icon Badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-400 font-sans tracking-tight">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg border ${card.badgeColor} shrink-0 group-hover:scale-105 transition-transform`}>
                <IconComponent className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Value & Subtitle */}
            <div className="mt-3">
              <div className={`text-2xl sm:text-3xl font-bold tracking-tight font-sans ${card.valueColor}`}>
                {card.value}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-normal tracking-tight truncate">
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

