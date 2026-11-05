"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { Receipt } from "lucide-react";
import { useInvoicingSummary } from "@/hooks/useDashboardStats";
import { formatMoney } from "@/lib/formatMoney";

const PERCENT = new Intl.NumberFormat("it-IT", { style: "percent", maximumFractionDigits: 0, signDisplay: "exceptZero" });

interface SupplierInvoicesSummaryProps {
  /** Invoices still waiting to be matched: usually what explains the gap. */
  readonly invoicesToMatch: number;
}

/**
 * One line under "Da fare": this year's expected supplier costs against the
 * supplier invoices confirmed so far. Called "fatture ricevute", not
 * "fatturato": these are costs, and "fatturato" means what customers pay.
 * Hidden when nothing is expected yet (no purchase contracts with costs).
 */
export function SupplierInvoicesSummary({ invoicesToMatch }: SupplierInvoicesSummaryProps) {
  const { data: summary } = useInvoicingSummary();
  if (!summary || summary.expectedYtd <= 0) return null;

  return (
    <section aria-labelledby="home-supplier-invoices" className="rounded-lg border border-border bg-card p-4">
      <h2 id="home-supplier-invoices" className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Receipt className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        Fatture dei fornitori nel {summary.year}
      </h2>
      <p className="mt-1 text-sm text-foreground">
        Previste {formatMoney(summary.expectedYtd, { decimals: 0 })} · ricevute e confermate{" "}
        {formatMoney(summary.invoicedYtd, { decimals: 0 })}{" "}
        <span className="text-muted-foreground">({PERCENT.format(summary.variancePercent / 100)})</span>
      </p>
      {invoicesToMatch > 0 && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          {invoicesToMatch === 1 ? "1 fattura da confermare" : `${invoicesToMatch} fatture da confermare`}, nell&apos;elenco qui sopra.
        </p>
      )}
    </section>
  );
}
