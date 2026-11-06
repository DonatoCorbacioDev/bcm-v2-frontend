"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarClock, FileText, Landmark, PlayCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { LogoMark } from "@/components/layout/Logo";

/**
 * A miniature of the real home page: what BCM shows first, so a visitor sees
 * the product's point (what to do, by when) instead of made-up totals.
 */
function DashboardMockup() {
  const rows = [
    { icon: Landmark, tone: "text-[var(--status-red-fg)] bg-[var(--status-red-bg)]",
      title: "IBAN cambiato: verifica prima di pagare", detail: "Fattura di Ferri & Associati" },
    { icon: CalendarClock, tone: "text-[var(--status-amber-fg)] bg-[var(--status-amber-bg)]",
      title: "Disdici entro il 24 novembre", detail: "Manutenzione impianti · poi si rinnova per 12 mesi" },
    { icon: AlertTriangle, tone: "text-[var(--status-amber-fg)] bg-[var(--status-amber-bg)]",
      title: "Scade il 16 novembre", detail: "Audit di Conformità · Vertice Legal" },
    { icon: FileText, tone: "text-primary bg-primary/10",
      title: "Fattura da abbinare", detail: "Nuvola Cloud · 4.800,00 € + IVA · in linea con il previsto" },
  ];
  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden" aria-hidden="true">
      {/* Fake top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
        <LogoMark size={16} />
        <span className="text-xs text-muted-foreground font-mono">BCM — Home</span>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-[11px] text-muted-foreground">Cosa richiede attenzione nei prossimi 30 giorni</p>
        <div className="divide-y divide-border rounded-lg border border-border bg-background">
          {rows.map(({ icon: Icon, tone, title, detail }) => (
            <div key={title} className="flex items-start gap-2.5 px-3 py-2.5">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${tone}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-foreground">{title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background gradient */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-background"
        aria-hidden="true"
      />
      <div
        className="absolute -top-24 -right-24 -z-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-sm text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Scadenze, fatture e pagamenti in un unico posto
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
              Scadenze e disdette dei contratti,{" "}
              <span className="text-primary">sotto controllo</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed">
              BCM raccoglie i contratti della tua azienda insieme a documenti, fatture e pagamenti.
              Ti avvisa prima che un contratto scada o che passi l&apos;ultimo giorno per disdirlo, e ti mostra
              cosa fare ogni settimana.
            </p>

            {isAuthenticated ? (
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/dashboard">
                    Apri BCM
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg">
                    <Link href="/register-org">
                      Inizia gratis
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/login">Accedi</Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                    <Link href="/login?demo=1">
                      <PlayCircle className="h-4 w-4" aria-hidden="true" />
                      Prova la demo
                    </Link>
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  Puoi provare la demo senza registrarti. Per iniziare non serve la carta di
                  credito.
                </p>
              </>
            )}
          </div>

          {/* Mockup */}
          <div className="hidden md:block">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
