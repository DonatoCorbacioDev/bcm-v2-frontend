"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { calendarFeedService } from "@/services/calendarFeed.service";
import { appleSubscribeUrl, googleSubscribeUrl, outlookSubscribeUrl } from "@/lib/calendarLinks";

/**
 * Subscribes the user's own calendar to BCM's feed: the calendar app fetches
 * it again by itself, so every new contract and every changed date shows up
 * without doing anything. The link is personal, so the text says so, and it
 * can be regenerated here (its only place in the app) if it leaked.
 */
export function SubscribeCalendar() {
  const queryClient = useQueryClient();
  const { data: feedUrl, isLoading, isError } = useQuery({
    queryKey: ["calendar-feed-url"],
    queryFn: calendarFeedService.getUrl,
  });
  const regenerate = useMutation({
    mutationFn: calendarFeedService.regenerate,
    onSuccess: (url) => {
      queryClient.setQueryData(["calendar-feed-url"], url);
      toast.success("Link del calendario rigenerato: quello precedente non funziona più");
    },
    onError: () => toast.error("Rigenerazione del link non riuscita"),
  });

  const copy = async () => {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      toast.success("Link del calendario copiato");
    } catch {
      toast.error("Copia negli appunti non riuscita");
    }
  };

  const links = feedUrl
    ? [
        { label: "Google Calendar", href: googleSubscribeUrl(feedUrl) },
        { label: "Outlook.com", href: outlookSubscribeUrl(feedUrl) },
        { label: "Outlook (Microsoft 365)", href: outlookSubscribeUrl(feedUrl, true) },
        { label: "Apple Calendar", href: appleSubscribeUrl(feedUrl) },
      ]
    : [];

  return (
    <section aria-labelledby="subscribe-title" className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 id="subscribe-title" className="text-base font-semibold text-foreground">Le scadenze nel tuo calendario</h2>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Un clic e le scadenze e gli ultimi giorni per disdire compaiono nel calendario che usi già, e si aggiornano da sole.
        Il link è personale: chi lo ha vede le scadenze dei tuoi contratti, quindi non condividerlo.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {isLoading && <p className="text-sm text-muted-foreground">Preparazione del link…</p>}
        {isError && <p className="text-sm text-[var(--status-red-fg)]">Link del calendario non disponibile: riprova più tardi.</p>}
        {links.map(({ label, href }) => (
          <Button key={label} asChild variant="outline" size="sm">
            <a href={href} target="_blank" rel="noopener noreferrer">{label}</a>
          </Button>
        ))}
        {feedUrl && (
          <Button type="button" variant="ghost" size="sm" onClick={copy}>
            Copia il link
          </Button>
        )}
      </div>
      {feedUrl && (
        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-xs text-muted-foreground">
            Pensi che sia stato condiviso per errore? Rigeneralo: quello vecchio smette di funzionare e va aggiunto di nuovo
            al calendario. Cambia da solo anche quando cambi la password o la verifica in 2 passaggi.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => regenerate.mutate()} disabled={regenerate.isPending}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {regenerate.isPending ? "Rigenerazione..." : "Rigenera link"}
          </Button>
        </div>
      )}
    </section>
  );
}
