"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, FileText, Terminal, Mail, CheckCircle2 } from "lucide-react";

export const AIRemediationTeaser: React.FC = () => {
  return (
    <section className="py-20 md:py-28 bg-[#FAFAFC] border-t border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#34C759]/10 text-[#34C759] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Automated Organization Safeguard</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
            Transform identity risk into immediate enterprise defense.
          </h2>
          <p className="text-sm sm:text-base text-[#6E6E73] mt-3">
            Lexicon AI correlates risk across your entire enterprise directory topology, generating boardroom compliance deliverables and ready-to-execute IT containment scripts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Deliverable 1 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="apple-card p-6 bg-white border border-black/[0.06] rounded-2xl shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-[#1D1D1F] mb-4">
                <FileText className="w-5 h-5 text-[#0071E3]" />
              </div>
              <span className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                CISO & Boardroom Deliverable
              </span>
              <h3 className="text-lg font-semibold text-[#1D1D1F] mt-1">
                Executive Risk & Cyber Insurance Briefing
              </h3>
              <p className="text-xs text-[#6E6E73] mt-2 leading-relaxed">
                Quantifies organizational exposure, financial liability reduction, and audit compliance for SOC 2, ISO 27001, and cyber insurance underwriters.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/[0.04] text-[11px] text-[#0071E3] font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
              <span>Includes Liability Reduction & ROI Matrix</span>
            </div>
          </motion.div>

          {/* Deliverable 2 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="apple-card p-6 bg-white border border-black/[0.06] rounded-2xl shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-[#1D1D1F] mb-4">
                <Terminal className="w-5 h-5 text-[#0071E3]" />
              </div>
              <span className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                IT Operations Deliverable
              </span>
              <h3 className="text-lg font-semibold text-[#1D1D1F] mt-1">
                Active Directory PowerShell FGPP Scripts
              </h3>
              <p className="text-xs text-[#6E6E73] mt-2 leading-relaxed">
                Copy-paste Fine-Grained Password Policies, LAPS deployment templates, and automated credential rotation scripts for high-risk accounts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/[0.04] text-[11px] text-[#0071E3] font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
              <span>Tested on Windows Server & Azure Entra ID</span>
            </div>
          </motion.div>

          {/* Deliverable 3 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="apple-card p-6 bg-white border border-black/[0.06] rounded-2xl shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center text-[#1D1D1F] mb-4">
                <Mail className="w-5 h-5 text-[#0071E3]" />
              </div>
              <span className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                Workforce Security Deliverable
              </span>
              <h3 className="text-lg font-semibold text-[#1D1D1F] mt-1">
                Employee Self-Defense Guides
              </h3>
              <p className="text-xs text-[#6E6E73] mt-2 leading-relaxed">
                Clear, empathetic security instructions sent directly to employees with vulnerable accounts, guiding password manager & FIDO2 passkey adoption.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/[0.04] text-[11px] text-[#0071E3] font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
              <span>Zero-shame, high-compliance adoption</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
