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
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-xs font-semibold border border-[#0071E3]/20">
            <Zap className="w-3.5 h-3.5" />
            <span>Continuous Threat Exposure Validation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
            Validate your defenses before adversaries test them.
          </h2>
          <p className="text-sm sm:text-base text-[#6E6E73] max-w-2xl mx-auto leading-relaxed">
            Simulate realistic adversary password spray, dictionary permutations, and mask attacks in real-time within sandboxed client-side Web Workers—without exposing raw credentials or disrupting operations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-3">
              {(["hybrid", "dictionary", "mask"] as const).map((mode) => {
                const isActive = activeTab === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setActiveTab(mode)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                      isActive
                        ? "bg-white border-[#0071E3] shadow-card ring-2 ring-[#0071E3]/20"
                        : "bg-white/80 hover:bg-white border-black/[0.06] hover:border-black/[0.12] hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold tracking-tight ${isActive ? "text-[#0071E3]" : "text-[#1D1D1F]"}`}>
                        {attackModes[mode].title}
                      </span>
                      <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/15">
                        {attackModes[mode].speed}
                      </span>
                    </div>
                    <p className="text-xs text-[#6E6E73] leading-relaxed">
                      {attackModes[mode].desc}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex items-start space-x-3 text-xs text-[#6E6E73] leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-[#34C759] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#1D1D1F] font-semibold">Enterprise Data Sovereignty:</strong> Simulation runs 100% locally in browser memory. Sensitive hash data is bounded and never transmitted over external networks.
              </span>
            </div>
          </div>

          {/* Terminal / Live Visual */}
          <div className="lg:col-span-7">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="p-6 bg-[#0D1117] text-white rounded-3xl shadow-2xl border border-white/10 font-mono text-xs space-y-4 relative overflow-hidden"
            >
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#0071E3]/10 rounded-full blur-3xl pointer-events-none -z-0"></div>

              <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10 text-[#8B949E]">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                  <span className="ml-2 text-[11px] text-[#8B949E] font-medium font-mono">
                    lexicon-defense://adversary-simulation-stream
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-[#238636]/20 border border-[#238636]/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse"></span>
                  <span className="text-[10px] text-[#34D399] font-sans font-semibold tracking-wide">
                    AUDIT ENGINE RUNNING
                  </span>
                </div>
              </div>

              <div className="relative z-10 space-y-2.5 text-[#E6EDF3]">
                <div className="text-[#8B949E] flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-[#58A6FF]" />
                  <span className="text-[#C9D1D9]">Target: Domain Account <span className="text-[#58A6FF] font-semibold">(jdoe@lexicon.corp)</span> [NTLM Hash: <span className="text-[#7EE787]">8846f7ea...</span>]</span>
                </div>
                <div>
                  <span className="text-[#58A6FF] font-bold">&gt;</span> Executing <span className="text-white font-medium">{current.title}</span>...
                </div>
                <div>
                  <span className="text-[#58A6FF] font-bold">&gt;</span> Candidate mutation pattern:{" "}
                  <span className="text-[#F0883E] font-semibold">{current.sample}</span>
                </div>
                <div className="p-3.5 bg-[#161B22] rounded-xl border border-white/10 space-y-1.5">
                  <div className="text-[11px] text-[#8B949E]">
                    [Worker 1] Evaluated <span className="text-[#C9D1D9]">480,210</span> permutations <span className="text-[#7EE787]">(384.1k/s)</span>
                  </div>
                  <div className="text-[11px] text-[#8B949E]">
                    [Worker 2] Evaluated <span className="text-[#C9D1D9]">492,000</span> permutations <span className="text-[#7EE787]">(393.6k/s)</span>
                  </div>
                  <div className="text-[11px] text-[#F85149] font-semibold pt-1 border-t border-white/5 flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>[VULNERABILITY IDENTIFIED] Elapsed: 2.14s | Entropy: 36.2 bits | Action: Policy Remediation Queued</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/10 text-[11px] text-[#8B949E] font-sans">
                <span>Safe Bounded Audit (Max 10s / 1M candidates)</span>
                <span className="text-[#34D399] font-medium flex items-center space-x-1.5">
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
