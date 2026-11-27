"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CostsVsBudgetChart, compactEuro } from "@/components/charts/CostsVsBudgetChart";
import { useBudgets } from "@/hooks/useBudgets";
import { useFinancialValues } from "@/hooks/useFinancialValues";

/**
 * The Home's one chart, for administrators (budgets are theirs): this year's
 * supplier costs month by month against the cost budget, spread evenly over
 * the year. Without a cost budget for this year it invites to set one, since
 * the chart would have nothing to compare with (once there are costs at all).
 */
export function HomeCostsCard() {
  const { data: budgets, isLoading: loadingBudgets } = useBudgets();
  const { data: values, isLoading: loadingValues } = useFinancialValues();
  if (loadingBudgets || loadingValues) return null;

  const now = new Date();
  const year = now.getFullYear();
  const yearlyBudget = (budgets ?? [])
    .filter((b) => b.year === year && b.category === "COST")
    .reduce((sum, b) => sum + b.targetAmount, 0);

  if (yearlyBudget <= 0) {
    // A new organization has no costs yet either: nothing to invite to.
    if ((values ?? []).length === 0) return null;
    return (
      <section aria-labelledby="home-costs" className="flex flex-col gap-4 rounded-xl border border-dashed border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 id="home-costs" className="font-semibold text-foreground">Costi rispetto al budget</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Imposta un budget di costo per il {year} e qui vedrai i costi dei fornitori mese per mese.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link href="/budgets">Imposta un budget</Link>
        </Button>
      </section>
    );
  }

  const monthly = yearlyBudget / 12;
  const totals = new Map<number, number>();
  for (const v of values ?? []) {
    if (v.year !== year || v.category !== "COST") continue;
    totals.set(v.month, (totals.get(v.month) ?? 0) + v.financialAmount);
  }
  const data = Array.from({ length: now.getMonth() + 1 }, (_, i) => ({
    label: new Date(year, i, 1).toLocaleDateString("it-IT", { month: "short" }),
    cost: totals.get(i + 1) ?? 0,
  }));
  const overCount = data.filter((d) => d.cost > monthly).length;

  return (
    <section aria-labelledby="home-costs" className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="home-costs" className="text-base font-semibold text-foreground">Costi dei fornitori nel {year}</h2>
        <Link href="/budgets" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Vedi i budget
        </Link>
      </div>
      <div className="mt-4">
        <CostsVsBudgetChart
          data={data}
          budget={monthly}
          ariaLabel={`Costi mensili dei fornitori nel ${year} rispetto al budget di ${compactEuro(monthly)} al mese: ${
            overCount === 0 ? "nessun mese sopra il budget" : overCount === 1 ? "un mese sopra il budget" : `${overCount} mesi sopra il budget`
          }.`}
        />
      </div>
    </section>
  );
}
