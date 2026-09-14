"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

interface LandingCTAProps {
  onLaunchAdmin: () => void;
  onLaunchUser: () => void;
}

export const LandingCTA: React.FC<LandingCTAProps> = ({
  onLaunchAdmin,
  onLaunchUser,
}) => {
  return (
    <section className="py-20 md:py-28 bg-[#1D1D1F] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#34C759]"></span>
            <span>Continuous Enterprise Protection Active</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-tight">
            Ready to shield your enterprise identity perimeter?
          </h2>

          <p className="text-sm sm:text-base text-[#A1A1A6] max-w-xl mx-auto">
            Experience complete identity threat detection, blast radius containment, and automated remediation across your entire workforce.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onLaunchAdmin}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-lg transition active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Launch SOC Operations</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLaunchUser}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm flex items-center justify-center space-x-2 border border-white/10 transition active:scale-[0.98]"
            >
              <UserCheck className="w-4 h-4" />
              <span>Launch Employee Security View</span>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
