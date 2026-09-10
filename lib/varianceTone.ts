/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

export interface Tone {
  bar: string;
  text: string;
}

/**
 * Color for "percent of budget used" (Budget / FinancialValueSummary).
 * Direction depends on the budget's category: for a COST budget, higher is
 * worse (over 100% means over budget); for a REVENUE budget it's the
 * opposite (over 100% means the target was met or exceeded, which is good
 * news, not a problem to flag).
 */
export function budgetUsageTone(percentUsed: number, category: "REVENUE" | "COST"): Tone {
  const GREEN: Tone = { bar: "bg-[var(--status-green-fg)]", text: "text-[var(--status-green-fg)]" };
  const AMBER: Tone = { bar: "bg-[var(--status-amber-fg)]", text: "text-[var(--status-amber-fg)]" };
  const RED: Tone = { bar: "bg-[var(--status-red-fg)]", text: "text-[var(--status-red-fg)]" };

  if (category === "REVENUE") {
    if (percentUsed >= 100) return GREEN;
    if (percentUsed >= 80) return AMBER;
    return RED;
  }
  if (percentUsed > 100) return RED;
  if (percentUsed >= 80) return AMBER;
  return GREEN;
}

/**
 * Color for "invoiced vs. expected" variance: unlike budget usage this is
 * two-directional and asymmetric -- being under expected is the risk signal
 * (revenue not yet confirmed-invoiced), being over expected is never
 * penalized (it's good news, not a problem to flag).
 */
export function invoicingVarianceTone(variancePercent: number): Tone {
  if (variancePercent >= -10) return { bar: "bg-[var(--status-green-fg)]", text: "text-[var(--status-green-fg)]" };
  if (variancePercent >= -30) return { bar: "bg-[var(--status-amber-fg)]", text: "text-[var(--status-amber-fg)]" };
  return { bar: "bg-[var(--status-red-fg)]", text: "text-[var(--status-red-fg)]" };
}

/** Same thresholds as {@link invoicingVarianceTone}, as a KPICard variant. */
export function invoicingVarianceVariant(variancePercent: number): "success" | "warning" | "danger" {
  if (variancePercent >= -10) return "success";
  if (variancePercent >= -30) return "warning";
  return "danger";
}
