"use client";

import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Copy,
  Check,
  Key,
  Smartphone,
  Ban,
  Calendar,
} from "lucide-react";
import { AuditSummary, RemediationReport } from "../../types";
import { generateRemediationReport } from "../../lib/api";

interface AIAdvisoryStudioProps {
  summary: AuditSummary;
}

export const AIAdvisoryStudio: React.FC<AIAdvisoryStudioProps> = ({ summary }) => {
  const [report, setReport] = useState<RemediationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const payload = {
        total_audited: summary.total_accounts,
        critical_count: summary.critical_count,
        high_risk_count: summary.high_risk_count,
        privileged_at_risk: summary.privileged_at_risk_count,
        breached_count: summary.breached_count,
        sample_findings: [
          {
            account_id: "ACC-00042",
            username: "alex.morgan",
            department: "Information Technology",
            role: "Enterprise Active Directory Admin",
            is_privileged: true,
            risk_tier: "Critical",
            baseline_risk: 0.8167,
            final_risk: 0.9667,
            zxcvbn_score: 2,
            breach_match: true,
            reuse_cluster_size: 31,
            policy_violations: [
              "Contains predictable enterprise dictionary keyword or sequence ('company')",
              "Contains predictable current/upcoming calendar year suffix",
            ],
            attack_matched: true,
            attack_elapsed_ms: 310.5,
            matched_rule: "year_and_special_suffix",
          },
          {
            account_id: "ACC-29113",
            username: "cthompson29113",
            department: "Information Technology",
            role: "Database Administrator",
            is_privileged: true,
            risk_tier: "Critical",
            baseline_risk: 0.8917,
            final_risk: 0.8917,
            zxcvbn_score: 1,
            breach_match: true,
            reuse_cluster_size: 28,
            policy_violations: [
              "Fails character complexity requirement",
              "Contains predictable dictionary keyword ('123')",
            ],
          },
          {
            account_id: "ACC-33583",
            username: "rbrown33583",
            department: "Finance",
            role: "Chief Financial Officer",
            is_privileged: true,
            risk_tier: "High",
            baseline_risk: 0.7417,
            final_risk: 0.7417,
            zxcvbn_score: 2,
            breach_match: true,
            reuse_cluster_size: 19,
            policy_violations: ["Password length < 12", "Year suffix"],
          },
        ],
      };

      const res = await generateRemediationReport(payload);
      setReport(res);
    } catch (err) {
      console.error("Failed to generate remediation report:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyReportMarkdown = () => {
    if (!report) return;
    const md = `
# Lexicon Enterprise Password Risk Advisory Report

## Executive Summary
${report.executive_summary}

## Risk Explanation
${report.risk_explanation}

## Priority Accounts Remediation
${report.priority_accounts
  .map(
    (a) =>
      `* **${a.username}** (${a.role} - ${a.department}) [${a.risk_tier}]: ${a.immediate_action} | Recommendation: ${a.recommended_policy}`
  )
  .join("\n")}

## Password Policy Recommendations
${report.password_policy_recommendations.map((p) => `* ${p}`).join("\n")}

## MFA Recommendations
${report.mfa_recommendations.map((m) => `* ${m}`).join("\n")}

## Custom Organizational Blocklist
${report.org_blocklist_suggestions.map((b) => `* \`${b}\``).join("\n")}

## Remediation Phasing & Rollout Plan
${report.remediation_priorities.map((r) => `* ${r}`).join("\n")}
    `.trim();

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="apple-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#0071E3]/20 bg-gradient-to-r from-[#0071E3]/[0.06] via-white to-white">
        <div>
          <div className="flex items-center space-x-2 text-[#0071E3] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI Remediation & Strategic Advisory</span>
          </div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mt-1 font-sans">
            Enterprise Remediation Advisory Studio
          </h2>
          <p className="text-xs text-[#6E6E73] max-w-2xl mt-1 font-normal">
            AI explains the deterministic empirical evidence without altering calculated risk scores. Synthesizes prioritized account actions, custom password filters, and FIDO2 MFA rollout roadmap.
          </p>
        </div>

        <button
          disabled={loading}
          onClick={handleGenerate}
          className="px-5 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 text-white font-medium flex items-center space-x-2 shadow-sm shrink-0 transition active:scale-[0.98]"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Synthesizing Advisory...</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 text-white" />
              <span>Generate Executive Remediation Report</span>
            </>
          )}
        </button>
      </div>

      {/* Report Container */}
      {report ? (
        <div className="apple-card p-8 space-y-8">
          {/* Actions Toolbar */}
          <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-[#34C759]" />
              <span className="font-semibold text-[#1D1D1F] text-sm uppercase tracking-wider font-sans">
                Enterprise Remediation Advisory Report
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={copyReportMarkdown}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs font-medium flex items-center space-x-1.5 border border-black/[0.08] shadow-xs transition"
              >
                {copied ? <Check className="w-4 h-4 text-[#34C759]" /> : <Copy className="w-4 h-4 text-[#6E6E73]" />}
                <span>{copied ? "Copied Markdown" : "Copy Markdown"}</span>
              </button>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase text-[#0071E3] font-semibold tracking-wider flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>1. Executive Summary</span>
            </h3>
            <p className="text-sm text-[#1D1D1F] leading-relaxed bg-[#F5F5F7] p-4 rounded-xl border border-black/[0.04] font-normal">
              {report.executive_summary}
            </p>
          </div>

          {/* Risk Explanation */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase text-[#5856D6] font-semibold tracking-wider flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4" />
              <span>2. Risk Root Cause Explanation</span>
            </h3>
            <p className="text-sm text-[#1D1D1F] leading-relaxed bg-[#F5F5F7] p-4 rounded-xl border border-black/[0.04] font-normal">
              {report.risk_explanation}
            </p>
          </div>

          {/* Priority Accounts Table */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase text-[#FF3B30] font-semibold tracking-wider flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4" />
              <span>3. Immediate Priority Account Interventions</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-black/[0.06]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F5F7] text-[#86868B] uppercase font-semibold text-[11px] border-b border-black/[0.06]">
                  <tr>
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4">Department & Role</th>
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">Mandatory Immediate Action</th>
                    <th className="py-3 px-4">Recommended Policy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] bg-white">
                  {report.priority_accounts.map((a, i) => (
                    <tr key={i} className="hover:bg-[#F5F5F7]/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#1D1D1F] font-sans">{a.username}</td>
                      <td className="py-3 px-4 text-[#6E6E73]">{a.role} ({a.department})</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FF3B30]/[0.08] text-[#FF3B30] border border-[#FF3B30]/20 font-semibold text-[10px]">
                          {a.risk_tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#FF9500] font-medium">{a.immediate_action}</td>
                      <td className="py-3 px-4 text-[#86868B]">{a.recommended_policy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Policy & MFA Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Policy Recommendations */}
            <div className="p-5 rounded-xl bg-[#F5F5F7] border border-black/[0.04] space-y-3">
              <h4 className="text-xs uppercase text-[#0071E3] font-semibold flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>4. Password Policy Revisions</span>
              </h4>
              <ul className="space-y-2 text-xs text-[#1D1D1F]">
                {report.password_policy_recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-[#0071E3] font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* MFA Recommendations */}
            <div className="p-5 rounded-xl bg-[#F5F5F7] border border-black/[0.04] space-y-3">
              <h4 className="text-xs uppercase text-[#5856D6] font-semibold flex items-center space-x-2">
                <Smartphone className="w-4 h-4" />
                <span>5. Phishing-Resistant MFA Mandate</span>
              </h4>
              <ul className="space-y-2 text-xs text-[#1D1D1F]">
                {report.mfa_recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-[#5856D6] font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Blocklist Suggestions */}
          <div className="p-5 rounded-xl bg-[#F5F5F7] border border-black/[0.04] space-y-3">
            <h4 className="text-xs uppercase text-[#FF3B30] font-semibold flex items-center space-x-2">
              <Ban className="w-4 h-4" />
              <span>6. Recommended Active Directory Custom Password Filter Blocklist</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {report.org_blocklist_suggestions.map((item, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-white border border-black/[0.08] text-[#FF3B30] font-mono text-xs shadow-xs"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Phased Roadmap */}
          <div className="p-5 rounded-xl bg-[#F5F5F7] border border-black/[0.04] space-y-3">
            <h4 className="text-xs uppercase text-[#34C759] font-semibold flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>7. Phased Remediation Execution Roadmap</span>
            </h4>
            <div className="space-y-2 text-xs text-[#1D1D1F]">
              {report.remediation_priorities.map((item, i) => (
                <div key={i} className="p-3 rounded-xl bg-white border border-black/[0.06] shadow-xs">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl border border-dashed border-black/[0.1] bg-white text-center text-[#86868B] space-y-3">
          <FileText className="w-10 h-10 mx-auto text-[#86868B]" />
          <p className="text-sm">
            Click &quot;Generate Executive Remediation Report&quot; to synthesize actionable guidance from the 50,000-account audit findings.
          </p>
        </div>
      )}
    </div>
  );
};


