"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function CompleteInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <LogoMark className="h-12 w-12 mx-auto mb-2" />
          <CardTitle className="text-2xl font-bold text-center">Invalid invite</CardTitle>
          <CardDescription className="text-center">
            This invitation link is invalid or has expired. Please contact your administrator.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/complete-invite", { token, password });
      router.push("/login?invite=success");
    } catch {
      setError("This invitation link is invalid or has expired. Please contact your administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main id="main-content" className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Benvenuto in BCM</CardTitle>
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
