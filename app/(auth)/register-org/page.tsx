"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AxiosError } from "axios";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { LogoMark } from "@/components/layout/Logo";
import { ONEROUS_CLAUSES, TERMS_VERSION } from "@/lib/legal";

interface RegisterOrgForm {
  organizationName: string;
  adminUsername: string;
  adminPassword: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
}

// The three declarations are separate on purpose: the specific approval of
// onerous clauses (arts. 1341-1342 c.c.) is only valid as its own, distinct
// act — folding it into the general "I accept the Terms" box would void it.
interface Declarations {
  termsAccepted: boolean;
  professionalUse: boolean;
  onerousClausesApproved: boolean;
}

interface AuthTokenResponse {
  token: string;
}

interface RegistrationStarted {
  registrationId: string;
  expiresInMinutes: number;
  resendCooldownSeconds: number;
}

interface UserProfile {
  id: number;
  username: string;
  managerId: number;
  role: string;
  roleId: number;
  verified: boolean;
  createdAt: string;
}

export default function RegisterOrgPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<RegisterOrgForm>({
    organizationName: "",
    adminUsername: "",
    adminPassword: "",
    adminEmail: "",
    adminFirstName: "",
    adminLastName: "",
  });
  const [declarations, setDeclarations] = useState<Declarations>({
    termsAccepted: false,
    professionalUse: false,
    onerousClausesApproved: false,
  });
  const allDeclared = Object.values(declarations).every(Boolean);
  // Set once the code has been emailed: the page then asks for it instead of the form.
  const [pending, setPending] = useState<RegistrationStarted | null>(null);
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDeclaration = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setDeclarations((prev) => ({ ...prev, [name]: checked }));
  };

  const showError = (err: unknown) => {
    const axiosError = err as AxiosError<{ message?: string }> & { userMessage?: string };
    setError(
      axiosError.userMessage ||
        axiosError.response?.data?.message ||
        "Registrazione non riuscita. Riprova."
    );
  };

  const codeSent = (data: RegistrationStarted) => {
    setPending(data);
    setResendIn(data.resendCooldownSeconds);
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post<RegistrationStarted>("/organizations/register", {
        ...form,
        ...declarations,
        termsVersion: TERMS_VERSION,
      });
      setCode("");
      setNotice(null);
      codeSent(data);
    } catch (err) {
      showError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pending) return;
    setIsLoading(true);
    setError(null);
    setNotice(null);

    try {
      const { data } = await api.post<AuthTokenResponse>("/organizations/register/confirm", {
        registrationId: pending.registrationId,
        code,
      });
      const { token } = data;

      const { data: userProfile } = await api.get<UserProfile>("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAuth(userProfile, token);
      router.push("/dashboard");
    } catch (err) {
      showError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pending) return;
    setError(null);
    setNotice(null);
    try {
      const { data } = await api.post<RegistrationStarted>("/organizations/register/resend", {
        registrationId: pending.registrationId,
      });
      codeSent(data);
      setCode("");
      setNotice("Ti abbiamo inviato un nuovo codice: quello precedente non è più valido.");
    } catch (err) {
      showError(err);
    }
  };

  const backToForm = () => {
    setPending(null);
    setError(null);
    setNotice(null);
  };

  if (pending) {
    return (
      <main id="main-content" className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
      <Card>
        <CardHeader className="space-y-1">
          <LogoMark className="h-12 w-12 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-center">Conferma la registrazione</h1>
          <CardDescription className="text-center">
            Ti abbiamo inviato un codice a 6 cifre a <strong>{form.adminEmail}</strong>. È valido
            per {pending.expiresInMinutes} minuti.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConfirm} className="space-y-4">
            {/* What the code signs, shown right where it is typed: the specific
                approval must be attributable to this person and to these clauses. */}
            <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground space-y-2">
              <p>Inserendo il codice firmi elettronicamente:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>l&apos;accettazione dei Termini di servizio (versione {TERMS_VERSION});</li>
                <li>la dichiarazione di agire per scopi imprenditoriali o professionali;</li>
                <li>
                  l&apos;approvazione specifica, ai sensi degli artt. 1341 e 1342 c.c., delle clausole
                  n. {ONEROUS_CLAUSES}.
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationCode">Codice di conferma</Label>
              <Input
                id="registrationCode"
                name="registrationCode"
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

            {error && (
              <div role="alert" className="text-sm text-destructive text-center">
                {error}
              </div>
            )}
            {notice && (
              <div role="status" className="text-sm text-muted-foreground text-center">
                {notice}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
              {isLoading ? "Conferma in corso…" : "Firma e crea organizzazione"}
            </Button>

            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={backToForm}
                className="text-primary hover:underline dark:text-[var(--accent-foreground)]"
              >
                Modifica i dati
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendIn > 0}
                className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline dark:text-[var(--accent-foreground)]"
              >
                {resendIn > 0 ? `Invia un nuovo codice (${resendIn}s)` : "Invia un nuovo codice"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="flex-1 flex items-center justify-center p-8">
    <div className="w-full max-w-md">
    <Card>
      <CardHeader className="space-y-1">
        <LogoMark className="h-12 w-12 mx-auto mb-2" />
        <h1 className="text-2xl font-bold text-center">
          Registra Organizzazione
        </h1>
        <CardDescription className="text-center">
          Crea la tua organizzazione e l&apos;account amministratore
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organizationName">Nome organizzazione</Label>
            <Input
              id="organizationName"
              name="organizationName"
              type="text"
              placeholder="Acme S.p.A."
              value={form.organizationName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="adminFirstName">Nome</Label>
              <Input
                id="adminFirstName"
                name="adminFirstName"
                type="text"
                placeholder="Mario"
                value={form.adminFirstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminLastName">Cognome</Label>
              <Input
                id="adminLastName"
                name="adminLastName"
                type="text"
                placeholder="Rossi"
                value={form.adminLastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminEmail">Email</Label>
            <Input
              id="adminEmail"
              name="adminEmail"
              type="email"
              placeholder="admin@acme.com"
              value={form.adminEmail}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminUsername">Nome utente</Label>
            <Input
              id="adminUsername"
              name="adminUsername"
              type="text"
              placeholder="admin"
              value={form.adminUsername}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminPassword">Password</Label>
            <Input
              id="adminPassword"
              name="adminPassword"
              type="password"
              placeholder="••••••••"
              value={form.adminPassword}
              onChange={handleChange}
              required
            />
          </div>

          <fieldset className="space-y-3 pt-1">
            <legend className="sr-only">Dichiarazioni obbligatorie</legend>
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={declarations.termsAccepted}
                onChange={handleDeclaration}
                required
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />
              <span>
                Accetto i{" "}
                <Link href="/termini" target="_blank" className="text-primary underline dark:text-[var(--accent-foreground)]">
                  Termini di servizio
                </Link>{" "}
                e ho letto l&apos;
                <Link href="/privacy" target="_blank" className="text-primary underline dark:text-[var(--accent-foreground)]">
                  Informativa privacy
                </Link>
                .
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                name="professionalUse"
                checked={declarations.professionalUse}
                onChange={handleDeclaration}
                required
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />
              <span>Dichiaro di agire per scopi imprenditoriali o professionali, e non come consumatore.</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                name="onerousClausesApproved"
                checked={declarations.onerousClausesApproved}
                onChange={handleDeclaration}
                required
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />
              <span>
                Ai sensi degli artt. 1341 e 1342 c.c. approvo specificamente le clausole dei Termini
                n. {ONEROUS_CLAUSES}.
              </span>
            </label>
            <p className="text-xs text-muted-foreground">
              Ti invieremo un codice via email: inserendolo confermi l&apos;indirizzo e firmi queste
              dichiarazioni.
            </p>
          </fieldset>

          {error && (
            <div role="alert" className="text-sm text-destructive text-center">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || !allDeclared}>
            {isLoading ? "Invio del codice…" : "Continua"}
          </Button>

          <div className="text-center">
            <span className="text-sm text-muted-foreground">Hai già un account? </span>
            <Link href="/login" className="text-sm text-primary hover:underline dark:text-[var(--accent-foreground)]">
              Accedi
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
    </div>
    </main>
  );
}
