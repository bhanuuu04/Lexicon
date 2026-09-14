"use client";

import React from "react";
import { motion } from "framer-motion";
import { KeyRound, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

export const HashRaceTeaser: React.FC = () => {
  const algorithms = [
    {
      name: "NTLM (Windows Active Directory Default)",
      timePerHash: "0.00002 ms",
      gpuRate: "120 Billion / sec",
      status: "Vulnerable",
      statusColor: "text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]/20",
      barWidth: "100%",
      barColor: "bg-[#FF3B30]",
      desc: "Fast single-iteration MD4. Easily exhaustible by off-the-shelf GPU rigs in seconds.",
    },
    {
      name: "SHA-256 (Raw Digest)",
      timePerHash: "0.00015 ms",
      gpuRate: "15 Billion / sec",
      status: "Insecure for Passwords",
      statusColor: "text-[#FF9500] bg-[#FF9500]/10 border-[#FF9500]/20",
      barWidth: "85%",
      barColor: "bg-[#FF9500]",
      desc: "Unsalted or single-round cryptographic digest lacking adaptive computational hardness.",
    },
    {
      name: "bcrypt (Cost Factor 12)",
      timePerHash: "240 ms",
      gpuRate: "12,000 / sec",
      status: "Secure Standard",
      statusColor: "text-[#0071E3] bg-[#0071E3]/10 border-[#0071E3]/20",
      barWidth: "15%",
      barColor: "bg-[#0071E3]",
      desc: "Eksblowfish-based adaptive work factor providing solid resistance against mass GPU cracking.",
    },
    {
      name: "Argon2id (64MB, 4 Passes)",
      timePerHash: "1,200 ms",
      gpuRate: "250 / sec",
      status: "State of the Art",
      statusColor: "text-[#34C759] bg-[#34C759]/10 border-[#34C759]/20",
      barWidth: "3%",
      barColor: "bg-[#34C759]",
      desc: "Memory-hard winner of the Password Hashing Competition. Highly ASIC and GPU resistant.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-white border-t border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-xs font-semibold mb-3">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Cryptographic Benchmarks</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
            Cryptographic hardness: NTLM vs Modern Standards
          </h2>
          <p className="text-sm sm:text-base text-[#6E6E73] mt-3">
            Compare real-time computation speeds across enterprise hashing algorithms. See why migrating away from legacy NTLM is an enterprise imperative.
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
                  <span className="text-[#86868B] block">Execution Time</span>
                  <span className="font-semibold text-[#1D1D1F] font-mono">
                    {algo.timePerHash}
                  </span>
                </div>
                <div>
                  <span className="text-[#86868B] block">Cracking Throughput (RTX 4090)</span>
                  <span className="font-semibold text-[#1D1D1F] font-mono">
                    {algo.gpuRate}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-[#86868B] block">Relative Defense Level</span>
                  <span className="font-semibold text-[#1D1D1F]">
                    {algo.status === "State of the Art" ? "Maximum" : algo.status === "Secure Standard" ? "High" : "Negligible"}
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
