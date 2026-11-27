/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { dayWithArticle } from "@/lib/italianDate";

const DAY_MS = 86_400_000;
const ALERT_DAYS = 30;

function parse(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function longDate(date: Date): string {
  return date.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

const clamp = (f: number) => Math.min(1, Math.max(0, f));
const pct = (f: number) => `${(clamp(f) * 100).toFixed(2)}%`;

interface ContractTimelineProps {
  readonly startDate: string;
  readonly endDate: string;
  /** The last day to give notice (endDate - noticeDays), from the backend. */
  readonly noticeDeadline: string;
  readonly renewalMonths?: number | null;
  /** For tests; the browser's today otherwise. */
  readonly today?: Date;
}

/**
 * The contract's current period on one line, as on the landing and the Home:
 * the time passed (light blue) up to "oggi", written on the line, the 30 days
 * of email alerts (BCM's solid blue: BCM is the one at work) and the last day
 * to cancel as a red dot. Each mark is named in the list below, with the same
 * swatch, so nothing needs decoding.
 */
export function ContractTimeline({ startDate, endDate, noticeDeadline, renewalMonths, today = new Date() }: ContractTimelineProps) {
  const start = parse(startDate);
  const end = parse(endDate);
  const deadline = parse(noticeDeadline);
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const span = Math.max(DAY_MS, end.getTime() - start.getTime());
  const at = (d: Date) => (d.getTime() - start.getTime()) / span;
  const alertsFrom = new Date(deadline.getTime() - ALERT_DAYS * DAY_MS);
  const daysLeft = Math.round((deadline.getTime() - now.getTime()) / DAY_MS);
  const renewedUntil = renewalMonths ? new Date(end.getFullYear(), end.getMonth() + renewalMonths, end.getDate()) : null;

  const ticks: { at: number; label: string }[] = [];
  for (let i = 1; i < 60; i++) {
    const first = new Date(start.getFullYear(), start.getMonth() + i, 1);
    if (first >= end) break;
    ticks.push({ at: at(first), label: first.toLocaleDateString("it-IT", { month: "short" }) });
  }
  // Every month on a year-long contract; fewer on a longer one, so labels never crowd.
  const step = Math.ceil(ticks.length / 12);

  let deadlineText: string;
  if (daysLeft > 1) deadlineText = `tra ${daysLeft} giorni`;
  else if (daysLeft === 1) deadlineText = "domani";
  else if (daysLeft === 0) deadlineText = "oggi";
  else deadlineText = "passato";

  return (
    <div
      role="img"
      aria-label={`Periodo dal ${longDate(start)} al ${longDate(end)}. Ultimo giorno per disdire ${dayWithArticle(noticeDeadline, true)}, ${deadlineText}.`}
    >
      <div className="relative h-14 sm:h-20" aria-hidden="true">
        {at(now) >= 0 && at(now) <= 1 && (
          <span className="absolute top-0 -translate-x-1/2 text-xs font-semibold text-foreground" style={{ left: pct(at(now)) }}>
            oggi
          </span>
        )}
        <div className="absolute inset-x-0 top-8 h-2 rounded-full bg-muted" />
        <div className="absolute left-0 top-8 h-2 rounded-l-full bg-primary/35" style={{ width: pct(at(now)) }} />
        <div
          className="absolute top-8 h-2 bg-primary"
          style={{ left: pct(at(alertsFrom)), width: pct(at(deadline) - clamp(at(alertsFrom))) }}
        />
        {at(now) >= 0 && at(now) <= 1 && (
          <div className="absolute top-5 h-8 w-0.5 rounded bg-foreground" style={{ left: pct(at(now)) }} />
        )}
        <div
          className="absolute top-9 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--status-red-mark)] ring-[3px] ring-card"
          style={{ left: pct(at(deadline)) }}
        />
        {ticks.filter((_, i) => i % step === 0).map(({ at: x, label }) => (
          <span key={`${label}-${x}`} className="absolute top-14 hidden pl-1 text-xs text-muted-foreground sm:block" style={{ left: pct(x) }}>
            {label}
          </span>
        ))}
      </div>
      <dl className="mt-1 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Periodo</dt>
          <dd className="font-medium text-foreground">{longDate(start)} – {longDate(end)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-muted-foreground">
            <span className="inline-block h-2 w-5 rounded-full bg-primary" aria-hidden="true" />
            Avvisi via email
          </dt>
          <dd className="font-medium text-foreground">Dal {longDate(alertsFrom)}, a 30, 14, 7 e 1 giorno</dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-muted-foreground">
            <span className="inline-block h-3 w-3 rounded-full bg-[var(--status-red-mark)]" aria-hidden="true" />
            Ultimo giorno per disdire
          </dt>
          <dd className={`font-medium ${daysLeft >= 0 ? "text-[var(--status-red-fg)]" : "text-foreground"}`}>
            {longDate(deadline)}, {deadlineText}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Se non disdici</dt>
          <dd className="font-medium text-foreground">
            {renewedUntil ? `Si rinnova fino al ${longDate(renewedUntil)}` : "Si rinnova automaticamente"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
