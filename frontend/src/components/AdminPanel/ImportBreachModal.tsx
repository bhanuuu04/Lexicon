"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, ShieldAlert, CheckCircle2, FileText, Plus, Database } from "lucide-react";
import { importCustomBreachList } from "../../lib/api";

interface ImportBreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (count: number) => void;
}

export const ImportBreachModal: React.FC<ImportBreachModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [inputText, setInputText] = useState("");
  const [sourceLabel, setSourceLabel] = useState("Custom Incident Threat Dump");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    const lines = inputText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setError("Please paste or type at least one password to import.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await importCustomBreachList(lines, sourceLabel);
      setResult({ count: res.imported_count, total: res.total_corpus_size });
      if (onImportSuccess) {
        onImportSuccess(res.imported_count);
      }
    } catch (err: any) {
      setError(err.message || "Failed to import compromised passwords");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInputText("");
    setResult(null);
    setError(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="apple-card max-w-xl w-full p-6 space-y-5 bg-white shadow-2xl border border-black/[0.1] relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FF3B30]/10 flex items-center justify-center text-[#FF3B30]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1D1D1F]">
                  Import Custom Threat Intelligence Dump
                </h3>
                <p className="text-xs text-[#86868B]">
                  Dynamically ingest compromised credentials into the live Lexicon breach corpus.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {result ? (
            <div className="p-6 rounded-xl bg-[#34C759]/[0.08] border border-[#34C759]/20 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#34C759] mx-auto" />
              <div className="text-base font-semibold text-[#1D1D1F]">
                Threat Ingestion Successful!
              </div>
              <p className="text-xs text-[#6E6E73]">
                Successfully indexed <strong className="text-[#1D1D1F]">{result.count.toLocaleString()}</strong> new compromised credentials. Total active corpus is now <strong className="text-[#0071E3]">{result.total.toLocaleString()}</strong> entries.
              </p>
              <div className="pt-2 flex justify-center space-x-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-white border border-black/[0.08] text-xs font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] transition"
                >
                  Import More
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[#0071E3] text-white text-xs font-medium hover:bg-[#0077ED] transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                  Threat Source Label
                </label>
                <input
                  type="text"
                  value={sourceLabel}
                  onChange={(e) => setSourceLabel(e.target.value)}
                  placeholder="e.g. Dark Web Dump 2026, Incident #402"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-xs text-[#1D1D1F] focus:outline-none focus:border-[#0071E3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                  Compromised Passwords (One per line)
                </label>
                <textarea
                  rows={6}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Password123!&#10;Company2026!&#10;WelcomeSummer#1"
                  className="w-full p-3.5 rounded-xl bg-[#F5F5F7] border border-black/[0.08] text-xs font-mono text-[#1D1D1F] focus:outline-none focus:border-[#0071E3] resize-none"
                />
                <div className="text-[11px] text-[#86868B] mt-1">
                  Lines detected: {inputText.split("\n").filter((l) => l.trim().length > 0).length}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-xs text-[#FF3B30]">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[#F5F5F7] text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] transition"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  onClick={handleImport}
                  className="px-5 py-2 rounded-xl bg-[#FF3B30] hover:bg-[#E02E24] disabled:opacity-50 text-white text-xs font-medium flex items-center space-x-2 shadow-xs transition"
                >
                  {loading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Ingesting Corpus...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Ingest into Corpus</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
