/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

/**
 * Single place for money formatting. Italian locale data leaves 4-digit
 * amounts ungrouped ("4800,00 €" next to "38.000,00 €"), which reads as an
 * inconsistency on financial screens: useGrouping "always" gives the
 * "4.800,00 €" Italian accounting uses. Browsers without that option fall
 * back to the locale default, so the worst case is the old output.
 */
const formatters = new Map<string, Intl.NumberFormat>();

function formatter(key: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  let cached = formatters.get(key);
  if (!cached) {
    cached = new Intl.NumberFormat("it-IT", { useGrouping: "always", ...options });
    formatters.set(key, cached);
  }
  return cached;
}

/** "4.800,00 €"; `decimals: 0` for totals and KPIs ("148.800 €"). */
export function formatMoney(amount: number, { decimals = 2, currency = "EUR" }: { decimals?: number; currency?: string } = {}): string {
  try {
    return formatter(`money:${currency}:${decimals}`, {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    // Not an ISO 4217 code (an invoice can carry anything): keep it as text.
    return `${formatNumber(amount, decimals)} ${currency}`;
  }
}

/** A plain amount without currency symbol, e.g. invoice line prices: "4.800,00". */
export function formatNumber(amount: number, decimals = 2): string {
  return formatter(`number:${decimals}`, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}
