"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Zap,
  ShieldAlert,
  Play,
  RotateCcw,
  Gauge,
  Cpu,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Server,
  Layers,
  Sparkles,
  Lock,
  ArrowRight,
  Info
} from "lucide-react";
import { Account, AttackCandidateProgress } from "../../types";
import { submitAttackResult, executeAttackSimulation, fetchHardwareBenchmarks } from "../../lib/api";
import { formatRiskScore, getTierColor } from "../../lib/riskFormat";

interface AttackLabArenaProps {
  targetAccount: Account | null;
  onAccountUpdated?: (updatedAccount: Account) => void;
  onSelectHeroAccount?: () => void;
}

export const AttackLabArena: React.FC<AttackLabArenaProps> = ({
  targetAccount,
  onAccountUpdated,
  onSelectHeroAccount,
}) => {
  const [status, setStatus] = useState<
    "IDLE" | "ACCOUNT_SELECTED" | "RUNNING" | "MATCHED" | "BUDGET_EXHAUSTED" | "RESET"
  >(targetAccount ? "ACCOUNT_SELECTED" : "IDLE");

  const [algorithm, setAlgorithm] = useState<"NTLM" | "MD5" | "SHA-256">("NTLM");
  const [maxCandidates, setMaxCandidates] = useState<number>(50000);
  const [timeBudgetMs, setTimeBudgetMs] = useState<number>(30000);

  const [progress, setProgress] = useState<AttackCandidateProgress>({
    candidates_tested: 0,
    elapsed_ms: 0,
    current_rate: 0,
    current_candidate: "",
    matched: false,
    status: "IDLE",
  });

  const [attackResult, setAttackResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatedRiskInfo, setUpdatedRiskInfo] = useState<{
    baseline_risk: number;
    attack_adjustment: number;
    final_risk: number;
    final_tier: string;
    message: string;
  } | null>(null);

  const [hardwareEstimates, setHardwareEstimates] = useState<any>(null);

  const workerRef = useRef<Worker | null>(null);
  const lastTargetAccountIdRef = useRef<string | null>(targetAccount?.id || null);

  // When switching to a DIFFERENT account ID, reset the attack state
  useEffect(() => {
    if (targetAccount) {
      if (lastTargetAccountIdRef.current !== targetAccount.id) {
        lastTargetAccountIdRef.current = targetAccount.id;
        resetAttack();
        setStatus("ACCOUNT_SELECTED");
      }
    } else {
      lastTargetAccountIdRef.current = null;
      resetAttack();
      setStatus("IDLE");
    }
  }, [targetAccount?.id]);

  // Clean up worker on component unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const resetAttack = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setProgress({
      candidates_tested: 0,
      elapsed_ms: 0,
      current_rate: 0,
      current_candidate: "",
      matched: false,
      status: "IDLE",
    });
    setAttackResult(null);
    setUpdatedRiskInfo(null);
    setHardwareEstimates(null);
  };

  const cancelAttack = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setStatus("BUDGET_EXHAUSTED");
    setProgress((prev) => ({ ...prev, status: "BUDGET_EXHAUSTED" }));
  };

  const computeHardwareTelemetry = (candidates: number, algo: string) => {
    const rates: Record<string, Record<string, number>> = {
      cpu_single: { MD5: 15_000_000, NTLM: 20_000_000, "SHA-256": 10_000_000, Bcrypt: 2_000, Argon2id: 50 },
      gpu_rtx4090: { MD5: 160_000_000_000, NTLM: 220_000_000_000, "SHA-256": 80_000_000_000, Bcrypt: 120_000, Argon2id: 4_000 },
      gpu_cluster_8x: { MD5: 1_280_000_000_000, NTLM: 1_760_000_000_000, "SHA-256": 640_000_000_000, Bcrypt: 960_000, Argon2id: 32_000 },
    };

    const formatT = (sec: number) => {
      if (sec < 0.001) return "< 1 ms (Instant)";
      if (sec < 1) return `${(sec * 1000).toFixed(1)} ms`;
      if (sec < 60) return `${sec.toFixed(2)} sec`;
      if (sec < 3600) return `${(sec / 60).toFixed(1)} min`;
      return `${(sec / 3600).toFixed(1)} hours`;
    };

    const count = Math.max(1, candidates);
    return {
      cpu_single: {
        name: "Single-Core CPU",
        rate: rates.cpu_single[algo] || 10_000_000,
        timeFormatted: formatT(count / (rates.cpu_single[algo] || 10_000_000)),
      },
      gpu_rtx4090: {
        name: "1x NVIDIA RTX 4090 (24GB)",
        rate: rates.gpu_rtx4090[algo] || 100_000_000_000,
        timeFormatted: formatT(count / (rates.gpu_rtx4090[algo] || 100_000_000_000)),
      },
      gpu_cluster_8x: {
        name: "8x RTX 4090 Hashcat Rig",
        rate: rates.gpu_cluster_8x[algo] || 1_000_000_000_000,
        timeFormatted: formatT(count / (rates.gpu_cluster_8x[algo] || 1_000_000_000_000)),
      },
    };
  };

  const startAttack = async () => {
    if (!targetAccount) return;

    resetAttack();
    setStatus("RUNNING");

    // Target hash selection based on algorithm
    let targetHash = targetAccount.hash_ntlm;
    if (algorithm === "MD5") targetHash = targetAccount.hash_md5;
    if (algorithm === "SHA-256") targetHash = targetAccount.hash_sha256;

    if (!targetHash) {
      alert(`Hash for ${algorithm} is missing on this account.`);
      setStatus("IDLE");
      return;
    }

    try {
      workerRef.current = new Worker(new URL("../../workers/attackWorker.ts", import.meta.url));

      workerRef.current.onmessage = async (e: MessageEvent) => {
        const data = e.data;

        if (data.type === "PROGRESS") {
          setProgress({
            candidates_tested: data.candidates_tested,
            elapsed_ms: data.elapsed_ms,
            current_rate: data.current_rate,
            current_candidate: data.current_candidate,
            matched: false,
            status: "RUNNING",
          });
        } else if (data.type === "RESULT") {
          const finalResult = data.result;
          setAttackResult(finalResult);
          setStatus(finalResult.matched ? "MATCHED" : "BUDGET_EXHAUSTED");

          setProgress({
            candidates_tested: finalResult.candidates_tested,
            elapsed_ms: finalResult.elapsed_ms,
            current_rate: Math.round((finalResult.candidates_tested / (finalResult.elapsed_ms || 1)) * 1000),
            current_candidate: finalResult.matched_password || "",
            matched: finalResult.matched,
            matched_password: finalResult.matched_password,
            matched_rule: finalResult.matched_rule,
            status: finalResult.matched ? "MATCHED" : "BUDGET_EXHAUSTED",
          });

          // Calculate hardware speed comparison
          const hw = computeHardwareTelemetry(finalResult.candidates_tested, algorithm);
          setHardwareEstimates(hw);

          // Submit attack telemetry to backend
          setIsSubmitting(true);
          try {
            const apiRes = await submitAttackResult({
              account_id: targetAccount.id,
              algorithm: algorithm,
              candidates_tested: finalResult.candidates_tested,
              elapsed_ms: finalResult.elapsed_ms,
              matched: finalResult.matched,
              matched_rule: finalResult.matched_rule,
              time_budget_ms: timeBudgetMs,
            });

            setUpdatedRiskInfo({
              baseline_risk: apiRes.baseline_risk,
              attack_adjustment: apiRes.attack_adjustment,
              final_risk: apiRes.final_risk,
              final_tier: apiRes.final_tier,
              message: apiRes.message,
            });

            if (onAccountUpdated) {
              const updated: Account = {
                ...targetAccount,
                attack_adjustment: apiRes.attack_adjustment,
                final_risk: apiRes.final_risk,
                final_tier: apiRes.final_tier,
              };
              onAccountUpdated(updated);
            }
          } catch (err) {
            console.error("Failed to submit attack result to backend:", err);
          } finally {
            setIsSubmitting(false);
          }
        }
      };

      workerRef.current.postMessage({
        type: "START",
        payload: {
          accountId: targetAccount.id,
          targetHash: targetHash,
          algorithm: algorithm,
          maxCandidates: maxCandidates,
          timeBudgetMs: timeBudgetMs,
          orgName: "Company",
          userContext: {
            username: targetAccount.username,
            first_name: targetAccount.first_name,
            last_name: targetAccount.last_name,
            department: targetAccount.department,
            role: targetAccount.role,
          },
        },
      });
    } catch (err) {
      console.error("Worker initialization error:", err);
      setStatus("IDLE");
    }
  };

  return (
    <div className="space-y-6">
      {/* Target Account Summary Banner */}
      {targetAccount ? (
        <div className="apple-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-black/[0.08] bg-white">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF3B30]/[0.08] text-[#FF3B30] text-[11px] font-semibold uppercase tracking-wider font-mono">
                {targetAccount.id}
              </span>
              <span className="text-sm font-semibold text-[#1D1D1F] font-sans">
                {targetAccount.username}
              </span>
              <span className="text-xs text-[#86868B] font-normal">
                ({targetAccount.department} • {targetAccount.role})
              </span>
              {targetAccount.is_hero && (
                <span className="px-2 py-0.5 rounded-full bg-[#5856D6]/10 text-[#5856D6] text-[10px] font-bold">
                  ★ HERO TARGET #42
                </span>
              )}
            </div>
            <div className="text-xs text-[#6E6E73] flex items-center space-x-4">
              <span>
                Baseline Risk:{" "}
                <strong className="text-[#1D1D1F]">
                  {formatRiskScore(targetAccount.baseline_risk)} ({targetAccount.baseline_tier})
                </strong>
              </span>
              <span>
                MFA:{" "}
                <strong className={targetAccount.mfa_enabled ? "text-[#34C759]" : "text-[#FF3B30]"}>
                  {targetAccount.mfa_enabled ? "Enabled" : "None"}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Algorithm Selector */}
            <div className="flex items-center bg-[#F5F5F7] p-1 rounded-xl text-xs border border-black/[0.06]">
              <button
                disabled={status === "RUNNING"}
                onClick={() => setAlgorithm("NTLM")}
                className={`px-3 py-1 rounded-lg transition font-medium ${
                  algorithm === "NTLM" ? "bg-white text-[#1D1D1F] shadow-sm font-semibold" : "text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                NTLM
              </button>
              <button
                disabled={status === "RUNNING"}
                onClick={() => setAlgorithm("MD5")}
                className={`px-3 py-1 rounded-lg transition font-medium ${
                  algorithm === "MD5" ? "bg-white text-[#1D1D1F] shadow-sm font-semibold" : "text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                MD5
              </button>
              <button
                disabled={status === "RUNNING"}
                onClick={() => setAlgorithm("SHA-256")}
                className={`px-3 py-1 rounded-lg transition font-medium ${
                  algorithm === "SHA-256" ? "bg-white text-[#1D1D1F] shadow-sm font-semibold" : "text-[#6E6E73] hover:text-[#1D1D1F]"
                }`}
              >
                SHA-256
              </button>
            </div>

            {/* Launch / Cancel Button */}
            {status === "RUNNING" ? (
              <button
                onClick={cancelAttack}
                className="px-4 py-2 rounded-xl bg-[#FF3B30]/[0.1] border border-[#FF3B30]/30 text-[#FF3B30] hover:bg-[#FF3B30]/[0.2] font-semibold flex items-center space-x-2 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Abort Attack</span>
              </button>
            ) : (
              <button
                onClick={startAttack}
                className="px-4 py-2 rounded-xl bg-[#FF3B30] hover:bg-[#E02E24] text-white font-semibold flex items-center space-x-2 shadow-sm transition active:scale-[0.98]"
              >
                <Play className="w-4 h-4" />
                <span>Execute Bounded Attack</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl border border-dashed border-black/[0.1] bg-white text-center text-[#86868B] font-sans">
          No account selected. Select an account from the Directory or click &quot;Target Hero Account&quot;.
        </div>
      )}

      {/* Attack Telemetry Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Telemetry Gauges & Odometer */}
        <div className="lg:col-span-2 apple-card p-6 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
              <h3 className="text-sm font-semibold text-[#1D1D1F] uppercase tracking-wider flex items-center space-x-2 font-sans">
                <Gauge className="w-4 h-4 text-[#34C759]" />
                <span>Live Candidate Stream & Telemetry</span>
              </h3>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-[#6E6E73]">Budget Limit:</span>
                <span className="text-[#1D1D1F] font-semibold">{maxCandidates.toLocaleString()} cands / {timeBudgetMs / 1000}s</span>
              </div>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-3 gap-3.5 my-6">
              <div className="p-4 rounded-xl bg-[#F5F5F7] border border-black/[0.04] text-center">
                <span className="text-[11px] text-[#86868B] uppercase block font-medium">Candidates Tested</span>
                <span className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] mt-1 block font-sans">
                  {progress.candidates_tested.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#86868B] mt-0.5 block">
                  of {maxCandidates.toLocaleString()} Max
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#F5F5F7] border border-black/[0.04] text-center">
                <span className="text-[11px] text-[#86868B] uppercase block font-medium">Elapsed Time</span>
                <span className="text-2xl sm:text-3xl font-semibold text-[#0071E3] mt-1 block font-sans">
                  {(progress.elapsed_ms / 1000).toFixed(2)}s
                </span>
                <span className="text-[10px] text-[#86868B] mt-0.5 block">
                  of {timeBudgetMs / 1000}s Budget
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#F5F5F7] border border-black/[0.04] text-center">
                <span className="text-[11px] text-[#86868B] uppercase block font-medium">Throughput Rate</span>
                <span className="text-2xl sm:text-3xl font-semibold text-[#FF9500] mt-1 block font-sans">
                  {progress.current_rate.toLocaleString()}
                </span>
                <span className="text-[10px] text-[#86868B] mt-0.5 block">candidates / sec</span>
              </div>
            </div>

            {/* Active Candidate Inspection Odometer */}
            <div className="p-4 rounded-xl bg-[#F5F5F7] border border-black/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6E6E73]">
                <span>Active Candidate Probe:</span>
                <span className="text-[#34C759] font-semibold">{algorithm} In-Browser Worker</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-black/[0.06] text-sm sm:text-base text-[#1D1D1F] truncate tracking-wider font-mono shadow-inner">
                {progress.current_candidate || (status === "RUNNING" ? "Generating permutations..." : "Awaiting execution")}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 text-xs pt-4 border-t border-black/[0.06]">
            <div className="flex justify-between text-[#6E6E73]">
              <span className="font-medium">Budget Consumption</span>
              <span className="font-semibold text-[#1D1D1F]">{((progress.candidates_tested / maxCandidates) * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#E5E5EA] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#34C759] to-[#FF3B30] transition-all duration-100"
                style={{ width: `${Math.min(100, (progress.candidates_tested / maxCandidates) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Right Column: Empirical Exploit Evidence & Risk Recalculation */}
        <div className="apple-card p-6 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-[#1D1D1F] uppercase tracking-wider pb-4 border-b border-black/[0.06] flex items-center space-x-2 font-sans">
              <TrendingUp className="w-4 h-4 text-[#FF3B30]" />
              <span>Empirical Security Findings</span>
            </h3>

            {/* State-dependent result box */}
            <div className="mt-4">
              {status === "MATCHED" && (
                <div className="p-4 rounded-xl bg-[#FF3B30]/[0.08] border border-[#FF3B30]/25 space-y-3">
                  <div className="flex items-center space-x-2 text-[#FF3B30] font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-[#FF3B30]" />
                    <span>EMPIRICAL MATCH CRACKED!</span>
                  </div>
                  <div className="text-xs text-[#1D1D1F] space-y-1.5">
                    <div>
                      Recovered Credential:{" "}
                      <span className="text-[#FF3B30] font-semibold bg-white px-2 py-0.5 rounded border border-[#FF3B30]/30 font-mono shadow-xs">
                        {progress.matched_password}
                      </span>
                    </div>
                    <div>
                      Matching Mutation Rule:{" "}
                      <span className="text-[#FF9500] font-semibold">{progress.matched_rule}</span>
                    </div>
                    <div>
                      Total Workload:{" "}
                      <span className="text-[#1D1D1F] font-semibold">{progress.candidates_tested.toLocaleString()}</span> probes in{" "}
                      <span className="text-[#1D1D1F] font-semibold">{progress.elapsed_ms}ms</span>
                    </div>
                  </div>
                </div>
              )}

              {status === "BUDGET_EXHAUSTED" && (
                <div className="p-4 rounded-xl bg-[#F5F5F7] border border-black/[0.06] space-y-3">
                  <div className="flex items-center space-x-2 text-[#FF9500] font-semibold text-sm">
                    <XCircle className="w-5 h-5 text-[#FF9500]" />
                    <span>NOT FOUND WITHIN BOUNDED BUDGET</span>
                  </div>
                  <p className="text-xs text-[#6E6E73]">
                    No candidate matched within the configured search budget of {maxCandidates.toLocaleString()} candidates / {timeBudgetMs / 1000}s.
                  </p>
                  <p className="text-[11px] text-[#86868B] italic">
                    Note: A failed bounded simulation only means the credential was not found within this specific dictionary rule budget.
                  </p>
                </div>
              )}

              {(status === "IDLE" || status === "ACCOUNT_SELECTED" || status === "RUNNING") && (
                <div className="p-6 rounded-xl bg-[#F5F5F7] border border-black/[0.04] text-center text-[#86868B] space-y-2">
                  <Cpu className="w-8 h-8 mx-auto text-[#86868B] animate-pulse" />
                  <p className="text-xs">
                    {status === "RUNNING"
                      ? "Testing contextual mutation rules in background Web Worker..."
                      : "Ready to launch bounded exploit simulation."}
                  </p>
                </div>
              )}
            </div>

            {/* Risk Recalculation Card */}
            {updatedRiskInfo && (
              <div className="mt-4 p-4 rounded-xl bg-[#F5F5F7] border border-black/[0.06] space-y-3 text-xs">
                <div className="text-[#86868B] uppercase text-[10px] font-semibold tracking-wider">
                  Deterministic Score Adjustment Applied:
                </div>
                <div className="flex items-center justify-between text-[#6E6E73]">
                  <span>Baseline Risk:</span>
                  <span className="font-semibold text-[#1D1D1F]">{formatRiskScore(updatedRiskInfo.baseline_risk)}</span>
                </div>
                <div className="flex items-center justify-between text-[#FF3B30]">
                  <span>Empirical Exploit Modifier:</span>
                  <span className="font-semibold">+{(updatedRiskInfo.attack_adjustment * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] text-[#1D1D1F] font-semibold text-sm">
                  <span>Final Risk Score:</span>
                  <span className="text-[#FF3B30]">
                    {formatRiskScore(updatedRiskInfo.final_risk)} ({updatedRiskInfo.final_tier})
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-[#86868B] italic">
            Privacy Guarantee: Candidate stream is strictly confined to client memory. Only final execution metadata is recorded.
          </div>
        </div>
      </div>

      {/* Hardware Cracking Rig Simulation & Offline Dump Time Estimates */}
      <div className="apple-card p-6 border border-[#5856D6]/20 bg-gradient-to-br from-[#5856D6]/[0.02] via-white to-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.06]">
          <div className="flex items-center space-x-2.5">
            <Server className="w-5 h-5 text-[#5856D6]" />
            <div>
              <h3 className="text-sm font-semibold text-[#1D1D1F]">
                Offline Hashdump Hardware Cracking Speed Projection ({algorithm})
              </h3>
              <p className="text-xs text-[#6E6E73]">
                Simulates real-world Hashcat throughput if an attacker exfiltrates the Active Directory NTDS.dit database.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-[#5856D6] font-semibold bg-[#5856D6]/10 px-3 py-1 rounded-lg">
            Workload: {progress.candidates_tested > 0 ? progress.candidates_tested.toLocaleString() : "50,000"} candidates
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* 1. Single-Core CPU */}
          <div className="p-4 rounded-xl bg-white border border-black/[0.06] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1D1D1F]">Standard CPU Core</span>
              <span className="text-[10px] text-[#86868B] uppercase">Commodity</span>
            </div>
            <div className="text-base font-bold text-[#0071E3]">
              {hardwareEstimates?.cpu_single?.timeFormatted || "< 5 ms"}
            </div>
            <div className="text-[11px] text-[#6E6E73]">
              Rate: {algorithm === "NTLM" ? "20 MH/s" : (algorithm === "MD5" ? "15 MH/s" : "10 MH/s")}
            </div>
            <p className="text-[10px] text-[#86868B] leading-tight">
              Single-threaded attacker or basic endpoint compute power.
            </p>
          </div>

          {/* 2. NVIDIA RTX 4090 Workstation GPU */}
          <div className="p-4 rounded-xl bg-white border border-black/[0.06] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1D1D1F]">1x NVIDIA RTX 4090</span>
              <span className="text-[10px] text-[#34C759] uppercase font-bold">GPU Tier</span>
            </div>
            <div className="text-base font-bold text-[#34C759]">
              {hardwareEstimates?.gpu_rtx4090?.timeFormatted || "< 1 ms (Instant)"}
            </div>
            <div className="text-[11px] text-[#6E6E73]">
              Rate: {algorithm === "NTLM" ? "220 GH/s" : (algorithm === "MD5" ? "160 GH/s" : "80 GH/s")}
            </div>
            <p className="text-[10px] text-[#86868B] leading-tight">
              Standard offensive security rig. Fast unsalted hashes offer zero resistance.
            </p>
          </div>

          {/* 3. Enterprise 8x RTX 4090 Cluster */}
          <div className="p-4 rounded-xl bg-white border border-black/[0.06] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1D1D1F]">8x RTX 4090 Cluster</span>
              <span className="text-[10px] text-[#FF3B30] uppercase font-bold">Threat Cluster</span>
            </div>
            <div className="text-base font-bold text-[#FF3B30]">
              {hardwareEstimates?.gpu_cluster_8x?.timeFormatted || "< 0.05 ms (Sub-Millisecond)"}
            </div>
            <div className="text-[11px] text-[#6E6E73]">
              Rate: {algorithm === "NTLM" ? "1.76 TH/s" : (algorithm === "MD5" ? "1.28 TH/s" : "640 GH/s")}
            </div>
            <p className="text-[10px] text-[#86868B] leading-tight">
              State-sponsored or organized cybercrime hash cracking rig.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
