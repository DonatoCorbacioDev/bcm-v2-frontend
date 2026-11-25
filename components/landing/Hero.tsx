"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, FileText, Handshake, Home, Landmark, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { LogoMark } from "@/components/layout/Logo";
import KPICard from "@/components/dashboard/KPICard";
import { HomeAttentionList } from "@/components/dashboard/HomeAttentionList";
import type { HomeAttentionItem } from "@/types";

/** YYYY-MM-DD for today plus `days`, in the visitor's own time zone. */
function isoInDays(today: Date, days: number): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const subscribeNever = () => () => {};

/**
 * Today in the browser, or null while the page is rendered on the server.
 * The page is built once and served for weeks, so a date fixed at build time
 * would soon be in the past.
 */
function useToday(): Date | null {
  const iso = useSyncExternalStore(subscribeNever, () => isoInDays(new Date(), 0), () => null);
  return iso ? new Date(`${iso}T00:00:00`) : null;
}

/**
 * The demo organization's real to-do list (Nortiva Solutions), with dates
 * counted from today. Before the browser fills them in, the rows read
 * "tra 6 giorni" without the date, which is still true.
 */
function demoItems(today: Date | null): HomeAttentionItem[] {
  const due = (days: number) => (today ? isoInDays(today, days) : null);
  const base = { managerName: "Marco Bellini", invoiceId: null, invoiceNumber: null, invoiceAmount: null, renewalMonths: null };
  return [
    { ...base, type: "IBAN_CHANGED", contractId: "demo-118", contractNumber: "NRT-118", counterpartyName: "Ferri & Associati S.r.l.",
      projectName: null, dueDate: null, daysLeft: null, invoiceId: "demo-fa-4t", invoiceNumber: "FA-2026-4T" },
    { ...base, type: "NOTICE_DEADLINE", contractId: "demo-123", contractNumber: "NRT-123", counterpartyName: "Gestio Software S.r.l.",
      projectName: "Licenza software gestionale", dueDate: due(6), daysLeft: 6, renewalMonths: 12 },
    { ...base, type: "EXPIRY", contractId: "demo-104", contractNumber: "NRT-104", counterpartyName: "Vertice Legal S.r.l.",
      projectName: "Audit di conformità", dueDate: due(12), daysLeft: 12 },
    { ...base, type: "NOTICE_DEADLINE", contractId: "demo-119", contractNumber: "NRT-119", counterpartyName: "Rossi Impianti S.r.l.",
      projectName: "Manutenzione impianti", dueDate: due(20), daysLeft: 20, renewalMonths: 12 },
  ];
}

const NAV = [
  { icon: Home, label: "Home", active: true },
  { icon: FileText, label: "Contratti", active: false },
  { icon: Handshake, label: "Controparti", active: false },
];

/**
 * BCM's real home page, built from the app's own components (KPICard,
 * HomeAttentionList) so the landing shows the product as it is. It is a
 * picture for the visitor: `inert` keeps its links out of the keyboard and
 * screen reader order, and the wrapper describes it in one sentence.
 */
function ProductFrame() {
  const today = useToday();

  return (
    <div
      role="img"
      aria-label="La Home di BCM: quattro attività nei prossimi 30 giorni, tra cui un IBAN cambiato da verificare e due disdette in scadenza."
      className="overflow-hidden rounded-xl border border-border bg-background shadow-[0_1px_0_var(--border),0_30px_60px_-30px_rgb(15_23_42/0.35)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:duration-700"
    >
      <div inert className="grid select-none md:grid-cols-[13.5rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-border bg-card md:block">
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
            <LogoMark size={26} />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">BCM</p>
              <p className="text-xs text-muted-foreground">Gestione contratti</p>
            </div>
          </div>
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">NS</span>
            <span className="truncate text-sm font-medium text-foreground">Nortiva Solutions S.r.l.</span>
          </div>
          <nav className="space-y-1 p-2">
            {NAV.map(({ icon: Icon, label, active }) => (
              <span
                key={label}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm ${
                  active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </span>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-4 border-b border-border bg-card px-5 py-3">
            <span className="text-sm font-medium text-foreground">Home</span>
            <span className="hidden items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground sm:flex">
              <Search className="h-4 w-4" aria-hidden="true" />
              Cerca contratti, controparti…
            </span>
          </div>
          <div className="space-y-5 p-5 md:p-7">
            <div>
              <p className="text-2xl font-bold text-foreground">Ciao, Marco</p>
              <p className="mt-1 text-muted-foreground">Cosa richiede attenzione nei prossimi 30 giorni</p>
            </div>
            {/* On a phone the three counters would fill the frame: the to-do list is the point. */}
            <div className="hidden gap-4 sm:grid sm:grid-cols-3">
              <KPICard title="Da fare entro 30 giorni" value={4} icon={<CalendarClock className="h-6 w-6" aria-hidden="true" />} variant="warning" />
              <KPICard title="Fatture da abbinare" value={2} icon={<FileText className="h-6 w-6" aria-hidden="true" />} />
              <KPICard title="Avvisi IBAN" value={1} icon={<Landmark className="h-6 w-6" aria-hidden="true" />} variant="danger" />
            </div>
            <div className="space-y-3">
              <p className="text-lg font-semibold text-foreground">Da fare</p>
              <HomeAttentionList items={demoItems(today)} windowDays={30} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <section className="pt-12 md:pt-16">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="grid items-end gap-8 md:grid-cols-12 md:gap-12">
          <h1 className="text-balance text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.035em] text-foreground sm:text-5xl md:col-span-7 lg:text-[4.25rem]">
            Gestione dei contratti e delle scadenze per le PMI
          </h1>

          <div className="space-y-6 md:col-span-5">
            <p className="text-lg leading-relaxed text-muted-foreground">
              BCM calcola l&apos;ultimo giorno per disdire ogni contratto e ti avvisa 30, 14, 7 e 1 giorno prima.
              Controlla anche le fatture FatturaPA dei fornitori e l&apos;IBAN su cui chiedono di pagare.
            </p>

            {isAuthenticated ? (
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Apri BCM
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <div className="space-y-3">
                {/* The demo first: most visitors want to see BCM before signing up.
                    "Accedi" is already in the top bar. */}
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <Link href="/login?demo=1">Prova la demo</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/register-org">Inizia gratis</Link>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  La demo non richiede registrazione. Gratis fino a 15 contratti, senza carta di credito.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* The product on its own ground, cut at the bottom edge of the section. */}
      <div className="mt-12 border-t border-border bg-muted/50 pt-8 md:mt-14 md:pt-10">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="max-h-[34rem] overflow-hidden [mask-image:linear-gradient(to_bottom,black_78%,transparent)] md:max-h-[40rem]">
            <ProductFrame />
          </div>
        </div>
      </div>
    </section>
  );
}
