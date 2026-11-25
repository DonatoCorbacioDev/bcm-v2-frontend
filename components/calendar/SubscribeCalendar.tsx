"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { calendarFeedService } from "@/services/calendarFeed.service";
import { appleSubscribeUrl, googleSubscribeUrl, outlookSubscribeUrl } from "@/lib/calendarLinks";

/**
 * Subscribes the user's own calendar to BCM's feed (the Profile's link): the
 * calendar app fetches it again by itself, so every new contract and every
 * changed date shows up without doing anything. The link is personal, so
 * the text says so and points to the Profile, where it can be regenerated.
 */
export function SubscribeCalendar() {
  const { data: feedUrl, isLoading, isError } = useQuery({
    queryKey: ["calendar-feed-url"],
    queryFn: calendarFeedService.getUrl,
  });

  const copy = async () => {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      toast.success("Link del calendario copiato");
    } catch {
      toast.error("Copia non riuscita: apri il Profilo e copialo da lì");
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
        Il link è personale: non condividerlo. Se serve, lo rigeneri dal{" "}
        <Link href="/profile" className="font-medium text-primary underline-offset-4 hover:underline">Profilo</Link>.
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
    </section>
  );
}
