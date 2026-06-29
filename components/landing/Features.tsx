import {
  FileText,
  Bell,
  ShieldCheck,
  BarChart2,
  Receipt,
  Building2,
} from "lucide-react";

const FEATURES = [
  {
    icon: FileText,
    title: "Gestione contratti",
    description:
      "Crea, modifica e monitora tutti i contratti in un unico posto. Ricerca per cliente, numero o stato con paginazione server-side.",
  },
  {
    icon: Bell,
    title: "Alert scadenze",
    description:
      "Notifiche email automatiche a 30, 14, 7 e 1 giorno dalla scadenza. Zero spam: una notifica per soglia, non una al giorno.",
  },
  {
    icon: ShieldCheck,
    title: "Risk scoring con AI",
    description:
      "Algoritmo ML (Random Forest, F1 0.96) che calcola il rischio di ogni contratto in tempo reale su 7 feature chiave.",
  },
  {
    icon: BarChart2,
    title: "Dashboard finanziaria",
    description:
      "Monitora i valori economici per area di business e tipo di finanziamento. Forecast con Facebook Prophet (trend + stagionalità).",
  },
  {
    icon: Receipt,
    title: "Fatture elettroniche",
    description:
      "Gestione fatture con supporto FatturaPA (XML). Visualizzazione, validazione e storico allegato ai contratti.",
  },
  {
    icon: Building2,
    title: "Multi-organizzazione",
    description:
      "Ogni azienda ha il suo spazio completamente isolato. Tenant scoping rigoroso a ogni livello API e ML.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14 space-y-3">
          <h2 className="text-3xl font-bold text-foreground">
            Tutto quello che ti serve, niente di superfluo
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Progettato per uffici acquisti, legal e amministrazione che gestiscono decine o centinaia
            di contratti.
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
