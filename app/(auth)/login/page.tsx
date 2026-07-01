"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/layout/Logo";
import { useDarkMode } from "@/hooks/useDarkMode";
import { ArrowRight, Lock, Moon, Sun } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error } = useAuth();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [credentials, setCredentials] = useState({ username: "", password: "" });

  const resetSuccess = searchParams.get("reset") === "success";
  const inviteSuccess = searchParams.get("invite") === "success";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(credentials);
    if (success) router.push("/dashboard");
  };

  return (
    <div className="flex-1 grid md:grid-cols-[1.08fr_1fr] min-h-screen">
      {/* ── Left brand panel ── */}
      <div
        className="hidden md:flex flex-col justify-between p-10 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(155deg,#13235f 0%,#1d3fa8 48%,#2563eb 100%)",
        }}
      >
        {/* Glow circles */}
        <div
          className="absolute -top-20 -right-20 h-80 w-80 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-10 -left-20 h-60 w-60 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
          aria-hidden="true"
        />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <LogoMark size={36} />
          <span className="text-[15px] font-bold tracking-tight opacity-90">
            Business Contracts Manager
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10 max-w-md">
          <h1
            className="font-bold leading-tight mb-4"
            style={{ fontSize: "38px", letterSpacing: "-0.01em" }}
          >
            La gestione dei contratti,{" "}
            <span className="opacity-90">semplice e sicura.</span>
          </h1>
          <p className="text-[15px] leading-relaxed opacity-75">
            Tieni sotto controllo scadenze, valori e documenti di ogni contratto,
            con notifiche intelligenti e analisi in tempo reale.
          </p>
        </div>

        {/* Compliance footer */}
        <div className="flex items-center gap-2 relative z-10 opacity-60">
          <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="text-[12px]">
            Conforme GDPR · AgID · ISO&nbsp;27001 — dati ospitati in Italia
          </span>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <main
        id="main-content"
        className="flex flex-col items-center justify-center p-8 relative bg-card"
      >
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
            <p className="text-[12px] font-semibold text-[var(--muted-foreground)] tracking-[0.08em] uppercase mb-2">
              Area riservata
            </p>
            <h2 className="text-[21px] font-bold text-foreground tracking-tight">
              Accedi al tuo account
            </h2>
            <p className="text-[13px] text-muted-foreground mt-1">
              Inserisci le credenziali per continuare
            </p>
          </div>

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
          {inviteSuccess && (
            <div
              role="status"
              aria-live="polite"
              className="mb-4 text-sm text-[var(--status-green-fg)] bg-[var(--status-green-bg)] rounded-lg py-2.5 px-3 text-center"
            >
              Account attivato. Ora puoi accedere.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-[13px] font-medium">
                Nome utente
              </Label>
              <Input
                id="username"
                type="text"
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
                  className="text-[12px] text-primary hover:underline"
                >
                  Password dimenticata?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
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

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-card text-[12px] text-muted-foreground">oppure</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-[42px] text-[13px] gap-2"
              disabled
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary text-white text-[10px] font-bold shrink-0">
                ID
              </span>
              Entra con SPID / CIE
            </Button>
          </form>

          <p className="mt-6 text-center text-[12px] text-muted-foreground">
            Non hai un account?{" "}
            <Link href="/register-org" className="text-primary font-medium hover:underline">
              Registra la tua organizzazione
            </Link>
          </p>

          <p className="mt-4 text-center text-[12px] text-muted-foreground">
            <Link href="/register-org" className="hover:underline">
              Contatta l&apos;amministratore
            </Link>
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
