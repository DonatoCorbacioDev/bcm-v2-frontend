"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cancellationLetter } from "@/lib/cancellationLetter";
import type { Contract } from "@/types";

function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

interface LetterProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly contract: Contract;
  readonly senderName: string | null | undefined;
}

/** The ready-to-send cancellation text, to copy into a PEC or a registered letter. */
export function CancellationLetterDialog({ open, onOpenChange, contract, senderName }: LetterProps) {
  const { subject, body } = cancellationLetter(contract, senderName);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Oggetto: ${subject}\n\n${body}`);
      setCopied(true);
      toast.success("Testo della disdetta copiato");
    } catch {
      toast.error("Copia non riuscita: seleziona il testo e copialo a mano");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) setCopied(false); onOpenChange(next); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Prepara la disdetta</DialogTitle>
          <DialogDescription>
            Un modello già compilato con i dati del contratto. Completa le parti tra parentesi quadre, poi invialo come indica
            il contratto, di solito con PEC o raccomandata con ricevuta di ritorno.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm">
            <span className="text-muted-foreground">Oggetto: </span>
            <span className="font-medium">{subject}</span>
          </p>
          <textarea
            readOnly
            aria-label="Testo della disdetta"
            value={body}
            rows={13}
            className="w-full resize-y rounded-md border border-border bg-muted/40 p-3 text-sm leading-relaxed text-foreground"
          />
          <p className="text-xs text-muted-foreground">
            La disdetta vale quando arriva al fornitore, entro il termine. È un modello da adattare, non una consulenza legale.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Chiudi
          </Button>
          <Button type="button" onClick={copy}>
            {copied ? "Copiato" : "Copia oggetto e testo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface MarkSentProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly contract: Contract;
  readonly onConfirm: () => void;
  readonly isPending: boolean;
}

/**
 * Records that the cancellation was sent by turning the tacit renewal off,
 * with the existing contract update: the notice alerts stop, the end-date
 * alert stays, and the contract history keeps who did it and when.
 */
export function MarkCancellationSentDialog({ open, onOpenChange, contract, onConfirm, isPending }: MarkSentProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Hai inviato la disdetta?</DialogTitle>
          <DialogDescription>
            BCM toglie il rinnovo tacito da {contract.contractNumber}: gli avvisi per disdire si fermano e resta l&apos;avviso
            della scadenza del {longDate(contract.endDate)}. La modifica resta nella cronologia del contratto.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Annulla
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Salvataggio…" : "Sì, l'ho inviata"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
