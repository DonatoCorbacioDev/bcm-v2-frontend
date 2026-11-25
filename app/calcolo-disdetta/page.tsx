/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { displayFont } from "@/components/landing/fonts";
import { NoticeCalculator } from "@/components/notice-calculator/NoticeCalculator";

const TITLE = "Calcolo della disdetta di un contratto | BCM";
const DESCRIPTION =
  "Calcola gratis l'ultimo giorno per disdire un contratto con rinnovo tacito: inserisci scadenza e preavviso, in giorni o in mesi. Il calcolo avviene nel browser.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/calcolo-disdetta" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/calcolo-disdetta", type: "website", siteName: "BCM", locale: "it_IT" },
};

export default function CalcoloDisdettaPage() {
  return (
    <div className={`${displayFont.variable} flex min-h-screen flex-col bg-background text-foreground`}>
      <LandingNav />
      <main className="flex-1">
        <section className="pb-16 pt-12 md:pb-20 md:pt-16">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <div className="max-w-3xl">
              <h1 className="font-display text-balance text-[2.4rem] font-medium leading-[1.06] tracking-[-0.015em] sm:text-5xl">
                Calcolo dell&apos;ultimo giorno per disdire un contratto
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                Per i contratti con rinnovo tacito: inserisci la scadenza e il preavviso scritti nel contratto, in giorni o
                in mesi. Se il termine è già passato e conosci la durata del rinnovo, ti dice il prossimo.
              </p>
            </div>
            <div className="mt-10 rounded-xl border border-border bg-card p-6 md:p-8">
              <NoticeCalculator idPrefix="page" />
            </div>
          </div>
        </section>

        <section className="border-t border-border py-16 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2 md:px-8">
            <div>
              <h2 className="font-display text-3xl font-medium tracking-[-0.01em]">Come si calcola</h2>
              <ul className="mt-5 space-y-3 leading-relaxed text-muted-foreground">
                <li>L&apos;ultimo giorno è la data di scadenza meno il preavviso scritto nel contratto.</li>
                <li>
                  Un preavviso in mesi si conta in mesi del calendario: tre mesi prima del 15 marzo è il 15 dicembre, non
                  90 giorni prima. Se quel giorno non esiste, vale l&apos;ultimo giorno del mese.
                </li>
                <li>Se il contratto si rinnova da solo, ogni rinnovo sposta in avanti la scadenza e quindi il termine.</li>
              </ul>
            </div>
            <div>
              <h2 className="font-display text-3xl font-medium tracking-[-0.01em]">Come inviare la disdetta</h2>
              <ul className="mt-5 space-y-3 leading-relaxed text-muted-foreground">
                <li>
                  La disdetta vale quando arriva al fornitore: conta il giorno in cui la riceve, non quello in cui la spedisci.
                </li>
                <li>
                  Usa un mezzo che lasci una prova della data, come la PEC o la raccomandata con ricevuta di ritorno, e
                  segui le modalità indicate nel contratto.
                </li>
                <li>Tieni qualche giorno di margine, soprattutto se il termine cade di sabato o domenica.</li>
              </ul>
            </div>
          </div>
          <p className="mx-auto mt-12 max-w-6xl px-4 text-sm text-muted-foreground md:px-8">
            Il calcolo segue il termine scritto nel contratto e non sostituisce una consulenza legale.
          </p>
        </section>
      </main>
      <LandingFooter headingLevel="h3" />
    </div>
  );
}
