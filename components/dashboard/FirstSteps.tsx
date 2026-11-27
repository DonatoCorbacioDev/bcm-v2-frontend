"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCounterparties } from "@/hooks/useCounterparties";
import { useUsers } from "@/hooks/useUsers";
import { organizationService } from "@/services/organization.service";

// The two marks the browser keeps for this user: the calendar step done by
// hand (BCM can't see a calendar subscription) and the card hidden. Per
// browser only: losing them just shows the card again.
const CHANGED = "bcm-first-steps-changed";
const read = (key: string) => {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};
const write = (key: string) => {
  try {
    localStorage.setItem(key, "1");
  } catch {
    // Storage blocked: the step simply stays open.
  }
  globalThis.dispatchEvent(new Event(CHANGED));
};
const subscribe = (onChange: () => void) => {
  globalThis.addEventListener(CHANGED, onChange);
  globalThis.addEventListener("storage", onChange);
  return () => {
    globalThis.removeEventListener(CHANGED, onChange);
    globalThis.removeEventListener("storage", onChange);
  };
};
function useStoredFlag(key: string): boolean {
  return useSyncExternalStore(subscribe, () => read(key), () => true);
}

interface Step {
  readonly title: string;
  readonly text: string;
  readonly done: boolean;
  readonly actions: readonly { label: string; href?: string; onClick?: () => void; primary?: boolean }[];
}

/**
 * The administrator's first steps on a new organization, in the order they
 * make sense: a supplier, the first contract (by hand or from Excel), a
 * colleague, the calendar. The first three tick themselves from the data;
 * the card goes away once they are done, or when hidden.
 */
export function FirstSteps({ userId, name }: { readonly userId: string; readonly name: string }) {
  const hiddenKey = `bcm-first-steps-hidden-${userId}`;
  const calendarKey = `bcm-first-steps-calendar-${userId}`;
  const hidden = useStoredFlag(hiddenKey);
  const calendarDone = useStoredFlag(calendarKey);

  const counterparties = useCounterparties();
  const users = useUsers();
  const usage = useQuery({
    queryKey: ["organization", "me", "usage"],
    queryFn: organizationService.getUsage,
  });

  if (hidden || counterparties.isLoading || users.isLoading || usage.isLoading) return null;

  const hasSupplier = (counterparties.data?.length ?? 0) > 0;
  const hasContract = (usage.data?.contractsUsed ?? 0) > 0;
  const hasColleague = (users.data?.length ?? 0) > 1;
  if (hasSupplier && hasContract && hasColleague) return null;

  const steps: Step[] = [
    {
      title: "Aggiungi un fornitore",
      text: "Con Partita IVA e IBAN verificato, per controllare le sue fatture.",
      done: hasSupplier,
      actions: [{ label: "Aggiungi fornitore", href: "/counterparties?new=1", primary: true }],
    },
    {
      title: "Aggiungi il primo contratto",
      text: "Uno alla volta, oppure tutti insieme da un file Excel.",
      done: hasContract,
      actions: [
        { label: "Nuovo contratto", href: "/contracts?new=1", primary: true },
        { label: "Importa da Excel", href: "/contracts?import=1" },
      ],
    },
    {
      title: "Invita un collega",
      text: "Chi ti aiuta a seguire i contratti riceve un'email per entrare.",
      done: hasColleague,
      actions: [{ label: "Invita", href: "/users?invite=1", primary: true }],
    },
    {
      title: "Collega il tuo calendario",
      text: "Le scadenze in Google Calendar, Outlook o Apple Calendar.",
      done: calendarDone,
      actions: [
        { label: "Collega", href: "/calendar", primary: true },
        { label: "Fatto", onClick: () => write(calendarKey) },
      ],
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  // One blue button on the card: the next step to do. The others wait in outline.
  const next = steps.find((s) => !s.done);

  return (
    <section aria-labelledby="first-steps" className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="first-steps" className="text-lg font-semibold text-foreground">
            Benvenuto in BCM, {name}: quattro passi per partire
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {doneCount} di {steps.length} fatti
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => write(hiddenKey)}>
          Nascondi
        </Button>
      </div>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Passi completati"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={doneCount}
      >
        <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>

      <ol className="mt-4 divide-y divide-border">
        {steps.map((step) => (
          <li key={step.title} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              {step.done ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--status-green-fg)]" aria-hidden="true" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/60" aria-hidden="true" />
              )}
              <div>
                <p className={`font-medium ${step.done ? "text-muted-foreground line-through decoration-muted-foreground/50" : "text-foreground"}`}>
                  {step.title}
                  <span className="sr-only">{step.done ? ", fatto" : ", da fare"}</span>
                </p>
                {!step.done && <p className="mt-0.5 text-sm text-muted-foreground">{step.text}</p>}
              </div>
            </div>
            {!step.done && (
              <div className="flex shrink-0 flex-wrap gap-2 pl-8 sm:pl-0">
                {step.actions.map((a) =>
                  a.href ? (
                    <Button key={a.label} asChild size="sm" variant={a.primary && step === next ? "default" : "outline"}>
                      <Link href={a.href}>{a.label}</Link>
                    </Button>
                  ) : (
                    <Button key={a.label} type="button" size="sm" variant="ghost" onClick={a.onClick}>
                      {a.label}
                    </Button>
                  ),
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
