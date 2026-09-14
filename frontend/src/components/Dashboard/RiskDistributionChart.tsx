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
  Critical: "#f43f5e",
  High: "#fb923c",
  Medium: "#facc15",
  Low: "#10b981",
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
      <div className="lg:col-span-8 apple-card-static p-6 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight font-sans">
                Deterministic Enterprise Risk Distribution
              </h3>
              <p className="text-xs text-slate-400 font-normal mt-0.5">
                Evaluated across all 50,000 synthetic Active Directory accounts
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs shrink-0">
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Critical: {summary.critical_count.toLocaleString()}</span>
              </span>
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
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
                  stroke="#475569"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
                />
                <YAxis
                  stroke="#475569"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
                  tickFormatter={(val) => val.toLocaleString()}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "rgba(255, 255, 255, 0.12)",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                  }}
                  formatter={(val: number) => [`${val.toLocaleString()} Accounts`, "Count"]}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={64}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.tier]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Tier Percentage Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-white/[0.08] text-center">
          <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/15">
            <span className="text-rose-400 font-bold text-base block font-sans">
              {((summary.critical_count / 50000) * 100).toFixed(1)}%
            </span>
            <span className="text-slate-400 text-xs block mt-0.5 font-medium">
              Critical ({summary.critical_count.toLocaleString()})
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
            <span className="text-amber-400 font-bold text-base block font-sans">
              {((summary.high_risk_count / 50000) * 100).toFixed(1)}%
            </span>
            <span className="text-slate-400 text-xs block mt-0.5 font-medium">
              High ({summary.high_risk_count.toLocaleString()})
            </span>
          </div>
          <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/15">
            <span className="text-yellow-400 font-bold text-base block font-sans">
              {((summary.medium_risk_count / 50000) * 100).toFixed(1)}%
            </span>
            <span className="text-slate-400 text-xs block mt-0.5 font-medium">
              Medium ({summary.medium_risk_count.toLocaleString()})
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
            <span className="text-emerald-400 font-bold text-base block font-sans">
              {((summary.low_risk_count / 50000) * 100).toFixed(1)}%
            </span>
            <span className="text-slate-400 text-xs block mt-0.5 font-medium">
              Low ({summary.low_risk_count.toLocaleString()})
            </span>
          </div>
        </div>
      </div>

      {/* 2. RIGHT PANEL: Department Risk Matrix (33% width) */}
      <div className="lg:col-span-4 apple-card-static p-6 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight font-sans">
              Department Risk Matrix
            </h3>
            <p className="text-xs text-slate-400 font-normal mt-0.5">
              Ranked by Critical accounts & average exposure
            </p>
          </div>

          {/* Department List */}
          <div className="overflow-y-auto max-h-[310px] space-y-2.5 pr-1.5 custom-scrollbar">
            {deptList.map((d) => (
              <div
                key={d.name}
                className="p-3 rounded-xl bg-slate-800/40 border border-white/[0.06] hover:border-white/[0.12] transition-all flex items-center justify-between gap-3 text-xs"
              >
                {/* Left: Department & Stats */}
                <div className="min-w-0">
                  <div className="font-semibold text-slate-100 truncate text-xs sm:text-sm font-sans">
                    {d.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {d.total.toLocaleString()} users • {d.privileged} admins • {d.breached} breached
                  </div>
                </div>

                {/* Right: Critical Badge & Average Risk */}
                <div className="text-right shrink-0">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/25 text-rose-300 font-semibold text-[11px]">
                    {d.critical} CRIT
                  </span>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    Avg: {(d.avg_risk * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anchored Footer: Total Policy Violations */}
        <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Total Policy Violations:</span>
          <span className="text-amber-400 font-bold text-sm font-sans">
            {summary.policy_violations_count.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

