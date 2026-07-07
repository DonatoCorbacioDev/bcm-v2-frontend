"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertOctagon, CheckCircle2, Loader2, WifiOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnomalies } from "@/hooks/useAnomalies";

const VISIBLE_COUNT = 5;
const MONTHS_IT = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

const SEVERITY_CONFIG = {
  HIGH:   { badge: "destructive" as const, label: "Alta" },
  MEDIUM: { badge: "warning" as const,     label: "Media" },
  LOW:    { badge: "secondary" as const,   label: "Bassa" },
};

function formatAmount(n: number): string {
  return n.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export function AnomalyWidget() {
  const { data: anomalies, isLoading, isError } = useAnomalies();
  const [showAll, setShowAll] = useState(false);
  const visibleAnomalies = showAll ? anomalies : anomalies?.slice(0, VISIBLE_COUNT);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertOctagon className="h-5 w-5 text-red-500" aria-hidden="true" />
          Anomalie finanziarie
        </CardTitle>
        <CardDescription>
          Importi insoliti rilevati da Isolation Forest — soglia 10%, segnalazione
          statistica non verificata come errore o frode reale
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <WifiOff className="h-6 w-6 text-amber-500" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">
              Rilevamento anomalie non disponibile
            </p>
            <p className="text-xs text-muted-foreground">
              Verifica che il servizio ML sia attivo
            </p>
          </div>
        )}

        {!isLoading && !isError && (!anomalies || anomalies.length === 0) && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Nessuna anomalia finanziaria rilevata</p>
          </div>
        )}

        {!isLoading && !isError && anomalies && anomalies.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left pb-2 font-medium">Cliente</th>
                  <th className="text-left pb-2 font-medium">Periodo</th>
                  <th className="text-right pb-2 font-medium">Importo</th>
                  <th className="text-right pb-2 font-medium">Gravità</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleAnomalies?.map((item) => {
                  const cfg = SEVERITY_CONFIG[item.severity] ?? SEVERITY_CONFIG.LOW;
                  const monthLabel = MONTHS_IT[(item.month - 1) % 12];
                  return (
                    <tr key={item.financialValueId}>
                      <td className="py-2.5 pr-3">
                        <Link
                          href={`/contracts/${item.contractId}`}
                          className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-[160px] block"
                        >
                          {item.customerName}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">
                        {monthLabel} {item.year}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono font-medium whitespace-nowrap">
                        {formatAmount(item.financialAmount)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Badge variant={cfg.badge}>{cfg.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {anomalies.length > VISIBLE_COUNT && (
              <button
                type="button"
                onClick={() => setShowAll((prev) => !prev)}
                className="mt-3 w-full text-center text-sm font-medium text-primary hover:underline"
              >
                {showAll ? "Mostra meno" : `Mostra tutti (${anomalies.length})`}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
