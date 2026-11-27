"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { CostsVsBudgetChart } from "@/components/charts/CostsVsBudgetChart";
import { useToday } from "@/components/landing/useToday";

// The demo organization's monthly supplier costs, in euro, for the eight
// months up to this one, against a budget of 4,500 a month.
const COSTS = [3900, 4200, 4600, 4100, 5100, 4300, 3700, 4400];
const BUDGET = 4500;

/** The Home's chart with the demo's numbers; the months follow today. */
export function BudgetChart() {
  const today = useToday();
  if (!today) return <div className="h-44 rounded-md bg-muted/50 md:h-64" />;

  const data = COSTS.map((cost, i) => {
    const month = new Date(today.getFullYear(), today.getMonth() - (COSTS.length - 1 - i), 1);
    return { label: month.toLocaleDateString("it-IT", { month: "short" }), cost };
  });
  return (
    <CostsVsBudgetChart
      data={data}
      budget={BUDGET}
      ariaLabel="Costi mensili dei fornitori rispetto al budget di 4.500 € al mese: due mesi sopra il budget."
    />
  );
}
