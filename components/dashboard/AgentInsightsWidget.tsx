"use client";

import { Sparkles, Loader2, WifiOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgentInsights } from "@/hooks/useAgentInsights";

export function AgentInsightsWidget() {
  const { data, isLoading, isError } = useAgentInsights();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[var(--chart-1)]" aria-hidden="true" />
          Suggerimenti AI
        </CardTitle>
        <CardDescription>
          Sintesi generata da rischio contrattuale e previsione finanziaria
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
            <WifiOff className="h-6 w-6 text-[var(--status-amber-fg)]" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">
              Suggerimenti AI non disponibili
            </p>
            <p className="text-xs text-muted-foreground">
              Verifica che il backend e il servizio ML siano attivi
            </p>
          </div>
        )}

        {!isLoading && !isError && data?.error && (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <WifiOff className="h-6 w-6 text-[var(--status-amber-fg)]" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{data.error}</p>
          </div>
        )}

        {!isLoading && !isError && !data?.error && !data?.report && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Nessun suggerimento disponibile</p>
          </div>
        )}

        {!isLoading && !isError && data?.report && (
          <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
            {data.report}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
