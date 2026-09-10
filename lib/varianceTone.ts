/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

export interface Tone {
  bar: string;
  text: string;
}

/**
 * Color for "percent of budget used" (Budget / FinancialValueSummary):
 * higher is worse, over 100% means over budget. Previously duplicated
 * verbatim as a local `usageTone` in both components.
 */
export function budgetUsageTone(percentUsed: number): Tone {
  if (percentUsed > 100) return { bar: "bg-[var(--status-red-fg)]", text: "text-[var(--status-red-fg)]" };
  if (percentUsed >= 80) return { bar: "bg-[var(--status-amber-fg)]", text: "text-[var(--status-amber-fg)]" };
  return { bar: "bg-[var(--status-green-fg)]", text: "text-[var(--status-green-fg)]" };
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
