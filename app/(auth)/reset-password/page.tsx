"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { PasswordFields } from "@/components/auth/PasswordFields";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogoMark } from "@/components/layout/Logo";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <main id="main-content" className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <LogoMark className="h-12 w-12 mx-auto mb-2" />
              <CardTitle className="text-2xl font-bold text-center">Link non valido</CardTitle>
              <CardDescription className="text-center">
                Il link per reimpostare la password non è valido o è scaduto.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Richiedi un nuovo link
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La password deve contenere almeno 8 caratteri.");
      return;
    }
    if (password !== confirm) {
      setError("Le password non coincidono.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      router.push("/login?reset=success");
    } catch {
      setError("Il link non è valido o è scaduto. Richiedine uno nuovo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main id="main-content" className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Reimposta password</CardTitle>
            <CardDescription className="text-center">
              Inserisci la nuova password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <PasswordFields
                password={password}
                confirm={confirm}
                onPasswordChange={setPassword}
                onConfirmChange={setConfirm}
                error={error}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Reimpostazione…" : "Reimposta password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
