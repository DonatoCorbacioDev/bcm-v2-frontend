"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useState } from "react";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { useConfirmVerifiedIban } from "@/hooks/useConfirmVerifiedIban";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VerifyIbanDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly counterpartyId: number;
  readonly currentIbanMasked?: string | null;
}

export default function VerifyIbanDialog({
  open,
  onOpenChange,
  counterpartyId,
  currentIbanMasked,
}: VerifyIbanDialogProps) {
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const mutation = useConfirmVerifiedIban(counterpartyId);

  const handleOpenChange = (next: boolean) => {
    if (mutation.isPending) return;
    // Always reset: Radix only ever invokes this to close (no DialogTrigger
    // lives inside this component), so `next` is never actually `true` here.
    setIban("");
    setBic("");
    onOpenChange(next);
  };

  const handleConfirm = () => {
    if (!iban.trim()) {
      toast.error("L'IBAN è obbligatorio");
      return;
    }
    mutation.mutate(
      { iban: iban.trim(), bic: bic.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("IBAN verificato aggiornato");
          handleOpenChange(false);
        },
        onError: (error: AxiosError<{ message?: string }>) => {
          toast.error(error.response?.data?.message || "Aggiornamento dell'IBAN verificato non riuscito");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conferma IBAN verificato</DialogTitle>
          <DialogDescription>
            Da questo momento i pagamenti SEPA per questa controparte verranno bloccati se l&apos;IBAN
            del fornitore su una fattura non corrisponde a questo. Usa questa azione solo dopo aver
            verificato il cambio IBAN fuori da BCM (es. telefonata, documento firmato).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm flex items-center justify-between">
            <span className="text-muted-foreground">IBAN verificato attuale</span>
            <span className="font-mono">{currentIbanMasked || "Non impostato"}</span>
          </div>
          <div>
            <label htmlFor="verified-iban" className="block text-sm font-medium mb-2">
              Nuovo IBAN *
            </label>
            <Input
              id="verified-iban"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="IT60X0542811101000000123456"
            />
          </div>
          <div>
            <label htmlFor="verified-bic" className="block text-sm font-medium mb-2">
              Nuovo BIC (opzionale)
            </label>
            <Input
              id="verified-bic"
              value={bic}
              onChange={(e) => setBic(e.target.value)}
              placeholder="BPPIITRRXXX"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={mutation.isPending}>
            Annulla
          </Button>
          <Button onClick={handleConfirm} disabled={mutation.isPending}>
            {/* istanbul ignore next */ mutation.isPending ? "Conferma in corso..." : "Conferma"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
