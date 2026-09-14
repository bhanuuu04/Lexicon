"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Network, AlertCircle, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";

export const BlastRadiusStory: React.FC = () => {
  const [selectedCluster, setSelectedCluster] = useState<number>(0);

  const clusters = [
    {
      id: 0,
      family: "Spring2024! Pattern",
      rootUser: "sarah.miller@lexicon.corp",
      rootRole: "Marketing Specialist",
      compromisedAccounts: 48,
      privilegeAccounts: 3,
      privilegeRoles: ["Domain Admin (svc_backup)", "IT Helpdesk Lead", "DBA Admin"],
      riskScore: 84.5,
      path: "Initial Workstation Compromise -> Shared LAPS/Staging Password -> Backup Service Account -> Domain Admin Escalation",
    },
    {
      id: 1,
      family: "WinterCompany2023#",
      rootUser: "alex.chen@lexicon.corp",
      rootRole: "Junior Developer",
      compromisedAccounts: 32,
      privilegeAccounts: 2,
      privilegeRoles: ["DevOps Lead", "Production AWS Access"],
      riskScore: 79.2,
      path: "Dev Laptop Phish -> Internal Git Repo Credential -> Shared Staging Cluster -> AWS Production Deployer",
    },
  ];

  const current = clusters[selectedCluster];

  return (
    <section className="py-20 md:py-28 bg-white border-t border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#5856D6]/10 text-[#5856D6] text-xs font-semibold">
              <Network className="w-3.5 h-3.5" />
              <span>Blast Radius Intelligence</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F] leading-tight">
              One compromised password never stays isolated.
            </h2>
            
            <p className="text-sm sm:text-base text-[#6E6E73] leading-relaxed">
              Lexicon discovers <strong>805 credential reuse families</strong> spanning over 30,000 Active Directory accounts. When a low-privilege user shares an identical or mutated password with privileged services, lateral escalation is instantaneous.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-[#34C759] mt-0.5 shrink-0" />
                <span className="text-xs text-[#1D1D1F]">
                  <strong>Graph-based lateral movement analysis</strong> revealing hidden privilege escalation paths.
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-[#34C759] mt-0.5 shrink-0" />
                <span className="text-xs text-[#1D1D1F]">
                  <strong>Cross-departmental linkage tracking</strong> between corporate workstations and cloud credentials.
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-[#34C759] mt-0.5 shrink-0" />
                <span className="text-xs text-[#1D1D1F]">
                  <strong>Targeted isolation instructions</strong> prioritizing high-impact multi-account clusters.
                </span>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              {clusters.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCluster(idx)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                    selectedCluster === idx
                      ? "bg-[#1D1D1F] text-white border-[#1D1D1F]"
                      : "bg-[#F5F5F7] text-[#6E6E73] border-black/[0.06] hover:bg-[#E5E5EA]"
                  }`}
                >
                  Cluster #{idx + 1}: {c.family}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Visual Attack Chain Card */}
          <div className="lg:col-span-7">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="apple-card p-6 sm:p-8 bg-[#F5F5F7] border border-black/[0.08] shadow-card rounded-2xl"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider block">
                    Active Cluster Simulation
                  </span>
                  <h4 className="text-base font-semibold text-[#1D1D1F]">
                    {current.family}
                  </h4>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20">
                    Risk Score: {current.riskScore}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5">
                <div className="bg-white p-3 rounded-xl border border-black/[0.04]">
                  <span className="text-[11px] text-[#86868B] block">Initial Compromise</span>
                  <span className="text-xs font-semibold text-[#1D1D1F] truncate block">
                    {current.rootUser}
                  </span>
                  <span className="text-[10px] text-[#6E6E73]">{current.rootRole}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-black/[0.04]">
                  <span className="text-[11px] text-[#86868B] block">Total Accounts Exposed</span>
                  <span className="text-base font-bold text-[#1D1D1F]">
                    {current.compromisedAccounts} accounts
                  </span>
                  <span className="text-[10px] text-[#FF9500]">Lateral Spread</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-black/[0.04] col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-[#86868B] block">Privileged Escalations</span>
                  <span className="text-base font-bold text-[#FF3B30]">
                    {current.privilegeAccounts} Admin Roles
                  </span>
                  <span className="text-[10px] text-[#FF3B30]">Critical Impact</span>
                </div>
              </div>

              {/* Escalation Path Visual */}
              <div className="bg-white p-4 rounded-xl border border-black/[0.04] space-y-3">
                <span className="text-xs font-semibold text-[#1D1D1F] flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#FF3B30]" />
                  <span>Escalation Vector</span>
                </span>
                
                <div className="p-3 bg-[#F5F5F7] rounded-lg text-xs font-mono text-[#1D1D1F] border border-black/[0.04] leading-relaxed">
                  {current.path}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {current.privilegeRoles.map((role) => (
                    <span
                      key={role}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
