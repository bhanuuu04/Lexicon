"use client";

import React, { useState } from "react";
import { Cpu, Play } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { HashRaceResult } from "../../types";

export const HashRaceArena: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, HashRaceResult>>({
    MD5: {
      algorithm: "MD5",
      candidates_tested: 0,
      elapsed_ms: 0,
      throughput: 0,
      memory_cost: "0 KB",
      iterations: "1",
      status: "pending",
    },
    "SHA-256": {
      algorithm: "SHA-256",
      candidates_tested: 0,
      elapsed_ms: 0,
      throughput: 0,
      memory_cost: "0 KB",
      iterations: "1",
      status: "pending",
    },
    bcrypt: {
      algorithm: "bcrypt",
      candidates_tested: 0,
      elapsed_ms: 0,
      throughput: 0,
      memory_cost: "4 KB",
      iterations: "Cost 10 (1,024 rounds)",
      status: "pending",
    },
    Argon2id: {
      algorithm: "Argon2id",
      candidates_tested: 0,
      elapsed_ms: 0,
      throughput: 0,
      memory_cost: "8,192 KB (Memory-Hard)",
      iterations: "t=2, m=8MB, p=1",
      status: "pending",
    },
  });

  const runRace = () => {
    setIsRunning(true);
    const algos: ("MD5" | "SHA-256" | "bcrypt" | "Argon2id")[] = ["MD5", "SHA-256", "bcrypt", "Argon2id"];

    setResults((prev) => {
      const next = { ...prev };
      algos.forEach((a) => {
        next[a] = { ...next[a], status: "running", elapsed_ms: 0, throughput: 0 };
      });
      return next;
    });

    let completedCount = 0;

    algos.forEach((algo) => {
      const worker = new Worker(new URL("../../workers/hashWorker.ts", import.meta.url), {
        type: "module",
      });

      worker.postMessage({ algorithm: algo });

      worker.onmessage = (e: MessageEvent) => {
        const { type, payload } = e.data;
        if (type === "RACE_RESULT") {
          setResults((prev) => ({
            ...prev,
            [payload.algorithm]: payload,
          }));
        }
        completedCount++;
        if (completedCount === algos.length) {
          setIsRunning(false);
        }
        worker.terminate();
      };
    });
  };

  const chartData = [
    { name: "MD5", throughput: results["MD5"].throughput, fill: "#f43f5e" },
    { name: "SHA-256", throughput: results["SHA-256"].throughput, fill: "#fb923c" },
    { name: "bcrypt", throughput: results["bcrypt"].throughput, fill: "#38bdf8" },
    { name: "Argon2id", throughput: results["Argon2id"].throughput, fill: "#10b981" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="apple-card-static p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-amber-500/20 bg-gradient-to-r from-amber-950/25 via-slate-900/60 to-slate-900/40">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Cryptographic Resistance Benchmark</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1 font-sans">
            Hash Race: Workload vs. Computation Cost
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 font-normal">
            Execute genuine WASM Web Workers measuring authentic on-device hashing throughput. Demonstrates why legacy fast hashes (MD5, SHA-256) are instantly crackable whereas modern memory-hard schemes (Argon2id, bcrypt) neutralize brute-force attacks.
          </p>
        </div>

        <button
          disabled={isRunning}
          onClick={runRace}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold flex items-center space-x-2 shadow-[0_2px_15px_rgba(16,185,129,0.35)] shrink-0 transition"
        >
          {isRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Executing Live WASM Race...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-white" />
              <span>Start Parallel Hash Race</span>
            </>
          )}
        </button>
      </div>

      {/* 4 Lanes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MD5 */}
        <div className="apple-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-semibold">
                Legacy / Vulnerable
              </span>
              <span className="text-xs text-slate-400 font-mono">1991</span>
            </div>
            <h3 className="text-xl font-bold text-white mt-2 font-sans">MD5</h3>
            <p className="text-xs text-slate-400 mt-1">Unsalted, extremely fast digest designed for checksums.</p>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-white/[0.08]">
            <div className="flex justify-between">
              <span className="text-slate-400">Measured Rate:</span>
              <span className="text-rose-400 font-bold font-sans">
                {results["MD5"].throughput > 0
                  ? `${results["MD5"].throughput.toLocaleString()} /sec`
                  : isRunning
                  ? "Benchmarking..."
                  : "Ready"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Elapsed Time:</span>
              <span className="text-slate-200 font-mono">{results["MD5"].elapsed_ms}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Memory Hardness:</span>
              <span className="text-rose-400">0 KB (Zero RAM)</span>
            </div>
          </div>
        </div>

        {/* SHA-256 */}
        <div className="apple-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                Fast Crypto Digest
              </span>
              <span className="text-xs text-slate-400 font-mono">2001</span>
            </div>
            <h3 className="text-xl font-bold text-white mt-2 font-sans">SHA-256</h3>
            <p className="text-xs text-slate-400 mt-1">Cryptographic hash, but lacks key-stretching (GPU vulnerable).</p>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-white/[0.08]">
            <div className="flex justify-between">
              <span className="text-slate-400">Measured Rate:</span>
              <span className="text-amber-400 font-bold font-sans">
                {results["SHA-256"].throughput > 0
                  ? `${results["SHA-256"].throughput.toLocaleString()} /sec`
                  : isRunning
                  ? "Benchmarking..."
                  : "Ready"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Elapsed Time:</span>
              <span className="text-slate-200 font-mono">{results["SHA-256"].elapsed_ms}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Memory Hardness:</span>
              <span className="text-amber-400">0 KB (Zero RAM)</span>
            </div>
          </div>
        </div>

        {/* bcrypt */}
        <div className="apple-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
                Iterated / Salted
              </span>
              <span className="text-xs text-slate-400 font-mono">1999</span>
            </div>
            <h3 className="text-xl font-bold text-white mt-2 font-sans">bcrypt</h3>
            <p className="text-xs text-slate-400 mt-1">Key-stretched with configurable exponential cost factor.</p>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-white/[0.08]">
            <div className="flex justify-between">
              <span className="text-slate-400">Measured Rate:</span>
              <span className="text-cyan-400 font-bold font-sans">
                {results["bcrypt"].throughput > 0
                  ? `${results["bcrypt"].throughput.toLocaleString()} /sec`
                  : isRunning
                  ? "Benchmarking..."
                  : "Ready"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Elapsed Time:</span>
              <span className="text-slate-200 font-mono">{results["bcrypt"].elapsed_ms}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Memory Hardness:</span>
              <span className="text-cyan-400">4 KB (Blowfish state)</span>
            </div>
          </div>
        </div>

        {/* Argon2id */}
        <div className="apple-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
                Modern Standard
              </span>
              <span className="text-xs text-slate-400 font-mono">PHC Winner</span>
            </div>
            <h3 className="text-xl font-bold text-white mt-2 font-sans">Argon2id</h3>
            <p className="text-xs text-slate-400 mt-1">Memory-hard & side-channel resistant. Industry standard.</p>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-white/[0.08]">
            <div className="flex justify-between">
              <span className="text-slate-400">Measured Rate:</span>
              <span className="text-emerald-400 font-bold font-sans">
                {results["Argon2id"].throughput > 0
                  ? `${results["Argon2id"].throughput.toLocaleString()} /sec`
                  : isRunning
                  ? "Benchmarking..."
                  : "Ready"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Elapsed Time:</span>
              <span className="text-slate-200 font-mono">{results["Argon2id"].elapsed_ms}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Memory Hardness:</span>
              <span className="text-emerald-400 font-bold">8,192 KB (High RAM)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Throughput Chart */}
      <div className="apple-card-static p-6">
        <h3 className="text-base font-bold text-white mb-1 font-sans">
          Empirical Relative Throughput (Hashes / Second)
        </h3>
        <p className="text-xs text-slate-400 mb-6 font-normal">
          Higher rate = easier for an attacker to crack passwords offline. Argon2id and bcrypt force massive slowdowns on cracking clusters.
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
              <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }} />
              <YAxis stroke="#475569" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "rgba(255, 255, 255, 0.12)",
                  borderRadius: "12px",
                  color: "#f8fafc",
                }}
                formatter={(val: number) => [`${val.toLocaleString()} hashes/sec`, "Throughput"]}
              />
              <Bar dataKey="throughput" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

