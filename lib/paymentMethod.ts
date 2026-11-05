/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

/**
 * How an invoice is to be paid, from its FatturaPA ModalitaPagamento code.
 * Mirrors the backend's PaymentMethods: only a bank transfer (or no method
 * stated) is paid from BCM by SEPA; RiBa and direct debits are collected by
 * the supplier; the rest is paid outside BCM.
 */
export type PaymentKind = "TRANSFER" | "COLLECTED_BY_SUPPLIER" | "OUTSIDE_BCM";

const LABELS: Record<string, string> = {
  MP01: "contanti",
  MP02: "assegno",
  MP03: "assegno circolare",
  MP05: "bonifico",
  MP08: "carta di pagamento",
  MP12: "RiBa",
  MP19: "addebito diretto SEPA",
  MP20: "addebito diretto SEPA",
  MP21: "addebito diretto SEPA B2B",
};

const COLLECTED = new Set(["MP12", "MP19", "MP20", "MP21"]);

export function paymentKind(method: string | null | undefined): PaymentKind {
  if (!method || method === "MP05") return "TRANSFER";
  return COLLECTED.has(method) ? "COLLECTED_BY_SUPPLIER" : "OUTSIDE_BCM";
}

/** "RiBa", "carta di pagamento"... or the bare code for one BCM doesn't name. */
export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "non indicato";
  return LABELS[method] ?? `metodo ${method}`;
}
