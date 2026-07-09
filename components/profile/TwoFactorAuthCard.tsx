"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, Copy } from "lucide-react";
import { twoFactorAuthService } from "@/services/twoFactorAuth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Step = "idle" | "setup" | "recoveryCodes" | "disabling";

export default function TwoFactorAuthCard() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("idle");
  const [secret, setSecret] = useState<string | null>(null);
  const [otpAuthUri, setOtpAuthUri] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const { data: enabled, isLoading } = useQuery({
    queryKey: ["2fa-status"],
    queryFn: twoFactorAuthService.getStatus,
  });

  const setupMutation = useMutation({
    mutationFn: twoFactorAuthService.setup,
    onSuccess: (data) => {
      setSecret(data.secret);
      setOtpAuthUri(data.otpAuthUri);
      setStep("setup");
    },
    onError: () => toast.error("Avvio della configurazione 2FA non riuscito"),
  });

  useEffect(() => {
    if (step !== "setup" || !otpAuthUri) return;
    let cancelled = false;
    QRCode.toDataURL(otpAuthUri).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => { cancelled = true; };
  }, [step, otpAuthUri]);

  const confirmMutation = useMutation({
    mutationFn: () => twoFactorAuthService.confirm(confirmCode),
    onSuccess: (codes) => {
      setRecoveryCodes(codes);
      setStep("recoveryCodes");
      setConfirmCode("");
      queryClient.setQueryData(["2fa-status"], true);
    },
    onError: () => toast.error("Codice non valido"),
  });

  const disableMutation = useMutation({
    mutationFn: () => twoFactorAuthService.disable(disableCode),
    onSuccess: () => {
      toast.success("Autenticazione a due fattori disattivata");
      setDisableCode("");
      setStep("idle");
      queryClient.setQueryData(["2fa-status"], false);
    },
    onError: () => toast.error("Codice non valido"),
  });

  const handleFinish = () => {
    setStep("idle");
    setSecret(null);
    setOtpAuthUri(null);
    setQrDataUrl(null);
    setRecoveryCodes([]);
  };

  const handleCopyRecoveryCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      toast.success("Codici copiati negli appunti");
    } catch {
      toast.error("Copia negli appunti non riuscita");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Autenticazione a due fattori</CardTitle>
        <CardDescription>
          Richiedi un codice dalla tua app di autenticazione (Google Authenticator, Authy, ecc.)
          ad ogni accesso, oltre alla password
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Caricamento...</p>
        ) : (
          <>
            {step === "idle" && (
              <div className="flex items-center justify-between">
                {enabled ? (
                  <Badge variant="success" className="gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Attiva
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1.5">
                    <ShieldOff className="h-3.5 w-3.5" /> Non attiva
                  </Badge>
                )}
                {enabled ? (
                  <Button variant="outline" size="sm" onClick={() => setStep("disabling")}>
                    Disattiva
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setupMutation.mutate()} disabled={setupMutation.isPending}>
                    {setupMutation.isPending ? "Preparazione..." : "Attiva 2FA"}
                  </Button>
                )}
              </div>
            )}

            {step === "disabling" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Inserisci un codice dalla tua app di autenticazione (o un codice di recupero)
                  per confermare la disattivazione.
                </p>
                <Input
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  placeholder="123456"
                  className="max-w-[200px]"
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => disableMutation.mutate()}
                    disabled={disableMutation.isPending || !disableCode.trim()}
                  >
                    {disableMutation.isPending ? "Disattivazione..." : "Conferma disattivazione"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setStep("idle"); setDisableCode(""); }}>
                    Annulla
                  </Button>
                </div>
              </div>
            )}

            {step === "setup" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Scansiona il QR code con la tua app di autenticazione, oppure inserisci la
                  chiave manualmente.
                </p>
                {qrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="QR code per l'app di autenticazione" className="h-40 w-40" />
                )}
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                    Chiave manuale
                  </p>
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded break-all">{secret}</code>
                </div>
                <div>
                  <label htmlFor="totp-confirm-code" className="block text-sm font-medium mb-2">
                    Codice di verifica
                  </label>
                  <Input
                    id="totp-confirm-code"
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value)}
                    placeholder="123456"
                    className="max-w-[200px]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => confirmMutation.mutate()}
                    disabled={confirmMutation.isPending || !confirmCode.trim()}
                  >
                    {confirmMutation.isPending ? "Verifica..." : "Conferma e attiva"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleFinish}>
                    Annulla
                  </Button>
                </div>
              </div>
            )}

            {step === "recoveryCodes" && (
              <div className="space-y-4">
                <div className="rounded-lg bg-[var(--status-amber-bg,#fef3c7)] border border-[var(--status-amber-border,#f59e0b)] p-3">
                  <p className="text-sm font-medium">Salva questi codici di recupero ora</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ogni codice può essere usato una sola volta per accedere se perdi l&apos;accesso
                    alla tua app di autenticazione. Non potrai rivederli dopo aver chiuso questa
                    schermata.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {recoveryCodes.map((code) => (
                    <div key={code} className="bg-muted rounded px-2 py-1 text-center">
                      {code}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyRecoveryCodes}>
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Copia tutti
                  </Button>
                  <Button size="sm" onClick={handleFinish}>
                    Ho salvato i codici
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
