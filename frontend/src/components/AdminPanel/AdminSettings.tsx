"use client";

import React, { useState } from "react";
import { Sliders, Shield, Database, Cpu, Save, Check } from "lucide-react";

export const AdminSettings: React.FC = () => {
  const [entropyWeight, setEntropyWeight] = useState(30);
  const [policyWeight, setPolicyWeight] = useState(25);
  const [breachWeight, setBreachWeight] = useState(20);
  const [privilegeWeight, setPrivilegeWeight] = useState(15);
  const [reuseWeight, setReuseWeight] = useState(10);
  const [workerCores, setWorkerCores] = useState(4);
  const [cacheTTL, setCacheTTL] = useState("24 Hours");
  const [saved, setSaved] = useState(false);

  const totalWeight = entropyWeight + policyWeight + breachWeight + privilegeWeight + reuseWeight;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="apple-card p-6 bg-white border border-black/[0.06] rounded-2xl shadow-card space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
          <div>
            <h2 className="text-lg font-semibold text-[#1D1D1F]">
              Platform & Engine Configuration
            </h2>
            <p className="text-xs text-[#6E6E73]">
              Configure deterministic risk model weights, simulation thread limits, and dataset synchronization.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium flex items-center space-x-1.5 shadow-xs transition active:scale-[0.98]"
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saved ? "Saved Changes" : "Save Preferences"}</span>
          </button>
        </div>

        {/* Section 1: Risk Weights */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1D1D1F] flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-[#0071E3]" />
              <span>Deterministic Risk Index Weights</span>
            </h3>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                totalWeight === 100
                  ? "bg-[#34C759]/10 text-[#34C759]"
                  : "bg-[#FF3B30]/10 text-[#FF3B30]"
              }`}
            >
              Sum: {totalWeight}% {totalWeight !== 100 && "(Must equal 100%)"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-[#FAFAFC] rounded-xl border border-black/[0.04]">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#1D1D1F] font-medium">Entropy (zxcvbn strength)</span>
                <span className="font-mono font-semibold text-[#0071E3]">{entropyWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={entropyWeight}
                onChange={(e) => setEntropyWeight(Number(e.target.value))}
                className="w-full accent-[#0071E3]"
              />
            </div>

            <div className="p-3.5 bg-[#FAFAFC] rounded-xl border border-black/[0.04]">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#1D1D1F] font-medium">Policy Violations</span>
                <span className="font-mono font-semibold text-[#0071E3]">{policyWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={policyWeight}
                onChange={(e) => setPolicyWeight(Number(e.target.value))}
                className="w-full accent-[#0071E3]"
              />
            </div>

            <div className="p-3.5 bg-[#FAFAFC] rounded-xl border border-black/[0.04]">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#1D1D1F] font-medium">Breach History (HIBP / Corpus)</span>
                <span className="font-mono font-semibold text-[#0071E3]">{breachWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={breachWeight}
                onChange={(e) => setBreachWeight(Number(e.target.value))}
                className="w-full accent-[#0071E3]"
              />
            </div>

            <div className="p-3.5 bg-[#FAFAFC] rounded-xl border border-black/[0.04]">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#1D1D1F] font-medium">Privilege Level (Admins / VIPs)</span>
                <span className="font-mono font-semibold text-[#0071E3]">{privilegeWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={privilegeWeight}
                onChange={(e) => setPrivilegeWeight(Number(e.target.value))}
                className="w-full accent-[#0071E3]"
              />
            </div>

            <div className="p-3.5 bg-[#FAFAFC] rounded-xl border border-black/[0.04] sm:col-span-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#1D1D1F] font-medium">Credential Reuse Multiplier</span>
                <span className="font-mono font-semibold text-[#0071E3]">{reuseWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={reuseWeight}
                onChange={(e) => setReuseWeight(Number(e.target.value))}
                className="w-full accent-[#0071E3]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Attack Lab Worker Allocations */}
        <div className="space-y-4 pt-4 border-t border-black/[0.06]">
          <h3 className="text-sm font-semibold text-[#1D1D1F] flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-[#0071E3]" />
            <span>Attack Telemetry Web Worker Concurrency</span>
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {[2, 4, 8].map((cores) => (
              <button
                key={cores}
                onClick={() => setWorkerCores(cores)}
                className={`p-3 rounded-xl border text-left transition ${
                  workerCores === cores
                    ? "bg-[#0071E3]/5 border-[#0071E3] text-[#0071E3]"
                    : "bg-[#FAFAFC] border-black/[0.06] text-[#6E6E73] hover:bg-white"
                }`}
              >
                <span className="text-xs font-semibold block">{cores} Dedicated Workers</span>
                <span className="text-[10px] text-[#86868B]">
                  {cores === 8 ? "Maximum Throughput" : cores === 4 ? "Balanced (Recommended)" : "Lightweight"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Dataset In-Memory Caching */}
        <div className="space-y-4 pt-4 border-t border-black/[0.06]">
          <h3 className="text-sm font-semibold text-[#1D1D1F] flex items-center space-x-2">
            <Database className="w-4 h-4 text-[#0071E3]" />
            <span>Active Directory In-Memory Cache TTL</span>
          </h3>

          <div className="flex items-center space-x-3 text-xs">
            <select
              value={cacheTTL}
              onChange={(e) => setCacheTTL(e.target.value)}
              className="bg-[#F5F5F7] border border-black/[0.06] rounded-xl px-3 py-2 text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
            >
              <option value="6 Hours">6 Hours</option>
              <option value="12 Hours">12 Hours</option>
              <option value="24 Hours">24 Hours (Default)</option>
              <option value="48 Hours">48 Hours</option>
            </select>
            <span className="text-[11px] text-[#86868B]">
              Active 50,000 synthetic account index cached in backend memory.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
