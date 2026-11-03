"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { AlertTriangle } from "lucide-react";
import { organizationService, type DeletionCodeSent } from "@/services/organization.service";
import { formatDeletionDate } from "@/lib/deletionDate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteOrganizationCardProps {
  readonly organizationName: string;
  /** When the deletion will run; null when none is scheduled. */
  readonly deletionScheduledFor: string | null;
}

/** The backend's own message (wrong password, wrong code, paid plan...) or a generic fallback. */
function errorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(error)) {
    if (error.response?.status === 429) return "Troppi tentativi, riprova tra un minuto";
    return error.response?.data?.message || fallback;
  }
  return fallback;
}

/**
 * "Zona pericolosa" of the organization page (GDPR art. 17, Terms sez. 13).
 * Asking takes three factors (password, retyped name, emailed code) and
 * only schedules the deletion 30 days ahead; any admin can cancel it until
 * then, from this same card.
 */
export function DeleteOrganizationCard({ organizationName, deletionScheduledFor }: DeleteOrganizationCardProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [typedName, setTypedName] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState<DeletionCodeSent | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const reset = () => {
    setPassword("");
    setTypedName("");
    setCode("");
    setCodeSent(null);
    setResendIn(0);
    setError(null);
  };

  const refreshOrganization = () => queryClient.invalidateQueries({ queryKey: ["organization", "me"] });

  const requestMutation = useMutation({
    mutationFn: () => organizationService.requestDeletion({ password, organizationName: typedName }),
    onSuccess: (sent) => {
      setCodeSent(sent);
      setResendIn(sent.resendCooldownSeconds);
      setCode("");
      setError(null);
    },
    onError: (e) => setError(errorMessage(e, "Richiesta non riuscita, riprova più tardi")),
  });

  const confirmMutation = useMutation({
    mutationFn: () => organizationService.confirmDeletion(code),
    onSuccess: ({ scheduledFor }) => {
      toast.success(`Cancellazione programmata per il ${formatDeletionDate(scheduledFor)}`);
      setOpen(false);
      reset();
      void refreshOrganization();
    },
    onError: (e) => {
      const message = errorMessage(e, "Conferma non riuscita, riprova");
      setError(message);
      // An expired or burned code can't be retried: back to the first step.
      if (isAxiosError(e) && /ripeti la richiesta/.test(message)) {
        setCodeSent(null);
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: organizationService.cancelDeletion,
    onSuccess: () => {
      toast.success("Cancellazione annullata: nessun dato verrà cancellato");
      void refreshOrganization();
    },
    onError: (e) => toast.error(errorMessage(e, "Annullamento non riuscito, riprova")),
  });

  const nameMatches = typedName.trim() === organizationName.trim();

  if (deletionScheduledFor) {
    return (
      <Card id="cancellazione" className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            Cancellazione programmata
          </CardTitle>
          <CardDescription>
            Il <strong>{formatDeletionDate(deletionScheduledFor)}</strong> l&apos;organizzazione e tutti i suoi dati
            saranno cancellati definitivamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Fino ad allora BCM funziona normalmente: puoi ancora esportare i dati qui sopra. Qualsiasi
            amministratore può annullare la cancellazione.
          </p>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? "Annullamento..." : "Annulla la cancellazione"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="cancellazione" className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Zona pericolosa</CardTitle>
        <CardDescription>Cancella l&apos;organizzazione e tutti i suoi dati</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Verranno cancellati contratti, documenti, fatture, valori finanziari, utenti e responsabili. La
          cancellazione avviene 30 giorni dopo la conferma: fino ad allora puoi annullarla ed esportare i dati.
          Prima esporta i dati che vuoi conservare.
        </p>
        <div className="flex justify-end">
          <Button variant="destructive" onClick={() => setOpen(true)}>
            Cancella organizzazione
          </Button>
        </div>
      </CardContent>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (requestMutation.isPending || confirmMutation.isPending) return;
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancella {organizationName}</DialogTitle>
            <DialogDescription>
              {codeSent
                ? `Ti abbiamo inviato via email un codice a 6 cifre, valido ${codeSent.expiresInMinutes} minuti.`
                : "Per sicurezza conferma la tua password e scrivi il nome dell'organizzazione."}
            </DialogDescription>
          </DialogHeader>

          {codeSent ? (
            <form
              id="delete-org-confirm"
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                confirmMutation.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="deletionCode">Codice di conferma</Label>
                <Input
                  id="deletionCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                />
              </div>
              <Button
                type="button"
                variant="link"
                className="px-0"
                disabled={resendIn > 0 || requestMutation.isPending}
                onClick={() => requestMutation.mutate()}
              >
                {resendIn > 0 ? `Invia un nuovo codice (${resendIn}s)` : "Invia un nuovo codice"}
              </Button>
            </form>
          ) : (
            <form
              id="delete-org-request"
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                requestMutation.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="deletionPassword">La tua password</Label>
                <Input
                  id="deletionPassword"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deletionName">
                  Scrivi <strong>{organizationName}</strong> per confermare
                </Label>
                <Input
                  id="deletionName"
                  autoComplete="off"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  required
                />
              </div>
            </form>
          )}

          {error && (
            <div role="alert" className="text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              disabled={requestMutation.isPending || confirmMutation.isPending}
            >
              Annulla
            </Button>
            {codeSent ? (
              <Button
                type="submit"
                form="delete-org-confirm"
                variant="destructive"
                disabled={code.length !== 6 || confirmMutation.isPending}
              >
                {confirmMutation.isPending ? "Conferma..." : "Conferma la cancellazione"}
              </Button>
            ) : (
              <Button
                type="submit"
                form="delete-org-request"
                variant="destructive"
                disabled={!password || !nameMatches || requestMutation.isPending}
              >
                {requestMutation.isPending ? "Invio del codice..." : "Invia il codice"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
