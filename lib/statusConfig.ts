/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import type { InvoiceMatchStatus } from "@/types";

export type BadgeVariant = "default" | "secondary" | "destructive" | "danger" | "success" | "warning" | "info" | "outline";

export interface StatusConfig {
  variant: BadgeVariant;
  label: string;
}

/** Single source of truth for contract status → badge variant + Italian label. */
export const CONTRACT_STATUS_CONFIG: Record<string, StatusConfig> = {
  ACTIVE: { variant: "success", label: "Attivo" },
  EXPIRED: { variant: "danger", label: "Scaduto" },
  CANCELLED: { variant: "secondary", label: "Annullato" },
  DRAFT: { variant: "info", label: "Bozza" },
};

/** How often a contract is billed, as the form and the contract page name it. */
export const BILLING_FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: "Mensile",
  QUARTERLY: "Trimestrale",
  SEMIANNUAL: "Semestrale",
  ANNUAL: "Annuale",
};

export const CONTRACT_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(CONTRACT_STATUS_CONFIG).map(([status, cfg]) => [status, cfg.label])
);

/**
 * The statuses an edit may set, from the contract's current one: the
 * backend's ContractStatusTransitions (docs/BUSINESS_RULES.md), which decides.
 * A draft becomes active only through approval, nothing goes back to draft,
 * a cancelled contract stays cancelled.
 */
const STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  DRAFT: ["DRAFT", "CANCELLED"],
  ACTIVE: ["ACTIVE", "EXPIRED", "CANCELLED"],
  EXPIRED: ["EXPIRED", "ACTIVE", "CANCELLED"],
  CANCELLED: ["CANCELLED"],
};

/** Status options for the form: every one for a new contract, the reachable ones for an existing one. */
export function contractStatusOptions(current?: string | null): { value: string; label: string }[] {
  const reachable = current ? STATUS_TRANSITIONS[current] : undefined;
  return Object.entries(CONTRACT_STATUS_LABELS)
    .filter(([value]) => !reachable || reachable.includes(value))
    .map(([value, label]) => ({ value, label }));
}

export function getContractStatusVariant(status: string): BadgeVariant {
  return CONTRACT_STATUS_CONFIG[status]?.variant ?? "default";
}

/**
 * Same window as the backend's "In scadenza" dashboard counter: ACTIVE
 * contracts ending today or within the next 30 days. The backend only sends
 * daysUntilExpiry for ACTIVE contracts; the status check keeps that explicit.
 */
export const EXPIRING_SOON_DAYS = 30;

/** Days left when the contract is expiring soon, otherwise null. */
export function getExpiringSoonDays(contract: { status: string; daysUntilExpiry?: number | null }): number | null {
  const days = contract.daysUntilExpiry;
  if (contract.status !== "ACTIVE" || days == null || days < 0 || days > EXPIRING_SOON_DAYS) return null;
  return days;
}

/** "Scade oggi", "Scade tra 1 giorno", "Scade tra 12 giorni". */
export function formatExpiresIn(days: number): string {
  if (days === 0) return "Scade oggi";
  return `Scade tra ${days} ${days === 1 ? "giorno" : "giorni"}`;
}

/**
 * Days left to the last day to give notice, when a tacitly renewing contract
 * is within 30 days of it; otherwise null (no deadline, already passed, or
 * still far).
 */
export function getNoticeDeadlineDays(contract: {
  status: string;
  daysUntilNoticeDeadline?: number | null;
}): number | null {
  const days = contract.daysUntilNoticeDeadline;
  if (contract.status !== "ACTIVE" || days == null || days < 0 || days > EXPIRING_SOON_DAYS) return null;
  return days;
}

/** "Ultimo giorno per disdire: oggi", "Disdici entro 1 giorno", "Disdici entro 12 giorni". */
export function formatNoticeIn(days: number): string {
  if (days === 0) return "Ultimo giorno per disdire: oggi";
  return `Disdici entro ${days} ${days === 1 ? "giorno" : "giorni"}`;
}

/** The last day to give notice, computed like the backend: end date minus notice days. */
export function computeNoticeDeadline(endDate: string | undefined, noticeDays: number | null | undefined): Date | null {
  if (!endDate || noticeDays == null || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return null;
  const [y, m, d] = endDate.split("-").map(Number);
  return new Date(y, m - 1, d - noticeDays);
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
export const PAYMENT_STATUS_CONFIG: Record<"PAID" | "READY" | "IBAN_CHANGED", StatusConfig> = {
  PAID: { variant: "success", label: "Pagata" },
  READY: { variant: "secondary", label: "Pronta per SEPA" },
  // Same wording as the home page alert: the two must tell the same story.
  IBAN_CHANGED: { variant: "destructive", label: "IBAN cambiato: da verificare" },
};

/** Invoice ↔ financial-value match status → badge variant + Italian label. */
export const MATCH_STATUS_CONFIG: Record<InvoiceMatchStatus, StatusConfig> = {
  UNMATCHED: { variant: "secondary", label: "N/D" },
  SUGGESTED: { variant: "warning", label: "Suggerito" },
  CONFIRMED: { variant: "success", label: "Verificata" },
  REJECTED: { variant: "secondary", label: "Rifiutata" },
  COUNTERPARTY_MISMATCH: { variant: "destructive", label: "Fornitore non corrisponde" },
};
