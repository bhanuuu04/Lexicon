"use client";

import React from "react";
import { motion } from "framer-motion";
import { Database, Search, AlertTriangle, Play, Sparkles } from "lucide-react";

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: "01",
      title: "Synthesize & Ingest",
      subtitle: "Active Directory Corpus",
      desc: "50,000 synthetic AD accounts spanning Domain Admins, IT Ops, and Executives, with realistic credential reuse patterns.",
      icon: Database,
    },
    {
      num: "02",
      title: "Audit & Correlate",
      subtitle: "Multi-Factor Scoring",
      desc: "Instant O(1) hash lookups, zxcvbn entropy calculation, and company dictionary mutation matching.",
      icon: Search,
    },
    {
      num: "03",
      title: "Prioritize Risk",
      subtitle: "Deterministic Formula",
      desc: "Composite risk index combining Entropy (30%), Policy (25%), Breach (20%), Privilege (15%), and Reuse (10%).",
      icon: AlertTriangle,
    },
    {
      num: "04",
      title: "Simulate Attacks",
      subtitle: "Client-Side Telemetry",
      desc: "Web Worker bounded candidate generation executing dictionary, mask, and hybrid attacks in-browser without data leak.",
      icon: Play,
    },
    {
      num: "05",
      title: "AI Remediation",
      subtitle: "Targeted Policy Output",
      desc: "Executive briefings, IT helpdesk action scripts, and custom Active Directory fine-grained password policies.",
      icon: Sparkles,
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#FAFAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0071E3] block mb-2">
            The Lexicon Pipeline
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#1D1D1F] tracking-tight">
            How Lexicon transforms credential chaos into actionable intelligence.
          </h2>
          <p className="text-sm sm:text-base text-[#6E6E73] mt-3">
            An end-to-end deterministic security workflow engineered for identity and access operations.
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
                    <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] flex items-center justify-center text-[#1D1D1F]">
                      <Icon className="w-4 h-4 text-[#1D1D1F]" />
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
