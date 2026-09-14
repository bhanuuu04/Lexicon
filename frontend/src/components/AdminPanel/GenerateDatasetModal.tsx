"use client";

import React, { useState } from "react";
import { Database, AlertTriangle, Sparkles, CheckCircle2, X, RefreshCw } from "lucide-react";
import { generateNewDataset } from "../../lib/api";
import { GenerateDatasetResponse } from "../../types";

interface GenerateDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetGenerated: (response: GenerateDatasetResponse) => void;
  currentCount?: number;
}

export const GenerateDatasetModal: React.FC<GenerateDatasetModalProps> = ({
  isOpen,
  onClose,
  onDatasetGenerated,
  currentCount = 50000,
}) => {
  const [selectedCount, setSelectedCount] = useState<number>(50000);
  const [customInput, setCustomInput] = useState<string>("");
  const [confirmationInput, setConfirmationInput] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const presets = [1000, 5000, 10000, 25000, 50000];

  const effectiveCount = customInput ? parseInt(customInput, 10) || selectedCount : selectedCount;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationInput.trim().toUpperCase() !== "GENERATE") {
      setError("Please type 'GENERATE' exactly to confirm dataset replacement.");
      return;
    }

    if (effectiveCount < 100 || effectiveCount > 100000) {
      setError("Account count must be between 100 and 100,000.");
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const response = await generateNewDataset(effectiveCount);
      onDatasetGenerated(response);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to generate new synthetic dataset.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-black/[0.08] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-black/[0.06] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1D1D1F]">
                Generate Synthetic Dataset
              </h3>
              <p className="text-xs text-[#6E6E73]">
                Admin Lifecycle Management • Persistent On-Demand Synthesis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="w-8 h-8 rounded-full hover:bg-black/[0.05] flex items-center justify-center text-[#86868B] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-6 space-y-6">
          <div className="p-4 rounded-2xl bg-[#FF9500]/[0.08] border border-[#FF9500]/20 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-[#FF9500] shrink-0 mt-0.5" />
            <div className="text-xs text-[#1D1D1F] space-y-1">
              <p className="font-semibold text-[#FF9500]">Dataset Persistence Notice</p>
              <p className="text-[#6E6E73] leading-relaxed">
                Generating a new dataset will replace the active <strong>{currentCount.toLocaleString()}</strong> Active Directory records, recalculate the complete security audit, and reset all attack and remediation states.
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Account Count Selector */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#86868B] block mb-2">
                Select Synthetic Account Volume
              </label>
              <div className="grid grid-cols-5 gap-2">
                {presets.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      setSelectedCount(count);
                      setCustomInput("");
                    }}
                    disabled={isGenerating}
                    className={`py-2 rounded-xl text-xs font-semibold transition border ${
                      selectedCount === count && !customInput
                        ? "bg-[#0071E3] text-white border-[#0071E3] shadow-xs"
                        : "bg-[#F5F5F7] hover:bg-[#EBEBED] text-[#1D1D1F] border-black/[0.06]"
                    }`}
                  >
                    {count >= 1000 ? `${count / 1000}k` : count}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Account Size */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#86868B] block mb-1.5">
                Or Custom Account Size (100 - 100,000)
              </label>
              <input
                type="number"
                min={100}
                max={100000}
                placeholder="e.g. 50000"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                disabled={isGenerating}
                className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs sm:text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 focus:bg-white transition"
              />
            </div>

            {/* Confirmation Input */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#86868B] block mb-1.5">
                Type <span className="font-mono text-[#FF3B30] font-bold">GENERATE</span> to confirm
              </label>
              <input
                type="text"
                placeholder="GENERATE"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                disabled={isGenerating}
                className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs sm:text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#FF3B30]/20 focus:bg-white transition font-mono"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#FF3B30]/10 text-[#FF3B30] text-xs font-medium border border-[#FF3B30]/20">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="px-4 py-2.5 rounded-xl bg-[#F5F5F7] hover:bg-[#EBEBED] text-xs font-medium text-[#1D1D1F] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating || confirmationInput.trim().toUpperCase() !== "GENERATE"}
                className="px-5 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-40 text-xs font-semibold text-white flex items-center space-x-2 shadow-xs transition active:scale-[0.98]"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing {effectiveCount.toLocaleString()} accounts...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate & Persist Dataset</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
