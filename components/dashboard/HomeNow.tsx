/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, FileText, Landmark, RefreshCw, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/formatMoney";
import { dayWithArticle } from "@/lib/italianDate";
import type { HomeAttentionItem } from "@/types";

/** A notice deadline this close is "now"; further ones wait on the timeline. */
export const NOTICE_NOW_DAYS = 14;
const EXPIRY_NOW_DAYS = 7;

/** What asks for an action now: a changed IBAN, a renewal to complete, a deadline close by. */
export function isNow(item: HomeAttentionItem): boolean {
  switch (item.type) {
    case "IBAN_CHANGED":
    case "RENEWAL_TO_CHECK":
      return true;
    case "NOTICE_DEADLINE":
      return item.daysLeft != null && item.daysLeft <= NOTICE_NOW_DAYS;
    case "EXPIRY":
      return item.daysLeft != null && item.daysLeft <= EXPIRY_NOW_DAYS;
    default:
      return false;
  }
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The Home in one sentence: "Hai 1 IBAN da verificare, 2 contratti da disdire entro 14 giorni e 2 fatture da abbinare." */
export function summarySentence(items: readonly HomeAttentionItem[], windowDays: number): string {
  const iban = items.filter((i) => i.type === "IBAN_CHANGED").length;
  const notice = items.filter((i) => i.type === "NOTICE_DEADLINE" && isNow(i)).length;
  const expiry = items.filter((i) => i.type === "EXPIRY" && isNow(i)).length;
  const renewal = items.filter((i) => i.type === "RENEWAL_TO_CHECK").length;
  const invoices = items.filter((i) => i.type === "INVOICE_TO_MATCH").length;
  const parts = [
    iban && plural(iban, "IBAN da verificare", "IBAN da verificare"),
    notice && plural(notice, `contratto da disdire entro ${NOTICE_NOW_DAYS} giorni`, `contratti da disdire entro ${NOTICE_NOW_DAYS} giorni`),
    expiry && plural(expiry, "contratto che scade questa settimana", "contratti che scadono questa settimana"),
    renewal && plural(renewal, "rinnovo da completare", "rinnovi da completare"),
    invoices && plural(invoices, "fattura da abbinare", "fatture da abbinare"),
  ].filter(Boolean) as string[];
  if (parts.length === 0) {
    const later = items.length;
    return later === 0
      ? `Niente da fare nei prossimi ${windowDays} giorni.`
      : `Niente di urgente: ${plural(later, "scadenza", "scadenze")} nei prossimi ${windowDays} giorni, tutte sulla linea qui sotto.`;
  }
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} e ${parts.at(-1)}`;
  return `Hai ${list}.`;
}

interface Row {
  icon: LucideIcon;
  tone: string;
  title: string;
  detail: string;
  action: string;
  href: string;
}

const RED = "text-[var(--status-red-fg)] bg-[var(--status-red-bg)]";
const AMBER = "text-[var(--status-amber-fg)] bg-[var(--status-amber-bg)]";

function rowOf(item: HomeAttentionItem): Row {
  const subject = [item.projectName, item.counterpartyName].filter(Boolean).join(" · ");
  const contract = `/contracts/${item.contractId}`;
  const when = item.daysLeft === 0 ? "oggi" : item.daysLeft === 1 ? "domani" : `tra ${item.daysLeft} giorni`;
  switch (item.type) {
    case "IBAN_CHANGED":
      return {
        icon: Landmark,
        tone: RED,
        title: `IBAN cambiato: ${item.counterpartyName ?? "un fornitore"}`,
        detail: `${item.invoiceNumber ? `La fattura ${item.invoiceNumber}` : "Una fattura"} chiede un conto diverso da quello verificato: non pagarla prima di verificare`,
        action: "Verifica",
        href: `${contract}?tab=invoices`,
      };
    case "NOTICE_DEADLINE":
      return {
        icon: CalendarClock,
        tone: AMBER,
        title: `Disdici entro ${item.dueDate ? dayWithArticle(item.dueDate) : ""} (${when})`,
        detail: `${subject}${item.renewalMonths ? ` · se non disdici si rinnova per ${item.renewalMonths === 1 ? "un altro mese" : `altri ${item.renewalMonths} mesi`}` : ""}`,
        action: "Prepara la disdetta",
        href: contract,
      };
    case "EXPIRY":
      return { icon: AlertTriangle, tone: AMBER, title: `Scade ${item.dueDate ? dayWithArticle(item.dueDate) : ""} (${when})`, detail: subject, action: "Apri", href: contract };
    default:
      return {
        icon: RefreshCw,
        tone: AMBER,
        title: "Completa il rinnovo",
        detail: `${subject} · si rinnova da solo, ma mancano preavviso o durata`,
        action: "Completa i dati",
        href: contract,
      };
  }
}

/**
 * "Da fare adesso": only what asks for an action now, most urgent first (the
 * backend's order: a possible fraud, then dates), each with its own button.
 * Deadlines further away are on the timeline, never listed twice.
 */
export function HomeNow({ items }: { readonly items: readonly HomeAttentionItem[] }) {
  const now = items.filter(isNow);
  if (now.length === 0) {
    return (
      <section aria-labelledby="home-now" className="flex items-center gap-3 rounded-xl border border-border bg-card p-5">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--status-green-fg)]" aria-hidden="true" />
        <h2 id="home-now" className="text-base font-medium text-foreground">Niente da fare adesso</h2>
      </section>
    );
  }
  return (
    <section aria-labelledby="home-now" className="rounded-xl border border-border bg-card">
      <h2 id="home-now" className="px-5 pt-4 text-base font-semibold text-foreground">Da fare adesso</h2>
      <ul className="mt-2 divide-y divide-border">
        {now.map((item) => {
          const row = rowOf(item);
          return (
            <li key={`${item.type}-${item.contractId}-${item.invoiceId ?? ""}`} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${row.tone}`}>
                <row.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{row.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{row.detail}</p>
              </div>
              <Button asChild size="sm" variant={item.type === "IBAN_CHANGED" ? "default" : "outline"} className="shrink-0 self-start sm:self-center">
                <Link href={row.href}>{row.action}</Link>
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The invoices waiting to be matched, compact, each with its button. */
export function HomeInvoices({ items }: { readonly items: readonly HomeAttentionItem[] }) {
  const invoices = items.filter((i) => i.type === "INVOICE_TO_MATCH");
  return (
    <section aria-labelledby="home-invoices" className="rounded-xl border border-border bg-card p-5">
      <h2 id="home-invoices" className="flex items-center gap-2 text-base font-semibold text-foreground">
        Fatture da abbinare
        {invoices.length > 0 && <span className="rounded-full bg-primary/10 px-2 text-sm text-primary tabular-nums">{invoices.length}</span>}
      </h2>
      {invoices.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-[var(--status-green-fg)]" aria-hidden="true" />
          Tutte le fatture sono abbinate al loro contratto.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {invoices.map((i) => (
            <li key={`${i.contractId}-${i.invoiceId}`} className="flex items-center gap-3 py-2.5">
              <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{i.invoiceNumber ?? "Fattura"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[i.counterpartyName, i.invoiceAmount != null ? `${formatMoney(i.invoiceAmount)} + IVA` : null].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Button asChild size="sm" variant="outline" className="shrink-0">
                <Link href={`/contracts/${i.contractId}?tab=invoices`}>Abbina</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
