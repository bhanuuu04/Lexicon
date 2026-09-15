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
  Critical: "#EF4444",
  High: "#F59E0B",
  Medium: "#9CA3AF",
  Low: "#10B981",
};

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({ summary }) => {
  const chartData = [
    { name: "Critical (≥0.75)", count: summary.critical_count, tier: "Critical" },
    { name: "High (0.50-0.74)", count: summary.high_risk_count, tier: "High" },
    { name: "Medium (0.25-0.49)", count: summary.medium_risk_count, tier: "Medium" },
    { name: "Low (<0.25)", count: summary.low_risk_count, tier: "Low" },
  ];

  return (
    <div className="p-5 flex flex-col justify-between bg-white border border-gray-200 rounded-xl shadow-2xs">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight font-sans">
              Password Risk Distribution
            </h3>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              Deterministic risk score breakdown across {summary.total_accounts.toLocaleString()} Active Directory accounts
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs shrink-0">
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200/60 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              <span>Critical: {summary.critical_count.toLocaleString()}</span>
            </span>
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
              <span>High: {summary.high_risk_count.toLocaleString()}</span>
            </span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-60 sm:h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
              />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
                tickFormatter={(val) => val.toLocaleString()}
              />
              <Tooltip
                cursor={{ fill: "rgba(0, 0, 0, 0.02)" }}
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E5E7EB",
                  borderRadius: "8px",
                  color: "#111827",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                }}
                formatter={(val: number) => [`${val.toLocaleString()} Accounts`, "Count"]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.tier]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Tier Percentage Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-gray-100 text-center">
        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200/60">
          <span className="text-red-600 font-semibold text-sm block font-sans">
            {((summary.critical_count / summary.total_accounts) * 100).toFixed(1)}%
          </span>
          <span className="text-gray-500 text-[11px] block mt-0.5">
            Critical ({summary.critical_count.toLocaleString()})
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200/60">
          <span className="text-amber-600 font-semibold text-sm block font-sans">
            {((summary.high_risk_count / summary.total_accounts) * 100).toFixed(1)}%
          </span>
          <span className="text-gray-500 text-[11px] block mt-0.5">
            High ({summary.high_risk_count.toLocaleString()})
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200/60">
          <span className="text-gray-700 font-semibold text-sm block font-sans">
            {((summary.medium_risk_count / summary.total_accounts) * 100).toFixed(1)}%
          </span>
          <span className="text-gray-500 text-[11px] block mt-0.5">
            Medium ({summary.medium_risk_count.toLocaleString()})
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200/60">
          <span className="text-emerald-600 font-semibold text-sm block font-sans">
            {((summary.low_risk_count / summary.total_accounts) * 100).toFixed(1)}%
          </span>
          <span className="text-gray-500 text-[11px] block mt-0.5">
            Low ({summary.low_risk_count.toLocaleString()})
          </span>
        </div>
      </div>
    </div>
  );
};

