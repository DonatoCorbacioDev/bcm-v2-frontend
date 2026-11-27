"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CumulativeChart } from "@/components/costs/CumulativeChart";
import { useAuthStore } from "@/store/authStore";
import { useBudgets } from "@/hooks/useBudgets";
import { useFinancialValues } from "@/hooks/useFinancialValues";
import { buildCostsOverview, costsCsv } from "@/lib/costsOverview";
import { formatMoney } from "@/lib/formatMoney";
import type { FinancialCategory } from "@/types";

const euro = (n: number) => formatMoney(n, { decimals: 0 });

/**
 * "Costi e budget": the three questions a small company asks about its
 * suppliers, on one page. How much am I spending this year? Am I within what
 * I planned? Which contracts weigh most? Budgets and the full list of
 * amounts stay one link away. Starts on costs; revenues appear only for an
 * organization that has them.
 */
export default function CostsPage() {
  const router = useRouter();
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN");
  useEffect(() => {
    if (!isAdmin) router.replace("/dashboard");
  }, [isAdmin, router]);

  const { data: values = [], isLoading: loadingValues } = useFinancialValues();
  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [category, setCategory] = useState<FinancialCategory>("COST");

  const years = useMemo(() => {
    const all = new Set<number>([thisYear, ...values.map((v) => v.year), ...budgets.map((b) => b.year)]);
    return [...all].sort((a, b) => b - a);
  }, [values, budgets, thisYear]);
  const hasRevenue = values.some((v) => v.year === year && v.category === "REVENUE")
    || budgets.some((b) => b.year === year && b.category === "REVENUE");
  const shown: FinancialCategory = hasRevenue ? category : "COST";
  const o = useMemo(() => buildCostsOverview(values, budgets, year, shown), [values, budgets, year, shown]);

  if (!isAdmin) return null;
  if (loadingValues || loadingBudgets) {
    return <div className="h-96 rounded-xl border border-border bg-card animate-pulse" aria-hidden="true" />;
  }

  const isCost = shown === "COST";
  const noun = isCost ? "costi" : "ricavi";
  const hasBudget = o.budget > 0;
  const nothing = o.yearForecast === 0 && !hasBudget;
  // For costs, being above the pace is the warning; for revenues, being below.
  const gap = o.toDate - o.paceToday;
  const worrying = isCost ? gap > 0 : gap < 0;

  const exportCsv = () => {
    const blob = new Blob(["﻿" + costsCsv(values, year, shown)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bcm-${noun}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Costi e budget</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Quanto {isCost ? "spendi in fornitori" : "incassi dai clienti"} rispetto a quanto avevi previsto. Importi IVA esclusa,
            dai valori dei tuoi contratti.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasRevenue && (
            <div role="group" aria-label="Costi o ricavi" className="inline-flex rounded-md border border-border bg-card p-0.5">
              {(["COST", "REVENUE"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={shown === c}
                  onClick={() => setCategory(c)}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    shown === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c === "COST" ? "Costi" : "Ricavi"}
                </button>
              ))}
            </div>
          )}
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger aria-label="Anno" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={exportCsv} disabled={o.yearForecast === 0}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Esporta in Excel
          </Button>
        </div>
      </div>

      {nothing ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <p className="font-medium text-foreground">Ancora niente da mostrare per il {year}</p>
          <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
            I {noun} arrivano dal valore annuo dei contratti: aggiungilo a un contratto e compaiono qui mese per mese. Poi
            imposta un budget per vedere se sei in linea.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button asChild><Link href="/contracts">Vai ai contratti</Link></Button>
            <Button asChild variant="outline"><Link href="/budgets">Imposta un budget</Link></Button>
          </div>
        </div>
      ) : (
        <>
          {/* Three numbers, then the sentence that says what they mean. */}
          <dl className="grid divide-y divide-border rounded-xl border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="px-5 py-4">
              <dt className="text-sm text-muted-foreground">{isCost ? "Spesi" : "Incassati"} fino a oggi</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{euro(o.toDate)}</dd>
            </div>
            <div className="px-5 py-4">
              <dt className="text-sm text-muted-foreground">Budget del {year}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {hasBudget ? euro(o.budget) : <Link href="/budgets" className="text-base font-medium text-primary underline-offset-4 hover:underline">Imposta un budget</Link>}
              </dd>
            </div>
            <div className="px-5 py-4">
              <dt className="text-sm text-muted-foreground">Previsione a fine anno</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{euro(o.yearForecast)}</dd>
              {hasBudget && (
                <dd className="text-sm text-muted-foreground">
                  {o.yearForecast <= o.budget ? `${euro(o.budget - o.yearForecast)} entro il budget` : `${euro(o.yearForecast - o.budget)} oltre il budget`}
                </dd>
              )}
            </div>
          </dl>

          {hasBudget && (
            <p
              className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${
                worrying
                  ? "border-[var(--status-amber-mark)]/40 bg-[var(--status-amber-bg)] text-[var(--status-amber-fg)]"
                  : "border-[var(--status-green-fg)]/30 bg-[var(--status-green-bg)] text-[var(--status-green-fg)]"
              }`}
            >
              {gap > 0 ? <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <TrendingDown className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
              <span>
                <strong className="font-semibold">
                  {worrying ? "Sopra il ritmo" : "In linea"}:
                </strong>{" "}
                {gap > 0 ? `${euro(gap)} sopra` : `${euro(-gap)} sotto`} quanto il budget prevede a oggi ({euro(o.paceToday)}).
              </span>
            </p>
          )}

          <section aria-labelledby="costs-chart" className="rounded-xl border border-border bg-card p-5">
            <h2 id="costs-chart" className="text-base font-semibold text-foreground">Mese per mese, sommati</h2>
            <div className="mt-4">
              <CumulativeChart months={o.months} hasBudget={hasBudget} />
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section aria-labelledby="costs-areas" className="rounded-xl border border-border bg-card p-5">
              <h2 id="costs-areas" className="text-base font-semibold text-foreground">Per reparto</h2>
              <ul className="mt-4 space-y-4">
                {o.areas.map((a) => {
                  const share = a.budget ? a.toDate / a.budget : null;
                  const expected = o.budget > 0 ? o.paceToday / o.budget : null;
                  const over = share != null && expected != null && (isCost ? share > expected : share < expected);
                  return (
                    <li key={a.areaName}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium text-foreground">{a.areaName}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {euro(a.toDate)}{a.budget ? ` di ${euro(a.budget)}` : ""}
                        </span>
                      </div>
                      {a.budget ? (
                        <>
                          <div className="relative mt-2 h-2 rounded-full bg-muted" aria-hidden="true">
                            <div
                              className={`h-2 rounded-full ${over ? "bg-[var(--status-amber-mark)]" : "bg-primary"}`}
                              style={{ width: `${Math.min(100, (share ?? 0) * 100)}%` }}
                            />
                            {expected != null && (
                              <div className="absolute -top-1 h-4 w-0.5 rounded bg-foreground" style={{ left: `${expected * 100}%` }} />
                            )}
                          </div>
                          <p className={`mt-1 text-xs ${over ? "text-[var(--status-amber-fg)]" : "text-muted-foreground"}`}>
                            {over ? "Sopra il ritmo" : "In linea"} · la tacca è dove dovresti essere oggi
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">Nessun budget per questo reparto</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section aria-labelledby="costs-top" className="rounded-xl border border-border bg-card p-5">
              <h2 id="costs-top" className="text-base font-semibold text-foreground">
                I contratti che {isCost ? "costano" : "rendono"} di più nel {year}
              </h2>
              <ol className="mt-4 divide-y divide-border">
                {o.topContracts.map((c) => (
                  <li key={c.contractId}>
                    <Link
                      href={`/contracts/${c.contractId}`}
                      className="flex items-baseline justify-between gap-3 rounded-md px-2 py-2.5 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">{c.name}</span>
                        {c.areaName && <span className="block text-xs text-muted-foreground">{c.areaName}</span>}
                      </span>
                      <span className="shrink-0 tabular-nums text-foreground">{euro(c.yearTotal)}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </>
      )}

      <p className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Link href="/financial-values" className="font-medium text-primary underline-offset-4 hover:underline">
          Vedi tutti gli importi, mese per mese
        </Link>
        <Link href="/budgets" className="font-medium text-primary underline-offset-4 hover:underline">
          Gestisci i budget
        </Link>
      </p>
    </div>
  );
}
