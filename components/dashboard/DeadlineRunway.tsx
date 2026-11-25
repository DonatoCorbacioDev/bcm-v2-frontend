/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { dayWithArticle } from "@/lib/italianDate";
import type { HomeAttentionItem } from "@/types";

const DAY_MS = 86_400_000;

function parse(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

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
 * Today on the left; for each deadline, the hatched amber of the days left
 * and a mark on the day itself, red for the last day to cancel (miss it and
 * the contract renews), amber for an end date. The same visual language as
 * the contract page and the landing, so it reads as BCM at a glance.
 */
export function DeadlineRunway({ items, windowDays, today }: DeadlineRunwayProps) {
  const rows = items
    .filter((i) => (i.type === "NOTICE_DEADLINE" || i.type === "EXPIRY") && i.daysLeft != null && i.daysLeft >= 0 && i.daysLeft <= windowDays)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
  if (rows.length === 0) return null;

  const at = (days: number) => `${((days / windowDays) * 100).toFixed(2)}%`;
  const ticks = [0, 7, 14, 21, windowDays].filter((d, i, all) => d <= windowDays && all.indexOf(d) === i);

  return (
    <section aria-labelledby="runway-title" className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="runway-title" className="text-base font-semibold text-foreground">Le prossime scadenze</h2>
        <p className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-0.5 rounded bg-[var(--status-red-fg)]" aria-hidden="true" />
            ultimo giorno per disdire
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-0.5 rounded bg-[var(--status-amber-fg)]" aria-hidden="true" />
            scadenza
          </span>
        </p>
      </div>

      {/* The axis: today, then a mark a week apart. */}
      <div className="mt-4 hidden grid-cols-[13rem_minmax(0,1fr)] gap-4 sm:grid" aria-hidden="true">
        <span />
        <div className="relative h-4 text-[11px] text-muted-foreground">
          {ticks.map((d) => (
            <span
              key={d}
              className={`absolute top-0 whitespace-nowrap ${d === 0 ? "font-medium text-foreground" : ""} ${d === windowDays ? "-translate-x-full" : d > 0 ? "-translate-x-1/2" : ""}`}
              style={{ left: at(d) }}
            >
              {d === 0 ? "oggi" : today ? shortDay(new Date(today.getTime() + d * DAY_MS)) : `+${d} gg`}
            </span>
          ))}
        </div>
      </div>

      <ul className="mt-2 space-y-3 sm:space-y-2">
        {rows.map((item) => {
          const days = item.daysLeft ?? 0;
          const notice = item.type === "NOTICE_DEADLINE";
          const name = item.projectName ?? item.counterpartyName ?? item.contractNumber;
          const when = days === 0 ? "oggi" : days === 1 ? "domani" : `tra ${days} giorni`;
          const what = notice ? "Disdetta entro" : "Scade";
          const dateText = item.dueDate ? dayWithArticle(item.dueDate) : "";
          return (
            <li key={`${item.type}-${item.contractId}`} className="grid gap-1.5 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-center sm:gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">
                  {what} {dateText}, {when}
                </p>
              </div>
              <div className="relative h-7" aria-hidden="true">
                <div className="absolute inset-x-0 top-3 h-1.5 rounded-full bg-muted" />
                <div
                  className="absolute left-0 top-3 h-1.5 rounded-l-full bg-[repeating-linear-gradient(135deg,var(--status-amber-fg)_0_5px,transparent_5px_10px)] opacity-70"
                  style={{ width: at(days) }}
                />
                <div className="absolute left-0 top-0.5 h-6 w-0.5 rounded bg-foreground" />
                <div
                  className={`absolute top-0.5 h-6 w-0.5 rounded ${notice ? "bg-[var(--status-red-fg)]" : "bg-[var(--status-amber-fg)]"}`}
                  style={{ left: at(days) }}
                />
                {item.dueDate && (
                  <span
                    className={`absolute -top-0.5 whitespace-nowrap pl-1.5 text-[11px] font-medium ${notice ? "text-[var(--status-red-fg)]" : "text-[var(--status-amber-fg)]"} ${days / windowDays > 0.8 ? "-translate-x-full pr-1.5 pl-0" : ""}`}
                    style={{ left: at(days) }}
                  >
                    {shortDay(parse(item.dueDate))}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
