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
      subtitle: "Enterprise AD scope",
      icon: Users,
      valueColor: "text-gray-900",
      filter: "ALL",
    },
    {
      id: "critical",
      title: "Critical Risk",
      value: summary.critical_count.toLocaleString(),
      subtitle: `${((summary.critical_count / summary.total_accounts) * 100).toFixed(1)}% immediate action`,
      icon: ShieldAlert,
      valueColor: "text-red-600",
      filter: "Critical",
    },
    {
      id: "high",
      title: "High Risk",
      value: summary.high_risk_count.toLocaleString(),
      subtitle: `${((summary.high_risk_count / summary.total_accounts) * 100).toFixed(1)}% elevated priority`,
      icon: AlertTriangle,
      valueColor: "text-amber-600",
      filter: "High",
    },
    {
      id: "breach",
      title: "Breach Matches",
      value: summary.breached_count.toLocaleString(),
      subtitle: "Known leak matches",
      icon: Database,
      valueColor: "text-gray-900",
      filter: "BREACHED",
    },
    {
      id: "reuse",
      title: "Reuse Clusters",
      value: summary.reuse_cluster_count.toLocaleString(),
      subtitle: `${summary.total_reused_accounts.toLocaleString()} shared credentials`,
      icon: Layers,
      valueColor: "text-gray-900",
      filter: "REUSED",
    },
    {
      id: "privileged",
      title: "Admins at Risk",
      value: summary.privileged_at_risk_count.toLocaleString(),
      subtitle: `of ${summary.privileged_count.toLocaleString()} Domain Admins`,
      icon: ShieldCheck,
      valueColor: summary.privileged_at_risk_count > 0 ? "text-red-600" : "text-gray-900",
      filter: "PRIVILEGED",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => onCardClick && onCardClick(card.filter)}
            className="p-3.5 cursor-pointer flex flex-col justify-between min-h-[110px] rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors shadow-2xs group"
          >
            {/* Header: Title + Icon Badge */}
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] font-medium text-gray-500 font-sans tracking-tight truncate">
                {card.title}
              </span>
              <div className="p-1 rounded-md bg-gray-50 border border-gray-200/60 text-gray-400 group-hover:text-gray-600 shrink-0 transition-colors">
                <IconComponent className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Value & Subtitle */}
            <div className="mt-2">
              <div className={`text-xl font-bold tracking-tight font-sans ${card.valueColor}`}>
                {card.value}
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5 font-normal tracking-tight truncate">
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
