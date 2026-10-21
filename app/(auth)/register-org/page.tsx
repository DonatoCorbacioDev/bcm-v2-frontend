"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useState } from "react";
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDeclaration = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setDeclarations((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post<AuthTokenResponse>("/organizations/register", {
        ...form,
        ...declarations,
        termsVersion: TERMS_VERSION,
      });
      const { token } = data;

      const { data: userProfile } = await api.get<UserProfile>("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAuth(userProfile, token);
      router.push("/dashboard");
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }> & { userMessage?: string };
      const message =
        axiosError.userMessage ||
        axiosError.response?.data?.message ||
        "Registrazione non riuscita. Riprova.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

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
          </fieldset>

          {error && (
            <div role="alert" className="text-sm text-destructive text-center">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || !allDeclared}>
            {isLoading ? "Creazione in corso…" : "Crea organizzazione"}
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
