/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

// A real sequence, so the steps carry numbers.
const STEPS = [
  {
    title: "Registra la tua organizzazione",
    description:
      "Crei l'account dell'amministratore e lo confermi con il codice che ricevi per email. Poi aggiungi le aree di business e le persone che seguono i contratti.",
  },
  {
    title: "Carica i tuoi contratti",
    description:
      "Se li hai già in Excel, scarichi il modello, lo compili e li carichi tutti insieme: le righe da correggere te le indica una per una. Poi colleghi a ogni contratto i suoi PDF e le fatture.",
  },
  {
    title: "Ricevi gli avvisi",
    description:
      "BCM controlla ogni giorno scadenze e termini di disdetta e ti scrive quando serve. In Home trovi sempre cosa fare nei prossimi 30 giorni.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-balance text-4xl font-medium tracking-[-0.01em] text-foreground md:text-5xl">
            Come funziona
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Si usa dal browser, senza installare niente.
          </p>
        </div>

        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-t-2 border-primary pt-6">
              <span className="text-sm font-semibold tabular-nums text-primary">Passo {index + 1}</span>
              <h3 className="mt-2 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
