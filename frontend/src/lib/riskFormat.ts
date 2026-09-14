export function getTierColor(tier: string): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  glow: string;
} {
  switch (tier?.toLowerCase()) {
    case "critical":
      return {
        bg: "bg-[#FF3B30]/[0.05]",
        text: "text-[#FF3B30]",
        border: "border-[#FF3B30]/20",
        badge: "bg-[#FF3B30]/[0.08] text-[#FF3B30] border border-[#FF3B30]/25",
        glow: "shadow-sm",
      };
    case "high":
      return {
        bg: "bg-[#FF9500]/[0.05]",
        text: "text-[#FF9500]",
        border: "border-[#FF9500]/20",
        badge: "bg-[#FF9500]/[0.08] text-[#FF9500] border border-[#FF9500]/25",
        glow: "shadow-sm",
      };
    case "medium":
      return {
        bg: "bg-[#E5A000]/[0.05]",
        text: "text-[#E5A000]",
        border: "border-[#E5A000]/20",
        badge: "bg-[#E5A000]/[0.08] text-[#E5A000] border border-[#E5A000]/25",
        glow: "shadow-sm",
      };
    case "low":
    default:
      return {
        bg: "bg-[#34C759]/[0.05]",
        text: "text-[#34C759]",
        border: "border-[#34C759]/20",
        badge: "bg-[#34C759]/[0.08] text-[#34C759] border border-[#34C759]/25",
        glow: "shadow-sm",
      };
  }
}

export function formatRiskScore(score: number): string {
  return (score * 100).toFixed(1) + "%";
}

export function getZxcvbnLabel(score: number): { label: string; color: string } {
  switch (score) {
    case 0:
      return { label: "Very Weak (Score 0)", color: "text-[#FF3B30]" };
    case 1:
      return { label: "Weak (Score 1)", color: "text-[#FF3B30]" };
    case 2:
      return { label: "Fair (Score 2)", color: "text-[#FF9500]" };
    case 3:
      return { label: "Good (Score 3)", color: "text-[#34C759]" };
    case 4:
      return { label: "Strong (Score 4)", color: "text-[#34C759]" };
    default:
      return { label: "Unknown", color: "text-[#86868B]" };
  }
}
