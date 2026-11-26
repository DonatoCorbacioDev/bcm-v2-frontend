"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { contractsService } from "@/services/contracts.service";
import { SubscribeCalendar } from "@/components/calendar/SubscribeCalendar";
import { contractCalendarEntries, isoDay, monthGrid, type CalendarEntry, type CalendarEntryKind } from "@/lib/contractCalendar";

// A tinted chip with a solid edge: the tint tells the kinds apart at a glance,
// the edge keeps them apart where tints are hard to see; the label (visible on
// phones, read out everywhere) means colour is never the only cue.
const KIND: Record<CalendarEntryKind, { label: string; chip: string; text: string }> = {
  notice: { label: "Ultimo giorno per disdire", chip: "bg-[var(--status-red-bg)] border-[var(--status-red-fg)]", text: "text-[var(--status-red-fg)]" },
  expiry: { label: "Scadenza", chip: "bg-[var(--status-amber-bg)] border-[var(--status-amber-fg)]", text: "text-[var(--status-amber-fg)]" },
  renewal: { label: "Si rinnova", chip: "bg-[var(--status-slate-bg)] border-[var(--status-slate-fg)]", text: "text-[var(--status-slate-fg)]" },
};

const WEEKDAYS = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];

function EntryLink({ entry, compact = false }: { readonly entry: CalendarEntry; readonly compact?: boolean }) {
  const kind = KIND[entry.kind];
  return (
    <Link
      href={`/contracts/${entry.contractId}`}
      className={`group flex rounded-sm border-l-[3px] px-1.5 py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${kind.chip}`}
      title={`${kind.label}: ${entry.contractNumber} · ${entry.name}`}
    >
      <span className={`min-w-0 ${compact ? "truncate text-xs" : "text-sm"} text-foreground group-hover:underline underline-offset-2`}>
        <span className="sr-only">{kind.label}: </span>
        {entry.contractNumber} · {entry.name}
      </span>
    </Link>
  );
}

/**
 * The month's deadlines, in the same colours as the Home's runway: red the
 * last day to cancel, amber an end date, grey the day a contract renews.
 * A grid on a wide screen, a list of days on a phone.
 */
export default function CalendarPage() {
  const today = new Date();
  const [cursor, setCursor] = useState(() => ({ year: today.getFullYear(), month: today.getMonth() }));
  // The search, not the full list: GET /contracts is for admins only, while
  // the search serves both roles, each seeing only the contracts it may (a
  // manager its own). Only active contracts have dates to show; 1000 is the
  // backend's page cap, well above a plan's contract limit.
  const { data: contracts, isLoading, isError } = useQuery({
    queryKey: ["contracts", "calendar", "active"],
    queryFn: async () => (await contractsService.searchPaged({ page: 0, size: 1000, status: "ACTIVE" })).content,
  });

  const entries = contractCalendarEntries(contracts ?? []);
  const byDay = new Map<string, CalendarEntry[]>();
  for (const e of entries) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e]);

  const weeks = monthGrid(cursor.year, cursor.month);
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  const monthPrefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
  const monthEntries = entries.filter((e) => e.date.startsWith(monthPrefix));
  const todayIso = isoDay(today);

  const move = (delta: number) =>
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendario</h1>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {(Object.keys(KIND) as CalendarEntryKind[]).map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className={`inline-block h-3.5 w-5 rounded-[3px] border-l-[3px] ${KIND[k].chip}`} aria-hidden="true" />
                {KIND[k].label}
              </span>
            ))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => move(-1)} aria-label="Mese precedente">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <p className="min-w-40 text-center font-semibold capitalize text-foreground" aria-live="polite">{monthLabel}</p>
          <Button type="button" variant="outline" size="icon" onClick={() => move(1)} aria-label="Mese successivo">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setCursor({ year: today.getFullYear(), month: today.getMonth() })}>
            Oggi
          </Button>
        </div>
      </div>

      {isError && <p className="text-sm text-[var(--status-red-fg)]">Impossibile caricare i contratti: riprova tra qualche istante.</p>}

      {/* Wide screens: the month as a grid. */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block" aria-busy={isLoading}>
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-3 py-2 text-xs font-medium text-muted-foreground">{d}</div>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={isoDay(week[0])} className="grid grid-cols-7 border-b border-border last:border-b-0">
            {week.map((day) => {
              const iso = isoDay(day);
              const inMonth = day.getMonth() === cursor.month;
              const items = byDay.get(iso) ?? [];
              return (
                <div key={iso} className={`min-h-28 space-y-1 border-r border-border p-2 last:border-r-0 ${inMonth ? "" : "bg-muted/50"}`}>
                  <p
                    className={`text-xs tabular-nums ${iso === todayIso ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground" : inMonth ? "text-foreground" : "text-muted-foreground"}`}
                    aria-label={iso === todayIso ? "Oggi" : undefined}
                  >
                    {day.getDate()}
                  </p>
                  {items.map((e) => <EntryLink key={`${e.contractId}-${e.kind}`} entry={e} compact />)}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Phones: the month's days with something on them. */}
      <div className="space-y-3 md:hidden">
        {monthEntries.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Nessuna scadenza in questo mese.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {monthEntries.map((e) => (
              <li key={`${e.contractId}-${e.kind}`} className="flex gap-3 p-3">
                <p className="w-12 shrink-0 text-center">
                  <span className="block text-lg font-semibold tabular-nums text-foreground">{Number(e.date.slice(8, 10))}</span>
                  <span className="block text-xs text-muted-foreground">
                    {new Date(`${e.date}T00:00:00`).toLocaleDateString("it-IT", { weekday: "short" })}
                  </span>
                </p>
                <div className="min-w-0">
                  <p className={`text-xs font-medium ${KIND[e.kind].text}`}>{KIND[e.kind].label}</p>
                  <EntryLink entry={e} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SubscribeCalendar />
    </div>
  );
}
