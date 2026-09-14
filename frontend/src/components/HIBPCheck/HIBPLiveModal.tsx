"use client";

import React, { useState } from "react";
import { Globe, ShieldCheck, Search, Lock, Info, X } from "lucide-react";
import { checkHIBPPrefix } from "../../lib/api";

interface HIBPLiveModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const HIBPLiveModal: React.FC<HIBPLiveModalProps> = ({
  isOpen,
  onClose,
}) => {
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
      const isPwned = res.suffixes && (suffix in res.suffixes);
      const pwnedCount = isPwned ? res.suffixes[suffix] : 0;

      setResult({
        prefix,
        suffix,
        suffixMasked: suffix.slice(0, 4) + "..." + suffix.slice(-4),
        status: res.status,
        message: res.message,
        candidateRangeCount: res.count,
        isPwned,
        pwnedCount,
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

  const content = (
    <div className="space-y-6">
      {/* Distinction banner */}
      <div className="apple-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#0071E3]/20 bg-gradient-to-r from-[#0071E3]/[0.06] via-white to-white">
        <div>
          <div className="flex items-center space-x-2 text-[#0071E3] text-xs font-semibold uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            <span>Live External Verification • k-Anonymity Model</span>
          </div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] mt-1 font-sans">
            Have I Been Pwned (HIBP) Live Range Verification
          </h2>
          <p className="text-xs text-[#6E6E73] max-w-2xl mt-1 font-normal">
            Directly test how k-anonymity protects credential privacy. Only the first 5 hexadecimal characters of the SHA-1 digest are sent to the HIBP API.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] text-right text-xs shrink-0">
          <span className="text-[#0071E3] font-semibold block font-sans">100% Client-Side Hashing</span>
          <span className="text-[#86868B] text-[11px]">Zero Plaintext Exfiltration</span>
        </div>
      </div>

      {/* Critical Transparency Alert */}
      <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-card flex items-start space-x-3 text-xs">
        <Info className="w-5 h-5 text-[#0071E3] shrink-0 mt-0.5" />
        <div className="space-y-1 text-[#6E6E73]">
          <span className="font-semibold text-[#1D1D1F] block font-sans">Audit Data Source Transparency Notice:</span>
          <p>
            * <strong className="text-[#1D1D1F] font-semibold">Synthetic Bulk Audit (50,000 Accounts):</strong> Powered exclusively by the deterministic synthetic dictionary corpus (<code className="text-[#86868B] font-mono">breach_corpus.json</code>).
          </p>
          <p>
            * <strong className="text-[#0071E3] font-semibold">Live HIBP Verification:</strong> Real-time live verification querying Troy Hunt&apos;s Have I Been Pwned Pwned-Passwords API (<code className="text-[#86868B] font-mono">api.pwnedpasswords.com</code>).
          </p>
        </div>
      </div>

      {/* Live Probe Tool */}
      <div className="apple-card p-6 max-w-2xl mx-auto space-y-6">
        <form onSubmit={handleCheck} className="space-y-4">
          <div>
            <label className="text-xs uppercase text-[#86868B] block mb-1.5 font-semibold tracking-wider">
              Sample Password to Verify via k-Anonymity
            </label>
            <div className="relative">
              <input
                type="text"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password (e.g. password, Admin123!, Summer2026!)"
                className="w-full px-4 py-3 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-sm text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#0071E3] focus:bg-white focus:ring-2 focus:ring-[#0071E3]/15 font-sans transition"
              />
              <Lock className="w-4 h-4 text-[#86868B] absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !passwordInput}
            className="w-full py-3 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-50 text-white font-medium flex items-center justify-center space-x-2 shadow-sm transition active:scale-[0.98]"
          >
            {loading ? (
              <span>Querying Live HIBP API...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Execute k-Anonymity Live Range Check</span>
              </>
            )}
          </button>
        </form>

        {result && (
          <div className="p-4 rounded-xl bg-[#F5F5F7] border border-black/[0.06] space-y-3.5 text-xs">
            {/* Live Verdict Banner */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              result.isPwned
                ? "bg-[#FF3B30]/10 border-[#FF3B30]/30 text-[#FF3B30]"
                : "bg-[#34C759]/10 border-[#34C759]/30 text-[#34C759]"
            }`}>
              <div className="flex items-center space-x-2 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {result.isPwned
                    ? `⚠️ PWNED: Found ${result.pwnedCount.toLocaleString()} times in public breaches!`
                    : "✅ SAFE: 0 breach occurrences found in HIBP database"}
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-white/80 border border-current">
                {result.isPwned ? "Compromised" : "Clean"}
              </span>
            </div>

            {/* Telemetry Breakdown */}
            <div className="space-y-1.5 text-[#6E6E73]">
              <div>Transmitted SHA-1 Prefix: <span className="text-[#0071E3] font-mono font-semibold">{result.prefix}</span> (Only 5 Hex chars sent over internet)</div>
              <div>Retained SHA-1 Suffix: <span className="text-[#86868B] font-mono">{result.suffixMasked}</span> (Matched strictly inside browser RAM)</div>
              <div>Candidate Hashes in HIBP Bucket: <span className="text-[#1D1D1F] font-semibold">{result.candidateRangeCount?.toLocaleString() || 0}</span></div>
              <div className="text-[11px] text-[#6E6E73] pt-2 border-t border-black/[0.06]">
                Queried endpoint: <code className="font-mono text-[#0071E3]">https://api.pwnedpasswords.com/range/{result.prefix}</code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // If used as modal
  if (isOpen !== undefined) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
        <div className="relative w-full max-w-3xl bg-[#F5F5F7] rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto border border-black/[0.08]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white text-[#86868B] hover:text-[#1D1D1F] border border-black/[0.06] shadow-xs transition"
          >
            <X className="w-4 h-4" />
          </button>
          {content}
        </div>
      </div>
    );
  }

  return content;
};
