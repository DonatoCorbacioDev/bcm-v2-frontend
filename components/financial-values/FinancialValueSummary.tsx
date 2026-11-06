"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useMemo } from "react";
import Link from "next/link";
import KPICard from "@/components/dashboard/KPICard";
import { budgetUsageTone, expectedBudgetPercent } from "@/lib/varianceTone";
import type { Budget, FinancialValue } from "@/types";
import { formatMoney } from "@/lib/formatMoney";


export interface BudgetAreaSelection {
  readonly id: number;
  readonly name: string;
}

interface BudgetRowProps {
  readonly budget: Budget;
  /** Share of the yearly target due by today (see expectedBudgetPercent). */
  readonly expectedPercent: number;
  readonly isSelected: boolean;
  readonly onClick?: (area: BudgetAreaSelection) => void;
}

function BudgetRow({ budget, expectedPercent, isSelected, onClick }: BudgetRowProps) {
  const tone = budgetUsageTone(budget.percentUsed, budget.category, expectedPercent);
  const clickable = !!onClick;
  // A cost budget with nothing booked against it is missing data, not a
  // saving: a green "0%" would read as good news.
  const noCostsYet = budget.category === "COST" && budget.actualAmount === 0;
  // The pace marker only means something while the year is under way.
  const showPaceMarker = expectedPercent > 0 && expectedPercent < 100;
  const used = `${budget.percentUsed.toFixed(0)}%`;
  const pace = showPaceMarker ? `, atteso ad oggi ${expectedPercent.toFixed(0)}%` : "";
  const summary = noCostsYet
    ? `${budget.areaName}: nessun costo registrato`
    : `${budget.areaName}: ${used} del budget annuale${pace}`;

  const rowClassName = `flex items-center gap-3 rounded-md -mx-2 px-2 py-1 w-full text-left ${clickable ? "cursor-pointer hover:bg-muted/60" : ""} ${isSelected ? "bg-muted ring-1 ring-inset ring-primary/40" : ""}`;

  const content = (
    <>
      <span className="w-28 sm:w-36 shrink-0 truncate text-sm text-secondary-foreground" title={budget.areaName}>
        {budget.areaName}
      </span>
      {noCostsYet ? (
        <span className="flex-1 text-xs text-muted-foreground">Nessun costo registrato</span>
      ) : (
        <div className="relative flex-1" aria-hidden="true">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${tone.bar}`}
              style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
            />
          </div>
          {showPaceMarker && (
            <div
              data-testid="budget-pace-marker"
              className="absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 rounded-full bg-foreground/70"
              style={{ left: `${expectedPercent}%` }}
            />
          )}
        </div>
      )}
      <span className={`w-12 shrink-0 text-right text-xs font-mono tabular-nums ${noCostsYet ? "text-muted-foreground" : tone.text}`}>
        {noCostsYet ? "N/D" : used}
      </span>
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        onClick={() => onClick!({ id: budget.businessAreaId, name: budget.areaName })}
        className={`${rowClassName} appearance-none bg-transparent border-0`}
        title={summary}
        aria-label={summary}
      >
        {content}
      </button>
    );
  }

  // Read as one sentence by screen readers; the bar and figures are visual.
  return (
    <div className={rowClassName} title={summary}>
      <span className="sr-only">{summary}</span>
      <div className="contents" aria-hidden="true">{content}</div>
    </div>
  );
}

interface FinancialValueSummaryProps {
  readonly financialValues: FinancialValue[];
  readonly budgets: Budget[];
  readonly year: number | null;
  readonly isAdmin: boolean;
  /** Financial values still loading: the totals show a placeholder instead of 0 €. */
  readonly isLoading?: boolean;
  /** Financial values failed to load: the totals show N/D instead of 0 €. */
  readonly isError?: boolean;
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
  isLoading = false,
  isError = false,
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
  const formatTotal = (amount: number) => (isError ? "N/D" : formatMoney(amount, { decimals: 0 }));

  const expectedPercent = year === null ? 100 : expectedBudgetPercent(year);
  const yearUnderWay = expectedPercent > 0 && expectedPercent < 100;

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
        <KPICard
          title={year === null ? "Ricavi (tutti gli anni)" : `Ricavi ${year}`}
          value={formatTotal(revenueTotal)}
          variant="success"
          isLoading={isLoading}
        />
        <KPICard
          title={year === null ? "Costi (tutti gli anni)" : `Costi ${year}`}
          value={formatTotal(costTotal)}
          variant="danger"
          isLoading={isLoading}
        />
        <KPICard
          title={year === null ? "Margine netto (tutti gli anni)" : `Margine netto ${year}`}
          value={formatTotal(netMargin)}
          variant={isError || netMargin >= 0 ? "success" : "danger"}
          isLoading={isLoading}
        />
      </div>

      {year !== null && yearBudgets.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Andamento rispetto al budget {year}</h2>
              {yearUnderWay && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  La tacca indica dove dovresti essere oggi: {expectedPercent.toFixed(0)}% dell&apos;anno trascorso.
                </p>
              )}
            </div>
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
                      expectedPercent={expectedPercent}
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
                      expectedPercent={expectedPercent}
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
