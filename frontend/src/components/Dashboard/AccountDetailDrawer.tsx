"use client";

import React from "react";
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import { Account } from "../../types";
import { getTierColor, formatRiskScore, getZxcvbnLabel } from "../../lib/riskFormat";

interface AccountDetailDrawerProps {
  account: Account | null;
  onClose: () => void;
  onLaunchAttack: (account: Account) => void;
}

export const AccountDetailDrawer: React.FC<AccountDetailDrawerProps> = ({
  account,
  onClose,
  onLaunchAttack,
}) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  if (!account) return null;

  const currentTier = account.final_tier || account.baseline_tier;
  const tierStyle = getTierColor(currentTier);
  const zxcvbnInfo = getZxcvbnLabel(account.zxcvbn_score);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-md flex justify-end transition-opacity">
      <div className="w-full max-w-xl bg-[#0f172a]/95 backdrop-blur-2xl border-l border-white/[0.08] h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
            <div>
              <div className="flex items-center space-x-2">
                {account.is_hero && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                    HERO SCENARIO TARGET
                  </span>
                )}
                <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                  Account Telemetry Profile
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1.5 flex items-center space-x-2 font-sans">
                <span>{account.username}</span>
                <span className="text-xs font-mono font-normal text-slate-400">({account.id})</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {account.role} • {account.department}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/60 text-slate-400 hover:text-white border border-white/[0.08] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Risk Metric Banner */}
          <div className={`p-4 rounded-2xl border ${tierStyle.border} ${tierStyle.bg} flex items-center justify-between`}>
            <div>
              <div className="text-xs text-slate-400 font-medium">Calculated Enterprise Risk</div>
              <div className="flex items-baseline space-x-2.5 mt-1">
                <span className={`text-3xl font-bold font-sans ${tierStyle.text}`}>
                  {formatRiskScore(account.final_risk || account.baseline_risk)}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${tierStyle.badge}`}>
                  {currentTier} Tier
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div>Baseline: {formatRiskScore(account.baseline_risk)}</div>
              {account.attack_adjustment > 0 && (
                <div className="text-rose-400 font-semibold mt-0.5">
                  Attack Bonus: +{(account.attack_adjustment * 100).toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          {/* Password Intelligence */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase text-slate-400 tracking-wider font-semibold">
              Password Intelligence & Audit Telemetry
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/[0.06]">
                <span className="text-[11px] text-slate-400 block font-medium">zxcvbn Entropy Score</span>
                <span className={`text-sm font-bold mt-1 block ${zxcvbnInfo.color}`}>
                  {zxcvbnInfo.label}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/[0.06]">
                <span className="text-[11px] text-slate-400 block font-medium">Synthetic Breach Corpus</span>
                <span
                  className={`text-sm font-bold mt-1 block ${
                    account.breach_match ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {account.breach_match ? "Compromised Match" : "No Breach Match"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/[0.06]">
                <span className="text-[11px] text-slate-400 block font-medium">Credential Reuse Blast Radius</span>
                <span
                  className={`text-sm font-bold mt-1 block ${
                    account.password_group_id !== null ? "text-indigo-400" : "text-slate-400"
                  }`}
                >
                  {account.password_group_id !== null
                    ? `Cluster #${account.password_group_id}`
                    : "Unique Password"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/[0.06]">
                <span className="text-[11px] text-slate-400 block font-medium">Privilege Tier</span>
                <span
                  className={`text-sm font-bold mt-1 block ${
                    account.is_privileged ? "text-cyan-400" : "text-slate-400"
                  }`}
                >
                  {account.is_privileged ? "Domain Admin / Privileged" : "Standard User"}
                </span>
              </div>
            </div>

            {/* Policy Violations */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-white/[0.06]">
              <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                Active Directory Policy Violations ({account.policy_violations.length})
              </span>
              {account.policy_violations.length === 0 ? (
                <div className="text-xs text-emerald-400 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium">Complies with baseline password policies</span>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {account.policy_violations.map((v, i) => (
                    <li key={i} className="text-xs text-amber-300 flex items-start space-x-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Attack Evidence Section */}
          <div className="p-4 rounded-xl border border-white/[0.06] bg-slate-800/30 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase text-slate-400 tracking-wider flex items-center space-x-1.5 font-semibold">
                <Zap className="w-4 h-4 text-rose-400" />
                <span>Attack Lab Empirical Telemetry</span>
              </h4>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                  account.attack_evidence
                    ? account.attack_evidence.matched
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-slate-800 text-slate-300"
                    : "bg-slate-800/80 text-slate-400 border border-white/[0.08]"
                }`}
              >
                {account.attack_evidence
                  ? account.attack_evidence.matched
                    ? "EXPLOIT MATCHED"
                    : "BUDGET EXHAUSTED"
                  : "NOT TESTED"}
              </span>
            </div>

            {account.attack_evidence ? (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>Candidates Tested: <span className="text-white font-bold">{account.attack_evidence.candidates_tested.toLocaleString()}</span></div>
                  <div>Elapsed Time: <span className="text-white font-bold">{account.attack_evidence.elapsed_ms}ms</span></div>
                  <div>Algorithm: <span className="text-cyan-400 font-bold">{account.attack_evidence.algorithm}</span></div>
                  <div>Matched Rule: <span className="text-amber-400 font-bold">{account.attack_evidence.matched_rule || "None"}</span></div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No bounded simulation performed yet for this account. Launch Attack Lab below to test deterministic mutation resistance.
              </p>
            )}
          </div>

          {/* Cryptographic Hashes Inspection */}
          <div className="space-y-2 text-xs">
            <h4 className="text-xs uppercase text-slate-400 tracking-wider font-semibold">Cryptographic Hashes</h4>
            
            {/* MD5 */}
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-white/[0.06] flex items-center justify-between">
              <div className="truncate mr-2">
                <span className="text-slate-500 uppercase text-[10px] block font-semibold">MD5 Digest</span>
                <span className="text-slate-300 font-mono truncate block text-[11px]">{account.hash_md5}</span>
              </div>
              <button
                onClick={() => copyToClipboard(account.hash_md5, "md5")}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              >
                {copiedKey === "md5" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* SHA-256 */}
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-white/[0.06] flex items-center justify-between">
              <div className="truncate mr-2">
                <span className="text-slate-500 uppercase text-[10px] block font-semibold">SHA-256 Digest</span>
                <span className="text-slate-300 font-mono truncate block text-[11px]">{account.hash_sha256}</span>
              </div>
              <button
                onClick={() => copyToClipboard(account.hash_sha256, "sha256")}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              >
                {copiedKey === "sha256" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* bcrypt */}
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-white/[0.06] flex items-center justify-between">
              <div className="truncate mr-2">
                <span className="text-slate-500 uppercase text-[10px] block font-semibold">bcrypt Hash</span>
                <span className="text-slate-300 font-mono truncate block text-[11px]">{account.hash_bcrypt}</span>
              </div>
              <button
                onClick={() => copyToClipboard(account.hash_bcrypt, "bcrypt")}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              >
                {copiedKey === "bcrypt" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Argon2id */}
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-white/[0.06] flex items-center justify-between">
              <div className="truncate mr-2">
                <span className="text-slate-500 uppercase text-[10px] block font-semibold">Argon2id Hash</span>
                <span className="text-slate-300 font-mono truncate block text-[11px]">{account.hash_argon2id}</span>
              </div>
              <button
                onClick={() => copyToClipboard(account.hash_argon2id, "argon2id")}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              >
                {copiedKey === "argon2id" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Action Button */}
        <div className="pt-6 border-t border-white/[0.08] mt-6">
          <button
            onClick={() => {
              onClose();
              onLaunchAttack(account);
            }}
            className="w-full py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold flex items-center justify-center space-x-2 transition shadow-[0_2px_15px_rgba(244,63,94,0.4)]"
          >
            <Zap className="w-4 h-4 text-white" />
            <span>Launch Account in Attack Lab</span>
          </button>
        </div>
      </div>
    </div>
  );
};

