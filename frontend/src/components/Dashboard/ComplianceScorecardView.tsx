"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Award,
  CheckCircle2,
  XCircle,
  FileCheck,
  Lock,
  Smartphone,
  RefreshCw,
  TrendingUp,
  Radio,
  Server,
  Key
} from "lucide-react";
import { fetchComplianceScorecard, fetchThreatSurface } from "../../lib/api";

export const ComplianceScorecardView: React.FC = () => {
  const [compliance, setCompliance] = useState<any>(null);
  const [threatSurface, setThreatSurface] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [comp, threat] = await Promise.all([
        fetchComplianceScorecard(),
        fetchThreatSurface()
      ]);
      setCompliance(comp);
      setThreatSurface(threat);
    } catch (err) {
      console.error("Failed to load compliance scorecard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="apple-card p-12 text-center text-xs text-[#86868B] space-y-3">
        <div className="w-8 h-8 border-2 border-[#0071E3] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p>Evaluating Active Directory domain against NIST, CIS, PCI-DSS & ISO 27001 frameworks...</p>
      </div>
    );
  }

  const frameworks = compliance?.frameworks || {};
  const grade = compliance?.overall_enterprise_grade || "B";

  const getGradeColor = (g: string) => {
    switch (g) {
      case "A":
        return "bg-[#34C759]/10 text-[#34C759] border-[#34C759]/30";
      case "B":
        return "bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/30";
      case "C":
        return "bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/30";
      default:
        return "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/30";
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "COMPLIANT") {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20 text-[10px] font-semibold flex items-center space-x-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>COMPLIANT</span>
        </span>
      );
    } else if (status === "PARTIAL") {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20 text-[10px] font-semibold flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3" />
          <span>PARTIAL COMPLIANCE</span>
        </span>
      );
    } else {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 text-[10px] font-semibold flex items-center space-x-1">
          <XCircle className="w-3 h-3" />
          <span>NON-COMPLIANT</span>
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Overall Enterprise Grade */}
      <div className="apple-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#0071E3]/20 bg-gradient-to-r from-[#0071E3]/[0.06] via-white to-white">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-[#0071E3] text-xs font-semibold uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>Regulatory & Industry Compliance Auditing</span>
          </div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] font-sans">
            Enterprise Password Security Compliance Scorecard
          </h2>
          <p className="text-xs text-[#6E6E73] max-w-2xl font-normal">
            Automated compliance verification across NIST SP 800-63B, CIS Controls v8, PCI-DSS v4.0 Requirement 8, and ISO/IEC 27001 Annex A.9.
          </p>
        </div>

        <div className="flex items-center space-x-4 shrink-0">
          <div className="flex items-center space-x-3 bg-white p-3 rounded-2xl border border-black/[0.08] shadow-xs">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-2xl border ${getGradeColor(grade)}`}>
              {grade}
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-[#86868B]">Security Posture</div>
              <div className="text-xs font-semibold text-[#1D1D1F]">Enterprise Grade {grade}</div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 rounded-xl bg-white hover:bg-[#F5F5F7] border border-black/[0.08] text-[#6E6E73] hover:text-[#1D1D1F] shadow-xs transition"
            title="Re-run compliance audit"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4 Regulatory Framework Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. NIST SP 800-63B */}
        {frameworks.nist_sp_800_63b && (
          <div className="apple-card p-6 space-y-4 border border-black/[0.06] shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center space-x-2.5">
                <FileCheck className="w-5 h-5 text-[#0071E3]" />
                <div>
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">
                    {frameworks.nist_sp_800_63b.name}
                  </h3>
                  <div className="text-[11px] text-[#86868B]">Digital Identity Guidelines (Authenticator Assurance)</div>
                </div>
              </div>
              {getStatusBadge(frameworks.nist_sp_800_63b.status)}
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {Object.entries(frameworks.nist_sp_800_63b.controls || {}).map(([key, val]: [string, any]) => (
                <div key={key} className="p-2.5 rounded-lg bg-[#F5F5F7] border border-black/[0.04]">
                  <div className="text-[10px] text-[#86868B] uppercase font-semibold">{key.replace(/_/g, " ")}</div>
                  <div className="text-xs font-semibold text-[#1D1D1F] mt-0.5">{val}</div>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#6E6E73] bg-[#F5F5F7]/80 p-3 rounded-xl border border-black/[0.04]">
              {frameworks.nist_sp_800_63b.findings}
            </p>
          </div>
        )}

        {/* 2. CIS Controls v8 */}
        {frameworks.cis_controls_v8 && (
          <div className="apple-card p-6 space-y-4 border border-black/[0.06] shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-[#5856D6]" />
                <div>
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">
                    {frameworks.cis_controls_v8.name}
                  </h3>
                  <div className="text-[11px] text-[#86868B]">Safeguard 5.2, 5.4, 6.1 (Account & Access Control)</div>
                </div>
              </div>
              {getStatusBadge(frameworks.cis_controls_v8.status)}
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {Object.entries(frameworks.cis_controls_v8.controls || {}).map(([key, val]: [string, any]) => (
                <div key={key} className="p-2.5 rounded-lg bg-[#F5F5F7] border border-black/[0.04]">
                  <div className="text-[10px] text-[#86868B] uppercase font-semibold">{key.replace(/_/g, " ")}</div>
                  <div className="text-xs font-semibold text-[#1D1D1F] mt-0.5">{val}</div>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#6E6E73] bg-[#F5F5F7]/80 p-3 rounded-xl border border-black/[0.04]">
              {frameworks.cis_controls_v8.findings}
            </p>
          </div>
        )}

        {/* 3. PCI-DSS v4.0 */}
        {frameworks.pci_dss_v4 && (
          <div className="apple-card p-6 space-y-4 border border-black/[0.06] shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center space-x-2.5">
                <Lock className="w-5 h-5 text-[#FF9500]" />
                <div>
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">
                    {frameworks.pci_dss_v4.name}
                  </h3>
                  <div className="text-[11px] text-[#86868B]">Requirement 8 (Identify and Authenticate Users)</div>
                </div>
              </div>
              {getStatusBadge(frameworks.pci_dss_v4.status)}
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {Object.entries(frameworks.pci_dss_v4.controls || {}).map(([key, val]: [string, any]) => (
                <div key={key} className="p-2.5 rounded-lg bg-[#F5F5F7] border border-black/[0.04]">
                  <div className="text-[10px] text-[#86868B] uppercase font-semibold">{key.replace(/_/g, " ")}</div>
                  <div className="text-xs font-semibold text-[#1D1D1F] mt-0.5">{val}</div>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#6E6E73] bg-[#F5F5F7]/80 p-3 rounded-xl border border-black/[0.04]">
              {frameworks.pci_dss_v4.findings}
            </p>
          </div>
        )}

        {/* 4. ISO/IEC 27001 */}
        {frameworks.iso_27001 && (
          <div className="apple-card p-6 space-y-4 border border-black/[0.06] shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center space-x-2.5">
                <Key className="w-5 h-5 text-[#34C759]" />
                <div>
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">
                    {frameworks.iso_27001.name}
                  </h3>
                  <div className="text-[11px] text-[#86868B]">Annex A.9 (Password Management & Access Control)</div>
                </div>
              </div>
              {getStatusBadge(frameworks.iso_27001.status)}
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {Object.entries(frameworks.iso_27001.controls || {}).map(([key, val]: [string, any]) => (
                <div key={key} className="p-2.5 rounded-lg bg-[#F5F5F7] border border-black/[0.04]">
                  <div className="text-[10px] text-[#86868B] uppercase font-semibold">{key.replace(/_/g, " ")}</div>
                  <div className="text-xs font-semibold text-[#1D1D1F] mt-0.5">{val}</div>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#6E6E73] bg-[#F5F5F7]/80 p-3 rounded-xl border border-black/[0.04]">
              {frameworks.iso_27001.findings}
            </p>
          </div>
        )}
      </div>

      {/* Active Directory Threat Surface & Attack Vectors Section */}
      {threatSurface && (
        <div className="apple-card p-6 space-y-5 border border-[#FF3B30]/20 bg-gradient-to-br from-[#FF3B30]/[0.02] via-white to-white">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
            <div className="flex items-center space-x-2.5">
              <ShieldAlert className="w-5 h-5 text-[#FF3B30]" />
              <div>
                <h3 className="text-sm font-semibold text-[#1D1D1F]">
                  Active Directory Attack Surface & Kerberos Exploitation Index
                </h3>
                <p className="text-xs text-[#6E6E73]">
                  Quantifies vulnerability to offline ticket extraction and cross-department lateral movement.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Kerberoasting Card */}
            <div className="p-4 rounded-xl bg-white border border-black/[0.06] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#FF3B30] uppercase">Kerberoasting Exposure</span>
                <span className="px-2 py-0.5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] text-[10px] font-bold">
                  {threatSurface.kerberoasting_exposure?.percentage_of_privileged}% of Privileged
                </span>
              </div>
              <div className="text-xl font-bold text-[#1D1D1F]">
                {threatSurface.kerberoasting_exposure?.vulnerable_accounts_count} Accounts
              </div>
              <p className="text-xs text-[#6E6E73] leading-relaxed">
                {threatSurface.kerberoasting_exposure?.threat_description}
              </p>
            </div>

            {/* AS-REP Roasting Card */}
            <div className="p-4 rounded-xl bg-white border border-black/[0.06] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#FF9500] uppercase">AS-REP Roasting Vulnerability</span>
                <span className="px-2 py-0.5 rounded-full bg-[#FF9500]/10 text-[#FF9500] text-[10px] font-bold">
                  {threatSurface.as_rep_roasting_exposure?.percentage_of_directory}% of Domain
                </span>
              </div>
              <div className="text-xl font-bold text-[#1D1D1F]">
                {threatSurface.as_rep_roasting_exposure?.vulnerable_accounts_count} Accounts
              </div>
              <p className="text-xs text-[#6E6E73] leading-relaxed">
                {threatSurface.as_rep_roasting_exposure?.threat_description}
              </p>
            </div>

            {/* Lateral Movement Card */}
            <div className="p-4 rounded-xl bg-white border border-black/[0.06] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5856D6] uppercase">Lateral Blast Radius</span>
                <span className="px-2 py-0.5 rounded-full bg-[#5856D6]/10 text-[#5856D6] text-[10px] font-bold">
                  {threatSurface.lateral_movement_blast_radius?.percentage_of_directory}% At Risk
                </span>
              </div>
              <div className="text-xl font-bold text-[#1D1D1F]">
                {threatSurface.lateral_movement_blast_radius?.total_compromised_nodes_at_risk} Nodes Reachable
              </div>
              <p className="text-xs text-[#6E6E73] leading-relaxed">
                {threatSurface.lateral_movement_blast_radius?.threat_description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
