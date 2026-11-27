/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import { DoorOpen, Download, MapPin, ShieldCheck } from "lucide-react";

// The answer to the first doubt of a small company ("built by one person:
// what if it closes?"). Every line restates what the Terms already promise
// (sections 12 and 13) or what the privacy notice states (section 4): change
// them together, never here alone.
const PROMISES = [
  {
    icon: MapPin,
    title: "Restano in Italia",
    text: "Su server Oracle Cloud a Milano. Ogni azienda ha il suo spazio separato e nessun altro cliente può vedere i tuoi contratti.",
  },
  {
    icon: Download,
    title: "Li esporti quando vuoi",
    text: "Dalla pagina dell'organizzazione scarichi un archivio con tutti i contratti, le fatture e i documenti che hai caricato.",
  },
  {
    icon: DoorOpen,
    title: "Se BCM chiude, non li perdi",
    text: "Ricevi un preavviso di 30 giorni via email, il rimborso della parte già pagata e non goduta, e almeno 30 giorni per esportare tutto.",
  },
  {
    icon: ShieldCheck,
    title: "Nessuna AI esterna sui documenti",
    text: "Restano sui server di BCM: non vengono mandati a servizi di intelligenza artificiale di altre aziende.",
  },
];

export function TrustSection() {
  return (
    <section id="dati" className="scroll-mt-16 border-t border-border bg-muted/40 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4">
            <h2 className="font-display text-balance text-4xl font-medium tracking-[-0.01em] text-foreground md:text-5xl">
              I tuoi dati restano tuoi
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Sono impegni scritti nei{" "}
              <Link href="/termini" className="font-medium text-primary underline-offset-4 hover:underline">
                Termini di servizio
              </Link>{" "}
              e nell&apos;
              <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
                Informativa privacy
              </Link>
              , non solo promesse di questa pagina.
            </p>
          </div>

          <ul className="grid gap-x-10 sm:grid-cols-2 md:col-span-8">
            {PROMISES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4 border-t border-border py-6">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
