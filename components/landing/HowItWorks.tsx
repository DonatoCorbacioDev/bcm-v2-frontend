/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { ClipboardList, Settings, BellRing } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Settings,
    title: "Registra la tua organizzazione",
    description:
      "Crei l'account dell'amministratore e lo confermi con il codice che ricevi per email. Poi aggiungi le aree di business e le persone che seguono i contratti.",
  },
  {
    number: "02",
    icon: ClipboardList,
    title: "Carica i tuoi contratti",
    description:
      "Inserisci i contratti che hai già, uno alla volta o da un file Excel, e collega a ognuno i suoi documenti PDF e le fatture.",
  },
  {
    number: "03",
    icon: BellRing,
    title: "Ricevi avvisi e analisi",
    description:
      "BCM controlla le scadenze ogni giorno e ti scrive quando serve. Ogni mattina aggiorna anche la valutazione del rischio dei contratti.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14 space-y-3">
          <h2 className="text-3xl font-bold text-foreground">Come funziona</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Si usa dal browser, senza installare niente.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {/* Connector line between steps */}
                {index < STEPS.length - 1 && (
                  <div
                    className="hidden md:block absolute top-8 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-0.5 bg-border"
                    aria-hidden="true"
                  />
                )}

                <div className="relative w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 shrink-0">
                  <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>

                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
