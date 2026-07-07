"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert, WifiOff, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRiskScores } from "@/hooks/useRiskScores";
import { useRiskFeedback, useSubmitRiskFeedback } from "@/hooks/useRiskFeedback";
import type { RiskScore } from "@/types";

const VISIBLE_COUNT = 5;

const LEVEL_CONFIG = {
  HIGH:   { color: "bg-red-500",    badge: "destructive" as const, label: "Alto" },
  MEDIUM: { color: "bg-yellow-400", badge: "warning" as const,     label: "Medio" },
  LOW:    { color: "bg-green-500",  badge: "success" as const,     label: "Basso" },
};

const ANOMALY_LABELS: Record<string, string> = {
  EXPIRED: "Scaduto",
  EXPIRING_SOON: "In scadenza",
  UNUSUAL_VALUE: "Valore anomalo",
  NO_END_DATE: "Senza data di fine",
};

function anomalyLabel(code: string): string {
  return ANOMALY_LABELS[code] ?? code.replaceAll("_", " ");
}

export function RiskScoreWidget() {
  const { data: riskScores, isLoading, isError } = useRiskScores();
  const { data: feedbackList } = useRiskFeedback();
  const submitFeedback = useSubmitRiskFeedback();
  const [showAll, setShowAll] = useState(false);
  const visibleScores = showAll ? riskScores : riskScores?.slice(0, VISIBLE_COUNT);
  const hasMlScores = riskScores?.some((s) => s.mlLevel != null) ?? false;

  const feedbackByContract = new Map(feedbackList?.map((f) => [f.contractId, f]));

  function handleFeedback(item: RiskScore, agree: boolean) {
    submitFeedback.mutate({
      contractId: item.contractId,
      riskScore: item.riskScore,
      level: item.level,
      mlScore: item.mlScore,
      mlLevel: item.mlLevel,
      agree,
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Rischi e anomalie
            </CardTitle>
            <CardDescription>
              Punteggio euristico (scadenza + valore anomalo) — non validato su esiti reali
            </CardDescription>
          </div>
          {riskScores && riskScores.length > 0 && (
            <Badge variant={hasMlScores ? "secondary" : "outline"}>
              {hasMlScores ? "ML attivo" : "Solo regole euristiche"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <WifiOff className="h-6 w-6 text-amber-500" />
            <p className="text-sm font-medium text-foreground">
              Analisi del rischio non disponibile
            </p>
            <p className="text-xs text-muted-foreground">
              Verifica che il backend e il servizio di previsione siano attivi
            </p>
          </div>
        )}

        {!isLoading && !isError && (!riskScores || riskScores.length === 0) && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Nessun dato sul rischio disponibile</p>
          </div>
        )}

        {!isLoading && !isError && riskScores && riskScores.length > 0 && (
          <div className="space-y-3">
            {visibleScores?.map((item) => {
              const cfg = LEVEL_CONFIG[item.level] ?? LEVEL_CONFIG.LOW;
              const pct = Math.round(item.riskScore * 100);
              const feedback = feedbackByContract.get(item.contractId);

              return (
                <div
                  key={item.contractId}
                  className="rounded-lg border border-border p-3 hover:border-muted-foreground transition-colors"
                >
                  <Link href={`/contracts/${item.contractId}`} className="block">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground truncate max-w-[60%]">
                        {item.customerName}
                      </span>
                      <Badge variant={cfg.badge}>{cfg.label} · {pct}%</Badge>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${cfg.color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>

                  {/* ML feedback loop: builds a labeled dataset from human-confirmed outcomes */}
                  {feedback ? (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      {feedback.agree ? (
                        <>
                          <ThumbsUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          <span>Confermato corretto</span>
                        </>
                      ) : (
                        <>
                          <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                          <span>Segnalato come errato</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Il punteggio è corretto?</span>
                      <button
                        type="button"
                        aria-label="Punteggio corretto"
                        disabled={submitFeedback.isPending}
                        onClick={() => handleFeedback(item, true)}
                        className="rounded p-1 hover:bg-muted hover:text-green-600 dark:hover:text-green-400 disabled:opacity-50"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Punteggio errato"
                        disabled={submitFeedback.isPending}
                        onClick={() => handleFeedback(item, false)}
                        className="rounded p-1 hover:bg-muted hover:text-red-500 disabled:opacity-50"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Anomalies */}
                  {item.anomalies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.anomalies.map((a) => (
                        <span
                          key={a}
                          className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5"
                        >
                          {anomalyLabel(a)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {riskScores.length > VISIBLE_COUNT && (
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="w-full text-center text-sm font-medium text-primary hover:underline"
              >
                {showAll ? "Mostra meno" : `Mostra tutti (${riskScores.length})`}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
