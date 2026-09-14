"use client";

import React from "react";
import { motion } from "framer-motion";
import { KeyRound, ShieldAlert, ShieldCheck } from "lucide-react";

export const HashRaceTeaser: React.FC = () => {
  const algorithms = [
    {
      name: "NTLM (Windows Active Directory Default)",
      timePerHash: "0.00002 ms",
      gpuRate: "120 Billion / sec",
      status: "Critical Risk (Legacy)",
      statusColor: "text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]/20",
      defenseRating: "Vulnerable to Offline Extraction",
      desc: "Fast single-round MD4 digest. Easily cracked by attackers within seconds if NTDS.dit is accessed.",
    },
    {
      name: "SHA-256 (Single Digest)",
      timePerHash: "0.00015 ms",
      gpuRate: "15 Billion / sec",
      status: "Insufficient for Passwords",
      statusColor: "text-[#FF9500] bg-[#FF9500]/10 border-[#FF9500]/20",
      defenseRating: "Low Computational Resistance",
      desc: "Lacks adaptive work factor. Vulnerable to fast consumer GPU array brute force.",
    },
    {
      name: "bcrypt (Cost Factor 12)",
      timePerHash: "240 ms",
      gpuRate: "12,000 / sec",
      status: "Enterprise Standard",
      statusColor: "text-[#0071E3] bg-[#0071E3]/10 border-[#0071E3]/20",
      defenseRating: "High Protection",
      desc: "Adaptive work factor slows down offline cracking attacks by orders of magnitude.",
    },
    {
      name: "Argon2id (64MB, 4 Passes)",
      timePerHash: "1,200 ms",
      gpuRate: "250 / sec",
      status: "Zero-Trust Hardened",
      statusColor: "text-[#34C759] bg-[#34C759]/10 border-[#34C759]/20",
      defenseRating: "Maximum Resistance",
      desc: "Memory-hard winner of the Password Hashing Competition. Defeats ASIC and massive GPU clusters.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-white border-t border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-xs font-semibold mb-3">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Cryptographic Hardening & Defense</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
            Cryptographic defense: Why algorithm choice defines breach survival.
          </h2>
          <p className="text-sm sm:text-base text-[#6E6E73] mt-3">
            Understand how hashing resistance protects enterprise data when database snapshots are compromised. Lexicon guides your organization to modernize beyond vulnerable legacy protocols.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {algorithms.map((algo, idx) => (
            <motion.div
              key={algo.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="apple-card p-5 sm:p-6 bg-[#FAFAFC] border border-black/[0.06] rounded-xl hover:bg-white transition-all shadow-card"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-[#1D1D1F]">
                    {algo.name}
                  </h4>
                  <p className="text-xs text-[#6E6E73] mt-0.5">{algo.desc}</p>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${algo.statusColor}`}
                  >
                    {algo.status}
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-xs border-t border-black/[0.04]">
                <div>
                  <span className="text-[#86868B] block">Execution Hardness</span>
                  <span className="font-semibold text-[#1D1D1F] font-mono">
                    {algo.timePerHash}
                  </span>
                </div>
                <div>
                  <span className="text-[#86868B] block">Adversary Cracking Rate (RTX 4090)</span>
                  <span className="font-semibold text-[#1D1D1F] font-mono">
                    {algo.gpuRate}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-[#86868B] block">Enterprise Defense Posture</span>
                  <span className="font-semibold text-[#1D1D1F]">
                    {algo.defenseRating}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
