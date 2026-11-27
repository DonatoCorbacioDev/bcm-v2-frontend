/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";

// For technical readers (recruiters, a customer's IT), on /come-e-fatto;
// the homepage keeps one plain line (BuiltBy). Every line is a fact
// checked in the repositories on 25/11/2026; update it when the facts move:
// versions in the pom/package/requirements, ASVS in bcm-v2-backend
// docs/SECURITY.md, the test counts from the three suites (2809 unit + 181
// integration backend, 1627 frontend), the region in bcm-v2-docker.
export const FACTS = [
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

/** The technical facts, one per item, under the page's h1. */
export function HowItsBuiltFacts() {
  return (
    <ul className="grid gap-x-10 sm:grid-cols-2">
      {FACTS.map(({ title, text }) => (
        <li key={title} className="border-t border-border py-6">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="mt-1.5 leading-relaxed text-muted-foreground">{text}</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * The homepage's line about who builds BCM, in words a small company reads;
 * the stack and the checks are one click away for whoever wants them.
 */
export function BuiltBy() {
  return (
    <section id="how-its-built" className="scroll-mt-16 border-t border-border py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
          BCM è progettato, scritto e gestito da una persona, Donato Corbacio, con la sicurezza verificata secondo gli
          standard internazionali OWASP.{" "}
          <Link href="/come-e-fatto" className="font-medium text-primary underline-offset-4 hover:underline">
            Vedi come è fatto
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
