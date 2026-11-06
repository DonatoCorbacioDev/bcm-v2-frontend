/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileText,
  Landmark,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { formatMoney } from "@/lib/formatMoney";
import { dayWithArticle } from "@/lib/italianDate";
import type { HomeAttentionItem, HomeAttentionType } from "@/types";

function formatWhen(daysLeft: number | null): string | null {
  if (daysLeft == null) return null;
  if (daysLeft === 0) return "oggi";
  if (daysLeft === 1) return "domani";
  if (daysLeft > 1) return `tra ${daysLeft} giorni`;
  return null;
}

function renewalDetail(subject: string, months: number | null | undefined): string {
  if (!months) return subject;
  if (months === 1) return `${subject} — dopo si rinnova per un altro mese`;
  return `${subject} — dopo si rinnova per altri ${months} mesi`;
}

const TONE = {
  danger: "text-destructive bg-destructive/10",
  warning: "text-[var(--status-amber-fg)] bg-[var(--status-amber-bg)]",
  info: "text-primary bg-primary/10",
} as const;

interface Presentation {
  icon: LucideIcon;
  tone: keyof typeof TONE;
  title: string;
  detail: string;
  href: string;
}

/** The sentence a user reads for each item: what to do, by when, about what. */
function present(item: HomeAttentionItem): Presentation {
  const subject = [item.projectName, item.counterpartyName].filter(Boolean).join(" · ");
  const contractHref = `/contracts/${item.contractId}`;
  const invoicesHref = `${contractHref}?tab=invoices`;
  const invoiceRef = item.invoiceNumber ? `La fattura ${item.invoiceNumber}` : "Una fattura";
  const kinds: Record<HomeAttentionType, () => Presentation> = {
    IBAN_CHANGED: () => ({
      icon: Landmark,
      tone: "danger",
      title: "IBAN cambiato: verifica prima di pagare",
      detail: `${invoiceRef} di ${item.counterpartyName ?? "un fornitore"} chiede il pagamento su un conto diverso da quello verificato`,
      href: invoicesHref,
    }),
    NOTICE_DEADLINE: () => ({
      icon: CalendarClock,
      tone: "warning",
      title: item.dueDate
        ? `Disdici entro ${dayWithArticle(item.dueDate)} se non vuoi rinnovarlo`
        : "Disdici se non vuoi rinnovarlo",
      detail: renewalDetail(subject, item.renewalMonths),
      href: contractHref,
    }),
    EXPIRY: () => ({
      icon: AlertTriangle,
      tone: "warning",
      title: item.dueDate ? `Scade ${dayWithArticle(item.dueDate)}` : "In scadenza",
      detail: subject,
      href: contractHref,
    }),
    RENEWAL_TO_CHECK: () => ({
      icon: RefreshCw,
      tone: "warning",
      title: "Verifica il rinnovo",
      detail: `${subject} — si rinnova tacitamente, ma mancano preavviso o durata del rinnovo`,
      href: contractHref,
    }),
    INVOICE_TO_MATCH: () => ({
      icon: FileText,
      tone: "info",
      title: item.invoiceNumber ? `Fattura ${item.invoiceNumber} da abbinare` : "Una fattura da abbinare",
      detail: [item.counterpartyName, item.invoiceAmount != null ? `${formatMoney(item.invoiceAmount)} + IVA` : null]
        .filter(Boolean)
        .join(" · "),
      href: invoicesHref,
    }),
  };
  return kinds[item.type]();
}

interface HomeAttentionListProps {
  readonly items: HomeAttentionItem[];
  readonly windowDays: number;
}

/**
 * The home page's to-do list: one row per thing to do, with what, by when,
 * and who follows it, each a link to where it gets done. Order comes from
 * the backend (a possible fraud first, then dates, then invoices to file).
 */
export function HomeAttentionList({ items, windowDays }: HomeAttentionListProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        <CheckCircle2 className="h-5 w-5 text-[var(--status-green-fg)]" aria-hidden="true" />
        Niente da fare nei prossimi {windowDays} giorni.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {items.map((item) => {
        const { icon: Icon, tone, title, detail, href } = present(item);
        const when = item.type === "INVOICE_TO_MATCH" || item.type === "IBAN_CHANGED" ? null : formatWhen(item.daysLeft);
        return (
          <li key={`${item.type}-${item.contractId}-${item.invoiceId ?? ""}`}>
            <Link
              href={href}
              className="group flex items-start gap-3 p-4 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${TONE[tone]}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-foreground">
                  {title}
                  {when && <span className="text-sm font-normal text-muted-foreground"> ({when})</span>}
                </span>
                {detail && <span className="mt-0.5 block text-sm text-muted-foreground">{detail}</span>}
                <span className="mt-1 block text-xs text-muted-foreground">
                  {item.contractNumber}
                  {item.managerName ? ` · Responsabile: ${item.managerName}` : " · Nessun responsabile"}
                </span>
              </span>
              <ChevronRight
                className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
