"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Cpu, EyeOff, Server, Database } from "lucide-react";

export const SecurityArchitecture: React.FC = () => {
  const securityPillars = [
    {
      icon: EyeOff,
      title: "Zero-Exfiltration Telemetry",
      desc: "All attack candidate generation and hash resistance testing execute inside sandboxed Web Workers in the user's browser. Raw passwords are never transmitted over network boundaries.",
    },
    {
      icon: Lock,
      title: "k-Anonymity HIBP Verification",
      desc: "Live breach verification leverages Cloudflare/HIBP k-anonymity. Only the first 5 characters of SHA-1 digests are queried, guaranteeing full password privacy.",
    },
    {
      icon: Cpu,
      title: "Deterministic Risk Calculus",
      desc: "Zero black-box AI hallucinations in core risk scoring. Risk indices are mathematically computed via weighted linear combination of entropy, policy, breach, privilege, and reuse.",
    },
    {
      icon: Database,
      title: "100% Synthetic AD Topology",
      desc: "Engineered from ground up with 50,000 synthetic identities representing authentic enterprise departments, privilege tiers, and realistic password reuse clusters.",
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
            Built with mathematical rigor and zero trust architecture.
          </h2>
          <p className="text-sm sm:text-base text-[#6E6E73] mt-3">
            Designed to meet the stringent security, auditability, and privacy standards of modern enterprise cybersecurity teams.
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
