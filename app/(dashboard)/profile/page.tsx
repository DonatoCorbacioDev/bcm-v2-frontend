"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { PageHeader } from "@/components/layout/PageHeader";
import { useState } from "react";
import { isAxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { PasswordFields } from "@/components/auth/PasswordFields";
import { roleLabel } from "@/lib/roleLabels";
import TwoFactorAuthCard from "@/components/profile/TwoFactorAuthCard";
import DataPrivacyCard from "@/components/profile/DataPrivacyCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { passwordViolation } from "@/lib/validations/password";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UserProfile {
  id: string;
  username: string;
  role: string;
  verified: boolean;
  /** The public demo login: password and two-factor are disabled for it. */
  demoAccount?: boolean;
}

const DEMO_NOTE =
  "Nella demo pubblica questa impostazione è disattivata: l'account è condiviso con tutti i visitatori.";

/** The backend's own message (wrong current password...) or a generic fallback. */
function errorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(error)) {
    if (error.response?.status === 429) return "Troppi tentativi, riprova tra un minuto";
    return error.response?.data?.message || fallback;
  }
  return fallback;
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState("");

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data;
    },
  });


  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handlePasswordChange = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Inserisci la password attuale.");
      return;
    }
    const violation = passwordViolation(password);
    if (violation) {
      toast.error(violation);
      return;
    }
    if (password !== confirm) {
      toast.error("Le password non coincidono.");
      return;
    }

    setIsSaving(true);
    try {
      await api.post("/users/me/password", { currentPassword, newPassword: password });
      toast.success("Password aggiornata");
      setCurrentPassword("");
      setPassword("");
      setConfirm("");
    } catch (error) {
      toast.error(errorMessage(error, "Aggiornamento della password non riuscito."));
    } finally {
      setIsSaving(false);
    }
  };

  const displayProfile = profile ?? user;
  const isDemo = profile?.demoAccount === true;

  return (
    <div className="max-w-5xl space-y-6 lg:[&_[data-slot=card]]:grid lg:[&_[data-slot=card]]:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:[&_[data-slot=card]]:gap-x-8 lg:[&_[data-slot=card]]:items-start lg:[&_[data-slot=card-header]]:pr-0 lg:[&_[data-slot=card-content]]:col-start-2 lg:[&_[data-slot=card-content]]:row-start-1 lg:[&_[data-slot=card-content]]:row-span-2 lg:[&_[data-slot=card-content]]:pl-0 lg:[&_[data-slot=card-footer]]:col-start-2">
      <PageHeader title="Il mio profilo" description="Il tuo account, la password, la verifica in 2 passaggi e i tuoi dati." />

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Dettagli account</CardTitle>
          <CardDescription>Le informazioni attuali del tuo account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Caricamento...</p>
          ) : (
            <>
              <div className="grid gap-1 py-2 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center border-b border-border">
                <span className="text-sm text-muted-foreground">Nome utente</span>
                <span className="text-sm font-medium">{displayProfile?.username}</span>
              </div>
              <div className="grid gap-1 py-2 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center border-b border-border">
                <span className="text-sm text-muted-foreground">Ruolo</span>
                <Badge variant="secondary">
                  {displayProfile?.role ? roleLabel(displayProfile.role) : ""}
                </Badge>
              </div>
              <div className="grid gap-1 py-2 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
                <span className="text-sm text-muted-foreground">Stato account</span>
                {displayProfile?.verified ? (
                  <Badge variant="success">Verificato</Badge>
                ) : (
                  <Badge variant="destructive">Non verificato</Badge>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Cambia password</CardTitle>
          <CardDescription>Imposta una nuova password per il tuo account</CardDescription>
        </CardHeader>
        <CardContent>
          {isDemo ? (
            <p className="text-sm text-muted-foreground">{DEMO_NOTE}</p>
          ) : (
          <form method="post" onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Password attuale</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <PasswordFields
              password={password}
              confirm={confirm}
              onPasswordChange={setPassword}
              onConfirmChange={setConfirm}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Salvataggio..." : "Aggiorna password"}
              </Button>
            </div>
          </form>
          )}
        </CardContent>
      </Card>

      {isDemo ? (
        <Card>
          <CardHeader>
            <CardTitle>Autenticazione a due fattori</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{DEMO_NOTE}</p>
          </CardContent>
        </Card>
      ) : (
        <TwoFactorAuthCard />
      )}

      <DataPrivacyCard />

    </div>
  );
}
