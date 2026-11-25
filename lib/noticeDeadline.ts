/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

/**
 * The last day to cancel a contract before it renews: the end date minus the
 * notice written in the contract. In days it is the backend's own rule
 * (Contracts.noticeDeadline: endDate - noticeDays); in months the notice is
 * counted in calendar months, as the contract states it, so "3 mesi" before
 * 31 May is 28 or 29 February, never 90 days.
 *
 * Dates are ISO "YYYY-MM-DD" and handled in UTC, so no time zone or daylight
 * saving change can move a day.
 */

export type NoticeUnit = "days" | "months";

export interface NoticeInput {
  /** The contract's end date. */
  readonly endDate: string;
  readonly notice: number;
  readonly unit: NoticeUnit;
  /** How long it renews for, in months; absent when the renewal is unknown. */
  readonly renewalMonths?: number | null;
  /** Today, in the user's own calendar. */
  readonly today: string;
}

export interface NoticeResult {
  /** The last day the cancellation must reach the supplier. */
  readonly deadline: string;
  readonly daysLeft: number;
  /** The deadline falls on a Saturday or a Sunday. */
  readonly weekend: boolean;
  /**
   * Set when the deadline for this end date has passed and the renewal is
   * known: the end date and deadline of the first renewal still open.
   */
  readonly renewed: { readonly endDate: string; readonly deadline: string; readonly daysLeft: number; readonly weekend: boolean } | null;
  /** The deadline has passed and no renewal was given to look ahead. */
  readonly passed: boolean;
}

export const MAX_NOTICE = { days: 3650, months: 120 } as const;
export const MAX_RENEWAL_MONTHS = 120;

const DAY_MS = 86_400_000;

function parse(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d ? date : null;
}

function format(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The same day `months` later (or earlier), on the month's last day when it has no such day. */
export function addMonths(iso: string, months: number): string {
  const date = parse(iso);
  if (!date) throw new Error(`Not a date: ${iso}`);
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return format(new Date(Date.UTC(y, m, Math.min(date.getUTCDate(), lastDay))));
}

function addDays(iso: string, days: number): string {
  const date = parse(iso);
  if (!date) throw new Error(`Not a date: ${iso}`);
  return format(new Date(date.getTime() + days * DAY_MS));
}

function daysBetween(from: string, to: string): number {
  return Math.round(((parse(to)?.getTime() ?? 0) - (parse(from)?.getTime() ?? 0)) / DAY_MS);
}

function isWeekend(iso: string): boolean {
  const day = parse(iso)?.getUTCDay();
  return day === 0 || day === 6;
}

function deadlineFor(endDate: string, notice: number, unit: NoticeUnit): string {
  return unit === "months" ? addMonths(endDate, -notice) : addDays(endDate, -notice);
}

/** Why the input cannot be computed, in the user's words, or null when it can. */
export function validateNotice(input: Omit<NoticeInput, "today">): string | null {
  if (!parse(input.endDate)) return "Inserisci la data di scadenza del contratto.";
  if (!Number.isInteger(input.notice) || input.notice < 1) return "Inserisci il preavviso: un numero intero di giorni o mesi.";
  if (input.notice > MAX_NOTICE[input.unit]) {
    return input.unit === "days" ? "Il preavviso può essere al massimo di 3650 giorni." : "Il preavviso può essere al massimo di 120 mesi.";
  }
  const r = input.renewalMonths;
  if (r != null && (!Number.isInteger(r) || r < 1 || r > MAX_RENEWAL_MONTHS)) {
    return "La durata del rinnovo deve essere tra 1 e 120 mesi.";
  }
  return null;
}

export function computeNoticeDeadline(input: NoticeInput): NoticeResult {
  const error = validateNotice(input);
  if (error) throw new Error(error);

  const deadline = deadlineFor(input.endDate, input.notice, input.unit);
  const daysLeft = daysBetween(input.today, deadline);
  const base = { deadline, daysLeft, weekend: isWeekend(deadline) };
  if (daysLeft >= 0) return { ...base, renewed: null, passed: false };

  if (!input.renewalMonths) return { ...base, renewed: null, passed: true };

  // Renewal after renewal, each counted from the original end date (so a
  // 31st stays the last day of the month), until a deadline is still open.
  for (let n = 1; n <= 1000; n++) {
    const endDate = addMonths(input.endDate, n * input.renewalMonths);
    const next = deadlineFor(endDate, input.notice, input.unit);
    const left = daysBetween(input.today, next);
    if (left >= 0) {
      return { ...base, renewed: { endDate, deadline: next, daysLeft: left, weekend: isWeekend(next) }, passed: false };
    }
  }
  return { ...base, renewed: null, passed: true };
}
