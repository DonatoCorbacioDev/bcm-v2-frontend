"use client";

import Link from "next/link";
import { AlertOctagon, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRiskScores } from "@/hooks/useRiskScores";
import type { Contract } from "@/types";

export const CRITICAL_RENEWAL_DAYS = 7;

interface RecommendedActionsProps {
  readonly criticalRenewals: Contract[];
}

/**
 * Surfaces the handful of things on the dashboard that actually need a
 * decision today: contracts about to expire and contracts the risk model
 * flagged as high risk. Both lists are capped at 3 with a "+N more" note —
 * this is a triage prompt, not a replacement for the full contracts table.
 */
export function RecommendedActions({ criticalRenewals }: RecommendedActionsProps) {
  const { data: riskScores, isError: isRiskError } = useRiskScores();
  const highRisk = (riskScores ?? []).filter((r) => r.level === "HIGH");
  const hasActions = criticalRenewals.length > 0 || highRisk.length > 0;

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center gap-2 mb-1">
        <AlertOctagon className="h-5 w-5 text-destructive" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-foreground">Azioni consigliate</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Cosa richiede attenzione oggi</p>

      {!hasActions && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" />
          Nessuna azione urgente al momento
        </div>
      )}

      {criticalRenewals.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Rinnovi critici (entro {CRITICAL_RENEWAL_DAYS} giorni)
          </h3>
          <ul className="space-y-2">
            {criticalRenewals.slice(0, 3).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/contracts/${c.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 hover:border-destructive/60 transition-colors"
                >
                  <span className="text-sm text-foreground truncate">
                    <span className="font-medium">{c.contractNumber}</span> - {c.customerName}
                  </span>
                  <Badge variant="destructive" className="whitespace-nowrap">Rinnova ora</Badge>
                </Link>
              </li>
            ))}
          </ul>
          {criticalRenewals.length > 3 && (
            <p className="text-xs text-muted-foreground mt-1">
              + altri {criticalRenewals.length - 3} rinnovi critici
            </p>
          )}
        </div>
      )}

      {highRisk.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Contratti ad alto rischio da rivedere
          </h3>
          <ul className="space-y-2">
            {highRisk.slice(0, 3).map((r) => (
              <li key={r.contractId}>
                <Link
                  href={`/contracts/${r.contractId}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 hover:border-muted-foreground transition-colors"
                >
                  <span className="text-sm text-foreground truncate">{r.customerName}</span>
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    Rivedi contratto
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {highRisk.length > 3 && (
            <p className="text-xs text-muted-foreground mt-1">
              + altri {highRisk.length - 3} contratti ad alto rischio
            </p>
          )}
        </div>
      )}

      {isRiskError && (
        <p className="text-xs text-muted-foreground mt-2">
          Analisi del rischio non disponibile al momento.
        </p>
      )}
    </div>
  );
}
