"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Terminal, ShieldCheck, Play, Sparkles } from "lucide-react";

export const AttackLabTeaser: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dictionary" | "mask" | "hybrid">("hybrid");

  const attackModes = {
    dictionary: {
      title: "Dictionary & Mutation Engine",
      speed: "1,250,000 c/s",
      desc: "Tests 10,000 common passwords with 8 permutation rules (leetspeak, titlecase, suffixes).",
      sample: "Password -> P@ssw0rd2024! -> p@$$w0rd#",
    },
    mask: {
      title: "Targeted Mask Exhaustion",
      speed: "4,800,000 c/s",
      desc: "Simulates structured patterns like ?u?l?l?l?d?d?s matching corporate seasonal password formats.",
      sample: "Winter2024! -> Summer2023# -> Spring2022$",
    },
    hybrid: {
      title: "Hybrid Company Context Attack",
      speed: "2,100,000 c/s",
      desc: "Combines corporate keywords (Lexicon, IT, Admin) with date increments and special character masks.",
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
            <span>Attack Telemetry Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
            See the risk. Don&apos;t just score it.
          </h2>
          <p className="text-sm sm:text-base text-[#6E6E73] mt-3">
            Interactive, client-side bounded attack telemetry proving exactly how quickly weak credentials collapse under targeted dictionary, mask, and hybrid permutations.
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
                <strong>Zero Server Exfiltration:</strong> Attack simulation executes 100% in local browser Web Workers. Raw credentials never leave client RAM.
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
                    lexicon-worker://telemetry-stream
                  </span>
                </div>
                <span className="text-[10px] text-[#34C759] font-sans font-semibold">
                  THREAD ACTIVE
                </span>
              </div>

              <div className="space-y-2 text-[#E5E5EA]">
                <div className="text-[#86868B] flex items-center space-x-2">
                  <Terminal className="w-3.5 h-3.5 text-[#0071E3]" />
                  <span>Target: Domain User (jdoe@lexicon.corp) [NTLM Hash: 8846f7ea...]</span>
                </div>
                <div>
                  <span className="text-[#0071E3]">&gt;</span> Initializing {current.title}...
                </div>
                <div>
                  <span className="text-[#0071E3]">&gt;</span> Candidate mutation pattern:{" "}
                  <span className="text-[#FF9500]">{current.sample}</span>
                </div>
                <div className="p-3 bg-black/40 rounded-lg border border-white/5 space-y-1">
                  <div className="text-[11px] text-[#A1A1A6]">
                    [Worker 1] Checked 480,210 candidates (384.1k/s)
                  </div>
                  <div className="text-[11px] text-[#A1A1A6]">
                    [Worker 2] Checked 492,000 candidates (393.6k/s)
                  </div>
                  <div className="text-[11px] text-[#34C759] font-bold">
                    [MATCH FOUND] Elapsed: 2.14s | Complexity: 36.2 bits | Status: COMPROMISED
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] text-[#86868B] font-sans">
                <span>Simulation Bounded (Max 10s / 1M hashes)</span>
                <span className="text-white font-medium">Safe POC Demonstration</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
