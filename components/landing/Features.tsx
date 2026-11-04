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

const FEATURES = [
  {
    icon: FileText,
    title: "Tutti i contratti in un archivio",
    description:
      "Trovi ogni contratto per cliente, numero o stato, e per ognuno vedi documenti, fatture e storico delle modifiche.",
  },
  {
    icon: Bell,
    title: "Avvisi di scadenza e disdetta",
    description:
      "Ricevi un'email 30, 14, 7 e 1 giorno prima della scadenza o, per i contratti che si rinnovano da soli, prima dell'ultimo giorno per disdirli. Ogni lunedì arriva anche il riepilogo della settimana.",
  },
  {
    icon: ListChecks,
    title: "Cosa fare questa settimana",
    description:
      "Appena entri vedi cosa richiede attenzione: disdette da inviare, contratti in scadenza, fatture da abbinare, IBAN cambiati. Ogni voce ti porta dove intervenire.",
  },
  {
    icon: BarChart2,
    title: "Ricavi, costi e budget",
    description:
      "Vedi ricavi e costi per contratto e per area di business, confrontati con il budget dell'anno.",
  },
  {
    icon: Receipt,
    title: "Fatture e bonifici",
    description:
      "Carichi le fatture elettroniche FatturaPA: BCM le controlla, le abbina al contratto e ti avvisa se il fornitore chiede il pagamento su un IBAN diverso. Da lì prepari anche il bonifico SEPA.",
  },
  {
    icon: Building2,
    title: "I tuoi dati restano tuoi",
    description:
      "Ogni azienda ha il suo spazio separato e nessun altro cliente può vedere i tuoi contratti. I server sono in Italia.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14 space-y-3">
          <h2 className="text-3xl font-bold text-foreground">
            Cosa puoi fare con BCM
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Pensato per chi in azienda segue acquisti, contratti e amministrazione.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
