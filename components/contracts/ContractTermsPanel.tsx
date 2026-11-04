"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Contract, ContractTerm, ContractTerms } from "@/types";

const FIELD_LABELS: Record<ContractTerm["field"], string> = {
  AUTO_RENEW: "Rinnovo tacito",
  NOTICE_DAYS: "Preavviso per la disdetta",
  RENEWAL_MONTHS: "Durata del rinnovo",
  START_DATE: "Data inizio",
  END_DATE: "Data fine",
};

function formatValue(term: ContractTerm): string {
  switch (term.field) {
    case "AUTO_RENEW":
      return term.value === "true" ? "Sì" : "No";
    case "NOTICE_DAYS":
      // Months are shown as written, with the days BCM would use.
      return term.asWritten.endsWith("giorni") ? term.asWritten : `${term.asWritten} (circa ${term.value} giorni)`;
    case "RENEWAL_MONTHS":
      return `${term.value} ${term.value === "1" ? "mese" : "mesi"}`;
    default: {
      const [y, m, d] = term.value.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    }
  }
}

/** The contract fields the terms fill, for "Usa questi valori" (opens the edit form, never saves). */
export function termsToContract(terms: ContractTerm[]): Partial<Contract> {
  const detected: Partial<Contract> = {};
  for (const term of terms) {
    if (term.field === "AUTO_RENEW") detected.autoRenew = term.value === "true";
    if (term.field === "NOTICE_DAYS") detected.noticeDays = Number(term.value);
    if (term.field === "RENEWAL_MONTHS") detected.renewalMonths = Number(term.value);
    if (term.field === "START_DATE") detected.startDate = term.value;
    if (term.field === "END_DATE") detected.endDate = term.value;
  }
  return detected;
}

interface ContractTermsPanelProps {
  readonly result: ContractTerms;
  readonly isAdmin: boolean;
  readonly onApply: (detected: Partial<Contract>) => void;
}

export default function ContractTermsPanel({ result, isAdmin, onApply }: ContractTermsPanelProps) {
  return (
    <div className="border-t border-border p-4 bg-primary/5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Rinnovo e scadenze nel documento
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Letti con regole fisse dal testo, senza intelligenza artificiale. Controlla sempre la frase di origine.
          </p>
        </div>
        {isAdmin && result.terms.length > 0 && (
          <Button size="sm" onClick={() => onApply(termsToContract(result.terms))}>
            Usa questi valori
          </Button>
        )}
      </div>

      {result.terms.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nel testo non ci sono indicazioni chiare su rinnovo, preavviso o date: meglio nessun valore che uno sbagliato.
        </p>
      ) : (
        <ul className="space-y-3">
          {result.terms.map((term) => (
            <li key={term.field} className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs font-medium text-muted-foreground">{FIELD_LABELS[term.field]}</p>
              <p className="text-sm font-semibold text-foreground">{formatValue(term)}</p>
              <blockquote className="mt-1.5 border-l-2 border-primary/40 pl-2 text-xs italic text-muted-foreground">
                &ldquo;{term.sentence}&rdquo;
              </blockquote>
            </li>
          ))}
        </ul>
      )}

      {!isAdmin && result.terms.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Solo un amministratore può riportare questi valori nel contratto.
        </p>
      )}
    </div>
  );
}
