"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { usePasswordResetForm } from "@/hooks/usePasswordResetForm";
import { PasswordFields } from "@/components/auth/PasswordFields";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { LogoMark } from "@/components/layout/Logo";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { password, setPassword, confirm, setConfirm, isLoading, error, handleSubmit } =
    usePasswordResetForm({
      onSubmit: async (newPassword) => {
        await api.post("/auth/reset-password", { token, newPassword });
        router.push("/login?reset=success");
      },
      submitErrorMessage: "Il link non è valido o è scaduto. Richiedine uno nuovo.",
    });

  if (!token) {
    return (
      <main id="main-content" className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <LogoMark className="h-12 w-12 mx-auto mb-2" />
              <h1 className="text-2xl font-bold text-center">Link non valido</h1>
              <CardDescription className="text-center">
                Il link per reimpostare la password non è valido o è scaduto.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline dark:text-[var(--accent-foreground)]">
                Richiedi un nuovo link
              </Link>
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
            <h1 className="text-2xl font-bold text-center">Reimposta password</h1>
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
