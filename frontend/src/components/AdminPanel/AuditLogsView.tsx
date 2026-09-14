"use client";

import React, { useState } from "react";
import { History, Search, Download, Filter, ShieldCheck, AlertTriangle, User, RefreshCw } from "lucide-react";

export const AuditLogsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");

  const logs = [
    {
      id: "LOG-9821",
      timestamp: "2026-09-14 13:42:01 UTC",
      actor: "sec-admin@lexicon.corp",
      action: "Executed Attack Lab simulation on Domain Admins cluster",
      category: "Simulation",
      severity: "INFO",
      details: "Thread count: 4, Hash type: NTLM, Result: 1 match found in 2.1s",
    },
    {
      id: "LOG-9820",
      timestamp: "2026-09-14 13:38:15 UTC",
      actor: "SYSTEM_DAEMON",
      action: "Automated Active Directory 50,000 identity audit completed",
      category: "Audit",
      severity: "SUCCESS",
      details: "50,000 accounts scanned, 805 reuse clusters identified, 4,210 critical flags",
    },
    {
      id: "LOG-9819",
      timestamp: "2026-09-14 13:12:44 UTC",
      actor: "jdoe@lexicon.corp",
      action: "k-Anonymity HIBP verification queried",
      category: "Privacy",
      severity: "INFO",
      details: "Prefix: 21BD1 (SHA-1), Result: 0 matches returned, no exposure",
    },
    {
      id: "LOG-9818",
      timestamp: "2026-09-14 12:45:00 UTC",
      actor: "ai-advisory-engine",
      action: "Generated Executive Board Risk Briefing & FGPP Script",
      category: "Remediation",
      severity: "INFO",
      details: "Target: C-Suite and IT Helpdesk Tier 2",
    },
    {
      id: "LOG-9817",
      timestamp: "2026-09-14 11:20:30 UTC",
      actor: "sec-ops@lexicon.corp",
      action: "Exported high-risk credential cluster report (CSV)",
      category: "Data Export",
      severity: "WARNING",
      details: "Exported 342 records with risk score > 80.0",
    },
  ];

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSeverity = filterSeverity === "ALL" || log.severity === filterSeverity;
    return matchSearch && matchSeverity;
  });

  return (
    <div className="space-y-6">
      <div className="apple-card p-6 bg-white border border-black/[0.06] rounded-2xl shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06]">
          <div>
            <h2 className="text-lg font-semibold text-[#1D1D1F]">
              System & Security Audit Logs
            </h2>
            <p className="text-xs text-[#6E6E73]">
              Immutable event log tracking all SOC operations, simulations, AI reports, and scan telemetry.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {}}
              className="px-3 py-1.5 rounded-lg border border-black/[0.08] bg-[#F5F5F7] hover:bg-[#E5E5EA] text-xs font-medium text-[#1D1D1F] flex items-center space-x-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit Trail</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 my-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#86868B] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by action, actor, or log ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F5F5F7] border border-black/[0.06] rounded-xl text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#86868B]" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-[#F5F5F7] border border-black/[0.06] text-xs text-[#1D1D1F] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
            >
              <option value="ALL">All Severities</option>
              <option value="SUCCESS">Success</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black/[0.06] text-[#86868B]">
                <th className="py-2.5 px-3 font-semibold">Event ID</th>
                <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3 font-semibold">Actor</th>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-3 font-semibold">Action & Details</th>
                <th className="py-2.5 px-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#FAFAFC] transition-colors">
                  <td className="py-3 px-3 font-mono font-medium text-[#1D1D1F]">
                    {log.id}
                  </td>
                  <td className="py-3 px-3 text-[#6E6E73] font-mono text-[11px]">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-3 font-medium text-[#1D1D1F]">
                    {log.actor}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F5F5F7] text-[#1D1D1F] border border-black/[0.06]">
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 max-w-md">
                    <span className="font-semibold text-[#1D1D1F] block">{log.action}</span>
                    <span className="text-[11px] text-[#86868B] block truncate">{log.details}</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        log.severity === "SUCCESS"
                          ? "bg-[#34C759]/10 text-[#34C759]"
                          : log.severity === "WARNING"
                          ? "bg-[#FF9500]/10 text-[#FF9500]"
                          : "bg-[#0071E3]/10 text-[#0071E3]"
                      }`}
                    >
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
