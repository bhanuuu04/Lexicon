"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Cpu, EyeOff, Server, Database, CheckCircle2 } from "lucide-react";

export const SecurityArchitecture: React.FC = () => {
  const securityPillars = [
    {
      icon: EyeOff,
      title: "Zero-Exfiltration Architecture",
      desc: "All attack candidate generation and hash resistance testing execute inside sandboxed Web Workers in local browser RAM. Raw corporate passwords never leave your secure perimeter.",
    },
    {
      icon: Lock,
      title: "k-Anonymity Privacy Model",
      desc: "Live external breach verification leverages strict cryptographic k-anonymity. Only the first 5 characters of SHA-1 digests are queried, ensuring complete organizational confidentiality.",
    },
    {
      icon: Cpu,
      title: "Deterministic Risk Intelligence",
      desc: "Zero generative AI hallucinations in risk scoring. Security scores are mathematically computed through deterministic linear models combining entropy, policy, breach history, privilege, and reuse.",
    },
    {
      icon: Server,
      title: "Full Directory Topology Protection",
      desc: "Architected to ingest and monitor 50,000+ corporate identities across Active Directory, Azure Entra ID, and Okta, preserving granular departmental privilege hierarchies.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-white border-t border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Enterprise Security Model</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
            Engineered with Zero-Trust principles and data sovereignty.
          </h2>
          <p className="text-sm sm:text-base text-[#6E6E73] mt-3">
            Designed to exceed the rigorous security, privacy, and auditability requirements of enterprise CISOs and regulatory frameworks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {securityPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="apple-card p-6 bg-[#FAFAFC] border border-black/[0.06] rounded-2xl shadow-card hover:bg-white transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-black/[0.06] flex items-center justify-center text-[#1D1D1F] mb-4 shadow-xs">
                  <Icon className="w-5 h-5 text-[#0071E3]" />
                </div>
                <h3 className="text-base font-semibold text-[#1D1D1F]">
                  {pillar.title}
                </h3>
                <p className="text-xs text-[#6E6E73] mt-2 leading-relaxed">
                  {pillar.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
