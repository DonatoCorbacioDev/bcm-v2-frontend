"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { computeNoticeDeadline, validateNotice, type NoticeUnit } from "@/lib/noticeDeadline";
import { isoInDays, useToday } from "@/components/landing/useToday";

function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function when(daysLeft: number): string {
  if (daysLeft === 0) return "oggi";
  if (daysLeft === 1) return "domani";
  return `tra ${daysLeft} giorni`;
}

const toInt = (s: string): number => (s.trim() === "" ? Number.NaN : Number(s));

/**
 * The public cancellation calculator: the end date and the notice written in
 * the contract give the last day the cancellation must reach the supplier.
 * Everything is computed in the browser (lib/noticeDeadline): nothing typed
 * here is sent anywhere.
 */
export function NoticeCalculator({ idPrefix = "calc" }: { readonly idPrefix?: string }) {
  const today = useToday();
  const [endDate, setEndDate] = useState("");
  const [notice, setNotice] = useState("");
  const [unit, setUnit] = useState<NoticeUnit>("days");
  const [renewal, setRenewal] = useState("");
  const [touched, setTouched] = useState(false);

  const input = {
    endDate,
    notice: toInt(notice),
    unit,
    renewalMonths: renewal.trim() === "" ? null : toInt(renewal),
  };
  const ready = endDate !== "" && notice.trim() !== "";
  const error = ready || touched ? validateNotice(input) : null;
  const result = today && ready && !error ? computeNoticeDeadline({ ...input, today: isoInDays(today, 0) }) : null;

  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-10">
      <form
        method="post"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
        }}
        className="space-y-5"
        aria-label="Calcolo della disdetta"
      >
        <div className="space-y-2">
          <Label htmlFor={id("end")}>Scadenza del contratto</Label>
          <Input id={id("end")} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor={id("notice")}>Preavviso scritto nel contratto</Label>
          <div className="flex gap-3">
            <Input
              id={id("notice")}
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              placeholder="Per esempio 90"
              value={notice}
              onChange={(e) => setNotice(e.target.value)}
              className="flex-1"
              required
            />
            <Select value={unit} onValueChange={(v) => setUnit(v as NoticeUnit)}>
              <SelectTrigger id={id("unit")} aria-label="Unità del preavviso" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">giorni</SelectItem>
                <SelectItem value="months">mesi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={id("renewal")}>
            Se si rinnova da solo, per quanti mesi <span className="font-normal text-muted-foreground">(facoltativo)</span>
          </Label>
          <Input
            id={id("renewal")}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            placeholder="Per esempio 12"
            value={renewal}
            onChange={(e) => setRenewal(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full sm:w-auto">Calcola l&apos;ultimo giorno</Button>
        <p className="text-sm text-muted-foreground">
          Il calcolo avviene nel tuo browser: i dati che inserisci non vengono inviati a nessuno.
        </p>
      </form>

      <div aria-live="polite" className="rounded-xl border border-border bg-muted/40 p-6 md:p-8">
        {error ? (
          <p className="text-[var(--status-red-fg)]">{error}</p>
        ) : result ? (
          <Outcome result={result} />
        ) : (
          <div className="flex h-full flex-col justify-center gap-3 text-muted-foreground">
            <CalendarClock className="h-6 w-6 text-primary" aria-hidden="true" />
            <p>Inserisci la scadenza e il preavviso: qui compare l&apos;ultimo giorno per disdire.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Outcome({ result }: { readonly result: ReturnType<typeof computeNoticeDeadline> }) {
  const open = result.renewed ?? (result.passed ? null : result);
  return (
    <div className="space-y-5">
      {result.renewed && (
        <p className="text-muted-foreground">
          Il termine per questa scadenza era {longDate(result.deadline)} ed è passato: il contratto si è rinnovato
          fino a {longDate(result.renewed.endDate)}.
        </p>
      )}

      {open ? (
        <div>
          <p className="text-sm font-medium text-muted-foreground">Ultimo giorno per disdire</p>
          <p className="mt-1 font-display text-3xl font-medium text-foreground first-letter:uppercase">{longDate(open.deadline)}</p>
          <p className="mt-1 text-lg font-medium text-[var(--status-red-fg)]">{when(open.daysLeft)}</p>
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium text-muted-foreground">Termine passato</p>
          <p className="mt-1 text-lg text-foreground">
            L&apos;ultimo giorno per disdire era {longDate(result.deadline)}, {-result.daysLeft} giorni fa.
          </p>
          <p className="mt-2 text-muted-foreground">
            Se il contratto si rinnova da solo, indica per quanti mesi: calcolo il prossimo termine utile.
          </p>
        </div>
      )}

      {open?.weekend && (
        <p className="flex gap-2 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-amber-fg)]" aria-hidden="true" />
          Cade di sabato o domenica: invia la disdetta qualche giorno prima.
        </p>
      )}

      {open && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          La disdetta deve <strong className="font-medium text-foreground">arrivare</strong> al fornitore entro quel giorno, non
          solo partire: mandala con PEC o raccomandata con ricevuta di ritorno, con qualche giorno di margine.
        </p>
      )}

      <div className="border-t border-border pt-5">
        <p className="text-sm text-muted-foreground">
          BCM fa questo calcolo per tutti i tuoi contratti e ti avvisa 30, 14, 7 e 1 giorno prima.
        </p>
        <Button asChild variant="outline" className="mt-3">
          <Link href="/login?demo=1">Prova la demo</Link>
        </Button>
      </div>
    </div>
  );
}
