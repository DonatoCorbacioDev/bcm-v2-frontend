"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface IbanCheckSupplier {
  readonly id: string;
  readonly name: string;
  /** Masked by the API ("IT...8400"), never the full value; null when none is verified yet. */
  readonly verifiedIban: string | null | undefined;
}

interface IbanCheckDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly invoiceNumber: string | null | undefined;
  /** Masked by the API, like verifiedIban. */
  readonly invoiceIban: string | null | undefined;
  readonly supplier: IbanCheckSupplier | null | undefined;
  /** Only an administrator can change a supplier's verified IBAN. */
  readonly isAdmin: boolean;
}

/**
 * What to do when an invoice asks to be paid on another bank account: the
 * classic supplier fraud. The two IBANs side by side, then the steps, in
 * order. Changing the verified IBAN stays on the supplier's page, where
 * the backend asks the administrator's password again.
 */
export function IbanCheckDialog({ open, onOpenChange, invoiceNumber, invoiceIban, supplier, isAdmin }: IbanCheckDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>IBAN cambiato: come verificarlo</DialogTitle>
          <DialogDescription>
            {/* No second full stop after a name that already ends with one ("S.r.l."). */}
            {`${invoiceNumber ? `La fattura ${invoiceNumber}` : "Questa fattura"} chiede il pagamento su un conto diverso da quello verificato${supplier ? ` per ${supplier.name}` : ""}`.replace(/\.?$/, ".")}
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
          <div>
            <dt className="text-muted-foreground">IBAN in fattura</dt>
            <dd className="font-mono font-semibold text-[var(--status-red-fg)]">{invoiceIban ?? "non indicato"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">IBAN verificato</dt>
            <dd className="font-mono font-semibold text-foreground">{supplier?.verifiedIban ?? "nessuno"}</dd>
          </div>
        </dl>

        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
          <li>Non pagare questa fattura finché non hai verificato: BCM la tiene fuori dal file per il bonifico SEPA.</li>
          <li>
            Chiama il fornitore a un numero che conosci già, dal contratto o da fatture precedenti. Non usare i recapiti
            scritti nella fattura o nell&apos;email che annuncia il cambio.
          </li>
          <li>
            Se conferma il nuovo conto,{" "}
            {isAdmin ? "aggiorna l'IBAN verificato nella scheda del fornitore." : "chiedi all'amministratore di aggiornare l'IBAN verificato nella scheda del fornitore."}
          </li>
          <li>Se non lo conferma, non pagare e avvisa la tua banca.</li>
        </ol>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Chiudi
          </Button>
          {isAdmin && supplier && (
            <Button asChild>
              <Link href={`/counterparties/${supplier.id}`}>Apri la scheda del fornitore</Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
