/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import type { Contract } from "@/types";

export type CalendarEntryKind = "notice" | "expiry" | "renewal";

export interface CalendarEntry {
  readonly contractId: string;
  readonly contractNumber: string;
  readonly name: string;
  readonly kind: CalendarEntryKind;
  /** YYYY-MM-DD */
  readonly date: string;
}

/**
 * The dates that matter for each active contract, the same ones the ICS feed
 * carries: for a tacit renewal with its notice stated, the last day to cancel
 * (red) and the day it renews; otherwise the end date (amber).
 */
export function contractCalendarEntries(contracts: readonly Contract[]): CalendarEntry[] {
  const entries: CalendarEntry[] = [];
  for (const c of contracts) {
    if (c.status !== "ACTIVE") continue;
    const name = c.projectName || c.counterparty?.name || c.contractNumber;
    const base = { contractId: c.id, contractNumber: c.contractNumber, name };
    if (c.autoRenew && c.noticeDeadline) {
      entries.push({ ...base, kind: "notice", date: c.noticeDeadline.slice(0, 10) });
      entries.push({ ...base, kind: "renewal", date: c.endDate.slice(0, 10) });
    } else if (c.endDate) {
      entries.push({ ...base, kind: "expiry", date: c.endDate.slice(0, 10) });
    }
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date) || a.contractNumber.localeCompare(b.contractNumber));
}

/** The weeks shown for a month, Monday first, padded with the neighbouring months' days. */
export function monthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday = 0
  const start = new Date(year, month, 1 - offset);
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week = Array.from({ length: 7 }, (_, d) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d));
    if (w > 0 && week[0].getMonth() !== month) break;
    weeks.push(week);
  }
  return weeks;
}

export function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
