"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Network,
  Lock,
  Zap,
  TrendingDown,
  FileCheck,
  ExternalLink,
  ChevronRight,
  Info,
  RefreshCw,
  Layers,
} from "lucide-react";
import { fetchComplianceScorecard, fetchThreatSurface } from "../../lib/api";
import { AuditSummary } from "../../types";

interface ComplianceThreatSurfaceViewProps {
  summary: AuditSummary;
  onNavigateToAccounts?: (tierFilter: string) => void;
  onNavigateToCluster?: (groupId: number) => void;
}

export const ComplianceThreatSurfaceView: React.FC<ComplianceThreatSurfaceViewProps> = ({
  summary,
  onNavigateToAccounts,
  onNavigateToCluster,
}) => {
  const [compliance, setCompliance] = useState<any>(null);
  const [threatSurface, setThreatSurface] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"compliance" | "threat-surface">("compliance");

  useEffect(() => {
    async function loadAuditIntelligence() {
      setLoading(true);
      try {
        const [comp, threat] = await Promise.all([
          fetchComplianceScorecard(),
          fetchThreatSurface(),
        ]);
        setCompliance(comp);
        setThreatSurface(threat);
      } catch (err) {
        console.error("Failed to load compliance/threat intelligence:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAuditIntelligence();
  }, []);

  if (loading) {
    return (
      <div className="apple-card p-12 bg-white border border-black/[0.06] rounded-3xl shadow-card flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center animate-pulse">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[#1D1D1F]">
            Auditing Enterprise Compliance & Threat Surface
          </h3>
          <p className="text-xs text-[#6E6E73]">
            Evaluating directory against NIST SP 800-63B, CIS v8, PCI-DSS v4 & Active Directory roasting telemetry...
          </p>
        </div>
      </div>
    );
  }

  const frameworks = compliance?.frameworks || {};
  const kerb = threatSurface?.kerberoasting_exposure;
  const asrep = threatSurface?.as_rep_roasting_exposure;
  const lateral = threatSurface?.lateral_movement_blast_radius;

  return (
    <div className="space-y-6">
      {/* Top Selector Banner */}
      <div className="apple-card p-6 sm:p-8 bg-white border border-black/[0.06] rounded-3xl shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#0071E3] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3]">
                SOC Regulatory & Exposure Intelligence
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tracking-tight">
              Compliance Scorecard & AD Threat Surface
            </h2>
            <p className="text-xs text-[#6E6E73] mt-1">
              Deterministic regulatory benchmarking and offline hash extraction exposure for Active Directory identities.
            </p>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="flex items-center bg-[#F5F5F7] p-1 rounded-2xl border border-black/[0.04] self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("compliance")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === "compliance"
                  ? "bg-white text-[#1D1D1F] shadow-xs"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              Regulatory Scorecards
            </button>
            <button
              onClick={() => setActiveTab("threat-surface")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === "threat-surface"
                  ? "bg-white text-[#1D1D1F] shadow-xs"
                  : "text-[#86868B] hover:text-[#1D1D1F]"
              }`}
            >
              AD Attack Surface
            </button>
          </div>
        </div>

        {/* SECTION 1: REGULATORY COMPLIANCE SCORECARD */}
        {activeTab === "compliance" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Overall Compliance Grade Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#FAFAFC] to-[#F5F5F7] border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center font-bold text-lg font-sans">
                  {compliance?.overall_enterprise_grade || "B"}
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#86868B]">
                    Overall Directory Readiness
                  </span>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">
                    {compliance?.overall_enterprise_grade === "A" || compliance?.overall_enterprise_grade === "A+"
                      ? "High Regulatory Compliance Posture"
                      : "Remediation Recommended for Full Regulatory Compliance"}
                  </h3>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-xs text-[#86868B]">
                <span>NIST SP 800-63B</span> • <span>CIS Controls v8</span> • <span>PCI-DSS v4</span> • <span>ISO 27001</span>
              </div>
            </div>

            {/* Framework Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(frameworks).map(([key, fw]: [string, any]) => {
                const passedCount = fw.requirements?.filter((r: any) => r.passed).length || 0;
                const totalCount = fw.requirements?.length || 1;
                const isPassed = fw.status === "COMPLIANT" || fw.status === "PASSED" || passedCount === totalCount;

                return (
                  <div
                    key={key}
                    className="p-5 rounded-2xl bg-[#FAFAFC] border border-black/[0.06] space-y-4 hover:border-black/[0.12] transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">
                          {fw.standard_id || key.toUpperCase()}
                        </span>
                        <h4 className="text-sm font-semibold text-[#1D1D1F] mt-0.5">
                          {fw.framework_name || key.replace(/_/g, " ").toUpperCase()}
                        </h4>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          isPassed
                            ? "bg-[#34C759]/10 text-[#248A3D] border-[#34C759]/30"
                            : "bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/30"
                        }`}
                      >
                        {isPassed ? "Compliant" : "Gaps Found"}
                      </span>
                    </div>

                    <p className="text-xs text-[#6E6E73] leading-relaxed">
                      {fw.description || "Regulatory standard governing credential entropy, lifetime, and identity controls."}
                    </p>

                    {/* Requirements Checklist */}
                    <div className="space-y-2 pt-2 border-t border-black/[0.04]">
                      {fw.requirements?.map((req: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start space-x-2 text-xs"
                        >
                          {req.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-[#34C759] shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-[#FF3B30] shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-semibold text-[#1D1D1F] block">{req.title || req.rule}</span>
                            <span className="text-[11px] text-[#86868B]">{req.details || req.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* SECTION 2: ACTIVE DIRECTORY THREAT SURFACE */}
        {activeTab === "threat-surface" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Kerberoasting */}
              <div className="p-5 rounded-2xl bg-[#FAFAFC] border border-black/[0.06] flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] text-[10px] font-bold uppercase tracking-wider border border-[#FF3B30]/20">
                      TGS Ticket Cracking
                    </span>
                    <span className="text-xs font-bold text-[#FF3B30]">
                      {kerb?.percentage_of_privileged || 0}% Privileged
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-[#1D1D1F]">
                    Kerberoasting Exposure
                  </h4>
                  <p className="text-xs text-[#6E6E73] mt-1 leading-relaxed">
                    {kerb?.threat_description || "Privileged service/admin accounts with weak crackable hashes and no MFA vulnerable to offline ticket extraction."}
                  </p>
                </div>

                <div className="pt-3 border-t border-black/[0.04] space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#86868B]">Vulnerable SPN Accounts:</span>
                    <span className="font-bold text-[#FF3B30]">{kerb?.vulnerable_accounts_count || 0}</span>
                  </div>
                  {kerb?.sample_target_ids && kerb.sample_target_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {kerb.sample_target_ids.slice(0, 4).map((id: string) => (
                        <span key={id} className="px-2 py-0.5 rounded bg-black/[0.05] text-[10px] font-mono text-[#1D1D1F]">
                          {id}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. AS-REP Roasting */}
              <div className="p-5 rounded-2xl bg-[#FAFAFC] border border-black/[0.06] flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FF9500]/10 text-[#FF9500] text-[10px] font-bold uppercase tracking-wider border border-[#FF9500]/20">
                      Pre-Auth Offline Attack
                    </span>
                    <span className="text-xs font-bold text-[#FF9500]">
                      {asrep?.percentage_of_directory || 0}% Directory
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-[#1D1D1F]">
                    AS-REP Roasting Exposure
                  </h4>
                  <p className="text-xs text-[#6E6E73] mt-1 leading-relaxed">
                    {asrep?.threat_description || "User accounts with weak credentials vulnerable to pre-authentication AS-REP offline dictionary attacks."}
                  </p>
                </div>

                <div className="pt-3 border-t border-black/[0.04] space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#86868B]">Susceptible Identities:</span>
                    <span className="font-bold text-[#FF9500]">{asrep?.vulnerable_accounts_count || 0}</span>
                  </div>
                  {asrep?.sample_target_ids && asrep.sample_target_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {asrep.sample_target_ids.slice(0, 4).map((id: string) => (
                        <span key={id} className="px-2 py-0.5 rounded bg-black/[0.05] text-[10px] font-mono text-[#1D1D1F]">
                          {id}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Lateral Movement Blast Radius */}
              <div className="p-5 rounded-2xl bg-[#FAFAFC] border border-black/[0.06] flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[10px] font-bold uppercase tracking-wider border border-[#0071E3]/20">
                      Cross-Department Pivot
                    </span>
                    <span className="text-xs font-bold text-[#0071E3]">
                      {lateral?.percentage_of_directory || 0}% Exposed
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-[#1D1D1F]">
                    Lateral Movement Blast Radius
                  </h4>
                  <p className="text-xs text-[#6E6E73] mt-1 leading-relaxed">
                    {lateral?.threat_description || "Password reuse clusters spanning multiple departments that allow attackers with low-privilege initial access to pivot into Domain Admin credentials."}
                  </p>
                </div>

                <div className="pt-3 border-t border-black/[0.04] space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#86868B]">Critical Pivot Clusters:</span>
                    <span className="font-bold text-[#0071E3]">{lateral?.critical_pivot_clusters_count || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#86868B]">Total At-Risk Nodes:</span>
                    <span className="font-bold text-[#1D1D1F]">{lateral?.total_compromised_nodes_at_risk || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
