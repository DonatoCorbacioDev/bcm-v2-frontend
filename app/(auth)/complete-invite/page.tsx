"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function CompleteInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { password, setPassword, confirm, setConfirm, isLoading, error, handleSubmit } =
    usePasswordResetForm({
      onSubmit: async (newPassword) => {
        await api.post("/auth/complete-invite", { token, password: newPassword });
        router.push("/login?invite=success");
      },
      submitErrorMessage: "Questo link di invito non è valido o è scaduto. Contatta il tuo amministratore.",
    });

  if (!token) {
    return (
      <main id="main-content" className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <LogoMark className="h-12 w-12 mx-auto mb-2" />
              <h1 className="text-2xl font-bold text-center">Invito non valido</h1>
              <CardDescription className="text-center">
                Questo link di invito non è valido o è scaduto. Contatta il tuo amministratore.
              </CardDescription>
            </CardHeader>
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
            <h1 className="text-2xl font-bold text-center">Benvenuto in BCM</h1>
            <CardDescription className="text-center">
              Scegli una password per attivare il tuo account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <PasswordFields
                password={password}
                confirm={confirm}
                onPasswordChange={setPassword}
                onConfirmChange={setConfirm}
                passwordLabel="Password"
                error={error}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Attivazione…" : "Attiva account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function CompleteInvitePage() {
  return (
    <Suspense>
      <CompleteInviteContent />
    </Suspense>
  );
}
