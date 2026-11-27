/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import { dayWithArticle } from "@/lib/italianDate";
import type { HomeAttentionItem } from "@/types";

const DAY_MS = 86_400_000;

// One solid colour per kind, the same on the legend's dot, the row's dot and
// line, and (in its darker, readable shade) the words.
const KIND = {
  notice: { what: "Disdetta entro", mark: "bg-[var(--status-red-mark)]", text: "text-[var(--status-red-fg)]" },
  expiry: { what: "Scade", mark: "bg-[var(--status-amber-mark)]", text: "text-[var(--status-amber-fg)]" },
} as const;

function shortDay(date: Date): string {
  return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

interface DeadlineRunwayProps {
  readonly items: readonly HomeAttentionItem[];
  readonly windowDays: number;
  /** Today; null while the page is rendered on the server (the landing). */
  readonly today: Date | null;
}

/**
 * BCM's signature: the next days on one line, as on a contract's timeline.
 * Today on the left; for each deadline a thin line of the days left and a
 * dot on the day itself, with how far it is in words: red for the last day
 * to cancel (miss it and the contract renews), amber for an end date. The
 * legend uses the same dots, so the colours are learnt at a glance. Each row
 * opens its contract.
 */
export function DeadlineRunway({ items, windowDays, today }: DeadlineRunwayProps) {
  const rows = items
    .filter((i) => (i.type === "NOTICE_DEADLINE" || i.type === "EXPIRY") && i.daysLeft != null && i.daysLeft >= 0 && i.daysLeft <= windowDays)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
  if (rows.length === 0) return null;

  // The window ends at 72% of the line: the words after the farthest dot
  // ("tra 30 giorni") always fit to its right, never across the line.
  const at = (days: number) => `${((days / windowDays) * 72).toFixed(2)}%`;
  const ticks = [0, 7, 14, 21, windowDays].filter((d, i, all) => d <= windowDays && all.indexOf(d) === i);

  return (
    <section aria-labelledby="runway-title" className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="runway-title" className="text-base font-semibold text-foreground">Le prossime scadenze</h2>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded-full ${KIND.notice.mark}`} aria-hidden="true" />
            Ultimo giorno per disdire
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded-full ${KIND.expiry.mark}`} aria-hidden="true" />
            Scadenza
          </span>
        </p>
      </div>

      {/* The axis: today, then a mark a week apart. */}
      <div className="mt-4 hidden grid-cols-[14rem_minmax(0,1fr)] gap-4 px-2 sm:grid" aria-hidden="true">
        <span />
        <div className="relative h-5 text-xs text-muted-foreground">
          {ticks.map((d) => (
            <span
              key={d}
              className={`absolute top-0 whitespace-nowrap ${d === 0 ? "font-semibold text-foreground" : "-translate-x-1/2"}`}
              style={{ left: at(d) }}
            >
              {d === 0 ? "oggi" : today ? shortDay(new Date(today.getTime() + d * DAY_MS)) : `+${d} gg`}
            </span>
          ))}
        </div>
      </div>

      <ul className="mt-1 space-y-1">
        {rows.map((item) => {
          const days = item.daysLeft ?? 0;
          const kind = item.type === "NOTICE_DEADLINE" ? KIND.notice : KIND.expiry;
          const name = item.projectName ?? item.counterpartyName ?? item.contractNumber;
          const when = days === 0 ? "oggi" : days === 1 ? "domani" : `tra ${days} giorni`;
          const dateText = item.dueDate ? dayWithArticle(item.dueDate) : "";
          return (
            <li key={`${item.type}-${item.contractId}`}>
              <Link
                href={`/contracts/${item.contractId}`}
                className="group grid gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-center sm:gap-4"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground group-hover:underline underline-offset-2">{name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {kind.what} {dateText}
                    <span className="sr-only">, {when}</span>
                  </span>
                </span>
                <span className="relative block h-8" aria-hidden="true">
                  <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
                  <span className="absolute left-0 top-1.5 h-5 w-0.5 rounded bg-foreground/70" />
                  <span className={`absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full ${kind.mark}`} style={{ width: at(days) }} />
                  <span
                    className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-[3px] ring-card ${kind.mark}`}
                    style={{ left: at(days) }}
                  />
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-semibold ${kind.text} pl-3`}
                    style={{ left: at(days) }}
                  >
                    {/* The date is already in the row's name column: only how far it is here. */}
                    {when}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
