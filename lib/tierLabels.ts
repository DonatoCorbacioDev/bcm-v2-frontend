export const TIER_LABELS: Record<string, string> = {
  FREE: "Free",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

export function tierLabel(tier: string): string {
  return TIER_LABELS[tier] ?? tier;
}
