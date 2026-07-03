import Link from "next/link";
import { ArrowRight, ShieldCheck, Bell, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Abstract dashboard mockup — shows the app's feel without a real screenshot. */
function DashboardMockup() {
  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
      {/* Fake top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <span className="ml-3 text-xs text-muted-foreground font-mono">BCM — Dashboard</span>
      </div>

      <div className="p-4 space-y-4">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Totali", value: "48", color: "text-foreground" },
            { label: "Attivi", value: "35", color: "text-green-600 dark:text-green-400" },
            { label: "In scadenza", value: "7", color: "text-yellow-600 dark:text-yellow-400" },
            { label: "Scaduti", value: "6", color: "text-red-500" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg border border-border bg-background p-2 text-center"
            >
              <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Alert bar */}
        <div className="flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 px-3 py-2">
          <Bell className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
          <span className="text-[11px] text-yellow-700 dark:text-yellow-300">
            3 contratti scadono nei prossimi 7 giorni
          </span>
        </div>

        {/* Contract rows */}
        <div className="space-y-1.5">
          {[
            { num: "CNT-2025-001", client: "Acme Corp Srl", days: "28 gg", color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" },
            { num: "CNT-2025-002", client: "Beta Systems SpA", days: "6 gg", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
            { num: "CNT-2025-003", client: "Gamma Holdings", days: "1 gg", color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
          ].map((row) => (
            <div
              key={row.num}
              className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
            >
              <div>
                <p className="text-[11px] font-medium text-foreground">{row.num}</p>
                <p className="text-[10px] text-muted-foreground">{row.client}</p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${row.bg} ${row.color}`}>
                {row.days}
              </span>
            </div>
          ))}
        </div>

        {/* Risk score mini-widget */}
        <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground">Risk score AI medio</p>
            <div className="w-full h-1.5 bg-muted rounded-full mt-1">
              <div className="h-1.5 bg-green-500 rounded-full" style={{ width: "62%" }} />
            </div>
          </div>
          <span className="text-[11px] font-bold text-green-600 dark:text-green-400">Basso</span>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
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
              Risk scoring con AI integrato
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
              Contratti sotto controllo,{" "}
              <span className="text-primary">scadenze mai perse</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed">
              BCM è il software SaaS per gestire contratti commerciali: alert intelligenti a soglie
              fisse, risk scoring con machine learning e reportistica integrata — tutto in un unico
              posto.
            </p>

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
            </div>

            <p className="text-sm text-muted-foreground">
              Nessuna carta di credito richiesta · Setup in 2 minuti
            </p>
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
