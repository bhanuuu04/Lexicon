"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  X,
  RefreshCw,
  Clock,
  Cpu,
  Layers,
  ShieldAlert,
  Server,
  Activity,
  Check
} from "lucide-react";
import { generateNewDataset } from "../../lib/api";
import { GenerateDatasetResponse } from "../../types";

interface GenerateDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetGenerated: (response: GenerateDatasetResponse) => void;
  currentCount?: number;
}

export const GenerateDatasetModal: React.FC<GenerateDatasetModalProps> = ({
  isOpen,
  onClose,
  onDatasetGenerated,
  currentCount = 50000,
}) => {
  const [selectedCount, setSelectedCount] = useState<number>(50000);
  const [customInput, setCustomInput] = useState<string>("");
  const [orgName, setOrgName] = useState<string>("Chandigarh University");
  const [domainName, setDomainName] = useState<string>("culko.in");
  const [archetype, setArchetype] = useState<string>("Healthcare Network & Hospital");
  const [confirmationInput, setConfirmationInput] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Live Timer & Stage Animation State
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const effectiveCount = customInput ? parseInt(customInput, 10) || selectedCount : selectedCount;

  // Estimated Duration in Seconds based on volume (~3.8k accounts per second including hash computing & DB bulk upload)
  const estimatedTotalSeconds = Math.max(3, Math.round(effectiveCount / 3800));

  const stages = [
    {
      title: "Synthesizing Identity Hierarchy",
      subtitle: `Generating Active Directory tree, departments, and ${effectiveCount.toLocaleString()} corporate identities`,
      icon: Server,
      color: "#0071E3",
    },
    {
      title: "Cryptographic Hash Matrix & Entropy",
      subtitle: `Computing ${(effectiveCount * 5).toLocaleString()} hashes across 5 algos + zxcvbn entropy deficit scoring`,
      icon: Cpu,
      color: "#5856D6",
    },
    {
      title: "Supabase DB Single-Transaction Stream",
      subtitle: "Flushing all records at once to Supabase Cloud PostgreSQL in consolidated bulk transaction",
      icon: Database,
      color: "#34C759",
    },
    {
      title: "Domain Risk Posture Calibration",
      subtitle: "Indexing MITRE ATT&CK vectors, NIST FGPP compliance, and organizational health index",
      icon: Activity,
      color: "#FF9500",
    },
  ];

  // Timer & stage progression during generation
  useEffect(() => {
    let interval: any = null;
    let progressInterval: any = null;

    if (isGenerating && !isCompleted) {
      const startTime = Date.now();
      interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setElapsedSeconds(elapsed);
      }, 100);

      progressInterval = setInterval(() => {
        setProgressPct((prev) => {
          if (prev < 25) {
            setCurrentStageIndex(0);
            return prev + 1.2;
          } else if (prev < 55) {
            setCurrentStageIndex(1);
            return prev + 0.9;
          } else if (prev < 85) {
            setCurrentStageIndex(2);
            return prev + 0.7;
          } else if (prev < 96) {
            setCurrentStageIndex(3);
            return prev + 0.3;
          }
          return prev;
        });
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isGenerating, isCompleted]);

  if (!isOpen) return null;

  const presets = [1000, 5000, 10000, 25000, 50000];
  const archetypes = [
    "Fortune 500 Enterprise",
    "Financial Services & Banking",
    "Healthcare Network & Hospital",
    "Tech Unicorn & Cloud SaaS",
    "Critical Infrastructure & Defense",
    "Global Logistics & Retail",
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationInput.trim().toUpperCase() !== "GENERATE") {
      setError("Please type 'GENERATE' exactly to confirm dataset replacement.");
      return;
    }

    if (effectiveCount < 100 || effectiveCount > 100000) {
      setError("Account count must be between 100 and 100,000.");
      return;
    }

    setError(null);
    setIsGenerating(true);
    setElapsedSeconds(0);
    setProgressPct(5);
    setCurrentStageIndex(0);
    setIsCompleted(false);

    try {
      const response = await generateNewDataset({
        count: effectiveCount,
        enterprise_name: orgName.trim() || "Lexicon Enterprise Systems",
        domain: domainName.trim() || "lexicon.corp",
        archetype: archetype,
        replace_supabase: true,
      });

      // Complete smoothly
      setProgressPct(100);
      setCurrentStageIndex(3);
      setIsCompleted(true);

      setTimeout(() => {
        onDatasetGenerated(response);
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || "Failed to generate new synthetic dataset.");
      setIsGenerating(false);
    }
  };

  const remainingSeconds = Math.max(0, Math.round(estimatedTotalSeconds - elapsedSeconds));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-black/[0.08] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-black/[0.06] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1D1D1F]">
                Generate Enterprise Dataset
              </h3>
              <p className="text-xs text-[#6E6E73]">
                Multi-Enterprise Synthesis • Supabase DB Real-Time Replacement
              </p>
            </div>
          </div>
          {!isGenerating && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-black/[0.05] flex items-center justify-center text-[#86868B] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body with Framer Motion AnimatePresence */}
        <div className="p-6 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {!isGenerating ? (
              /* CONFIGURATION FORM VIEW */
              <motion.div
                key="config-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Warning Banner */}
                <div className="p-4 rounded-2xl bg-[#FF9500]/[0.08] border border-[#FF9500]/20 flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-[#FF9500] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#1D1D1F] space-y-1">
                    <p className="font-semibold text-[#FF9500]">Supabase Database Replacement Notice</p>
                    <p className="text-[#6E6E73] leading-relaxed">
                      Generating a new dataset will <strong>delete all existing data in Supabase PostgreSQL</strong> and replace it with the new organization records, <strong>{effectiveCount.toLocaleString()}</strong> Active Directory accounts, and fresh audit summaries in a <strong>single bulk upload</strong>.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleGenerate} className="space-y-4">
                  {/* Enterprise Organization Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#86868B] block mb-1.5">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Chandigarh University"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#86868B] block mb-1.5">
                        Domain Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. culko.in"
                        value={domainName}
                        onChange={(e) => setDomainName(e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* Archetype */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#86868B] block mb-1.5">
                      Enterprise Archetype
                    </label>
                    <select
                      value={archetype}
                      onChange={(e) => setArchetype(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:bg-white transition"
                    >
                      {archetypes.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account Count Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                        Select Account Volume
                      </label>
                      <span className="text-[11px] text-[#0071E3] font-mono font-semibold">
                        Est. Time: ~{estimatedTotalSeconds}s (Bulk Insert)
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {presets.map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => {
                            setSelectedCount(count);
                            setCustomInput("");
                          }}
                          className={`py-2 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                            selectedCount === count && !customInput
                              ? "bg-[#0071E3] text-white border-[#0071E3] shadow-xs"
                              : "bg-[#F5F5F7] hover:bg-[#EBEBED] text-[#1D1D1F] border-black/[0.06]"
                          }`}
                        >
                          {count >= 1000 ? `${count / 1000}k` : count}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Account Size */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#86868B] block mb-1.5">
                      Or Custom Account Size (100 - 100,000)
                    </label>
                    <input
                      type="number"
                      min={100}
                      max={100000}
                      placeholder="e.g. 50000"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:bg-white transition"
                    />
                  </div>

                  {/* Confirmation Input */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#86868B] block mb-1.5">
                      Type <span className="font-mono text-[#FF3B30] font-bold">GENERATE</span> to confirm
                    </label>
                    <input
                      type="text"
                      placeholder="GENERATE"
                      value={confirmationInput}
                      onChange={(e) => setConfirmationInput(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#FF3B30]/20 focus:bg-white transition font-mono"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-[#FF3B30]/10 text-[#FF3B30] text-xs font-medium border border-[#FF3B30]/20">
                      {error}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-[#F5F5F7] hover:bg-[#EBEBED] text-xs font-medium text-[#1D1D1F] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={confirmationInput.trim().toUpperCase() !== "GENERATE"}
                      className="px-5 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-40 text-xs font-semibold text-white flex items-center space-x-2 shadow-xs transition active:scale-[0.98] cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate & Replace in Supabase ({effectiveCount.toLocaleString()})</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              /* FRAMER MOTION REAL-TIME PROGRESS & ESTIMATED TIMER VIEW */
              <motion.div
                key="generating-progress"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="py-6 space-y-6 text-center relative"
              >
                {/* Background Ambient Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#0071E3]/[0.08] rounded-full blur-3xl -z-0 pointer-events-none" />

                {/* Animated Central Cyber Orb */}
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  {!isCompleted ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-2 border-dashed border-[#0071E3]/40"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.18, 1], opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-1 rounded-full bg-[#0071E3]/10"
                      />
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0071E3] to-[#47A1FF] text-white flex items-center justify-center shadow-lg shadow-[#0071E3]/30 z-10">
                        <Database className="w-7 h-7 animate-pulse" />
                      </div>
                    </>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-16 h-16 rounded-2xl bg-[#34C759] text-white flex items-center justify-center shadow-lg shadow-[#34C759]/30 z-10"
                    >
                      <Check className="w-8 h-8" />
                    </motion.div>
                  )}
                </div>

                {/* Title and Active Stage */}
                <div className="space-y-1.5 relative z-10">
                  <h4 className="text-lg font-semibold text-[#1D1D1F]">
                    {isCompleted
                      ? "Enterprise Dataset Generated & Replaced!"
                      : stages[currentStageIndex]?.title}
                  </h4>
                  <p className="text-xs text-[#6E6E73] max-w-md mx-auto">
                    {isCompleted
                      ? `Successfully synchronized ${effectiveCount.toLocaleString()} accounts to Supabase Cloud PostgreSQL.`
                      : stages[currentStageIndex]?.subtitle}
                  </p>
                </div>

                {/* Live Estimated Timer & Progress Ticker */}
                <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] max-w-md mx-auto space-y-3 relative z-10">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 text-[#1D1D1F] font-mono font-semibold">
                      <Clock className="w-3.5 h-3.5 text-[#0071E3]" />
                      <span>Elapsed: {elapsedSeconds.toFixed(1)}s</span>
                    </div>

                    {!isCompleted ? (
                      <span className="text-[11px] font-mono font-medium text-[#FF9500] px-2 py-0.5 rounded-full bg-[#FF9500]/10 border border-[#FF9500]/20">
                        Est. Remaining: ~{remainingSeconds}s
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono font-medium text-[#34C759] px-2 py-0.5 rounded-full bg-[#34C759]/10 border border-[#34C759]/20 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed in {elapsedSeconds.toFixed(1)}s</span>
                      </span>
                    )}
                  </div>

                  {/* Progress Bar with Framer Motion */}
                  <div className="w-full h-2.5 bg-black/[0.06] rounded-full overflow-hidden relative">
                    <motion.div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted
                          ? "bg-[#34C759]"
                          : "bg-gradient-to-r from-[#0071E3] via-[#5856D6] to-[#0071E3]"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(8, progressPct))}%` }}
                    />
                  </div>

                  {/* Telemetry Chips */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-left">
                    <div className="px-2.5 py-1.5 rounded-xl bg-white border border-black/[0.04]">
                      <span className="text-[#86868B] block text-[10px] uppercase font-semibold">Scope</span>
                      <span className="font-semibold text-[#1D1D1F] truncate block">
                        {orgName} ({domainName})
                      </span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-xl bg-white border border-black/[0.04]">
                      <span className="text-[#86868B] block text-[10px] uppercase font-semibold">Bulk Upload</span>
                      <span className="font-semibold text-[#0071E3] block">
                        {effectiveCount.toLocaleString()} Records at Once
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Stages Indicator */}
                <div className="flex items-center justify-center space-x-2 pt-1">
                  {stages.map((stg, i) => (
                    <div
                      key={i}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                        i === currentStageIndex && !isCompleted
                          ? "bg-[#0071E3] text-white shadow-xs font-semibold scale-105"
                          : i < currentStageIndex || isCompleted
                          ? "bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20"
                          : "bg-black/[0.04] text-[#86868B]"
                      }`}
                    >
                      {i < currentStageIndex || isCompleted ? (
                        <Check className="w-2.5 h-2.5 shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                      )}
                      <span>Stage {i + 1}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

