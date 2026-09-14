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
        bg: "bg-red-950/40",
        text: "text-red-400",
        border: "border-red-600/40",
        badge: "bg-red-600/20 text-red-400 border border-red-500/30",
        glow: "shadow-[0_0_15px_rgba(239,68,68,0.25)]",
      };
    case "high":
      return {
        bg: "bg-orange-950/40",
        text: "text-orange-400",
        border: "border-orange-600/40",
        badge: "bg-orange-600/20 text-orange-400 border border-orange-500/30",
        glow: "shadow-[0_0_15px_rgba(249,115,22,0.25)]",
      };
    case "medium":
      return {
        bg: "bg-yellow-950/40",
        text: "text-yellow-400",
        border: "border-yellow-600/40",
        badge: "bg-yellow-600/20 text-yellow-400 border border-yellow-500/30",
        glow: "shadow-[0_0_15px_rgba(234,179,8,0.25)]",
      };
    case "low":
    default:
      return {
        bg: "bg-emerald-950/40",
        text: "text-emerald-400",
        border: "border-emerald-600/40",
        badge: "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30",
        glow: "shadow-[0_0_15px_rgba(16,185,129,0.25)]",
      };
  }
}

export function formatRiskScore(score: number): string {
  return (score * 100).toFixed(1) + "%";
}

export function getZxcvbnLabel(score: number): { label: string; color: string } {
  switch (score) {
    case 0:
      return { label: "Very Weak (Score 0)", color: "text-red-500" };
    case 1:
      return { label: "Weak (Score 1)", color: "text-red-400" };
    case 2:
      return { label: "Fair (Score 2)", color: "text-yellow-400" };
    case 3:
      return { label: "Good (Score 3)", color: "text-emerald-400" };
    case 4:
      return { label: "Strong (Score 4)", color: "text-emerald-300" };
    default:
      return { label: "Unknown", color: "text-slate-400" };
  }
}
