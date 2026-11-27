/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { formatMoney } from "@/lib/formatMoney";
import {
  AlertTriangle, CalendarClock, CheckCircle2, FileText, Info, Landmark, RefreshCw, type LucideIcon,
} from "lucide-react";
import { EXPIRING_SOON_DAYS } from "@/lib/statusConfig";
import { Button } from "@/components/ui/button";
import { dayWithArticle } from "@/lib/italianDate";
import type { Contract, ElectronicInvoice, InvoiceMatchStatus } from "@/types";

type Tone = "danger" | "warning" | "ok" | "info";

const TONE: Record<Tone, string> = {
  danger: "border-destructive/40 bg-destructive/10 text-destructive",
  warning: "border-[var(--status-amber-fg)]/40 bg-[var(--status-amber-bg)] text-[var(--status-amber-fg)]",
  ok: "border-border bg-card text-[var(--status-green-fg)]",
  info: "border-border bg-card text-muted-foreground",
};

/** The invoice statuses the home page lists as "da abbinare". */
const TO_MATCH: ReadonlySet<InvoiceMatchStatus> = new Set<InvoiceMatchStatus>([
  "UNMATCHED", "SUGGESTED", "COUNTERPARTY_MISMATCH",
]);

interface NextAction {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  detail?: string;
  /** The invoice asking for another bank account, when that is the action. */
  ibanInvoice?: ElectronicInvoice;
  /** A tacit renewal whose last day to cancel has not passed: the user can still cancel it. */
  cancellable?: boolean;
  /** Invoices wait to be matched: the action is in the Fatture tab. */
  toMatch?: boolean;
}

/** "2026-11-24" -> "24 novembre 2026", read as a calendar day (no timezone shift). */
function formatDay(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

function inDays(days: number): string {
  if (days === 0) return "oggi";
  if (days === 1) return "domani";
  return `tra ${days} giorni`;
}

/** A contract that isn't running has nothing to act on, only a status. */
function statusAction(contract: Contract): NextAction | null {
  if (contract.status === "DRAFT") {
    return { icon: Info, tone: "info", title: "Bozza: non ancora attiva" };
  }
  if (contract.status === "CANCELLED") {
    return { icon: Info, tone: "info", title: "Contratto annullato" };
  }
  if (contract.status === "EXPIRED") {
    return { icon: Info, tone: "info", title: `Scaduto ${dayWithArticle(contract.endDate, true)}` };
  }
  return null;
}

function renewalPhrase(months: number | null | undefined): string {
  if (!months) return "si rinnova automaticamente";
  return months === 1 ? "si rinnova per un altro mese" : `si rinnova per altri ${months} mesi`;
}

/** What the renewal costs, when the contract says: ": 6.000,00 € (IVA esclusa)". */
function renewalCost(contract: Contract): string {
  if (!contract.annualValue || !contract.renewalMonths) return "";
  return `: ${formatMoney((contract.annualValue * contract.renewalMonths) / 12)} (IVA esclusa)`;
}

/** A tacit renewal with its notice deadline known: disdici, passed, or nothing yet. */
function noticeAction(contract: Contract, noticeDeadline: string, days: number): NextAction {
  const renewal = renewalPhrase(contract.renewalMonths);
  if (days >= 0 && days <= EXPIRING_SOON_DAYS) {
    return {
      icon: CalendarClock,
      tone: "warning",
      title: `Disdici entro ${dayWithArticle(noticeDeadline, true)} (${inDays(days)}) se non vuoi rinnovarlo`,
      detail: `Dopo questa data ${renewal}${renewalCost(contract)}.`,
      cancellable: true,
    };
  }
  if (days < 0) {
    return {
      icon: RefreshCw,
      tone: "info",
      title: `Termine di disdetta passato: ${dayWithArticle(contract.endDate, true)} ${renewal}`,
    };
  }
  return {
    icon: CheckCircle2,
    tone: "ok",
    title: `Nessuna azione nei prossimi ${EXPIRING_SOON_DAYS} giorni`,
    detail: `Ultimo giorno per disdire: ${formatDay(noticeDeadline)}.`,
    cancellable: true,
  };
}

/** What the contract's dates call for: notice deadline, end, or nothing. */
function dateAction(contract: Contract): NextAction {
  const status = statusAction(contract);
  if (status) return status;

  if (contract.autoRenew && contract.noticeDeadline && contract.daysUntilNoticeDeadline != null) {
    return noticeAction(contract, contract.noticeDeadline, contract.daysUntilNoticeDeadline);
  }

  if (contract.autoRenew) {
    return {
      icon: RefreshCw,
      tone: "warning",
      title: "Verifica il rinnovo",
      detail: "Si rinnova da solo (rinnovo tacito), ma mancano preavviso o durata del rinnovo: completa i dati del contratto.",
    };
  }

  const days = contract.daysUntilExpiry;
  if (days != null && days >= 0 && days <= EXPIRING_SOON_DAYS) {
    return { icon: AlertTriangle, tone: "warning", title: `Scade ${dayWithArticle(contract.endDate, true)} (${inDays(days)})` };
  }
  return {
    icon: CheckCircle2,
    tone: "ok",
    title: `Nessuna scadenza nei prossimi ${EXPIRING_SOON_DAYS} giorni`,
    detail: `Scade ${dayWithArticle(contract.endDate, true)}.`,
  };
}

/** "La fattura FA-12" (or "Fattura FA-12"), "Una fattura" when the XML carried no number. */
function invoiceLabel(number: string | null | undefined, article = "La fattura"): string {
  return number ? `${article} ${number}` : "Una fattura";
}

/**
 * What the user should do about this contract now, in one sentence. Same
 * rules and order as the home page: a changed IBAN first (money can leave
 * to a fraudster), then a deadline, then invoices waiting to be matched.
 */
export function nextAction(contract: Contract, invoices: readonly ElectronicInvoice[] = []): NextAction {
  const ibanChanged = invoices.find((i) => i.ibanChanged && i.sepaBatchId == null);
  if (ibanChanged) {
    // Both IBANs are masked by the API ("IT...5519"): enough to tell them apart.
    const verified = contract.counterparty?.verifiedIban;
    const asked = ibanChanged.supplierIban;
    return {
      icon: Landmark,
      tone: "danger",
      title: "IBAN cambiato: verifica prima di pagare",
      detail: asked && verified
        ? `${invoiceLabel(ibanChanged.invoiceNumber)} chiede il pagamento su ${asked} invece che sul conto verificato ${verified}.`
        : `${invoiceLabel(ibanChanged.invoiceNumber)} chiede il pagamento su un conto diverso da quello verificato.`,
      ibanInvoice: ibanChanged,
    };
  }
  const byDate = dateAction(contract);
  if (byDate.tone === "warning") return byDate;

  const toMatch = invoices.filter((i) => TO_MATCH.has(i.matchStatus));
  if (toMatch.length > 0) {
    return {
      icon: FileText,
      tone: "info",
      title: toMatch.length === 1
        ? `${invoiceLabel(toMatch[0].invoiceNumber, "Fattura")} da abbinare`
        : `${toMatch.length} fatture da abbinare`,
      detail: "Controlla l'abbinamento nella scheda Fatture.",
      toMatch: true,
    };
  }
  return byDate;
}

interface NextActionCardProps {
  readonly contract: Contract;
  readonly invoices?: readonly ElectronicInvoice[];
  /** Opens the changed-IBAN steps for that invoice; without it no button is shown. */
  readonly onIbanCheck?: (invoice: ElectronicInvoice) => void;
  /** Opens the ready-to-send cancellation text; without it no button is shown. */
  readonly onPrepareCancellation?: () => void;
  /** Records that the cancellation was sent (administrators only); without it no button is shown. */
  readonly onMarkCancellationSent?: () => void;
  /** Opens the Fatture tab; without it no button is shown. */
  readonly onOpenInvoices?: () => void;
}

/** The first thing on a contract's page: what to do now, before all its data. */
export function NextActionCard({ contract, invoices, onIbanCheck, onPrepareCancellation, onMarkCancellationSent, onOpenInvoices }: NextActionCardProps) {
  const { icon: Icon, tone, title, detail, ibanInvoice, cancellable, toMatch } = nextAction(contract, invoices);
  return (
    <section aria-label="Prossima azione" className={`flex items-start gap-3 rounded-lg border p-4 ${TONE[tone]}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">{title}</p>
        {detail && <p className="mt-0.5 text-sm text-foreground">{detail}</p>}
        {ibanInvoice && onIbanCheck && (
          <Button type="button" size="sm" variant="outline" className="mt-3 bg-card" onClick={() => onIbanCheck(ibanInvoice)}>
            Come verificarlo
          </Button>
        )}
        {toMatch && onOpenInvoices && (
          <Button type="button" size="sm" variant="outline" className="mt-3 bg-card" onClick={onOpenInvoices}>
            Apri le fatture
          </Button>
        )}
        {cancellable && (onPrepareCancellation || onMarkCancellationSent) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {/* The one action that matters here: in sight, and saying what it does. */}
            {onPrepareCancellation && (
              <Button type="button" size="sm" onClick={onPrepareCancellation}>
                Prepara la disdetta
              </Button>
            )}
            {onMarkCancellationSent && (
              <Button type="button" size="sm" variant="outline" className="bg-card" onClick={onMarkCancellationSent}>
                Segna disdetta inviata
              </Button>
            )}
          </div>
        )}
        {cancellable && onPrepareCancellation && (
          <p className="mt-2 text-xs text-muted-foreground">
            Crea la lettera già compilata da inviare con PEC o raccomandata.
          </p>
        )}
      </div>
    </section>
  );
}
