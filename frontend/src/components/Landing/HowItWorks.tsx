"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Search, AlertTriangle, ShieldAlert, Sparkles } from "lucide-react";

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: "01",
      title: "Discover & Ingest",
      subtitle: "Enterprise Identity Surface",
      desc: "Ingests directory topology across 50,000 corporate accounts, mapping domain admins, IT operations, and standard users.",
      icon: ShieldCheck,
    },
    {
      num: "02",
      title: "Detect Vulnerabilities",
      subtitle: "Identity Threat Intelligence",
      desc: "Instantly correlates accounts against known breach corpora, weak entropy patterns, and company dictionary mutations.",
      icon: Search,
    },
    {
      num: "03",
      title: "Prioritize Defense",
      subtitle: "Deterministic Risk Calculus",
      desc: "Calculates precise composite risk scores (Entropy, Policy, Breach, Privilege, Reuse) to eliminate false positives.",
      icon: AlertTriangle,
    },
    {
      num: "04",
      title: "Simulate & Validate",
      subtitle: "Proactive Security Testing",
      desc: "Runs client-side bounded attack simulations in local Web Workers to verify credential resilience under adversarial conditions.",
      icon: ShieldAlert,
    },
    {
      num: "05",
      title: "Remediate & Protect",
      subtitle: "Automated Organization Defense",
      desc: "Generates board-level executive briefings, Active Directory PowerShell policies, and employee self-defense guides.",
      icon: Sparkles,
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#FAFAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0071E3] block mb-2">
            The Enterprise Protection Lifecycle
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#1D1D1F] tracking-tight">
            How Lexicon safeguards your organization from identity risk.
          </h2>
          <p className="text-sm sm:text-base text-[#6E6E73] mt-3">
            An end-to-end continuous defense workflow engineered for security operations, compliance, and CISO leadership.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 lg:gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="apple-card p-6 flex flex-col justify-between border border-black/[0.06] bg-white shadow-card hover:shadow-card-hover transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#F5F5F7] text-[#1D1D1F]">
                      {step.num}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] flex items-center justify-center text-[#0071E3]">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-[#1D1D1F] tracking-tight">
                    {step.title}
                  </h3>
                  <span className="text-xs font-medium text-[#0071E3] block mt-0.5 mb-2">
                    {step.subtitle}
                  </span>
                  <p className="text-xs text-[#6E6E73] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
