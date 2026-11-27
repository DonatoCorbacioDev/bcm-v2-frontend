/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import type { Budget, FinancialCategory, FinancialValue } from "@/types";

/**
 * The numbers behind "Costi e budget", from the contracts' expected amounts
 * (financial values: generated from each contract's annual value, or entered
 * by hand) and the budgets. "Fino a oggi" counts the months up to the
 * current one; the forecast counts the whole year, future months included,
 * as the contracts foresee them. All amounts are VAT excluded.
 */
export interface MonthPoint {
  readonly month: number; // 1-12
  readonly label: string; // "gen"
  /** Cumulative amount up to this month, for the months up to today; null after. */
  readonly actual: number | null;
  /** Cumulative amount as the contracts foresee it, from today's month on; null before. */
  readonly forecast: number | null;
  /** Where the budget says one should be by the end of this month. */
  readonly pace: number | null;
}

export interface AreaRow {
  readonly areaName: string;
  readonly toDate: number;
  readonly budget: number | null;
}

export interface ContractRow {
  readonly contractId: string;
  readonly name: string;
  readonly areaName: string;
  readonly yearTotal: number;
}

export interface CostsOverview {
  readonly toDate: number;
  readonly yearForecast: number;
  readonly budget: number;
  /** Where one should be today: the budget times the share of the year gone by. */
  readonly paceToday: number;
  readonly months: MonthPoint[];
  readonly areas: AreaRow[];
  readonly topContracts: ContractRow[];
}

const MONTH_LABELS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

/** The share of `year` gone by on `today`: 0 before it starts, 1 after it ends. */
export function yearShare(year: number, today: Date): number {
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year + 1, 0, 1).getTime();
  return Math.min(1, Math.max(0, (today.getTime() - start) / (end - start)));
}

export function buildCostsOverview(
  values: readonly FinancialValue[],
  budgets: readonly Budget[],
  year: number,
  category: FinancialCategory,
  today: Date = new Date(),
): CostsOverview {
  const ofYear = values.filter((v) => v.year === year && v.category === category);
  // The months already lived: all of a past year, none of a future one.
  const lastLived = year < today.getFullYear() ? 12 : year > today.getFullYear() ? 0 : today.getMonth() + 1;

  const byMonth = new Array<number>(12).fill(0);
  for (const v of ofYear) byMonth[v.month - 1] += v.financialAmount;

  const budget = budgets.filter((b) => b.year === year && b.category === category).reduce((s, b) => s + b.targetAmount, 0);

  let running = 0;
  const months: MonthPoint[] = byMonth.map((amount, i) => {
    running += amount;
    const month = i + 1;
    return {
      month,
      label: MONTH_LABELS[i],
      actual: month <= lastLived ? running : null,
      // The forecast line starts where the actual one stops, so the two join.
      forecast: month >= lastLived ? running : null,
      pace: budget > 0 ? (budget * month) / 12 : null,
    };
  });

  const toDate = byMonth.slice(0, lastLived).reduce((s, a) => s + a, 0);
  const yearForecast = byMonth.reduce((s, a) => s + a, 0);

  const areaNames = new Set<string>();
  for (const v of ofYear) areaNames.add(v.areaName ?? "Senza reparto");
  const areaBudgets = budgets.filter((b) => b.year === year && b.category === category);
  for (const b of areaBudgets) areaNames.add(b.areaName);
  const areas: AreaRow[] = [...areaNames]
    .map((areaName) => ({
      areaName,
      toDate: ofYear
        .filter((v) => (v.areaName ?? "Senza reparto") === areaName && v.month <= lastLived)
        .reduce((s, v) => s + v.financialAmount, 0),
      budget: areaBudgets.filter((b) => b.areaName === areaName).reduce((s, b) => s + b.targetAmount, 0) || null,
    }))
    .sort((a, b) => b.toDate - a.toDate);

  const byContract = new Map<string, ContractRow>();
  for (const v of ofYear) {
    const row = byContract.get(v.contractId);
    byContract.set(v.contractId, {
      contractId: v.contractId,
      name: v.customerName ?? "Contratto",
      areaName: v.areaName ?? "",
      yearTotal: (row?.yearTotal ?? 0) + v.financialAmount,
    });
  }
  const topContracts = [...byContract.values()].sort((a, b) => b.yearTotal - a.yearTotal).slice(0, 5);

  return { toDate, yearForecast, budget, paceToday: budget * yearShare(year, today), months, areas, topContracts };
}

/** The year's amounts as a CSV that Excel opens in Italian (";" and decimal comma). */
export function costsCsv(values: readonly FinancialValue[], year: number, category: FinancialCategory): string {
  const amount = (n: number) => n.toFixed(2).replace(".", ",");
  const cell = (s: string) => `"${s.replaceAll('"', '""')}"`;
  const rows = values
    .filter((v) => v.year === year && v.category === category)
    .sort((a, b) => a.month - b.month || (a.customerName ?? "").localeCompare(b.customerName ?? ""))
    .map((v) => [
      `${String(v.month).padStart(2, "0")}/${v.year}`,
      cell(v.customerName ?? ""),
      cell(v.areaName ?? ""),
      cell(v.typeName ?? ""),
      amount(v.financialAmount),
    ].join(";"));
  return ["Mese;Controparte;Reparto;Categoria;Importo (IVA esclusa)", ...rows].join("\r\n");
}
