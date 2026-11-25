"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useEffect, useRef } from "react";
import { dayWithArticle } from "@/lib/italianDate";
import { isoInDays, useToday } from "@/components/landing/useToday";

// The demo's NRT-119: twelve months, tacit renewal, 90 days' notice, and the
// last day to cancel 20 days from today. Positions are fractions of the year,
// the same whatever today is, so the page renders whole before the dates fill in.
const YEAR = 365;
const NOTICE_DAYS = 90;
const DAYS_LEFT = 20;
const ALERT_DAYS = 30;
const DEADLINE = (YEAR - NOTICE_DAYS) / YEAR;
const TODAY = (YEAR - NOTICE_DAYS - DAYS_LEFT) / YEAR;
const ALERTS_FROM = (YEAR - NOTICE_DAYS - ALERT_DAYS) / YEAR;

const pct = (f: number) => `${(f * 100).toFixed(2)}%`;

function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

/** The months between start and end, as a fraction of the year and a short name. */
function monthTicks(start: Date): { at: number; label: string }[] {
  const ticks = [];
  for (let i = 1; i <= 12; i++) {
    const first = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const at = (first.getTime() - start.getTime()) / (YEAR * 86_400_000);
    if (at > 0 && at < 1) ticks.push({ at, label: first.toLocaleDateString("it-IT", { month: "short" }) });
  }
  return ticks;
}

/**
 * A contract's year drawn on one line: where today is, when the alerts start
 * and the last day to send the cancellation. The elapsed part fills once when
 * the strip scrolls into view (never under reduced motion, and never for a
 * strip already on screen when the page opens).
 */
export function NoticeTimeline() {
  const today = useToday();
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = fill.current;
    if (!el || globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      el.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
        duration: 1100,
        easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
      });
    }, { threshold: 0.6 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const deadline = today ? isoInDays(today, DAYS_LEFT) : null;
  // The end date is the deadline plus the notice; a renewal and the start are
  // counted in months from it, as the contract does (not 365 days, which
  // slips a day across a leap year).
  const end = today ? new Date(today.getFullYear(), today.getMonth(), today.getDate() + DAYS_LEFT + NOTICE_DAYS) : null;
  const renewedUntil = end ? isoInDays(new Date(end.getFullYear() + 1, end.getMonth(), end.getDate()), 0) : null;
  const start = end ? new Date(end.getFullYear() - 1, end.getMonth(), end.getDate()) : null;

  return (
    <div
      role="img"
      aria-label={`Contratto di manutenzione impianti: mancano ${DAYS_LEFT} giorni all'ultimo giorno per disdirlo, poi si rinnova per altri 12 mesi.`}
      className="select-none"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="font-medium text-foreground">NRT-119 · Manutenzione impianti</p>
        <p className="text-sm text-muted-foreground">Rinnovo tacito di 12 mesi, preavviso di 90 giorni</p>
      </div>

      <div className="relative mt-6 h-10 sm:h-16" aria-hidden="true">
        <div className="absolute inset-x-0 top-3 h-3 rounded-full bg-muted" />
        <div ref={fill} className="absolute left-0 top-3 h-3 origin-left rounded-l-full bg-primary/30" style={{ width: pct(TODAY) }} />
        <div
          className="absolute top-3 h-3 bg-[repeating-linear-gradient(135deg,var(--status-amber-fg)_0_5px,transparent_5px_10px)] opacity-70"
          style={{ left: pct(ALERTS_FROM), width: pct(DEADLINE - ALERTS_FROM) }}
        />
        <div className="absolute top-0 h-9 w-0.5 rounded bg-foreground" style={{ left: pct(TODAY) }} />
        <div className="absolute top-0 h-9 w-0.5 rounded bg-[var(--status-red-fg)]" style={{ left: pct(DEADLINE) }} />
        {start &&
          monthTicks(start).map(({ at, label }) => (
            <span key={label} className="absolute top-9 hidden pl-1 text-xs text-muted-foreground sm:block" style={{ left: pct(at) }}>
              {label}
            </span>
          ))}
      </div>

      <dl className="mt-2 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Oggi</dt>
          <dd className="font-medium text-foreground">Avvisi già partiti a 30 giorni</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Ultimo giorno per disdire</dt>
          <dd className="font-medium text-[var(--status-red-fg)]">
            {deadline ? `${dayWithArticle(deadline).replace(/^(il|l')\s?/, "")}, ` : ""}tra {DAYS_LEFT} giorni
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Se non disdici</dt>
          <dd className="font-medium text-foreground">
            {renewedUntil ? `Si rinnova fino al ${longDate(renewedUntil)}` : "Si rinnova per altri 12 mesi"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
