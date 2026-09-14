"use client";

import React, { useState } from "react";
import { Cpu, Play, ShieldAlert, Sparkles, Zap, HardDrive } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { HashRaceResult } from "../../types";

export const HashRaceArena: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, HashRaceResult>>({
    NTLM: {
      algorithm: "NTLM",
      candidates_tested: 0,
      elapsed_ms: 0,
      throughput: 0,
      memory_cost: "0 KB",
      iterations: "1 (Unsalted MD4)",
      status: "pending",
    },
    MD5: {
      algorithm: "MD5",
      candidates_tested: 0,
      elapsed_ms: 0,
      throughput: 0,
      memory_cost: "0 KB",
      iterations: "1 (Standard)",
      status: "pending",
    },
    "SHA-256": {
      algorithm: "SHA-256",
      candidates_tested: 0,
      elapsed_ms: 0,
      throughput: 0,
      memory_cost: "0 KB",
      iterations: "1 (Fast Digest)",
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
    const algos: ("NTLM" | "MD5" | "SHA-256" | "bcrypt" | "Argon2id")[] = [
      "NTLM",
      "MD5",
      "SHA-256",
      "bcrypt",
      "Argon2id",
    ];

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

      worker.onerror = () => {
        completedCount++;
        if (completedCount === algos.length) {
          setIsRunning(false);
        }
        worker.terminate();
      };
    });
  };

  const chartData = [
    { name: "NTLM", throughput: results["NTLM"]?.throughput || 0, fill: "#FF3B30", label: "NTLM (AD)" },
    { name: "MD5", throughput: results["MD5"]?.throughput || 0, fill: "#FF453A", label: "MD5" },
    { name: "SHA-256", throughput: results["SHA-256"]?.throughput || 0, fill: "#FF9500", label: "SHA-256" },
    { name: "bcrypt", throughput: results["bcrypt"]?.throughput || 0, fill: "#0071E3", label: "bcrypt" },
    { name: "Argon2id", throughput: results["Argon2id"]?.throughput || 0, fill: "#34C759", label: "Argon2id" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="apple-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#FF9500]/20 bg-gradient-to-r from-[#FF9500]/[0.06] via-white to-white">
        <div>
          <div className="flex items-center space-x-2 text-[#FF9500] text-xs font-semibold uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Cryptographic Resistance Benchmark Engine</span>
          </div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mt-1 font-sans">
            Multi-Algorithm Hash Race: Workload vs. Compute Cost
          </h2>
          <p className="text-xs text-[#6E6E73] max-w-3xl mt-1 font-normal">
            Execute authentic parallel WASM Web Workers measuring client-side hashing throughput. Demonstrates why enterprise Active Directory legacy hashes (NTLM) and fast digests (MD5, SHA-256) are vulnerable to billion-hash/sec offline cracking clusters, whereas memory-hard schemes (Argon2id 64MB / bcrypt) neutralize offline brute-force attacks.
          </p>
        </div>

        <button
          disabled={isRunning}
          onClick={runRace}
          className="px-5 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 text-white font-medium flex items-center space-x-2 shadow-sm shrink-0 transition active:scale-[0.98]"
        >
          {isRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Executing 5-Lane WASM Race...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-white" />
              <span>Start Parallel Hash Race</span>
            </>
          )}
        </button>
      </div>

      {/* 5 Lanes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* NTLM */}
        <div className="apple-card p-5 flex flex-col justify-between space-y-4 border-l-4 border-l-[#FF3B30]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#FF3B30]/[0.1] text-[#FF3B30] border border-[#FF3B30]/20 font-bold">
                Active Directory
              </span>
              <span className="text-xs text-[#86868B] font-mono">1993</span>
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F] mt-2 font-sans">NTLM</h3>
            <p className="text-xs text-[#6E6E73] mt-1">Unsalted MD4 over UTF-16LE. Default Windows hash.</p>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-black/[0.06]">
            <div className="flex justify-between items-center">
              <span className="text-[#6E6E73]">Measured Rate:</span>
              <span className="text-[#FF3B30] font-bold font-sans">
                {results["NTLM"].throughput > 0
                  ? `${results["NTLM"].throughput.toLocaleString()} /s`
                  : isRunning
                  ? "Testing..."
                  : "Ready"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Elapsed Time:</span>
              <span className="text-[#1D1D1F] font-mono">{results["NTLM"].elapsed_ms}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Memory Hardness:</span>
              <span className="text-[#FF3B30] font-semibold">0 KB (Zero RAM)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Work Factor:</span>
              <span className="text-[#86868B] font-mono text-[11px]">1 Iteration</span>
            </div>
          </div>
        </div>

        {/* MD5 */}
        <div className="apple-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#FF453A]/[0.1] text-[#FF453A] border border-[#FF453A]/20 font-semibold">
                Legacy Digest
              </span>
              <span className="text-xs text-[#86868B] font-mono">1991</span>
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F] mt-2 font-sans">MD5</h3>
            <p className="text-xs text-[#6E6E73] mt-1">Unsalted, fast checksum digest. Obsolete for passwords.</p>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-black/[0.06]">
            <div className="flex justify-between items-center">
              <span className="text-[#6E6E73]">Measured Rate:</span>
              <span className="text-[#FF453A] font-semibold font-sans">
                {results["MD5"].throughput > 0
                  ? `${results["MD5"].throughput.toLocaleString()} /s`
                  : isRunning
                  ? "Testing..."
                  : "Ready"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Elapsed Time:</span>
              <span className="text-[#1D1D1F] font-mono">{results["MD5"].elapsed_ms}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Memory Hardness:</span>
              <span className="text-[#FF453A] font-medium">0 KB (Zero RAM)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Work Factor:</span>
              <span className="text-[#86868B] font-mono text-[11px]">1 Iteration</span>
            </div>
          </div>
        </div>

        {/* SHA-256 */}
        <div className="apple-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#FF9500]/[0.1] text-[#FF9500] border border-[#FF9500]/20 font-semibold">
                Cryptographic
              </span>
              <span className="text-xs text-[#86868B] font-mono">2001</span>
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F] mt-2 font-sans">SHA-256</h3>
            <p className="text-xs text-[#6E6E73] mt-1">Standard digest, lacks key-stretching (GPU vulnerable).</p>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-black/[0.06]">
            <div className="flex justify-between items-center">
              <span className="text-[#6E6E73]">Measured Rate:</span>
              <span className="text-[#FF9500] font-semibold font-sans">
                {results["SHA-256"].throughput > 0
                  ? `${results["SHA-256"].throughput.toLocaleString()} /s`
                  : isRunning
                  ? "Testing..."
                  : "Ready"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Elapsed Time:</span>
              <span className="text-[#1D1D1F] font-mono">{results["SHA-256"].elapsed_ms}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Memory Hardness:</span>
              <span className="text-[#FF9500] font-medium">0 KB (Zero RAM)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Work Factor:</span>
              <span className="text-[#86868B] font-mono text-[11px]">1 Iteration</span>
            </div>
          </div>
        </div>

        {/* bcrypt */}
        <div className="apple-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#0071E3]/[0.1] text-[#0071E3] border border-[#0071E3]/20 font-semibold">
                Cost Factor 12
              </span>
              <span className="text-xs text-[#86868B] font-mono">1999</span>
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F] mt-2 font-sans">bcrypt</h3>
            <p className="text-xs text-[#6E6E73] mt-1">Key-stretched Eksblowfish with 4,096 work rounds.</p>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-black/[0.06]">
            <div className="flex justify-between items-center">
              <span className="text-[#6E6E73]">Measured Rate:</span>
              <span className="text-[#0071E3] font-semibold font-sans">
                {results["bcrypt"].throughput > 0
                  ? `${results["bcrypt"].throughput.toLocaleString()} /s`
                  : isRunning
                  ? "Testing..."
                  : "Ready"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Elapsed Time:</span>
              <span className="text-[#1D1D1F] font-mono">{results["bcrypt"].elapsed_ms}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Memory Hardness:</span>
              <span className="text-[#0071E3] font-medium">4 KB (Blowfish)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Work Factor:</span>
              <span className="text-[#0071E3] font-mono text-[11px]">2¹² = 4,096</span>
            </div>
          </div>
        </div>

        {/* Argon2id */}
        <div className="apple-card p-5 flex flex-col justify-between space-y-4 border-r-4 border-r-[#34C759]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-[#34C759]/[0.1] text-[#34C759] border border-[#34C759]/20 font-bold">
                PHC Standard
              </span>
              <span className="text-xs text-[#86868B] font-mono">2015</span>
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F] mt-2 font-sans">Argon2id</h3>
            <p className="text-xs text-[#6E6E73] mt-1">Memory-hard (64MB / 4 passes). Post-quantum grade.</p>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-black/[0.06]">
            <div className="flex justify-between items-center">
              <span className="text-[#6E6E73]">Measured Rate:</span>
              <span className="text-[#34C759] font-bold font-sans">
                {results["Argon2id"].throughput > 0
                  ? `${results["Argon2id"].throughput.toLocaleString()} /s`
                  : isRunning
                  ? "Testing..."
                  : "Ready"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Elapsed Time:</span>
              <span className="text-[#1D1D1F] font-mono">{results["Argon2id"].elapsed_ms}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Memory Hardness:</span>
              <span className="text-[#34C759] font-bold">64 MiB RAM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Work Factor:</span>
              <span className="text-[#34C759] font-mono text-[11px]">4 Passes (p=1)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Throughput Chart */}
      <div className="apple-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-black/[0.06] mb-6 gap-2">
          <div>
            <h3 className="text-base font-semibold text-[#1D1D1F] font-sans">
              Cryptographic Throughput Discrepancy (Hashes / Second)
            </h3>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              Higher throughput = attacker can test billions of candidates offline. Argon2id and bcrypt enforce memory bandwidth barriers.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1.5 text-[#FF3B30] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30]"></span>
              <span>Vulnerable (NTLM/MD5)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-[#34C759] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34C759]"></span>
              <span>Protected (Argon2id/bcrypt)</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
              <XAxis dataKey="name" stroke="#86868B" tick={{ fontSize: 12, fill: "#6E6E73" }} axisLine={{ stroke: "rgba(0, 0, 0, 0.08)" }} />
              <YAxis stroke="#86868B" tick={{ fontSize: 12, fill: "#6E6E73" }} axisLine={{ stroke: "rgba(0, 0, 0, 0.08)" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "rgba(0, 0, 0, 0.08)",
                  borderRadius: "12px",
                  color: "#1D1D1F",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
                }}
                formatter={(val: number) => [`${val.toLocaleString()} hashes/sec`, "Throughput"]}
              />
              <Bar dataKey="throughput" radius={[6, 6, 0, 0]}>
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



