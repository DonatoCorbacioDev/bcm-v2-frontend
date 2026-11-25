/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import {
  FileText,
  Bell,
  ListChecks,
  BarChart2,
  Receipt,
  Building2,
} from "lucide-react";

// Each title says what BCM does, each line one concrete detail. Every claim
// must match the product: no feature that is hidden or not reliable.
const FEATURES = [
  {
    icon: Bell,
    title: "Avvisa prima di scadenze e disdette",
    description:
      "Un'email prima della scadenza o, per i contratti che si rinnovano da soli, prima dell'ultimo giorno per disdirli. Ogni lunedì il riepilogo della settimana.",
  },
  {
    icon: ListChecks,
    title: "Mostra cosa fare questa settimana",
    description:
      "Appena entri vedi disdette da inviare, contratti in scadenza, fatture da abbinare e IBAN cambiati. Ogni voce porta dove intervenire.",
  },
  {
    icon: Receipt,
    title: "Controlla le fatture dei fornitori",
    description:
      "Importa le fatture elettroniche FatturaPA, le abbina al contratto e segnala un IBAN diverso da quello registrato. Da lì prepari il bonifico SEPA.",
  },
  {
    icon: FileText,
    title: "Archivia ogni contratto con i suoi documenti",
    description:
      "Trovi un contratto per cliente, numero o stato, con i PDF, le fatture e lo storico delle modifiche.",
  },
  {
    icon: BarChart2,
    title: "Confronta costi e ricavi con il budget",
    description:
      "Per contratto e per area di business, rispetto al budget dell'anno.",
  },
  {
    icon: Building2,
    title: "Tiene separati i dati di ogni azienda",
    description:
      "Nessun altro cliente può vedere i tuoi contratti. I server sono in Italia.",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-16 border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="grid gap-6 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4">
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.025em] text-foreground md:text-4xl">
              Cosa fa BCM
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Per chi in azienda segue acquisti, contratti e amministrazione.
            </p>
          </div>

          {/* A list, not a wall of cards: each item reads in one line of sight. */}
          <ul className="grid gap-x-10 sm:grid-cols-2 md:col-span-8">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-4 border-t border-border py-6">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted-foreground">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
