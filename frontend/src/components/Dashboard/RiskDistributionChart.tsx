"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { AuditSummary } from "../../types";

interface RiskDistributionChartProps {
  summary: AuditSummary;
}

const TIER_COLORS: Record<string, string> = {
  Critical: "#FF3B30",
  High: "#FF9500",
  Medium: "#E5A000",
  Low: "#34C759",
};

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({ summary }) => {
  const chartData = [
    { name: "Critical (≥0.75)", count: summary.critical_count, tier: "Critical" },
    { name: "High (0.50-0.74)", count: summary.high_risk_count, tier: "High" },
    { name: "Medium (0.25-0.49)", count: summary.medium_risk_count, tier: "Medium" },
    { name: "Low (<0.25)", count: summary.low_risk_count, tier: "Low" },
  ];

  const deptList = Object.entries(summary.department_risk_summary || {})
    .map(([name, stat]) => ({
      name,
      ...stat,
    }))
    .sort((a, b) => b.critical - a.critical);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. LEFT PANEL: Enterprise Risk Distribution (67% width) */}
      <div className="lg:col-span-8 apple-card p-6 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-[#1D1D1F] tracking-tight font-sans">
                Enterprise Risk Distribution
              </h3>
              <p className="text-xs text-[#6E6E73] font-normal mt-0.5">
                Evaluated across all 50,000 synthetic Active Directory accounts
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs shrink-0">
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#FF3B30]/[0.08] border border-[#FF3B30]/20 text-[#FF3B30] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#FF3B30]"></span>
                <span>Critical: {summary.critical_count.toLocaleString()}</span>
              </span>
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#FF9500]/[0.08] border border-[#FF9500]/20 text-[#FF9500] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#FF9500]"></span>
                <span>High: {summary.high_risk_count.toLocaleString()}</span>
              </span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  stroke="#86868B"
                  tick={{ fontSize: 12, fill: "#6E6E73" }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(0, 0, 0, 0.08)" }}
                />
                <YAxis
                  stroke="#86868B"
                  tick={{ fontSize: 12, fill: "#6E6E73" }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(0, 0, 0, 0.08)" }}
                  tickFormatter={(val) => val.toLocaleString()}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0, 0, 0, 0.03)" }}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "rgba(0, 0, 0, 0.08)",
                    borderRadius: "12px",
                    color: "#1D1D1F",
                    fontSize: "12px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
                  }}
                  formatter={(val: number) => [`${val.toLocaleString()} Accounts`, "Count"]}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.tier]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Tier Percentage Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-black/[0.06] text-center">
          <div className="p-3 rounded-xl bg-[#FF3B30]/[0.05] border border-[#FF3B30]/15">
            <span className="text-[#FF3B30] font-semibold text-base block font-sans">
              {((summary.critical_count / 50000) * 100).toFixed(1)}%
            </span>
            <span className="text-[#6E6E73] text-xs block mt-0.5 font-medium">
              Critical ({summary.critical_count.toLocaleString()})
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#FF9500]/[0.05] border border-[#FF9500]/15">
            <span className="text-[#FF9500] font-semibold text-base block font-sans">
              {((summary.high_risk_count / 50000) * 100).toFixed(1)}%
            </span>
            <span className="text-[#6E6E73] text-xs block mt-0.5 font-medium">
              High ({summary.high_risk_count.toLocaleString()})
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#E5A000]/[0.05] border border-[#E5A000]/15">
            <span className="text-[#E5A000] font-semibold text-base block font-sans">
              {((summary.medium_risk_count / 50000) * 100).toFixed(1)}%
            </span>
            <span className="text-[#6E6E73] text-xs block mt-0.5 font-medium">
              Medium ({summary.medium_risk_count.toLocaleString()})
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#34C759]/[0.05] border border-[#34C759]/15">
            <span className="text-[#34C759] font-semibold text-base block font-sans">
              {((summary.low_risk_count / 50000) * 100).toFixed(1)}%
            </span>
            <span className="text-[#6E6E73] text-xs block mt-0.5 font-medium">
              Low ({summary.low_risk_count.toLocaleString()})
            </span>
          </div>
        </div>
      </div>

      {/* 2. RIGHT PANEL: Department Risk Matrix (33% width) */}
      <div className="lg:col-span-4 apple-card p-6 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-[#1D1D1F] tracking-tight font-sans">
              Department Risk Matrix
            </h3>
            <p className="text-xs text-[#6E6E73] font-normal mt-0.5">
              Ranked by Critical accounts & average exposure
            </p>
          </div>

          {/* Department List */}
          <div className="overflow-y-auto max-h-[310px] space-y-2 pr-1.5 custom-scrollbar">
            {deptList.map((d) => (
              <div
                key={d.name}
                className="p-3 rounded-xl bg-[#F5F5F7] border border-black/[0.04] hover:border-black/[0.08] hover:bg-[#EBEBED] transition-all flex items-center justify-between gap-3 text-xs"
              >
                {/* Left: Department & Stats */}
                <div className="min-w-0">
                  <div className="font-semibold text-[#1D1D1F] truncate text-xs sm:text-sm font-sans">
                    {d.name}
                  </div>
                  <div className="text-[11px] text-[#6E6E73] mt-0.5 truncate">
                    {d.total.toLocaleString()} users • {d.privileged} admins • {d.breached} breached
                  </div>
                </div>

                {/* Right: Critical Badge & Average Risk */}
                <div className="text-right shrink-0">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FF3B30]/[0.08] border border-[#FF3B30]/20 text-[#FF3B30] font-semibold text-[11px]">
                    {d.critical} CRIT
                  </span>
                  <div className="text-[11px] text-[#6E6E73] mt-0.5 font-medium">
                    Avg: {(d.avg_risk * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anchored Footer: Total Policy Violations */}
        <div className="pt-4 mt-4 border-t border-black/[0.06] flex items-center justify-between text-xs">
          <span className="text-[#6E6E73] font-medium">Total Policy Violations:</span>
          <span className="text-[#FF9500] font-bold text-sm font-sans">
            {summary.policy_violations_count.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};


