import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Starter",
    price: "Gratis",
    period: "per sempre",
    description: "Per chi vuole provare BCM senza impegno.",
    cta: "Inizia gratis",
    ctaHref: "/register-org",
    ctaVariant: "outline" as const,
    highlighted: false,
    features: [
      "Fino a 10 contratti",
      "1 utente admin",
      "Alert email scadenze",
      "Dashboard e KPI",
      "Risk scoring AI",
    ],
  },
  {
    name: "Pro",
    price: "€29",
    period: "/ mese",
    badge: "Presto disponibile",
    description: "Per team che gestiscono decine di contratti.",
    cta: "Presto disponibile",
    ctaHref: "#",
    ctaVariant: "default" as const,
    highlighted: true,
    features: [
      "Contratti illimitati",
      "Fino a 5 utenti",
      "Export Excel e PDF",
      "Fatture elettroniche FatturaPA",
      "Storico completo modifiche",
      "Supporto prioritario",
    ],
  },
  {
    name: "Enterprise",
    price: "Su misura",
    period: "",
    description: "Per grandi organizzazioni con esigenze specifiche.",
    cta: "Contattaci",
    ctaHref: "mailto:donato.corbacio.dev@gmail.com",
    ctaVariant: "outline" as const,
    highlighted: false,
    features: [
      "Tutto di Pro",
      "SLA dedicato",
      "Onboarding assistito",
      "Integrazioni custom",
      "Formazione del team",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-14 space-y-3">
          <h2 className="text-3xl font-bold text-foreground">Prezzi semplici e trasparenti</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Inizia gratis, scala quando ne hai bisogno. Nessun costo nascosto.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 flex flex-col gap-6 ${
                plan.highlighted
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-card"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-1">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-foreground text-lg">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              <ul className="flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check
                      className="h-4 w-4 text-primary mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={plan.ctaVariant}
                className="w-full"
                disabled={plan.cta === "Presto disponibile"}
              >
                <Link href={plan.ctaHref}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
