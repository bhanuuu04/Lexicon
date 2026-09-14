"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Network, KeyRound, Cpu, ShieldCheck } from "lucide-react";

export const TrustMetrics: React.FC = () => {
  const metrics = [
    {
      label: "Synthetic Identities",
      value: "50,000",
      subtext: "Active Directory topology simulated",
      icon: Users,
    },
    {
      label: "Reuse Families",
      value: "805",
      subtext: "Across 30,000 cross-linked accounts",
      icon: Network,
    },
    {
      label: "Hashing Standards",
      value: "4 Algos",
      subtext: "NTLM, SHA-256, bcrypt, Argon2id",
      icon: KeyRound,
    },
    {
      label: "Breach Lookup",
      value: "O(1)",
      subtext: "In-memory synthetic dictionary corpus",
      icon: Cpu,
    },
    {
      label: "Privacy Guarantee",
      value: "100%",
      subtext: "Client-side bounded attack telemetry",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="py-12 border-y border-black/[0.06] bg-[#FFFFFF]/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 lg:gap-8">
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className="flex flex-col items-center text-center p-4 rounded-xl bg-white/80 border border-black/[0.04] shadow-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] text-[#1D1D1F] flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-[#1D1D1F]" />
                </div>
                <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
                  {m.value}
                </span>
                <span className="text-xs font-medium text-[#1D1D1F] mt-1">
                  {m.label}
                </span>
                <span className="text-[11px] text-[#86868B] mt-0.5 leading-tight">
                  {m.subtext}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
