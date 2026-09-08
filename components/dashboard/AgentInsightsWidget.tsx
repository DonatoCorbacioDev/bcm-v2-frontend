"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useState } from "react";
import { Sparkles, Loader2, WifiOff, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAgentInsights } from "@/hooks/useAgentInsights";
import { useAskAgent } from "@/hooks/useAskAgent";
import { useCreateReminder } from "@/hooks/useCreateReminder";

export function AgentInsightsWidget() {
  const { data, isLoading, isError } = useAgentInsights();
  // Every read below happens only once isLoading/isError have already
  // gated it, so `data` is always defined by then in practice — react-query
  // just can't express that in its own return type. Falling back to {} here
  // collapses that into one always-safe access instead of an `data?.x`
  // optional chain at every read site (whose "data nullish" branch could
  // never actually be exercised).
  /* istanbul ignore next */
  const insights = data ?? { report: null, error: null };
  const [question, setQuestion] = useState("");
  const askAgent = useAskAgent();
  const createReminder = useCreateReminder();

  function handleAsk(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    createReminder.reset();
    askAgent.mutate(trimmed);
  }

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

        {!isLoading && !isError && insights.error && (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
            <WifiOff className="h-6 w-6 text-[var(--status-amber-fg)]" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{insights.error}</p>
          </div>
        )}

        {!isLoading && !isError && !insights.error && !insights.report && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Nessun suggerimento disponibile</p>
          </div>
        )}

        {!isLoading && !isError && insights.report && (
          <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
            {insights.report}
          </p>
        )}

        <form onSubmit={handleAsk} className="mt-4 flex items-center gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Chiedi qualcosa sui tuoi contratti..."
            disabled={askAgent.isPending}
            aria-label="Chiedi qualcosa sui tuoi contratti"
          />
          <Button
            type="submit"
            size="icon"
            disabled={askAgent.isPending || !question.trim()}
            aria-label="Invia domanda"
          >
            {askAgent.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </form>

        {askAgent.isSuccess && askAgent.data.error && (
          <p className="mt-3 text-sm text-muted-foreground">{askAgent.data.error}</p>
        )}
        {askAgent.isSuccess && askAgent.data.answer && (
          <p className="mt-3 text-sm text-foreground whitespace-pre-line leading-relaxed">
            {askAgent.data.answer}
          </p>
        )}
        {askAgent.isError && (
          <p className="mt-3 text-sm text-muted-foreground">
            Non è stato possibile contattare l&apos;assistente. Riprova.
          </p>
        )}

        {askAgent.isSuccess && askAgent.data.proposedAction && (
          <div className="mt-3 rounded-lg border border-border p-3 space-y-2">
            <p className="text-sm text-foreground">
              Promemoria proposto per{" "}
              <span className="font-medium">{askAgent.data.proposedAction.customerName}</span>:
              {" "}&ldquo;{askAgent.data.proposedAction.message}&rdquo;
            </p>
            {createReminder.isSuccess ? (
              <p className="text-sm text-[var(--status-green-fg)]">Promemoria creato.</p>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={createReminder.isPending}
                onClick={/* istanbul ignore next: defensive, the button only renders when proposedAction is already set */ () => {
                  const action = askAgent.data?.proposedAction;
                  if (!action) return;
                  createReminder.mutate({ contractId: action.contractId, message: action.message });
                }}
              >
                {createReminder.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  "Conferma promemoria"
                )}
              </Button>
            )}
            {createReminder.isError && (
              <p className="text-sm text-muted-foreground">
                Impossibile creare il promemoria. Riprova.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
