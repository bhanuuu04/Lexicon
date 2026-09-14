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
} from "lucide-react";
import { Account, AttackCandidateProgress } from "../../types";
import { submitAttackResult } from "../../lib/api";
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

  const [algorithm, setAlgorithm] = useState<"MD5" | "SHA-256">("MD5");
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

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (targetAccount) {
      setStatus("ACCOUNT_SELECTED");
      resetAttack();
    }
  }, [targetAccount]);

  const resetAttack = () => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "CANCEL" });
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
    setStatus(targetAccount ? "ACCOUNT_SELECTED" : "IDLE");
  };

  const startAttack = () => {
    if (!targetAccount) return;

    resetAttack();
    setStatus("RUNNING");

    const worker = new Worker(new URL("../../workers/attackWorker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    const targetHash =
      algorithm === "MD5" ? targetAccount.hash_md5 : targetAccount.hash_sha256;

    worker.postMessage({
      type: "START_ATTACK",
      payload: {
        account_id: targetAccount.id,
        username: targetAccount.username,
        department: targetAccount.department,
        target_hash: targetHash,
        algorithm,
        max_candidates: maxCandidates,
        time_budget_ms: timeBudgetMs,
      },
    });

    worker.onmessage = async (e: MessageEvent) => {
      const { type, payload } = e.data;

      if (type === "PROGRESS") {
        setProgress(payload);
      } else if (type === "RESULT") {
        setStatus(payload.matched ? "MATCHED" : "BUDGET_EXHAUSTED");
        setProgress((prev) => ({
          ...prev,
          candidates_tested: payload.candidates_tested,
          elapsed_ms: payload.elapsed_ms,
          current_rate: payload.current_rate,
          matched: payload.matched,
          matched_password: payload.matched_password,
          matched_rule: payload.matched_rule,
          status: payload.status,
        }));
        setAttackResult(payload);

        setIsSubmitting(true);
        try {
          const resp = await submitAttackResult({
            account_id: payload.account_id,
            algorithm: payload.algorithm,
            candidates_tested: payload.candidates_tested,
            elapsed_ms: payload.elapsed_ms,
            matched: payload.matched,
            matched_rule: payload.matched_rule,
            time_budget_ms: payload.time_budget_ms,
          });
          setUpdatedRiskInfo(resp);
          if (onAccountUpdated && targetAccount) {
            onAccountUpdated({
              ...targetAccount,
              attack_adjustment: resp.attack_adjustment,
              final_risk: resp.final_risk,
              final_tier: resp.final_tier as any,
              attack_evidence: {
                algorithm: payload.algorithm,
                candidates_tested: payload.candidates_tested,
                elapsed_ms: payload.elapsed_ms,
                matched: payload.matched,
                matched_rule: payload.matched_rule,
              },
            });
          }
        } catch (err) {
          console.error("Failed to submit summarized attack result:", err);
        } finally {
          setIsSubmitting(false);
        }

        worker.terminate();
        workerRef.current = null;
      }
    };
  };

  const cancelAttack = () => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "CANCEL" });
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setStatus("ACCOUNT_SELECTED");
  };

  const targetTier = targetAccount?.final_tier || targetAccount?.baseline_tier || "Low";
  const tierStyle = getTierColor(targetTier);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="apple-card-static p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-rose-500/20 bg-gradient-to-r from-rose-950/25 via-slate-900/60 to-slate-900/40">
        <div>
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Interactive Client-Side Bounded Attack Lab</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1 font-sans">
            Empirical Mutation Exploitability Engine
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 font-normal">
            Bounded simulation running entirely in browser Web Workers. Tests deterministic password mutations against target hashes. Never exfiltrates candidate stream.
          </p>
        </div>

        {!targetAccount && onSelectHeroAccount && (
          <button
            onClick={onSelectHeroAccount}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold flex items-center space-x-2 shadow-[0_2px_12px_rgba(244,63,94,0.35)] transition"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Load Hero Account (alex.morgan)</span>
          </button>
        )}
      </div>

      {/* Target Account Bar */}
      {targetAccount ? (
        <div className="apple-card-static p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${tierStyle.bg} border ${tierStyle.border}`}>
              <ShieldAlert className={`w-6 h-6 ${tierStyle.text}`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-base font-sans">{targetAccount.username}</span>
                <span className="text-xs font-mono text-slate-400">({targetAccount.id})</span>
                {targetAccount.is_hero && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-[0_0_6px_rgba(244,63,94,0.4)]">
                    HERO TARGET
                  </span>
                )}
                {targetAccount.is_privileged && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-semibold">
                    ADMIN
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {targetAccount.role} • {targetAccount.department} • Baseline Risk: {formatRiskScore(targetAccount.baseline_risk)} ({targetAccount.baseline_tier})
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {/* Algorithm selector */}
            <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-800/80 border border-white/[0.08]">
              <button
                disabled={status === "RUNNING"}
                onClick={() => setAlgorithm("MD5")}
                className={`px-3 py-1 rounded-lg transition font-medium ${
                  algorithm === "MD5" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                MD5
              </button>
              <button
                disabled={status === "RUNNING"}
                onClick={() => setAlgorithm("SHA-256")}
                className={`px-3 py-1 rounded-lg transition font-medium ${
                  algorithm === "SHA-256" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                SHA-256
              </button>
            </div>

            {/* Launch / Cancel Button */}
            {status === "RUNNING" ? (
              <button
                onClick={cancelAttack}
                className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 font-semibold flex items-center space-x-2 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Abort Attack</span>
              </button>
            ) : (
              <button
                onClick={startAttack}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold flex items-center space-x-2 shadow-[0_2px_12px_rgba(244,63,94,0.35)] transition"
              >
                <Play className="w-4 h-4" />
                <span>Execute Bounded Attack</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl border border-dashed border-white/[0.1] text-center text-slate-400 font-sans">
          No account selected. Select an account from the Directory or click &quot;Target Hero Account&quot;.
        </div>
      )}

      {/* Attack Telemetry Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Telemetry Gauges & Odometer */}
        <div className="lg:col-span-2 apple-card-static p-6 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 font-sans">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <span>Live Candidate Stream & Telemetry</span>
              </h3>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Budget Limit:</span>
                <span className="text-slate-200 font-medium">{maxCandidates.toLocaleString()} cands / {timeBudgetMs / 1000}s</span>
              </div>
            </div>

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-3 gap-3.5 my-6">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-white/[0.06] text-center">
                <span className="text-[11px] text-slate-400 uppercase block font-medium">Candidates Tested</span>
                <span className="text-2xl sm:text-3xl font-bold text-white mt-1 block font-sans">
                  {progress.candidates_tested.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  of {maxCandidates.toLocaleString()} Max
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-white/[0.06] text-center">
                <span className="text-[11px] text-slate-400 uppercase block font-medium">Elapsed Time</span>
                <span className="text-2xl sm:text-3xl font-bold text-cyan-400 mt-1 block font-sans">
                  {(progress.elapsed_ms / 1000).toFixed(2)}s
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  of {timeBudgetMs / 1000}s Budget
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-white/[0.06] text-center">
                <span className="text-[11px] text-slate-400 uppercase block font-medium">Throughput Rate</span>
                <span className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1 block font-sans">
                  {progress.current_rate.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">candidates / sec</span>
              </div>
            </div>

            {/* Active Candidate Inspection Odometer */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Active Candidate Probe:</span>
                <span className="text-emerald-400 font-semibold">{algorithm} WASM Engine</span>
              </div>
              <div className="p-3 rounded-lg bg-black/50 border border-white/[0.05] text-sm sm:text-base text-emerald-400 truncate tracking-wider font-mono">
                {progress.current_candidate || (status === "RUNNING" ? "Generating..." : "Awaiting execution")}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 text-xs pt-4 border-t border-white/[0.08]">
            <div className="flex justify-between text-slate-400">
              <span className="font-medium">Budget Consumption</span>
              <span className="font-semibold text-slate-200">{((progress.candidates_tested / maxCandidates) * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-rose-500 transition-all duration-100"
                style={{ width: `${Math.min(100, (progress.candidates_tested / maxCandidates) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Right Column: Empirical Exploit Evidence & Risk Recalculation */}
        <div className="apple-card-static p-6 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-4 border-b border-white/[0.08] flex items-center space-x-2 font-sans">
              <TrendingUp className="w-4 h-4 text-rose-400" />
              <span>Empirical Security Findings</span>
            </h3>

            {/* State-dependent result box */}
            <div className="mt-4">
              {status === "MATCHED" && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                  <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-rose-400" />
                    <span>EMPIRICAL MATCH CRACKED!</span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-1.5">
                    <div>
                      Recovered Credential:{" "}
                      <span className="text-white font-bold bg-black/40 px-2 py-0.5 rounded border border-rose-500/30 font-mono">
                        {progress.matched_password}
                      </span>
                    </div>
                    <div>
                      Matching Mutation Rule:{" "}
                      <span className="text-amber-400 font-bold">{progress.matched_rule}</span>
                    </div>
                    <div>
                      Total Workload:{" "}
                      <span className="text-white font-bold">{progress.candidates_tested.toLocaleString()}</span> probes in{" "}
                      <span className="text-white font-bold">{progress.elapsed_ms}ms</span>
                    </div>
                  </div>
                </div>
              )}

              {status === "BUDGET_EXHAUSTED" && (
                <div className="p-4 rounded-xl bg-slate-800/40 border border-white/[0.08] space-y-3">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                    <XCircle className="w-5 h-5 text-amber-400" />
                    <span>NOT FOUND WITHIN BOUNDED BUDGET</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    No candidate matched within the configured search budget of {maxCandidates.toLocaleString()} candidates / {timeBudgetMs / 1000}s.
                  </p>
                  <p className="text-[11px] text-slate-400 italic">
                    Note: A failed bounded simulation only means the credential was not found within this specific dictionary rule budget.
                  </p>
                </div>
              )}

              {(status === "IDLE" || status === "ACCOUNT_SELECTED" || status === "RUNNING") && (
                <div className="p-6 rounded-xl bg-slate-800/30 border border-white/[0.06] text-center text-slate-400 space-y-2">
                  <Cpu className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
                  <p className="text-xs">
                    {status === "RUNNING"
                      ? "Testing mutation rules in background Web Worker..."
                      : "Ready to launch bounded exploit simulation."}
                  </p>
                </div>
              )}
            </div>

            {/* Risk Recalculation Card */}
            {updatedRiskInfo && (
              <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-white/[0.08] space-y-3 text-xs">
                <div className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  Deterministic Score Adjustment Applied:
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Baseline Risk:</span>
                  <span className="font-bold">{formatRiskScore(updatedRiskInfo.baseline_risk)}</span>
                </div>
                <div className="flex items-center justify-between text-rose-400">
                  <span>Empirical Exploit Modifier:</span>
                  <span className="font-bold">+{(updatedRiskInfo.attack_adjustment * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-white font-bold text-sm">
                  <span>Final Risk Score:</span>
                  <span className="text-rose-400">
                    {formatRiskScore(updatedRiskInfo.final_risk)} ({updatedRiskInfo.final_tier})
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 italic">
            Privacy Guarantee: Candidate stream is strictly confined to client memory. Only final execution metadata is recorded.
          </div>
        </div>
      </div>
    </div>
  );
};

