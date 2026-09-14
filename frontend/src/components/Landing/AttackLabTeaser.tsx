"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Terminal, ShieldCheck, ShieldAlert } from "lucide-react";

export const AttackLabTeaser: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dictionary" | "mask" | "hybrid">("hybrid");

  const attackModes = {
    dictionary: {
      title: "Dictionary & Permutation Audit",
      speed: "1,250,000 checks/sec",
      desc: "Simulates adversarial dictionary spray with 8 corporate mutation rules (leetspeak, titlecase, suffixes).",
      sample: "Password -> P@ssw0rd2024! -> p@$$w0rd#",
    },
    mask: {
      title: "Structured Mask Vulnerability Scan",
      speed: "4,800,000 checks/sec",
      desc: "Detects predictable employee habits like seasonal patterns (?u?l?l?l?d?d?s) before attackers crack them.",
      sample: "Winter2024! -> Summer2023# -> Spring2022$",
    },
    hybrid: {
      title: "Targeted Brand & Keyword Emulation",
      speed: "2,100,000 checks/sec",
      desc: "Tests enterprise resistance against attackers weaponizing company names, department terms, and years.",
      sample: "Lexicon#2024 -> LexiconIT99! -> LexiconAdmin123",
    },
  };

  const current = attackModes[activeTab];

  return (
    <section className="py-20 md:py-28 bg-[#FAFAFC] border-t border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FF9500]/10 text-[#FF9500] text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>Continuous Threat Exposure Validation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
            Validate your defenses before adversaries test them.
          </h2>
          <p className="text-sm sm:text-base text-[#6E6E73] mt-3">
            Simulate realistic adversary password spray, dictionary permutations, and mask attacks in real-time within sandboxed client-side Web Workers—without exposing raw credentials or disrupting operations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-3">
              {(["hybrid", "dictionary", "mask"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveTab(mode)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    activeTab === mode
                      ? "bg-white border-[#0071E3] shadow-card"
                      : "bg-[#F5F5F7] border-transparent hover:bg-white/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1D1D1F]">
                      {attackModes[mode].title}
                    </span>
                    <span className="text-xs font-mono font-medium text-[#0071E3]">
                      {attackModes[mode].speed}
                    </span>
                  </div>
                  <p className="text-xs text-[#6E6E73] mt-1">
                    {attackModes[mode].desc}
                  </p>
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-white border border-black/[0.06] flex items-center space-x-3 text-xs text-[#6E6E73]">
              <ShieldCheck className="w-5 h-5 text-[#34C759] shrink-0" />
              <span>
                <strong>Enterprise Data Sovereignty:</strong> Simulation runs 100% locally in browser memory. Sensitive hash data is bounded and never transmitted over external networks.
              </span>
            </div>
          </div>

          {/* Terminal / Live Visual */}
          <div className="lg:col-span-7">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="apple-card p-6 bg-[#1D1D1F] text-white rounded-2xl shadow-xl font-mono text-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-[#86868B]">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></div>
                  <span className="ml-2 text-[11px] text-[#A1A1A6]">
                    lexicon-defense://adversary-simulation-stream
                  </span>
                </div>
                <span className="text-[10px] text-[#34C759] font-sans font-semibold">
                  AUDIT ENGINE RUNNING
                </span>
              </div>

              <div className="space-y-2 text-[#E5E5EA]">
                <div className="text-[#86868B] flex items-center space-x-2">
                  <Terminal className="w-3.5 h-3.5 text-[#0071E3]" />
                  <span>Target: Domain Account (jdoe@lexicon.corp) [NTLM Hash: 8846f7ea...]</span>
                </div>
                <div>
                  <span className="text-[#0071E3]">&gt;</span> Executing {current.title}...
                </div>
                <div>
                  <span className="text-[#0071E3]">&gt;</span> Candidate mutation pattern:{" "}
                  <span className="text-[#FF9500]">{current.sample}</span>
                </div>
                <div className="p-3 bg-black/40 rounded-lg border border-white/5 space-y-1">
                  <div className="text-[11px] text-[#A1A1A6]">
                    [Worker 1] Evaluated 480,210 permutations (384.1k/s)
                  </div>
                  <div className="text-[11px] text-[#A1A1A6]">
                    [Worker 2] Evaluated 492,000 permutations (393.6k/s)
                  </div>
                  <div className="text-[11px] text-[#FF3B30] font-bold">
                    [VULNERABILITY IDENTIFIED] Elapsed: 2.14s | Entropy: 36.2 bits | Action: Policy Remediation Queued
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] text-[#86868B] font-sans">
                <span>Safe Bounded Audit (Max 10s / 1M candidates)</span>
                <span className="text-[#34C759] font-medium flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Zero Network Exposure</span>
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
