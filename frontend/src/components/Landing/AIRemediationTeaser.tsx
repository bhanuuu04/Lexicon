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
            <span>AI Risk Intelligence</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
            From raw risk findings to executive & IT action.
          </h2>
          <p className="text-sm sm:text-base text-[#6E6E73] mt-3">
            Lexicon AI correlates risk telemetry across your Active Directory topology and generates immediate, role-specific remediation deliverables.
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
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                Leadership Deliverable
              </span>
              <h3 className="text-lg font-semibold text-[#1D1D1F] mt-1">
                Executive Risk Briefing
              </h3>
              <p className="text-xs text-[#6E6E73] mt-2 leading-relaxed">
                Concise, board-ready overview quantifying organization-wide credential vulnerability, insurance liability, and compliance standing.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/[0.04] text-[11px] text-[#0071E3] font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
              <span>Includes ROI & Insurance Defense Score</span>
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
                <Terminal className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                IT Operations Deliverable
              </span>
              <h3 className="text-lg font-semibold text-[#1D1D1F] mt-1">
                Helpdesk Execution Scripts
              </h3>
              <p className="text-xs text-[#6E6E73] mt-2 leading-relaxed">
                Ready-to-run Active Directory PowerShell commands, Fine-Grained Password Policies (FGPP), and automated credential rotation scripts.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/[0.04] text-[11px] text-[#0071E3] font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
              <span>Copy-paste PowerShell & LAPS Policies</span>
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
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                Workforce Security Deliverable
              </span>
              <h3 className="text-lg font-semibold text-[#1D1D1F] mt-1">
                Targeted User Guidance
              </h3>
              <p className="text-xs text-[#6E6E73] mt-2 leading-relaxed">
                Empathetic, clear security instructions sent directly to employees with vulnerable accounts, explaining how to adopt password managers.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/[0.04] text-[11px] text-[#0071E3] font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
              <span>Zero-shame, high-compliance messaging</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
