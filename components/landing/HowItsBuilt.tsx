/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

// For technical readers (recruiters, a customer's IT). Every line is a fact
// checked in the repositories on 25/11/2026; update it when the facts move:
// versions in the pom/package/requirements, ASVS in bcm-v2-backend
// docs/SECURITY.md, the test counts from the three suites (2809 unit + 181
// integration backend, 1627 frontend), the region in bcm-v2-docker.
const FACTS = [
  {
    title: "Backend",
    text: "Java 21 e Spring Boot 4, API REST con MySQL e Redis.",
  },
  {
    title: "Frontend",
    text: "Next.js 16 e React 19 in TypeScript, con Tailwind CSS e shadcn/ui.",
  },
  {
    title: "Analisi dei contratti",
    text: "Un servizio in Python con FastAPI, separato dal resto dell'applicazione.",
  },
  {
    title: "Sicurezza",
    text: "Verificata sui requisiti OWASP ASVS 5.0, livello 2, e sulle OWASP API Top 10, con scansioni OWASP ZAP passive e attive.",
  },
  {
    title: "Test",
    text: "Più di 4.600 test automatici, unitari, di integrazione su MySQL reale e di accessibilità, eseguiti a ogni modifica.",
  },
  {
    title: "Infrastruttura",
    text: "Docker su Oracle Cloud a Milano, backup con una copia fuori da Oracle e ripristino provato, monitoraggio continuo.",
  },
];

export function HowItsBuilt() {
  return (
    <section id="how-its-built" className="scroll-mt-16 border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4">
            <h2 className="font-display text-balance text-4xl font-medium tracking-[-0.01em] text-foreground md:text-5xl">
              Come è fatto
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              BCM è progettato, scritto e messo in produzione da una persona, Donato Corbacio.
            </p>
          </div>

          <ul className="grid gap-x-10 sm:grid-cols-2 md:col-span-8">
            {FACTS.map(({ title, text }) => (
              <li key={title} className="border-t border-border py-6">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
