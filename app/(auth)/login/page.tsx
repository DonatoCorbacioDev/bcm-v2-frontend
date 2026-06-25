"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
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

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error } = useAuth();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const resetSuccess = searchParams.get("reset") === "success";
  const inviteSuccess = searchParams.get("invite") === "success";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(credentials);
    if (success) {
      router.push("/dashboard");
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <LogoMark className="h-12 w-12 mx-auto mb-2" />
        <h1 className="text-2xl font-bold text-center leading-none">
          Business Contracts Manager
        </h1>
        <CardDescription className="text-center">
          Inserisci le tue credenziali per accedere al sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {resetSuccess && (
          <div role="status" aria-live="polite" className="mb-4 text-sm text-green-600 text-center bg-green-50 dark:bg-green-900/20 rounded-md py-2 px-3">
            Password reimpostata con successo. Ora puoi accedere.
          </div>
        )}
        {inviteSuccess && (
          <div role="status" aria-live="polite" className="mb-4 text-sm text-green-600 text-center bg-green-50 dark:bg-green-900/20 rounded-md py-2 px-3">
            Account attivato con successo. Ora puoi accedere.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Nome utente</Label>
            <Input
              id="username"
              type="text"
              placeholder="Inserisci il nome utente"
              value={credentials.username}
              onChange={(e) =>
                setCredentials({ ...credentials, username: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              required
            />
          </div>
          {error && (
            <div role="alert" className="text-sm text-destructive text-center">{error}</div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Accesso in corso..." : "Accedi"}
          </Button>
          <div className="text-center space-y-1">
            <div>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Password dimenticata?
              </Link>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Non hai un account? </span>
              <Link href="/register-org" className="text-sm text-primary hover:underline">
                Registra la tua organizzazione
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
