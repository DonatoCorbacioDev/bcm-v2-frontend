"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { Copy, ShieldCheck } from "lucide-react";
import type { AxiosError } from "axios";
import { twoFactorAuthService } from "@/services/twoFactorAuth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TwoFactorEnrollmentProps {
  /** From login or from a new organization's confirmation: valid 10 minutes. */
  readonly setupToken: string;
  /** Called with the access token once the recovery codes have been seen. */
  readonly onComplete: (accessToken: string) => void | Promise<void>;
  readonly onCancel: () => void;
  readonly cancelLabel?: string;
}

function messageOf(err: unknown, fallback: string): string {
  const e = err as AxiosError<{ message?: string }> & { userMessage?: string };
  return e?.userMessage || e?.response?.data?.message || fallback;
}

/**
 * The 2FA setup an administrator must complete before the first session
 * (the backend's TwoFactorPolicy): scan the QR code, type a code, save the
 * recovery codes. Only then does the session start.
 */
export function TwoFactorEnrollment({ setupToken, onComplete, onCancel, cancelLabel = "Annulla" }: TwoFactorEnrollmentProps) {
  const [code, setCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{ token: string; recoveryCodes: string[] } | null>(null);
  const [copied, setCopied] = useState(false);

  // A query, not an effect: asked once per setup token even when React mounts twice.
  const setup = useQuery({
    queryKey: ["2fa-enroll", setupToken],
    queryFn: () => twoFactorAuthService.enrollSetup(setupToken),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  const otpAuthUri = setup.data?.otpAuthUri;
  useEffect(() => {
    if (!otpAuthUri) return;
    let cancelled = false;
    QRCode.toDataURL(otpAuthUri)
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { /* the manual key below still works */ });
    return () => { cancelled = true; };
  }, [otpAuthUri]);

  const confirm = useMutation({
    mutationFn: () => twoFactorAuthService.enrollConfirm(setupToken, code),
    onSuccess: (data) => setResult(data),
  });

  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[var(--status-green-fg)]">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          <p className="text-sm font-medium">Autenticazione a due fattori attiva</p>
        </div>
        <div className="rounded-lg border border-[var(--status-amber-fg)]/30 bg-[var(--status-amber-fg)]/5 p-3">
          <p className="text-sm font-medium text-foreground">Salva questi codici di recupero ora</p>
          <p className="text-xs text-muted-foreground mt-1">
            Ognuno vale una volta sola e ti fa accedere se perdi il telefono. Non potrai rivederli.
          </p>
        </div>
        <ul aria-label="Codici di recupero" className="grid grid-cols-2 gap-2 font-mono text-sm">
          {result.recoveryCodes.map((c) => (
            <li key={c} className="bg-muted rounded px-2 py-1 text-center">{c}</li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(result.recoveryCodes.join("\n"));
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" /> {copied ? "Copiati" : "Copia tutti"}
          </Button>
          <Button type="button" size="sm" className="flex-1" onClick={() => onComplete(result.token)}>
            Ho salvato i codici, continua
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        confirm.mutate();
      }}
    >
      <div className="space-y-1">
        <h3 className="text-[15px] font-semibold text-foreground">Attiva l&apos;autenticazione a due fattori</h3>
        <p className="text-[13px] text-muted-foreground">
          Gli account amministratore la richiedono: senza il codice del tuo telefono, una password
          rubata non basta per entrare.
        </p>
      </div>

      {setup.isLoading && <p className="text-sm text-muted-foreground">Preparazione…</p>}

      {setup.isError && (
        <div role="alert" className="text-[13px] text-destructive">
          {messageOf(setup.error, "Configurazione non disponibile: accedi di nuovo.")}
        </div>
      )}

      {setup.data && (
        <>
          <ol className="list-decimal pl-5 text-[13px] text-muted-foreground space-y-1">
            <li>Apri un&apos;app di autenticazione (Google Authenticator, Microsoft Authenticator, Authy…).</li>
            <li>Scansiona il codice QR, oppure inserisci la chiave a mano.</li>
            <li>Scrivi qui il codice a 6 cifre che l&apos;app mostra.</li>
          </ol>
          {qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="Codice QR per l'app di autenticazione" className="h-40 w-40 mx-auto" />
          )}
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Chiave manuale</p>
            <code className="text-sm font-mono bg-muted px-2 py-1 rounded break-all">{setup.data.secret}</code>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="enroll-code" className="text-[13px] font-medium">Codice di verifica</Label>
            <Input
              id="enroll-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              className="h-[42px] text-[13px]"
            />
          </div>
          {confirm.isError && (
            <div role="alert" className="text-[13px] text-destructive text-center">
              {messageOf(confirm.error, "Codice non valido. Riprova.")}
            </div>
          )}
          <Button type="submit" className="w-full h-[44px]" disabled={confirm.isPending || code.length !== 6}>
            {confirm.isPending ? "Verifica in corso…" : "Attiva e accedi"}
          </Button>
        </>
      )}

      <Button type="button" variant="ghost" className="w-full h-[38px] text-[13px]" onClick={onCancel}>
        {cancelLabel}
      </Button>
    </form>
  );
}
