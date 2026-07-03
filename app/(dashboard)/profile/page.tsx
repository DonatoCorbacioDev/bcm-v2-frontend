"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { PasswordFields } from "@/components/auth/PasswordFields";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UserProfile {
  id: number;
  username: string;
  role: string;
  verified: boolean;
}

export default function ProfilePage() {
  const { user } = useAuthStore();

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("La password deve contenere almeno 8 caratteri.");
      return;
    }
    if (password !== confirm) {
      toast.error("Le password non coincidono.");
      return;
    }

    setIsSaving(true);
    try {
      await api.patch(`/users/${profile?.id ?? user?.id}`, { password });
      toast.success("Password aggiornata con successo!");
      setPassword("");
      setConfirm("");
    } catch {
      toast.error("Aggiornamento della password non riuscito.");
    } finally {
      setIsSaving(false);
    }
  };

  const displayProfile = profile ?? user;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Il mio profilo</h1>
        <p className="text-muted-foreground mt-2">Le informazioni del tuo account</p>
      </div>

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
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Nome utente</span>
                <span className="text-sm font-medium">{displayProfile?.username}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Ruolo</span>
                <Badge variant="secondary">{displayProfile?.role}</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
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
          <form onSubmit={handlePasswordChange} className="space-y-4">
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
        </CardContent>
      </Card>
    </div>
  );
}
