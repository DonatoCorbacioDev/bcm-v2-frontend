"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { Loader2, TrendingUp, WifiOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import KPICard from "@/components/dashboard/KPICard";
import { useInvoicingSummary } from "@/hooks/useDashboardStats";
import { invoicingVarianceVariant } from "@/lib/varianceTone";

const EUR_FORMATTER = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const PERCENT_FORMATTER = new Intl.NumberFormat("it-IT", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

export function InvoicingSummaryWidget() {
  const { data: summary, isLoading, isError } = useInvoicingSummary();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[var(--status-blue-fg)]" aria-hidden="true" />
          Fatturato vs previsto{summary ? ` ${summary.year}` : ""}
        </CardTitle>
        <CardDescription>
          Valore atteso dai valori finanziari vs. fatture confermate (abbinamento verificato)
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <WifiOff className="h-6 w-6 text-[var(--status-amber-fg)]" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">Riepilogo fatturato non disponibile</p>
            <p className="text-xs text-muted-foreground">Verifica che il backend sia attivo</p>
          </div>
        )}

        {!isLoading && !isError && summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPICard title="Valore atteso" value={EUR_FORMATTER.format(summary.expectedYtd)} />
            <KPICard title="Fatturato confermato" value={EUR_FORMATTER.format(summary.invoicedYtd)} />
            <KPICard
              title="Scostamento"
              value={PERCENT_FORMATTER.format(summary.variancePercent / 100)}
              variant={invoicingVarianceVariant(summary.variancePercent)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
