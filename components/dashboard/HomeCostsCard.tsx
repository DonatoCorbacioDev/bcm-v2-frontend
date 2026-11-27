"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import { useBudgets } from "@/hooks/useBudgets";
import { useFinancialValues } from "@/hooks/useFinancialValues";
import { buildCostsOverview } from "@/lib/costsOverview";
import { formatMoney } from "@/lib/formatMoney";

const euro = (n: number) => formatMoney(n, { decimals: 0 });

/**
 * The Home's glance at this year's costs, for administrators (budgets are
 * theirs): one number, one bar against the budget with today's tick, one
 * word. The chart and the details are on "Costi e budget". Nothing at all
 * for an organization with no costs yet: the first steps come first.
 */
export function HomeCostsCard() {
  const { data: budgets, isLoading: loadingBudgets } = useBudgets();
  const { data: values, isLoading: loadingValues } = useFinancialValues();
  if (loadingBudgets || loadingValues) return null;

  const year = new Date().getFullYear();
  const o = buildCostsOverview(values ?? [], budgets ?? [], year, "COST");
  if (o.yearForecast === 0 && o.budget === 0) return null;

  const hasBudget = o.budget > 0;
  const share = hasBudget ? o.toDate / o.budget : 0;
  const expected = hasBudget ? o.paceToday / o.budget : 0;
  const over = hasBudget && o.toDate > o.paceToday;

  return (
    <section aria-labelledby="home-costs" className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="home-costs" className="text-base font-semibold text-foreground">Costi del {year}</h2>
        <Link href="/costs" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Apri Costi e budget
        </Link>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">
        {euro(o.toDate)}
        {hasBudget && <span className="text-base font-normal text-muted-foreground"> su {euro(o.budget)} di budget</span>}
      </p>
      {hasBudget ? (
        <>
          <div className="relative mt-3 h-2 rounded-full bg-muted" aria-hidden="true">
            <div className={`h-2 rounded-full ${over ? "bg-[var(--status-amber-mark)]" : "bg-primary"}`} style={{ width: `${Math.min(100, share * 100)}%` }} />
            <div className="absolute -top-1 h-4 w-0.5 rounded bg-foreground" style={{ left: `${expected * 100}%` }} />
          </div>
          <p className={`mt-2 text-sm ${over ? "text-[var(--status-amber-fg)]" : "text-[var(--status-green-fg)]"}`}>
            {over ? `Sopra il ritmo di ${euro(o.toDate - o.paceToday)}` : "In linea con il budget"}
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Spesi fino a oggi, IVA esclusa.{" "}
          <Link href="/budgets" className="font-medium text-primary underline-offset-4 hover:underline">Imposta un budget</Link>{" "}
          per vedere se sei in linea.
        </p>
      )}
    </section>
  );
}
