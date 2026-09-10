"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import KPICard from "@/components/dashboard/KPICard";
import { useCounterparty, useCounterpartyInvoicingSummary } from "@/hooks/useCounterparty";
import { invoicingVarianceVariant } from "@/lib/varianceTone";

const TYPE_LABELS: Record<string, string> = {
  CUSTOMER: "Cliente",
  SUPPLIER: "Fornitore",
  BOTH: "Entrambi",
};

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

export default function CounterpartyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const counterpartyId = Number(params.id);

  const { data: counterparty, isLoading, isError } = useCounterparty(counterpartyId);
  const { data: summary, isLoading: isSummaryLoading, isError: isSummaryError } =
    useCounterpartyInvoicingSummary(counterpartyId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !counterparty) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/counterparties")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alle controparti
        </Button>
        <div className="text-center py-12 bg-destructive/10 rounded-lg border border-destructive/30">
          <p className="text-destructive">Controparte non trovata o errore nel caricamento dei dati</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={() => router.push("/counterparties")} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alle controparti
        </Button>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold text-foreground">{counterparty.name}</h1>
          <Badge variant="outline">{TYPE_LABELS[counterparty.type] ?? counterparty.type}</Badge>
        </div>
        <p className="text-muted-foreground mt-1">{counterparty.vatNumber || "P.IVA non indicata"}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[var(--status-blue-fg)]" aria-hidden="true" />
            Fatturato vs previsto
          </CardTitle>
          <CardDescription>
            Valore contrattato (contratti attivi) vs. fatture confermate nell&apos;anno corrente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSummaryLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {isSummaryError && (
            <p className="text-sm text-destructive text-center py-8">Riepilogo non disponibile</p>
          )}

          {!isSummaryLoading && !isSummaryError && summary && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPICard title="Contratti attivi" value={summary.activeContracts} />
                <KPICard title="Valore contrattato" value={EUR_FORMATTER.format(summary.contractedValue)} />
                <KPICard
                  title="Scostamento"
                  value={PERCENT_FORMATTER.format(summary.variancePercent / 100)}
                  variant={invoicingVarianceVariant(summary.variancePercent)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Fatturato confermato</p>
                  <p className="text-base font-medium text-foreground">
                    {EUR_FORMATTER.format(summary.invoicedYtd)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fatture totali</p>
                  <p className="text-base font-medium text-foreground">
                    {summary.invoiceCount}
                    {summary.lastInvoiceDate &&
                      ` · ultima il ${new Date(summary.lastInvoiceDate).toLocaleDateString("it-IT")}`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
