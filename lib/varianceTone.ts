/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

export interface Tone {
  bar: string;
  text: string;
}

/**
 * How much of a yearly budget should be reached by `today`, as a percentage:
 * the share of the year already gone for the current year, 100 for a past
 * year (the whole target was due) and 0 for a future one. Budgets are yearly
 * targets while financial values accrue month by month, so comparing them
 * against 100% all year long turns every area red in January.
 */
export function expectedBudgetPercent(year: number, today: Date = new Date()): number {
  const currentYear = today.getFullYear();
  if (year < currentYear) return 100;
  if (year > currentYear) return 0;
  const start = new Date(currentYear, 0, 1).getTime();
  const end = new Date(currentYear + 1, 0, 1).getTime();
  const startOfTomorrow = new Date(currentYear, today.getMonth(), today.getDate() + 1).getTime();
  return ((startOfTomorrow - start) / (end - start)) * 100;
}

/**
 * Color for "percent of budget used" (Budget / FinancialValueSummary),
 * measured against `expectedPercent` (see expectedBudgetPercent; 100 = the
 * whole yearly target), with BCM's one meaning per colour: blue bar when in
 * line, amber when off the pace. Never red: in BCM red is a date to act by or
 * a payment to stop, and a budget off its pace is a warning.
 * - REVENUE: in line once on pace, amber below it.
 * - COST: in line up to the pace, amber ahead of it (and over the budget).
 */
export function budgetUsageTone(percentUsed: number, category: "REVENUE" | "COST", expectedPercent = 100): Tone {
  const IN_LINE: Tone = { bar: "bg-primary", text: "text-[var(--status-green-fg)]" };
  const AMBER: Tone = { bar: "bg-[var(--status-amber-mark)]", text: "text-[var(--status-amber-fg)]" };

  if (category === "REVENUE") return percentUsed >= expectedPercent ? IN_LINE : AMBER;
  return percentUsed > expectedPercent ? AMBER : IN_LINE;
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
