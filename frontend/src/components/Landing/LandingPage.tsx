"use client";

import React, { useRef } from "react";
import { LandingHero } from "./LandingHero";
import { TrustMetrics } from "./TrustMetrics";
import { HowItWorks } from "./HowItWorks";
import { BlastRadiusStory } from "./BlastRadiusStory";
import { AttackLabTeaser } from "./AttackLabTeaser";
import { HashRaceTeaser } from "./HashRaceTeaser";
import { AIRemediationTeaser } from "./AIRemediationTeaser";
import { SecurityArchitecture } from "./SecurityArchitecture";
import { LandingCTA } from "./LandingCTA";
import { LandingFooter } from "./LandingFooter";

interface LandingPageProps {
  onExploreAdmin: () => void;
  onExploreUser: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onExploreAdmin,
  onExploreUser,
}) => {
  const securitySectionRef = useRef<HTMLDivElement>(null);

  const handleScrollToSecurity = () => {
    securitySectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full bg-[#F5F5F7] min-h-screen text-[#1D1D1F] selection:bg-[#0071E3] selection:text-white">
      {/* 1. Hero */}
      <LandingHero
        onExploreClick={onExploreAdmin}
        onExploreUser={onExploreUser}
        onSecurityModelClick={handleScrollToSecurity}
      />

      {/* 2. Trust Metrics */}
      <TrustMetrics />

      {/* 3. Pipeline / How it works */}
      <HowItWorks />

      {/* 4. Blast Radius Interactive Story */}
      <BlastRadiusStory />

      {/* 5. Attack Lab Live Telemetry */}
      <AttackLabTeaser />

      {/* 6. Cryptographic Hardness Benchmark */}
      <HashRaceTeaser />

      {/* 7. AI Advisory Teaser */}
      <AIRemediationTeaser />

      {/* 8. Enterprise Security Architecture */}
      <div ref={securitySectionRef}>
        <SecurityArchitecture />
      </div>

      {/* 9. Landing CTA */}
      <LandingCTA
        onLaunchAdmin={onExploreAdmin}
        onLaunchUser={onExploreUser}
      />

      {/* 10. Footer */}
      <LandingFooter />
    </div>
  );
};
