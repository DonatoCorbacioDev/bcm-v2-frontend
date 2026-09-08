/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import type { InvoiceMatchStatus } from "@/types";

export type BadgeVariant = "default" | "secondary" | "destructive" | "success" | "warning" | "info" | "outline";

export interface StatusConfig {
  variant: BadgeVariant;
  label: string;
}

/** Single source of truth for contract status → badge variant + Italian label. */
export const CONTRACT_STATUS_CONFIG: Record<string, StatusConfig> = {
  ACTIVE: { variant: "success", label: "Attivo" },
  EXPIRED: { variant: "destructive", label: "Scaduto" },
  CANCELLED: { variant: "secondary", label: "Annullato" },
  DRAFT: { variant: "info", label: "Bozza" },
};

export const CONTRACT_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(CONTRACT_STATUS_CONFIG).map(([status, cfg]) => [status, cfg.label])
);

export function getContractStatusVariant(status: string): BadgeVariant {
  return CONTRACT_STATUS_CONFIG[status]?.variant ?? "default";
}

/** Contract workflow stage → badge variant + Italian label. */
export const WORKFLOW_STAGE_CONFIG: Record<string, StatusConfig> = {
  DRAFT: { variant: "secondary", label: "Bozza" },
  IN_REVIEW: { variant: "warning", label: "In revisione" },
  APPROVED: { variant: "success", label: "Approvato" },
};

/**
 * Shared color mapping for HIGH/MEDIUM/LOW severity, used by both risk score
 * and anomaly severity. Labels stay defined per call site because Italian
 * grammatical gender differs ("rischio alto" vs "gravità alta").
 */
export const RISK_LEVEL_VARIANT: Record<"HIGH" | "MEDIUM" | "LOW", BadgeVariant> = {
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "success",
};

/** Invoice payment status (derived from SEPA batch / IBAN presence) → badge variant + Italian label. */
export const PAYMENT_STATUS_CONFIG: Record<"PAID" | "READY", StatusConfig> = {
  PAID: { variant: "success", label: "Pagata" },
  READY: { variant: "secondary", label: "Pronta per SEPA" },
};

/** Invoice ↔ financial-value match status → badge variant + Italian label. */
export const MATCH_STATUS_CONFIG: Record<InvoiceMatchStatus, StatusConfig> = {
  UNMATCHED: { variant: "secondary", label: "N/D" },
  SUGGESTED: { variant: "warning", label: "Suggerito" },
  CONFIRMED: { variant: "success", label: "Verificata" },
  REJECTED: { variant: "secondary", label: "Rifiutata" },
  COUNTERPARTY_MISMATCH: { variant: "destructive", label: "Fornitore non corrisponde" },
};
