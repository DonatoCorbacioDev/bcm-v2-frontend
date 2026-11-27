/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import { NoticeCalculator } from "@/components/notice-calculator/NoticeCalculator";

/** The free cancellation calculator on the homepage; its own page is /calcolo-disdetta. */
export function CalculatorSection() {
  return (
    <section id="calcolo-disdetta" className="scroll-mt-16 border-t border-border bg-muted/40 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-balance text-4xl font-medium tracking-[-0.01em] text-foreground md:text-5xl">
            Prova il calcolo su un tuo contratto
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Per un contratto alla volta, senza registrarti. Lo trovi anche nella{" "}
            <Link href="/calcolo-disdetta" className="font-medium text-primary underline-offset-4 hover:underline">
              pagina del calcolo della disdetta
            </Link>
            .
          </p>
        </div>
        <div className="mt-10 rounded-xl border border-border bg-card p-6 md:p-8">
          <NoticeCalculator idPrefix="home" />
        </div>
      </div>
    </section>
  );
}
