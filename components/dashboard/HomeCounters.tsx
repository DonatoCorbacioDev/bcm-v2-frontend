/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { CalendarClock, FileText, Landmark } from "lucide-react";

interface HomeCountersProps {
  readonly windowDays: number;
  readonly dueSoon: number;
  readonly invoicesToMatch: number;
  readonly ibanAlerts: number;
}

/**
 * The Home's three numbers on one quiet strip, each a link to the to-do list
 * below. A number takes its colour only when it is above zero: amber for
 * deadlines (attention), blue for invoices (an action in BCM), red for a
 * changed IBAN (act before paying). At zero everything stays grey.
 */
export function HomeCounters({ windowDays, dueSoon, invoicesToMatch, ibanAlerts }: HomeCountersProps) {
  const items = [
    { icon: CalendarClock, value: dueSoon, label: `da fare entro ${windowDays} giorni`, tone: "text-[var(--status-amber-fg)]" },
    { icon: FileText, value: invoicesToMatch, label: invoicesToMatch === 1 ? "fattura da abbinare" : "fatture da abbinare", tone: "text-primary" },
    { icon: Landmark, value: ibanAlerts, label: "IBAN da verificare", tone: "text-[var(--status-red-fg)]" },
  ];

  return (
    <ul className="grid divide-y divide-border rounded-xl border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {items.map(({ icon: Icon, value, label, tone }) => (
        <li key={label}>
          <a
            href="#home-todo"
            className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring first:rounded-t-xl sm:first:rounded-l-xl"
          >
            <Icon className={`h-5 w-5 shrink-0 ${value > 0 ? tone : "text-muted-foreground/60"}`} aria-hidden="true" />
            <span className={`text-2xl font-semibold tabular-nums ${value > 0 ? tone : "text-muted-foreground"}`}>{value}</span>
            <span className="text-sm text-muted-foreground group-hover:text-foreground">{label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
