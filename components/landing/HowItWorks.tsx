import { ClipboardList, Settings, BellRing } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Settings,
    title: "Registra la tua organizzazione",
    description:
      "Crea l'account admin, configura la tua prima area di business e aggiungi i responsabili contratti. Il wizard guidato lo fa in meno di due minuti.",
  },
  {
    number: "02",
    icon: ClipboardList,
    title: "Carica i tuoi contratti",
    description:
      "Inserisci manualmente i contratti esistenti o creane di nuovi. Collega fatture elettroniche e documenti PDF direttamente al contratto.",
  },
  {
    number: "03",
    icon: BellRing,
    title: "Ricevi alert e analisi",
    description:
      "Il sistema monitora le scadenze e notifica per email a soglie precise (30/14/7/1 gg). Il risk scoring AI aggiorna il profilo di rischio ogni notte.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14 space-y-3">
          <h2 className="text-3xl font-bold text-foreground">Come funziona</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Operativo in pochi minuti, senza installazioni né configurazioni complesse.
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
