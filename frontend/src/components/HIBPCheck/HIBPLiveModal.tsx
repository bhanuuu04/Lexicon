"use client";

import React, { useState } from "react";
import { Globe, ShieldCheck, Search, Lock, Info } from "lucide-react";
import { checkHIBPPrefix } from "../../lib/api";

export const HIBPLiveModal: React.FC = () => {
  const [passwordInput, setPasswordInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) return;

    setLoading(true);
    setResult(null);

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(passwordInput);
      const hashBuffer = await crypto.subtle.digest("SHA-1", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha1Full = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();

      const prefix = sha1Full.slice(0, 5);
      const suffix = sha1Full.slice(5);

      const res = await checkHIBPPrefix(prefix);
      setResult({
        prefix,
        suffixMasked: suffix.slice(0, 4) + "..." + suffix.slice(-4),
        status: res.status,
        message: res.message,
        candidateRangeCount: res.count,
      });
    } catch (err: any) {
      setResult({
        status: "error",
        message: `Verification error: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Distinction banner */}
      <div className="apple-card-static p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-500/20 bg-gradient-to-r from-indigo-950/25 via-slate-900/60 to-slate-900/40">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            <span>Live External Verification • k-Anonymity Model</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1 font-sans">
            Have I Been Pwned (HIBP) Live Range Verification
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 font-normal">
            Directly test how k-anonymity protects credential privacy. Only the first 5 hexadecimal characters of the SHA-1 digest are sent to the HIBP API.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-indigo-500/25 text-right text-xs shrink-0">
          <span className="text-indigo-300 font-bold block font-sans">100% Client-Side Hashing</span>
          <span className="text-slate-400 text-[11px]">Zero Plaintext Exfiltration</span>
        </div>
      </div>

      {/* Critical Transparency Alert */}
      <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/[0.08] flex items-start space-x-3 text-xs">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-300">
          <span className="font-bold text-white block font-sans">Audit Data Source Transparency Notice:</span>
          <p>
            * <strong className="text-cyan-300 font-medium">Synthetic Bulk Audit (50,000 Accounts):</strong> Powered exclusively by the deterministic synthetic dictionary corpus (<code className="text-slate-400 font-mono">breach_corpus.json</code>).
          </p>
          <p>
            * <strong className="text-indigo-300 font-medium">Live HIBP Verification:</strong> Optional live verification using Troy Hunt&apos;s Have I Been Pwned Pwned-Passwords k-anonymity protocol.
          </p>
        </div>
      </div>

      {/* Live Probe Tool */}
      <div className="apple-card-static p-6 max-w-2xl mx-auto space-y-6">
        <form onSubmit={handleCheck} className="space-y-4">
          <div>
            <label className="text-xs uppercase text-slate-400 block mb-1.5 font-semibold tracking-wider">
              Sample Password to Verify via k-Anonymity
            </label>
            <div className="relative">
              <input
                type="text"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter sample synthetic password (e.g. Company2026!)"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-white/[0.08] text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 font-sans transition"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !passwordInput}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold flex items-center justify-center space-x-2 shadow-[0_2px_15px_rgba(16,185,129,0.35)] transition"
          >
            {loading ? (
              <span>Querying Range API...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Execute k-Anonymity Live Range Check</span>
              </>
            )}
          </button>
        </form>

        {result && (
          <div className="p-4 rounded-xl bg-slate-800/50 border border-white/[0.08] space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-emerald-300 font-bold font-sans">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>k-Anonymity Query Complete</span>
            </div>
            <div className="space-y-1.5 text-slate-300">
              <div>Transmitted SHA-1 Prefix: <span className="text-cyan-400 font-mono font-bold">{result.prefix}</span> (5 Hex chars)</div>
              <div>Retained SHA-1 Suffix: <span className="text-slate-400 font-mono">{result.suffixMasked}</span> (Never transmitted)</div>
              <div>Matching Hashes in Bucket: <span className="text-white font-bold">{result.candidateRangeCount || 0}</span></div>
              <div className="text-[11px] text-emerald-400 pt-2 border-t border-white/[0.08]">
                {result.message}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

