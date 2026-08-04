"use client";

import { useMemo } from "react";
import Link from "next/link";
import KPICard from "@/components/dashboard/KPICard";
import { Badge } from "@/components/ui/badge";
import type { Budget, FinancialValue } from "@/types";

const EUR_FORMATTER = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function usageTone(percentUsed: number): { bar: string; text: string } {
  if (percentUsed > 100) return { bar: "bg-[var(--status-red-fg)]", text: "text-[var(--status-red-fg)]" };
  if (percentUsed >= 80) return { bar: "bg-[var(--status-amber-fg)]", text: "text-[var(--status-amber-fg)]" };
  return { bar: "bg-[var(--status-green-fg)]", text: "text-[var(--status-green-fg)]" };
}

interface FinancialValueSummaryProps {
  readonly financialValues: FinancialValue[];
  readonly budgets: Budget[];
  readonly year: number | null;
  readonly isAdmin: boolean;
}

export default function FinancialValueSummary({
  financialValues,
  budgets,
  year,
  isAdmin,
}: FinancialValueSummaryProps) {
  const { revenueTotal, costTotal } = useMemo(() => {
    const scoped = year === null ? financialValues : financialValues.filter((fv) => fv.year === year);
    return {
      revenueTotal: scoped.filter((fv) => fv.category === "REVENUE").reduce((sum, fv) => sum + fv.financialAmount, 0),
      costTotal: scoped.filter((fv) => fv.category === "COST").reduce((sum, fv) => sum + fv.financialAmount, 0),
    };
  }, [financialValues, year]);

  const netMargin = revenueTotal - costTotal;

  const yearBudgets = useMemo(
    () => (year === null ? [] : budgets.filter((b) => b.year === year)),
    [budgets, year]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title={year === null ? "Ricavi (tutti gli anni)" : `Ricavi ${year}`} value={EUR_FORMATTER.format(revenueTotal)} variant="success" />
        <KPICard title={year === null ? "Costi (tutti gli anni)" : `Costi ${year}`} value={EUR_FORMATTER.format(costTotal)} variant="danger" />
        <KPICard
          title={year === null ? "Margine netto (tutti gli anni)" : `Margine netto ${year}`}
          value={EUR_FORMATTER.format(netMargin)}
          variant={netMargin >= 0 ? "success" : "danger"}
        />
      </div>

      {year !== null && yearBudgets.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Andamento rispetto al budget {year}</h2>
            {isAdmin && (
              <Link href="/budgets" className="text-xs text-primary hover:underline">
                Gestisci budget
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {yearBudgets.map((b) => {
              const tone = usageTone(b.percentUsed);
              return (
                <div key={b.id} className="flex items-center gap-3">
                  <span className="w-32 sm:w-40 shrink-0 truncate text-sm text-secondary-foreground" title={b.areaName}>
                    {b.areaName}
                  </span>
                  <Badge variant={b.category === "REVENUE" ? "success" : "secondary"} className="shrink-0 hidden sm:inline-flex">
                    {b.category === "REVENUE" ? "Ricavo" : "Costo"}
                  </Badge>
                  <div className="relative h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${tone.bar}`}
                      style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                    />
                  </div>
                  <span className={`w-12 shrink-0 text-right text-xs font-mono tabular-nums ${tone.text}`}>
                    {b.percentUsed.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
