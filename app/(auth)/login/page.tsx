"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/layout/Logo";
import { TwoFactorEnrollment } from "@/components/auth/TwoFactorEnrollment";
import { useDarkMode } from "@/hooks/useDarkMode";
import { ArrowLeft, ArrowRight, Lock, Moon, Sun } from "lucide-react";

// Public on purpose: printed on this page and on the landing (seeded nightly
// by bcm-v2-docker ops/demo/demo-reset.sh, MANAGER role, no 2FA).
const DEMO_CREDENTIALS = { username: "demo", password: "BcmDemo#2026" } as const;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, verifyTwoFactor, finishLogin, isLoading, error } = useAuth();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [setupToken, setSetupToken] = useState<string | null>(null);

  const resetSuccess = searchParams.get("reset") === "success";
  const inviteSuccess = searchParams.get("invite") === "success";
  const idleSignOut = searchParams.get("reason") === "idle";
  const isDemo = searchParams.get("demo") === "1";

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await login(credentials);
    if (result.success) {
      router.push("/dashboard");
    } else if (result.mfaRequired) {
      setMfaToken(result.mfaToken);
    } else if (result.mfaSetupRequired) {
      setSetupToken(result.setupToken);
    }
  };

  // The public demo, one click from the landing's "Prova la demo". The
  // credentials are public: they are printed on this page and on the landing.
  const enterDemo = async () => {
    const result = await login(DEMO_CREDENTIALS);
    if (result.success) router.push("/dashboard");
  };

  const handleMfaSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!mfaToken) return;
    const success = await verifyTwoFactor(mfaToken, mfaCode);
    if (success) router.push("/dashboard");
  };

  return (
    <div className="flex-1 grid md:grid-cols-[1.08fr_1fr] min-h-screen">
      {/* ── Left brand panel ── */}
      <aside
        aria-label="Presentazione applicazione"
        className="hidden md:flex flex-col justify-between p-10 text-white relative overflow-hidden"
        style={{
          background:
            "linear-gradient(155deg,var(--brand-hero-from) 0%,var(--brand-hero-via) 48%,var(--brand-hero-to) 100%)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <LogoMark size={36} />
          <span className="text-[15px] font-bold tracking-tight opacity-90">
            Business Contracts Manager
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10 max-w-md">
          <h1 className="font-display mb-4 text-[42px] font-medium leading-[1.08] tracking-[-0.015em]">
            Contratti, scadenze e fatture dei fornitori, in un posto solo.
          </h1>
          <p className="text-[15px] leading-relaxed opacity-75">
            Scadenze, valori e documenti di tutti i tuoi contratti, sempre sotto
            controllo.
          </p>
        </div>

        {/* Compliance footer */}
        <div className="flex items-center gap-2 relative z-10 opacity-60">
          <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="text-[12px]">
            Dati conservati in Italia, nel rispetto del{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 decoration-white/40 hover:decoration-white hover:opacity-80"
            >
              GDPR
            </Link>
          </span>
        </div>
      </aside>

      {/* ── Right form panel ── */}
      <main
        id="main-content"
        className="flex flex-col items-center justify-center p-8 relative bg-card"
      >
        {/* Back to home */}
        <Link
          href="/"
          className="absolute top-4 left-4 flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Torna alla home
        </Link>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleDark}
          className="absolute top-4 right-4 h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          aria-label={isDark ? "Modalità chiara" : "Modalità scura"}
        >
          {isDark ? (
            <Sun className="h-[18px] w-[18px] text-muted-foreground" aria-hidden="true" />
          ) : (
            <Moon className="h-[18px] w-[18px] text-muted-foreground" aria-hidden="true" />
          )}
        </button>

        <div className="w-full max-w-[380px]">
          {/* Logo (mobile) + heading */}
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <LogoMark size={44} />
            </div>
            <h2 className="font-display text-[28px] font-medium text-foreground tracking-[-0.01em]">
              Accedi al tuo account
            </h2>
            <p className="text-[13px] text-muted-foreground mt-1">
              Inserisci le credenziali per continuare
            </p>
          </div>

          {/* Public demo callout */}
          {isDemo && (
            <div className="mb-6 rounded-lg border border-border bg-muted/60 p-4 text-[13px] text-foreground">
              <p className="font-medium mb-1">Demo pubblica</p>
              <p className="text-muted-foreground mb-3">
                Un&apos;azienda di esempio con contratti, fatture e scadenze. I dati vengono
                ripristinati ogni notte.
              </p>
              <Button
                type="button"
                onClick={enterDemo}
                disabled={isLoading}
                className="w-full h-[44px] text-[14px] font-semibold"
              >
                {isLoading ? "Accesso in corso…" : "Entra nella demo"}
              </Button>
              <p className="mt-3 text-[12px] text-muted-foreground">
                Oppure accedi qui sotto con utente <span className="font-mono font-semibold">{DEMO_CREDENTIALS.username}</span>{" "}
                e password <span className="font-mono font-semibold">{DEMO_CREDENTIALS.password}</span>.
              </p>
            </div>
          )}

          {/* Success messages */}
          {resetSuccess && (
            <div
              role="status"
              aria-live="polite"
              className="mb-4 text-sm text-[var(--status-green-fg)] bg-[var(--status-green-bg)] rounded-lg py-2.5 px-3 text-center"
            >
              Password reimpostata. Ora puoi accedere.
            </div>
          )}
          {idleSignOut && (
            <div
              role="status"
              aria-live="polite"
              className="mb-4 text-sm text-muted-foreground bg-muted rounded-lg py-2.5 px-3 text-center"
            >
              Sessione chiusa dopo 30 minuti di inattività. Accedi di nuovo per continuare.
            </div>
          )}
          {inviteSuccess && (
            <div
              role="status"
              aria-live="polite"
              className="mb-4 text-sm text-[var(--status-green-fg)] bg-[var(--status-green-bg)] rounded-lg py-2.5 px-3 text-center"
            >
              Account attivato. Ora puoi accedere.
            </div>
          )}

          {setupToken ? (
            <TwoFactorEnrollment
              setupToken={setupToken}
              onComplete={async (token) => {
                await finishLogin(token);
                router.push("/dashboard");
              }}
              onCancel={() => setSetupToken(null)}
              cancelLabel="Torna al login"
            />
          ) : mfaToken ? (
            <form method="post" onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="mfa-code" className="text-[13px] font-medium">
                  Codice di verifica
                </Label>
                <Input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456 oppure un codice di recupero"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  required
                  autoFocus
                  className="h-[42px] text-[13px]"
                />
                <p className="text-[12px] text-muted-foreground">
                  Inserisci il codice a 6 cifre della tua app di autenticazione, oppure uno dei
                  tuoi codici di recupero.
                </p>
              </div>

              {error && (
                <div role="alert" className="text-[13px] text-destructive text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-[44px] text-[14px] font-semibold gap-2 mt-2"
                disabled={isLoading}
              >
                {isLoading ? "Verifica in corso…" : "Verifica"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full h-[38px] text-[13px]"
                onClick={() => { setMfaToken(null); setMfaCode(""); }}
              >
                Torna al login
              </Button>
            </form>
          ) : (
            <form method="post" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-[13px] font-medium">
                  Nome utente
                </Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="nome.utente"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  required
                  className="h-[42px] text-[13px]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[13px] font-medium">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-[12px] text-primary hover:underline dark:text-[var(--accent-foreground)]"
                  >
                    Password dimenticata?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  required
                  className="h-[42px] text-[13px]"
                />
              </div>

              {error && (
                <div role="alert" className="text-[13px] text-destructive text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-[44px] text-[14px] font-semibold gap-2 mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Accesso in corso…"
                ) : (
                  <>
                    Accedi
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </Button>

            </form>
          )}

          <p className="mt-6 text-center text-[12px] text-muted-foreground">
            Non hai un account?{" "}
            <Link href="/register-org" className="text-primary font-medium hover:underline dark:text-[var(--accent-foreground)]">
              Registra la tua organizzazione
            </Link>
          </p>

          <p className="mt-4 text-center text-[12px] text-muted-foreground">
            Non riesci ad accedere? Chiedi all&apos;amministratore della tua organizzazione.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
