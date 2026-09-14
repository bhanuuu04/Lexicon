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
  Cpu,
  Clock,
  KeyRound,
  Sparkles,
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
  const zxcvbnAnalysis = account.zxcvbn_analysis;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/25 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-xl bg-white/95 backdrop-blur-2xl border-l border-black/[0.08] h-full overflow-y-auto p-6 flex flex-col justify-between shadow-modal">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-black/[0.06]">
            <div>
              <div className="flex items-center space-x-2">
                {account.is_hero && (
                  <span className="px-2 py-0.5 rounded-full bg-[#FF3B30] text-white text-[10px] font-semibold shadow-sm">
                    HERO SCENARIO TARGET
                  </span>
                )}
                <span className="text-xs text-[#0071E3] font-semibold uppercase tracking-wider">
                  Account Telemetry Profile
                </span>
              </div>
              <h2 className="text-xl font-semibold text-[#1D1D1F] mt-1.5 flex items-center space-x-2 font-sans">
                <span>{account.username}</span>
                <span className="text-xs font-mono font-normal text-[#86868B]">({account.id})</span>
              </h2>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                {account.role} • {account.department}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#EBEBED] border border-black/[0.06] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Risk Metric Banner */}
          <div className={`p-4 rounded-2xl border ${tierStyle.border} ${tierStyle.bg} flex items-center justify-between`}>
            <div>
              <div className="text-xs text-[#6E6E73] font-medium">Calculated Enterprise Risk</div>
              <div className="flex items-baseline space-x-2.5 mt-1">
                <span className={`text-3xl font-semibold font-sans ${tierStyle.text}`}>
                  {formatRiskScore(account.final_risk || account.baseline_risk)}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${tierStyle.badge}`}>
                  {currentTier} Tier
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-[#6E6E73]">
              <div>Baseline: {formatRiskScore(account.baseline_risk)}</div>
              {account.attack_adjustment > 0 && (
                <div className="text-[#FF3B30] font-semibold mt-0.5">
                  Attack Bonus: +{(account.attack_adjustment * 100).toFixed(1)}%
                </div>
              )}
            </div>
          </div>

          {/* zxcvbn Password Pattern Anatomy & Crack Times */}
          {zxcvbnAnalysis && (
            <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#0071E3]/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-[#0071E3] uppercase tracking-wider">
                  <Cpu className="w-4 h-4" />
                  <span>zxcvbn Pattern Sequence & Entropy</span>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white text-[#1D1D1F] border border-black/[0.06]">
                  {zxcvbnAnalysis.entropy_bits} bits entropy
                </span>
              </div>

              {/* Sequence Tokens Anatomy */}
              {zxcvbnAnalysis.sequence && zxcvbnAnalysis.sequence.length > 0 && (
                <div>
                  <span className="text-[11px] text-[#86868B] block mb-1.5 font-medium">
                    Decomposed Pattern Anatomy:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {zxcvbnAnalysis.sequence.map((seq, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-lg bg-white border border-black/[0.06] text-xs font-mono flex items-center space-x-1 shadow-xs"
                      >
                        <span className="font-semibold text-[#0071E3]">{seq.token}</span>
                        <span className="text-[10px] text-[#86868B] uppercase">
                          ({seq.pattern}{seq.matched_word ? `: ${seq.matched_word}` : ""})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fast vs Slow Hash Crack Times */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-black/[0.04] text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-black/[0.04]">
                  <span className="text-[10px] text-[#86868B] uppercase block font-semibold flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-[#FF3B30]" />
                    <span>NTLM Fast Hash (Offline GPU)</span>
                  </span>
                  <span className="text-xs font-semibold text-[#FF3B30] mt-0.5 block">
                    {zxcvbnAnalysis.crack_times_display.offline_fast_hashing_1e10_per_second}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-black/[0.04]">
                  <span className="text-[10px] text-[#86868B] uppercase block font-semibold flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-[#34C759]" />
                    <span>Argon2id Slow Hash (Memory-Hard)</span>
                  </span>
                  <span className="text-xs font-semibold text-[#34C759] mt-0.5 block">
                    {zxcvbnAnalysis.crack_times_display.offline_slow_hashing_1e4_per_second}
                  </span>
                </div>
              </div>

              {/* Suggestions / Warning */}
              {(zxcvbnAnalysis.feedback.warning || (zxcvbnAnalysis.feedback.suggestions && zxcvbnAnalysis.feedback.suggestions.length > 0)) && (
                <div className="text-xs text-[#6E6E73] p-2.5 rounded-xl bg-white border border-black/[0.04] space-y-1">
                  {zxcvbnAnalysis.feedback.warning && (
                    <div className="text-[#FF9500] font-medium flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{zxcvbnAnalysis.feedback.warning}</span>
                    </div>
                  )}
                  {zxcvbnAnalysis.feedback.suggestions.map((sugg, i) => (
                    <div key={i} className="text-[11px] text-[#6E6E73]">
                      • {sugg}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Password Intelligence */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase text-[#86868B] tracking-wider font-semibold">
              Enterprise Audit Telemetry
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.04]">
                <span className="text-[11px] text-[#6E6E73] block font-medium">zxcvbn Strength</span>
                <span className={`text-sm font-semibold mt-1 block ${zxcvbnInfo.color}`}>
                  {zxcvbnInfo.label}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.04]">
                <span className="text-[11px] text-[#6E6E73] block font-medium">Breach Corpus Status</span>
                <span
                  className={`text-sm font-semibold mt-1 block ${
                    account.breach_match ? "text-[#FF3B30]" : "text-[#34C759]"
                  }`}
                >
                  {account.breach_match ? "Compromised Match" : "Clean (No Match)"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.04]">
                <span className="text-[11px] text-[#6E6E73] block font-medium">Credential Reuse Blast Radius</span>
                <span
                  className={`text-sm font-semibold mt-1 block ${
                    account.password_group_id !== null ? "text-[#5856D6]" : "text-[#86868B]"
                  }`}
                >
                  {account.password_group_id !== null
                    ? `Cluster #${account.password_group_id}`
                    : "Unique Password"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.04]">
                <span className="text-[11px] text-[#6E6E73] block font-medium">Privilege Tier</span>
                <span
                  className={`text-sm font-semibold mt-1 block ${
                    account.is_privileged ? "text-[#0071E3]" : "text-[#86868B]"
                  }`}
                >
                  {account.is_privileged ? "Domain Admin / Privileged" : "Standard User"}
                </span>
              </div>
            </div>

            {/* Policy Violations */}
            <div className="p-4 rounded-xl bg-[#F5F5F7] border border-black/[0.04]">
              <span className="text-[11px] text-[#6E6E73] block mb-2 font-medium">
                Active Directory Policy Violations ({account.policy_violations.length})
              </span>
              {account.policy_violations.length === 0 ? (
                <div className="text-xs text-[#34C759] flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#34C759]" />
                  <span className="font-medium">Complies with baseline password policies</span>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {account.policy_violations.map((v, i) => (
                    <li key={i} className="text-xs text-[#FF9500] flex items-start space-x-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#FF9500] shrink-0 mt-0.5" />
                      <span className="text-[#1D1D1F] font-medium">{v}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Active Directory Hashes Breakdown */}
            <div className="p-4 rounded-xl bg-[#F5F5F7] border border-black/[0.04] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#6E6E73] font-medium flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#0071E3]" />
                  <span>Cryptographic Hashes & AD Digests</span>
                </span>
                <span className="text-[10px] text-[#86868B] font-mono">Multi-Algorithm</span>
              </div>

              <div className="space-y-1.5">
                {account.hash_ntlm && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-black/[0.04]">
                    <div className="min-w-0 flex-1 mr-2">
                      <span className="text-[10px] font-semibold text-[#1D1D1F] block">NTLM (Active Directory)</span>
                      <span className="text-[11px] font-mono text-[#86868B] truncate block">{account.hash_ntlm}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(account.hash_ntlm!, "ntlm")}
                      className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-md transition shrink-0"
                    >
                      {copiedKey === "ntlm" ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-black/[0.04]">
                  <div className="min-w-0 flex-1 mr-2">
                    <span className="text-[10px] font-semibold text-[#1D1D1F] block">SHA-256</span>
                    <span className="text-[11px] font-mono text-[#86868B] truncate block">{account.hash_sha256}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(account.hash_sha256, "sha256")}
                    className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-md transition shrink-0"
                  >
                    {copiedKey === "sha256" ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-black/[0.04]">
                  <div className="min-w-0 flex-1 mr-2">
                    <span className="text-[10px] font-semibold text-[#1D1D1F] block">Bcrypt (Cost 12)</span>
                    <span className="text-[11px] font-mono text-[#86868B] truncate block">{account.hash_bcrypt}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(account.hash_bcrypt, "bcrypt")}
                    className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-md transition shrink-0"
                  >
                    {copiedKey === "bcrypt" ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-black/[0.04]">
                  <div className="min-w-0 flex-1 mr-2">
                    <span className="text-[10px] font-semibold text-[#1D1D1F] block">Argon2id (64MB, 4 Passes)</span>
                    <span className="text-[11px] font-mono text-[#86868B] truncate block">{account.hash_argon2id}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(account.hash_argon2id, "argon2id")}
                    className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-md transition shrink-0"
                  >
                    {copiedKey === "argon2id" ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Algorithm Cryptographic Digests */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase text-[#86868B] tracking-wider font-semibold flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>Multi-Algorithm Cryptographic Digests</span>
            </h4>

            <div className="space-y-2">
              {/* NTLM */}
              <div className="p-3 rounded-xl bg-[#F5F5F7] border border-black/[0.04] flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#FF3B30]/[0.1] text-[#FF3B30]">
                      NTLM (Active Directory)
                    </span>
                    <span className="text-[10px] text-[#86868B]">1 round MD4</span>
                  </div>
                  <div className="text-xs font-mono text-[#1D1D1F] truncate mt-1">
                    {account.hash_ntlm || "N/A"}
                  </div>
                </div>
                {account.hash_ntlm && (
                  <button
                    onClick={() => copyToClipboard(account.hash_ntlm!, "ntlm")}
                    className="p-1.5 rounded-lg hover:bg-white text-[#6E6E73] hover:text-[#1D1D1F] transition shrink-0"
                    title="Copy NTLM hash"
                  >
                    {copiedKey === "ntlm" ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* SHA-256 */}
              <div className="p-3 rounded-xl bg-[#F5F5F7] border border-black/[0.04] flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#FF9500]/[0.1] text-[#FF9500]">
                      SHA-256
                    </span>
                    <span className="text-[10px] text-[#86868B]">Standard digest</span>
                  </div>
                  <div className="text-xs font-mono text-[#1D1D1F] truncate mt-1">
                    {account.hash_sha256 || "N/A"}
                  </div>
                </div>
                {account.hash_sha256 && (
                  <button
                    onClick={() => copyToClipboard(account.hash_sha256, "sha256")}
                    className="p-1.5 rounded-lg hover:bg-white text-[#6E6E73] hover:text-[#1D1D1F] transition shrink-0"
                    title="Copy SHA-256 hash"
                  >
                    {copiedKey === "sha256" ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* bcrypt */}
              <div className="p-3 rounded-xl bg-[#F5F5F7] border border-black/[0.04] flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#0071E3]/[0.1] text-[#0071E3]">
                      bcrypt
                    </span>
                    <span className="text-[10px] text-[#86868B]">Cost 12 (4,096 rounds)</span>
                  </div>
                  <div className="text-xs font-mono text-[#1D1D1F] truncate mt-1">
                    {account.hash_bcrypt || "N/A"}
                  </div>
                </div>
                {account.hash_bcrypt && (
                  <button
                    onClick={() => copyToClipboard(account.hash_bcrypt, "bcrypt")}
                    className="p-1.5 rounded-lg hover:bg-white text-[#6E6E73] hover:text-[#1D1D1F] transition shrink-0"
                    title="Copy bcrypt hash"
                  >
                    {copiedKey === "bcrypt" ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* Argon2id */}
              <div className="p-3 rounded-xl bg-[#F5F5F7] border border-black/[0.04] flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#34C759]/[0.1] text-[#34C759]">
                      Argon2id
                    </span>
                    <span className="text-[10px] text-[#86868B]">64 MiB / 4 passes (PHC)</span>
                  </div>
                  <div className="text-xs font-mono text-[#1D1D1F] truncate mt-1">
                    {account.hash_argon2id || "N/A"}
                  </div>
                </div>
                {account.hash_argon2id && (
                  <button
                    onClick={() => copyToClipboard(account.hash_argon2id, "argon2id")}
                    className="p-1.5 rounded-lg hover:bg-white text-[#6E6E73] hover:text-[#1D1D1F] transition shrink-0"
                    title="Copy Argon2id hash"
                  >
                    {copiedKey === "argon2id" ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Attack Evidence Section */}
          <div className="p-4 rounded-xl border border-black/[0.06] bg-[#F5F5F7] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase text-[#86868B] tracking-wider flex items-center space-x-1.5 font-semibold">
                <Zap className="w-4 h-4 text-[#FF3B30]" />
                <span>Attack Lab Empirical Telemetry</span>
              </h4>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                  account.attack_evidence
                    ? account.attack_evidence.matched
                      ? "bg-[#FF3B30]/[0.1] text-[#FF3B30] border border-[#FF3B30]/20"
                      : "bg-black/[0.05] text-[#1D1D1F]"
                    : "bg-black/[0.05] text-[#86868B] border border-black/[0.06]"
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
                <div className="grid grid-cols-2 gap-2 text-[#6E6E73]">
                  <div>Candidates Tested: <span className="text-[#1D1D1F] font-semibold">{account.attack_evidence.candidates_tested.toLocaleString()}</span></div>
                  <div>Elapsed Time: <span className="text-[#1D1D1F] font-semibold">{account.attack_evidence.elapsed_ms}ms</span></div>
                  <div>Algorithm: <span className="text-[#0071E3] font-semibold">{account.attack_evidence.algorithm}</span></div>
                  <div>Matched Rule: <span className="text-[#FF9500] font-semibold">{account.attack_evidence.matched_rule || "None"}</span></div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#86868B]">
                No client-side attack simulation has been executed on this account yet.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-black/[0.06] flex items-center space-x-3">
          <button
            onClick={() => onLaunchAttack(account)}
            className="flex-1 py-3 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-sm transition active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 text-white" />
            <span>Attack Lab</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-[#F5F5F7] hover:bg-[#EBEBED] text-[#1D1D1F] text-xs font-medium border border-black/[0.08] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
