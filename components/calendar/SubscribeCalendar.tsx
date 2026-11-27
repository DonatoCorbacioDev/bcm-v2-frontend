"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, Mail, RefreshCw, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { calendarFeedService } from "@/services/calendarFeed.service";
import { appleSubscribeUrl, googleSubscribeUrl, outlookSubscribeUrl } from "@/lib/calendarLinks";
import { markCalendarConnected, useCalendarConnected } from "@/components/dashboard/FirstSteps";
import { useAuthStore } from "@/store/authStore";

/**
 * Google Calendar's mark, from Simple Icons (CC0), in its own blue: it names
 * the service the button opens. Microsoft asked Simple Icons to remove its
 * logos, so Outlook gets a plain mail icon in Microsoft's blue; Apple gets
 * its Calendar app's colours, not the Apple logo.
 */
function GoogleCalendarMark({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="#4285F4">
      <path d="M18.316 5.684H24v12.632h-5.684V5.684zM5.684 24h12.632v-5.684H5.684V24zM18.316 5.684V0H1.895A1.894 1.894 0 0 0 0 1.895v16.421h5.684V5.684h12.632zm-7.207 6.25v-.065c.272-.144.5-.349.687-.617s.279-.595.279-.982c0-.379-.099-.72-.3-1.025a2.05 2.05 0 0 0-.832-.714 2.703 2.703 0 0 0-1.197-.257c-.6 0-1.094.156-1.481.467-.386.311-.65.671-.793 1.078l1.085.452c.086-.249.224-.461.413-.633.189-.172.445-.257.767-.257.33 0 .602.088.816.264a.86.86 0 0 1 .322.703c0 .33-.12.589-.36.778-.24.19-.535.284-.886.284h-.567v1.085h.633c.407 0 .748.109 1.02.327.272.218.407.499.407.843 0 .336-.129.614-.387.832s-.565.327-.924.327c-.351 0-.651-.103-.897-.311-.248-.208-.422-.502-.521-.881l-1.096.452c.178.616.505 1.082.977 1.401.472.319.984.478 1.538.477a2.84 2.84 0 0 0 1.293-.291c.382-.193.684-.458.902-.794.218-.336.327-.72.327-1.149 0-.429-.115-.797-.344-1.105a2.067 2.067 0 0 0-.881-.689zm2.093-1.931l.602.913L15 10.045v5.744h1.187V8.446h-.827l-2.158 1.557zM22.105 0h-3.289v5.184H24V1.895A1.894 1.894 0 0 0 22.105 0zm-3.289 23.5l4.684-4.684h-4.684V23.5zM0 22.105C0 23.152.848 24 1.895 24h3.289v-5.184H0v3.289z" />
    </svg>
  );
}

function IconTile({ icon: Icon, color }: { readonly icon: LucideIcon; readonly color: string }) {
  return <Icon className="h-6 w-6" style={{ color }} aria-hidden="true" />;
}

/**
 * Subscribes the user's own calendar to BCM's feed: the calendar app fetches
 * it again by itself, so every new contract and every changed date shows up
 * without doing anything. The link is personal, so the text says so, and it
 * can be regenerated here (its only place in the app) if it leaked.
 */
export function SubscribeCalendar() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => (state.user?.id != null ? String(state.user.id) : ""));
  const connected = useCalendarConnected(userId);
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

  // The one each person recognises, and a line to tell the two Outlooks apart.
  const links = feedUrl
    ? [
        { label: "Google Calendar", hint: "Se usi Gmail", href: googleSubscribeUrl(feedUrl), mark: <GoogleCalendarMark className="h-6 w-6" /> },
        { label: "Outlook aziendale", hint: "Microsoft 365, l'email di lavoro", href: outlookSubscribeUrl(feedUrl, true), mark: <IconTile icon={Mail} color="#0078D4" /> },
        { label: "Outlook personale", hint: "Outlook.com, Hotmail, Live", href: outlookSubscribeUrl(feedUrl), mark: <IconTile icon={Mail} color="#0078D4" /> },
        { label: "Calendario Apple", hint: "iPhone, iPad e Mac", href: appleSubscribeUrl(feedUrl), mark: <IconTile icon={CalendarDays} color="#FF3B30" /> },
      ]
    : [];

  return (
    <section aria-labelledby="subscribe-title" className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 id="subscribe-title" className="text-base font-semibold text-foreground">Le scadenze nel tuo calendario</h2>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Un clic e le scadenze e gli ultimi giorni per disdire compaiono nel calendario che usi già, e si aggiornano da sole.
        Il link è personale: chi lo ha vede le scadenze dei tuoi contratti, quindi non condividerlo.
      </p>
      {isLoading && <p className="mt-4 text-sm text-muted-foreground">Preparazione del link…</p>}
      {isError && <p className="mt-4 text-sm text-[var(--status-red-fg)]">Link del calendario non disponibile: riprova più tardi.</p>}
      {connected && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-md bg-[var(--status-green-bg)] px-3 py-1.5 text-sm text-[var(--status-green-fg)]">
          <Check className="h-4 w-4" aria-hidden="true" />
          Collegato: le scadenze arrivano nel tuo calendario
        </p>
      )}
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {links.map(({ label, hint, href, mark }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => userId && markCalendarConnected(userId)}
              className="flex h-full items-center gap-3 rounded-lg border border-border bg-background p-3 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-card ring-1 ring-border">{mark}</span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      {feedUrl && (
        <p className="mt-3 text-sm text-muted-foreground">
          Usi un altro calendario?{" "}
          <button type="button" onClick={copy} className="font-medium text-primary underline-offset-4 hover:underline">
            Copia il link
          </button>{" "}
          e aggiungilo come &quot;calendario da URL&quot;.
        </p>
      )}
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
