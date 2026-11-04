/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { AlertTriangle, CalendarClock, CheckCircle2, Info, RefreshCw, type LucideIcon } from "lucide-react";
import { EXPIRING_SOON_DAYS } from "@/lib/statusConfig";
import type { Contract } from "@/types";

type Tone = "warning" | "ok" | "info";

const TONE: Record<Tone, string> = {
  warning: "border-[var(--status-amber-fg)]/40 bg-[var(--status-amber-bg)] text-[var(--status-amber-fg)]",
  ok: "border-border bg-card text-[var(--status-green-fg)]",
  info: "border-border bg-card text-muted-foreground",
};

interface NextAction {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  detail?: string;
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

/** What the user should do about this contract now, in one sentence. Same rules as the home page list. */
export function nextAction(contract: Contract): NextAction {
  if (contract.status === "DRAFT") {
    return { icon: Info, tone: "info", title: "Bozza: non ancora attiva" };
  }
  if (contract.status === "CANCELLED") {
    return { icon: Info, tone: "info", title: "Contratto annullato" };
  }
  if (contract.status === "EXPIRED") {
    return { icon: Info, tone: "info", title: `Scaduto il ${formatDay(contract.endDate)}` };
  }

  const renewal = contract.renewalMonths
    ? `si rinnova per altri ${contract.renewalMonths} ${contract.renewalMonths === 1 ? "mese" : "mesi"}`
    : "si rinnova automaticamente";

  if (contract.autoRenew && contract.noticeDeadline && contract.daysUntilNoticeDeadline != null) {
    const days = contract.daysUntilNoticeDeadline;
    if (days >= 0 && days <= EXPIRING_SOON_DAYS) {
      return {
        icon: CalendarClock,
        tone: "warning",
        title: `Disdici entro il ${formatDay(contract.noticeDeadline)} (${inDays(days)}) se non vuoi rinnovarlo`,
        detail: `Dopo questa data ${renewal}.`,
      };
    }
    if (days < 0) {
      return {
        icon: RefreshCw,
        tone: "info",
        title: `Termine di disdetta passato: il ${formatDay(contract.endDate)} ${renewal}`,
      };
    }
    return {
      icon: CheckCircle2,
      tone: "ok",
      title: `Nessuna azione nei prossimi ${EXPIRING_SOON_DAYS} giorni`,
      detail: `Ultimo giorno per disdire: ${formatDay(contract.noticeDeadline)}.`,
    };
  }

  if (contract.autoRenew) {
    return {
      icon: RefreshCw,
      tone: "warning",
      title: "Verifica il rinnovo",
      detail: "Si rinnova tacitamente, ma mancano preavviso o durata del rinnovo: completa i dati del contratto.",
    };
  }

  const days = contract.daysUntilExpiry;
  if (days != null && days >= 0 && days <= EXPIRING_SOON_DAYS) {
    return { icon: AlertTriangle, tone: "warning", title: `Scade il ${formatDay(contract.endDate)} (${inDays(days)})` };
  }
  return {
    icon: CheckCircle2,
    tone: "ok",
    title: `Nessuna scadenza nei prossimi ${EXPIRING_SOON_DAYS} giorni`,
    detail: `Scade il ${formatDay(contract.endDate)}.`,
  };
}

interface NextActionCardProps {
  readonly contract: Contract;
}

/** The first thing on a contract's page: what to do now, before all its data. */
export function NextActionCard({ contract }: NextActionCardProps) {
  const { icon: Icon, tone, title, detail } = nextAction(contract);
  return (
    <section aria-label="Prossima azione" className={`flex items-start gap-3 rounded-lg border p-4 ${TONE[tone]}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">{title}</p>
        {detail && <p className="mt-0.5 text-sm text-foreground">{detail}</p>}
      </div>
    </section>
  );
}
