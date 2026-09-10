"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useMemo } from "react";
import Link from "next/link";
import KPICard from "@/components/dashboard/KPICard";
import { budgetUsageTone } from "@/lib/varianceTone";
import type { Budget, FinancialValue } from "@/types";

const EUR_FORMATTER = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export interface BudgetAreaSelection {
  readonly id: number;
  readonly name: string;
}

interface BudgetRowProps {
  readonly budget: Budget;
  readonly isSelected: boolean;
  readonly onClick?: (area: BudgetAreaSelection) => void;
}

function BudgetRow({ budget, isSelected, onClick }: BudgetRowProps) {
  const tone = budgetUsageTone(budget.percentUsed, budget.category);
  const clickable = !!onClick;

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onClick!({ id: budget.businessAreaId, name: budget.areaName }) : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick!({ id: budget.businessAreaId, name: budget.areaName });
              }
            }
          : undefined
      }
      className={`flex items-center gap-3 rounded-md -mx-2 px-2 py-1 ${clickable ? "cursor-pointer hover:bg-muted/60" : ""} ${isSelected ? "bg-muted ring-1 ring-inset ring-primary/40" : ""}`}
    >
      <span className="w-28 sm:w-36 shrink-0 truncate text-sm text-secondary-foreground" title={budget.areaName}>
        {budget.areaName}
      </span>
      <div className="relative h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${tone.bar}`}
          style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
        />
      </div>
      <span className={`w-12 shrink-0 text-right text-xs font-mono tabular-nums ${tone.text}`}>
        {budget.percentUsed.toFixed(0)}%
      </span>
    </div>
  );
}

interface FinancialValueSummaryProps {
  readonly financialValues: FinancialValue[];
  readonly budgets: Budget[];
  readonly year: number | null;
  readonly isAdmin: boolean;
  /** Currently active area filter (drives the row highlight below). */
  readonly selectedAreaId?: number | null;
  /** Clicking a budget row asks the parent to filter the table below by that area. */
  readonly onAreaClick?: (area: BudgetAreaSelection) => void;
}

export default function FinancialValueSummary({
  financialValues,
  budgets,
  year,
  isAdmin,
  selectedAreaId = null,
  onAreaClick,
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

  // Split by category so revenue and cost are never visually mixed, and sort
  // each group worst-first (lowest revenue achievement / highest cost overrun
  // on top) so the areas that need attention surface immediately.
  const { revenueBudgets, costBudgets } = useMemo(() => {
    return {
      revenueBudgets: yearBudgets
        .filter((b) => b.category === "REVENUE")
        .sort((a, b) => a.percentUsed - b.percentUsed),
      costBudgets: yearBudgets
        .filter((b) => b.category === "COST")
        .sort((a, b) => b.percentUsed - a.percentUsed),
    };
  }, [yearBudgets]);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {revenueBudgets.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--status-green-fg)] mb-2">
                  Ricavi
                </h3>
                <div className="space-y-2">
                  {revenueBudgets.map((b) => (
                    <BudgetRow
                      key={b.id}
                      budget={b}
                      isSelected={selectedAreaId === b.businessAreaId}
                      onClick={onAreaClick}
                    />
                  ))}
                </div>
              </div>
            )}
            {costBudgets.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--status-red-fg)] mb-2">
                  Costi
                </h3>
                <div className="space-y-2">
                  {costBudgets.map((b) => (
                    <BudgetRow
                      key={b.id}
                      budget={b}
                      isSelected={selectedAreaId === b.businessAreaId}
                      onClick={onAreaClick}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
