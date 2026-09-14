"use client";

import React from "react";
import { Shield } from "lucide-react";

export const LandingFooter: React.FC = () => {
  return (
    <footer className="py-12 bg-white border-t border-black/[0.06] text-xs text-[#86868B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-lg bg-[#0071E3] flex items-center justify-center text-white">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-[#1D1D1F]">
              Lexicon Enterprise Password Risk Intelligence
            </span>
          </div>

          <div className="flex items-center space-x-6 text-[#6E6E73]">
            <span>Deterministic Risk Model</span>
            <span>•</span>
            <span>k-Anonymity Verified</span>
            <span>•</span>
            <span>Active Directory Synthetic 50k</span>
          </div>

          <div>
            <span>© {new Date().getFullYear()} Lexicon Cyber Intelligence. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
