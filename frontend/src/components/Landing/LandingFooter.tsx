"use client";

import React from "react";
import { Shield } from "lucide-react";

export const LandingFooter: React.FC = () => {
  return (
    <footer className="py-12 bg-white border-t border-black/[0.06] text-xs text-[#86868B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 min-w-[28px] max-w-[28px] min-h-[28px] max-h-[28px] rounded-lg bg-white border border-black/[0.08] flex items-center justify-center p-0.5 overflow-hidden shadow-2xs shrink-0">
              <img
                src="/lexicon-logo.png"
                alt="Lexicon"
                className="w-full h-full object-contain block"
                style={{ width: "24px", height: "24px", maxWidth: "24px", maxHeight: "24px" }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[#1D1D1F] tracking-tight text-xs">
                LEXICON
              </span>
              <span className="text-[10px] text-[#86868B]">
                Enterprise Password Risk Intelligence
              </span>
            </div>
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
