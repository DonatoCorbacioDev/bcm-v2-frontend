/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import dynamic from "next/dynamic";
import { Archive, Building2, CalendarDays, Download, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NoticeTimeline } from "@/components/landing/NoticeTimeline";
import { IbanAlertPreview } from "@/components/landing/IbanAlertPreview";

// Recharts is the heaviest part of the page: loaded only for this tile.
const BudgetChart = dynamic(() => import("@/components/landing/BudgetChart").then((m) => m.BudgetChart), {
  loading: () => <div className="h-44 rounded-md bg-muted/50 md:h-64" />,
});

// Every claim matches the product and the demo organization's data: no
// feature that is hidden or not reliable.
const MORE = [
  // The ICS feed (CalendarFeedController): end dates and last days to cancel.
  { icon: CalendarDays, text: "Scadenze e ultimi giorni per disdire nel tuo Google Calendar, Outlook o Apple Calendar." },
  { icon: Archive, text: "Ogni contratto con i suoi PDF, le fatture e lo storico delle modifiche." },
  { icon: Landmark, text: "Il file per il bonifico SEPA, pronto da caricare in banca." },
  { icon: Download, text: "Tutti i tuoi dati esportabili in un file, quando vuoi." },
  { icon: Building2, text: "Ogni azienda nel suo spazio separato, su server in Italia." },
];

function Tile({ title, children, visual, className = "" }: {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly visual: React.ReactNode;
  readonly className?: string;
}) {
  return (
    <div className={`flex flex-col rounded-xl border border-border bg-card p-6 md:p-8 ${className}`}>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-prose leading-relaxed text-muted-foreground">{children}</p>
      <div className="mt-6 flex-1">{visual}</div>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="scroll-mt-16 border-t border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-balance text-4xl font-medium tracking-[-0.01em] text-foreground md:text-5xl">
            Cosa fa BCM
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Per chi in azienda segue acquisti, contratti e amministrazione. Ogni riquadro è una parte dell&apos;app,
            con i dati della demo.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-6">
          <Tile className="md:col-span-6" title="Calcola l'ultimo giorno per disdire" visual={<NoticeTimeline />}>
            Da durata e preavviso di ogni contratto. Le email partono 30, 14, 7 e 1 giorno prima, e ogni lunedì arriva il
            riepilogo della settimana.
          </Tile>

          <Tile className="md:col-span-3" title="Segnala un IBAN cambiato" visual={<IbanAlertPreview />}>
            Se una fattura chiede il pagamento su un conto diverso da quello verificato, l&apos;avviso va in cima alla Home.
          </Tile>

          <Tile
            className="md:col-span-3"
            title="Abbina le fatture ai contratti"
            visual={
              <div className="rounded-lg border border-border bg-background p-4" aria-hidden="true">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">Fattura NCS-2026-10</p>
                    <p className="text-sm text-muted-foreground">Nuvola Cloud Servizi S.r.l.</p>
                  </div>
                  <Badge variant="success">Abbinata</Badge>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Importo</dt>
                    <dd className="font-medium tabular-nums text-foreground">4.800,00 € + IVA</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Contratto</dt>
                    <dd className="font-medium text-foreground">NRT-117, in linea con il previsto</dd>
                  </div>
                </dl>
              </div>
            }
          >
            Importa le fatture elettroniche FatturaPA e le confronta con quanto previsto dal contratto.
          </Tile>

          <Tile className="md:col-span-4" title="Confronta i costi con il budget" visual={<BudgetChart />}>
            Mese per mese, per contratto e per area di business.
          </Tile>

          <div className="rounded-xl border border-border bg-card p-6 md:col-span-2 md:p-8">
            <h3 className="text-lg font-semibold text-foreground">E poi</h3>
            <ul className="mt-4 space-y-4">
              {MORE.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3 leading-relaxed text-muted-foreground">
                  <Icon className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
