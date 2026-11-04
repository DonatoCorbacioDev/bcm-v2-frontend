/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONTACT_EMAIL = "donatocorbacio92@gmail.com";
const PRO_INFO_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Informazioni sul piano Pro di BCM")}`;
const CUSTOM_NEEDS_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("BCM: esigenze particolari")}`;

// Every claim here must match what the product does and what the backend
// enforces (TierLimitService: 15 / 200 contracts; checkout switched off by
// billing.checkout-enabled). The price list is a promise to customers, not
// marketing copy: no feature that is hidden or not reliable, no price that
// hasn't been decided, no absolute guarantee. Change both together.
const PLANS = [
  {
    name: "Free",
    price: "Gratuito",
    tagline: "Per iniziare",
    status: "Disponibile",
    cta: "Inizia gratis",
    ctaHref: "/register-org",
    ctaVariant: "outline" as const,
    highlighted: false,
    features: [
      "Fino a 15 contratti",
      "Scadenze, rinnovi taciti, termini di disdetta e promemoria email",
      "Home con le attività da seguire",
      "Importazione delle fatture FatturaPA XML e confronto con il previsto",
      "Segnalazione di IBAN diversi da quello registrato",
      "Documenti, esportazioni e file per i bonifici SEPA",
    ],
  },
  {
    name: "Pro",
    price: "Prezzo in definizione",
    tagline: "Per chi gestisce più contratti",
    status: "Non ancora acquistabile",
    cta: "Richiedi informazioni",
    ctaHref: PRO_INFO_HREF,
    ctaVariant: "default" as const,
    highlighted: true,
    features: [
      "Fino a 200 contratti",
      "Tutte le funzionalità del piano Free",
      "Pensato per aziende con più contratti da gestire",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14 space-y-3">
          <h2 className="text-3xl font-bold text-foreground">Piani</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Puoi iniziare gratis. Il piano Pro è in definizione: scrivici se ti interessa.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 flex flex-col gap-6 ${
                plan.highlighted
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-card"
              }`}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{plan.tagline}</p>
                <h3 className="font-semibold text-foreground text-lg mt-1">{plan.name}</h3>
                <p className="text-2xl font-bold text-foreground mt-2">{plan.price}</p>
                <p className="text-sm text-muted-foreground mt-1">{plan.status}</p>
              </div>

              <ul className="flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button asChild variant={plan.ctaVariant} className="w-full">
                <Link href={plan.ctaHref}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Hai esigenze particolari o gestisci più di 200 contratti?{" "}
          <a href={CUSTOM_NEEDS_HREF} className="font-medium text-primary underline-offset-4 hover:underline">
            Scrivici per parlarne
          </a>
          .
        </p>
      </div>
    </section>
  );
}
