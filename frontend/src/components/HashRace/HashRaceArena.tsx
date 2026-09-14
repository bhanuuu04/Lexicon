"use client";

import React, { useState } from "react";
import { Cpu, Play } from "lucide-react";
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
      iterations: "1 (AD Default)",
      status: "pending",
    },
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
    const algos: ("NTLM" | "MD5" | "SHA-256" | "bcrypt" | "Argon2id")[] = ["NTLM", "MD5", "SHA-256", "bcrypt", "Argon2id"];

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
    { name: "NTLM (AD)", throughput: results["NTLM"].throughput, fill: "#FF2D55" },
    { name: "MD5", throughput: results["MD5"].throughput, fill: "#FF3B30" },
    { name: "SHA-256", throughput: results["SHA-256"].throughput, fill: "#FF9500" },
    { name: "bcrypt", throughput: results["bcrypt"].throughput, fill: "#0071E3" },
    { name: "Argon2id", throughput: results["Argon2id"].throughput, fill: "#34C759" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="apple-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#FF9500]/20 bg-gradient-to-r from-[#FF9500]/[0.06] via-white to-white">
        <div>
          <div className="flex items-center space-x-2 text-[#FF9500] text-xs font-semibold uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Cryptographic Resistance Benchmark</span>
          </div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mt-1 font-sans">
            Hash Race: Workload vs. Computation Cost
          </h2>
          <p className="text-xs text-[#6E6E73] max-w-2xl mt-1 font-normal">
            Execute genuine WASM Web Workers measuring authentic on-device hashing throughput. Demonstrates why legacy fast hashes (MD5, SHA-256) are instantly crackable whereas modern memory-hard schemes (Argon2id, bcrypt) neutralize brute-force attacks.
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

      {/* 5 Lanes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* NTLM */}
        <div className="apple-card p-5 flex flex-col justify-between space-y-4 border border-[#FF2D55]/20 bg-white">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-[#FF2D55]/[0.08] text-[#FF2D55] border border-[#FF2D55]/20 font-semibold">
                AD Baseline
              </span>
              <span className="text-xs text-[#86868B] font-mono">MD4-LE</span>
            </div>
            <h3 className="text-xl font-semibold text-[#1D1D1F] mt-2 font-sans">NTLM</h3>
            <p className="text-xs text-[#6E6E73] mt-1">Windows Active Directory default. Highly vulnerable to rapid cracking.</p>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-black/[0.06]">
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Measured Rate:</span>
              <span className="text-[#FF2D55] font-semibold font-sans">
                {results["NTLM"].throughput > 0
                  ? `${results["NTLM"].throughput.toLocaleString()} /sec`
                  : isRunning
                  ? "Benchmarking..."
                  : "Ready"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Elapsed Time:</span>
              <span className="text-[#1D1D1F] font-mono">{results["NTLM"].elapsed_ms}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Memory Hardness:</span>
              <span className="text-[#FF2D55] font-medium">0 KB (Zero RAM)</span>
            </div>
          </div>
        </div>

        {/* MD5 */}
        <div className="apple-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-[#FF3B30]/[0.08] text-[#FF3B30] border border-[#FF3B30]/20 font-semibold">
                Legacy / Vulnerable
              </span>
              <span className="text-xs text-[#86868B] font-mono">1991</span>
            </div>
            <h3 className="text-xl font-semibold text-[#1D1D1F] mt-2 font-sans">MD5</h3>
            <p className="text-xs text-[#6E6E73] mt-1">Unsalted, extremely fast digest designed for checksums.</p>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-black/[0.06]">
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Measured Rate:</span>
              <span className="text-[#FF3B30] font-semibold font-sans">
                {results["MD5"].throughput > 0
                  ? `${results["MD5"].throughput.toLocaleString()} /sec`
                  : isRunning
                  ? "Benchmarking..."
                  : "Ready"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Elapsed Time:</span>
              <span className="text-[#1D1D1F] font-mono">{results["MD5"].elapsed_ms}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Memory Hardness:</span>
              <span className="text-[#FF3B30] font-medium">0 KB (Zero RAM)</span>
            </div>
          </div>
        </div>

        {/* SHA-256 */}
        <div className="apple-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-[#FF9500]/[0.08] text-[#FF9500] border border-[#FF9500]/20 font-semibold">
                Fast Crypto Digest
              </span>
              <span className="text-xs text-[#86868B] font-mono">2001</span>
            </div>
            <h3 className="text-xl font-semibold text-[#1D1D1F] mt-2 font-sans">SHA-256</h3>
            <p className="text-xs text-[#6E6E73] mt-1">Cryptographic hash, but lacks key-stretching (GPU vulnerable).</p>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-black/[0.06]">
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Measured Rate:</span>
              <span className="text-[#FF9500] font-semibold font-sans">
                {results["SHA-256"].throughput > 0
                  ? `${results["SHA-256"].throughput.toLocaleString()} /sec`
                  : isRunning
                  ? "Benchmarking..."
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
          </div>
        </div>

        {/* bcrypt */}
        <div className="apple-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-[#0071E3]/[0.08] text-[#0071E3] border border-[#0071E3]/20 font-semibold">
                Iterated / Salted
              </span>
              <span className="text-xs text-[#86868B] font-mono">1999</span>
            </div>
            <h3 className="text-xl font-semibold text-[#1D1D1F] mt-2 font-sans">bcrypt</h3>
            <p className="text-xs text-[#6E6E73] mt-1">Key-stretched with configurable exponential cost factor.</p>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-black/[0.06]">
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Measured Rate:</span>
              <span className="text-[#0071E3] font-semibold font-sans">
                {results["bcrypt"].throughput > 0
                  ? `${results["bcrypt"].throughput.toLocaleString()} /sec`
                  : isRunning
                  ? "Benchmarking..."
                  : "Ready"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Elapsed Time:</span>
              <span className="text-[#1D1D1F] font-mono">{results["bcrypt"].elapsed_ms}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Memory Hardness:</span>
              <span className="text-[#0071E3] font-medium">4 KB (Blowfish state)</span>
            </div>
          </div>
        </div>

        {/* Argon2id */}
        <div className="apple-card p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-[#34C759]/[0.08] text-[#34C759] border border-[#34C759]/20 font-semibold">
                Modern Standard
              </span>
              <span className="text-xs text-[#86868B] font-mono">PHC Winner</span>
            </div>
            <h3 className="text-xl font-semibold text-[#1D1D1F] mt-2 font-sans">Argon2id</h3>
            <p className="text-xs text-[#6E6E73] mt-1">Memory-hard & side-channel resistant. Industry standard.</p>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-black/[0.06]">
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Measured Rate:</span>
              <span className="text-[#34C759] font-semibold font-sans">
                {results["Argon2id"].throughput > 0
                  ? `${results["Argon2id"].throughput.toLocaleString()} /sec`
                  : isRunning
                  ? "Benchmarking..."
                  : "Ready"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Elapsed Time:</span>
              <span className="text-[#1D1D1F] font-mono">{results["Argon2id"].elapsed_ms}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E73]">Memory Hardness:</span>
              <span className="text-[#34C759] font-medium">8,192 KB (High RAM)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Throughput Chart */}
      <div className="apple-card p-6">
        <h3 className="text-base font-semibold text-[#1D1D1F] mb-1 font-sans">
          Relative Throughput Comparison (Hashes / Second)
        </h3>
        <p className="text-xs text-[#6E6E73] mb-6 font-normal">
          Higher rate = easier for an attacker to crack passwords offline. Argon2id and bcrypt force massive slowdowns on cracking clusters.
        </p>

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


