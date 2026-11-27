/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { HowItsBuiltFacts } from "@/components/landing/HowItsBuilt";
import { displayFont } from "@/components/landing/fonts";

const TITLE = "Come è fatto BCM | BCM";
const DESCRIPTION =
  "Le tecnologie, i controlli di sicurezza, i test e l'infrastruttura di BCM, progettato e scritto da Donato Corbacio.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/come-e-fatto" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/come-e-fatto", type: "website", siteName: "BCM", locale: "it_IT" },
};

export default function ComeEFattoPage() {
  return (
    <div className={`${displayFont.variable} flex min-h-screen flex-col bg-background text-foreground`}>
      <LandingNav />
      <main className="flex-1">
        <section className="pb-16 pt-12 md:pb-20 md:pt-16">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <div className="max-w-3xl">
              <h1 className="font-display text-balance text-[2.4rem] font-medium leading-[1.06] tracking-[-0.015em] sm:text-5xl">
                Come è fatto BCM
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                BCM è progettato, scritto e messo in produzione da una persona, Donato Corbacio. Qui le tecnologie, i
                controlli e l&apos;infrastruttura, per chi vuole i dettagli tecnici.
              </p>
            </div>
            <div className="mt-10">
              <HowItsBuiltFacts />
            </div>
          </div>
        </section>
      </main>
      <LandingFooter headingLevel="h3" />
    </div>
  );
}
