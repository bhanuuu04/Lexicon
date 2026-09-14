"use client";

import React, { useState, useEffect } from "react";
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
  Download,
  Terminal,
  Layers,
  ChevronDown,
  ChevronUp,
  Building,
  Lock,
  ArrowRight
} from "lucide-react";
import { AuditSummary, RemediationReport, Account } from "../../types";
import { generateRemediationReport, fetchAccounts, fetchGPOScriptText, fetchDepartmentPlaybook } from "../../lib/api";

interface AIAdvisoryStudioProps {
  summary: AuditSummary;
}

export const AIAdvisoryStudio: React.FC<AIAdvisoryStudioProps> = ({ summary }) => {
  const [report, setReport] = useState<RemediationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active Directory GPO Script State
  const [gpoScript, setGpoScript] = useState<string>("");
  const [gpoLoading, setGpoLoading] = useState(false);
  const [showGpoCode, setShowGpoCode] = useState(false);
  const [copiedGpo, setCopiedGpo] = useState(false);

  // Department Playbook State
  const [selectedDept, setSelectedDept] = useState<string>("Finance");
  const [deptPlaybook, setDeptPlaybook] = useState<any>(null);
  const [deptLoading, setDeptLoading] = useState(false);

  const departments = ["Finance", "Information Technology", "Engineering", "Human Resources"];

  useEffect(() => {
    loadDepartmentPlaybook(selectedDept);
  }, [selectedDept]);

  const loadDepartmentPlaybook = async (dept: string) => {
    setDeptLoading(true);
    try {
      const data = await fetchDepartmentPlaybook(dept);
      setDeptPlaybook(data);
    } catch (err) {
      console.error("Failed to load department playbook:", err);
    } finally {
      setDeptLoading(false);
    }
  };

  const handleDownloadGPO = async () => {
    setGpoLoading(true);
    try {
      let script = gpoScript;
      if (!script) {
        script = await fetchGPOScriptText();
        setGpoScript(script);
      }
      const blob = new Blob([script], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Deploy-LexiconPasswordPolicy.ps1";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download GPO script:", err);
    } finally {
      setGpoLoading(false);
    }
  };

  const toggleGpoPreview = async () => {
    if (!showGpoCode && !gpoScript) {
      try {
        const script = await fetchGPOScriptText();
        setGpoScript(script);
      } catch (err) {
        console.error("Failed to fetch GPO script preview:", err);
      }
    }
    setShowGpoCode(!showGpoCode);
  };

  const copyGpoScript = () => {
    if (!gpoScript) return;
    navigator.clipboard.writeText(gpoScript);
    setCopiedGpo(true);
    setTimeout(() => setCopiedGpo(false), 2000);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Fetch live critical accounts for the report
      let liveAccounts: Account[] = [];
      try {
        const critRes = await fetchAccounts({ tier: "Critical", page_size: 5 });
        if (critRes.accounts && critRes.accounts.length > 0) {
          liveAccounts = critRes.accounts;
        } else {
          const highRes = await fetchAccounts({ tier: "High", page_size: 5 });
          liveAccounts = highRes.accounts || [];
        }
      } catch (e) {
        console.error("Failed to fetch live accounts for advisory report:", e);
      }

      const sampleFindings = liveAccounts.map((a) => ({
        account_id: a.id,
        username: a.username,
        department: a.department,
        role: a.role,
        is_privileged: a.is_privileged,
        risk_tier: a.final_tier || a.baseline_tier,
        baseline_risk: a.baseline_risk,
        final_risk: a.final_risk !== undefined ? a.final_risk : a.baseline_risk,
        zxcvbn_score: a.zxcvbn_score,
        breach_match: a.breach_match,
        reuse_cluster_size: a.password_group_id ? 20 : 1,
        policy_violations: a.policy_violations || [],
        attack_matched: a.attack_adjustment > 0,
        attack_elapsed_ms: a.attack_evidence?.elapsed_ms,
        matched_rule: a.attack_evidence?.matched_rule,
      }));

      const payload = {
        total_audited: summary.total_accounts,
        critical_count: summary.critical_count,
        high_risk_count: summary.high_risk_count,
        privileged_at_risk: summary.privileged_at_risk_count,
        breached_count: summary.breached_count,
        sample_findings: sampleFindings,
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
            <span>AI Remediation & Active Directory Automation</span>
          </div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mt-1 font-sans">
            Enterprise Remediation Studio & GPO Deployment
          </h2>
          <p className="text-xs text-[#6E6E73] max-w-2xl mt-1 font-normal">
            Generate one-click Active Directory Fine-Grained Password Policy (FGPP) PowerShell deployment scripts, department-specific mitigation playbooks, and executive risk advisory reports.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleDownloadGPO}
            disabled={gpoLoading}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] font-medium text-xs flex items-center space-x-2 border border-black/[0.1] shadow-xs transition active:scale-[0.98]"
          >
            <Download className="w-4 h-4 text-[#0071E3]" />
            <span>Download GPO Script (.ps1)</span>
          </button>

          <button
            disabled={loading}
            onClick={handleGenerate}
            className="px-5 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 text-white font-medium text-xs flex items-center space-x-2 shadow-sm transition active:scale-[0.98]"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-white" />
                <span>Synthesize Advisory</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* GPO Automation & PowerShell Deployment Card */}
      <div className="apple-card p-6 border border-[#5856D6]/20 bg-gradient-to-br from-[#5856D6]/[0.03] via-white to-white space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#5856D6]/10 flex items-center justify-center text-[#5856D6]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1D1D1F]">
                Active Directory Fine-Grained Password Policy (FGPP) Automation
              </h3>
              <p className="text-xs text-[#6E6E73]">
                NIST SP 800-63B compliant PowerShell script creating <code className="text-[#5856D6] font-mono">Lexicon-Privileged-PSO</code> (20-char min, strict lockout) and <code className="text-[#0071E3] font-mono">Lexicon-Standard-PSO</code> (15-char min).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleGpoPreview}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs font-medium flex items-center space-x-1.5 border border-black/[0.08] shadow-xs transition"
            >
              <Terminal className="w-3.5 h-3.5 text-[#5856D6]" />
              <span>{showGpoCode ? "Hide PowerShell Preview" : "View PowerShell Code"}</span>
              {showGpoCode ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleDownloadGPO}
              className="px-3.5 py-1.5 rounded-xl bg-[#5856D6] hover:bg-[#4C4ABF] text-white text-xs font-medium flex items-center space-x-1.5 shadow-xs transition active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Deploy-LexiconPasswordPolicy.ps1</span>
            </button>
          </div>
        </div>

        {showGpoCode && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between bg-[#1D1D1F] px-4 py-2 rounded-t-xl text-xs text-white/80">
              <span className="font-mono text-[11px] text-[#34C759]">PowerShell Module: ActiveDirectory</span>
              <button
                onClick={copyGpoScript}
                className="flex items-center space-x-1 text-xs hover:text-white transition"
              >
                {copiedGpo ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedGpo ? "Copied" : "Copy Code"}</span>
              </button>
            </div>
            <pre className="p-4 bg-[#111113] text-[#F5F5F7] font-mono text-xs rounded-b-xl overflow-x-auto max-h-72 border border-black/[0.1] leading-relaxed">
              {gpoScript || "Loading PowerShell policy script..."}
            </pre>
          </div>
        )}
      </div>

      {/* Department Threat Playbook Explorer */}
      <div className="apple-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.06]">
          <div className="flex items-center space-x-2.5">
            <Building className="w-5 h-5 text-[#0071E3]" />
            <div>
              <h3 className="text-sm font-semibold text-[#1D1D1F]">
                Department Threat Mitigation Playbooks
              </h3>
              <p className="text-xs text-[#6E6E73]">
                Role-tailored threat intelligence and phased remediation playbooks.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 bg-[#F5F5F7] p-1 rounded-xl border border-black/[0.04]">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedDept === dept
                    ? "bg-white text-[#0071E3] shadow-xs"
                    : "text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {deptPlaybook ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#F5F5F7] border border-black/[0.04] space-y-2">
              <div className="flex items-center space-x-2 text-[#FF3B30] text-xs font-semibold uppercase">
                <AlertOctagon className="w-4 h-4" />
                <span>Primary Threat Profile</span>
              </div>
              <p className="text-xs text-[#1D1D1F] leading-relaxed">
                {deptPlaybook.threat_profile || deptPlaybook.primary_threat || "Targeted by credential stuffing and business email compromise."}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F5F7] border border-black/[0.04] space-y-2">
              <div className="flex items-center space-x-2 text-[#5856D6] text-xs font-semibold uppercase">
                <Smartphone className="w-4 h-4" />
                <span>Recommended MFA & Auth</span>
              </div>
              <p className="text-xs text-[#1D1D1F] leading-relaxed font-medium">
                {deptPlaybook.recommended_mfa || "Hardware FIDO2 / WebAuthn security keys with number matching."}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F5F7] border border-black/[0.04] space-y-2">
              <div className="flex items-center space-x-2 text-[#34C759] text-xs font-semibold uppercase">
                <Lock className="w-4 h-4" />
                <span>Remediation Priority</span>
              </div>
              <p className="text-xs text-[#1D1D1F] leading-relaxed font-medium">
                {deptPlaybook.priority || "High (Execute within 48 hours)"}
              </p>
            </div>

            <div className="md:col-span-3 p-4 rounded-xl bg-white border border-black/[0.06] space-y-3 shadow-xs">
              <h4 className="text-xs uppercase font-semibold text-[#1D1D1F] tracking-wider flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#0071E3]" />
                <span>Prioritized Mitigation Action Items for {selectedDept}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(deptPlaybook.top_actions || deptPlaybook.mitigation_steps || []).map((act: string, idx: number) => (
                  <div key={idx} className="flex items-start space-x-2 p-2.5 rounded-lg bg-[#F5F5F7]/80 text-xs text-[#1D1D1F]">
                    <ArrowRight className="w-3.5 h-3.5 text-[#0071E3] shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-[#86868B]">Loading playbook...</div>
        )}
      </div>

      {/* Executive Report Container */}
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
            Click &quot;Synthesize Advisory&quot; to generate actionable enterprise guidance from the 50,000-account audit findings.
          </p>
        </div>
      )}
    </div>
  );
};
