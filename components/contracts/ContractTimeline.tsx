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
 * The contract's current period on one line, as on the landing: how much has
 * passed, the 30 days of alerts, today and the last day to cancel. What
 * BCM is for, drawn where the user reads the contract.
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
      <div className="relative h-10 sm:h-14" aria-hidden="true">
        <div className="absolute inset-x-0 top-3 h-2.5 rounded-full bg-muted" />
        <div className="absolute left-0 top-3 h-2.5 rounded-l-full bg-primary/30" style={{ width: pct(at(now)) }} />
        <div
          className="absolute top-3 h-2.5 bg-[repeating-linear-gradient(135deg,var(--status-amber-fg)_0_5px,transparent_5px_10px)] opacity-70"
          style={{ left: pct(at(alertsFrom)), width: pct(at(deadline) - clamp(at(alertsFrom))) }}
        />
        {at(now) >= 0 && at(now) <= 1 && (
          <div className="absolute top-0 h-8 w-0.5 rounded bg-foreground" style={{ left: pct(at(now)) }} />
        )}
        <div className="absolute top-0 h-8 w-0.5 rounded bg-[var(--status-red-fg)]" style={{ left: pct(at(deadline)) }} />
        {ticks.filter((_, i) => i % step === 0).map(({ at: x, label }) => (
          <span key={`${label}-${x}`} className="absolute top-8 hidden pl-1 text-xs text-muted-foreground sm:block" style={{ left: pct(x) }}>
            {label}
          </span>
        ))}
      </div>
      <dl className="mt-1 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Periodo</dt>
          <dd className="font-medium text-foreground">{longDate(start)} – {longDate(end)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Ultimo giorno per disdire</dt>
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
