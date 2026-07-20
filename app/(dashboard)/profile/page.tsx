"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { PasswordFields } from "@/components/auth/PasswordFields";
import { calendarFeedService } from "@/services/calendarFeed.service";
import TwoFactorAuthCard from "@/components/profile/TwoFactorAuthCard";
import DataPrivacyCard from "@/components/profile/DataPrivacyCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data;
    },
  });

  const { data: calendarFeedUrl, isLoading: isLoadingFeedUrl } = useQuery({
    queryKey: ["calendar-feed-url"],
    queryFn: calendarFeedService.getUrl,
  });

  const regenerateFeedMutation = useMutation({
    mutationFn: calendarFeedService.regenerate,
    onSuccess: (url) => {
      queryClient.setQueryData(["calendar-feed-url"], url);
      toast.success("Link del calendario rigenerato: quello precedente non funziona più");
    },
    onError: () => toast.error("Rigenerazione del link non riuscita"),
  });

  const handleCopyFeedUrl = async () => {
    if (!calendarFeedUrl) return;
    try {
      await navigator.clipboard.writeText(calendarFeedUrl);
      toast.success("Link copiato negli appunti");
    } catch {
      toast.error("Copia negli appunti non riuscita");
    }
  };

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

      <TwoFactorAuthCard />

      <DataPrivacyCard />

      {/* Calendar feed */}
      <Card>
        <CardHeader>
          <CardTitle>Calendario scadenze</CardTitle>
          <CardDescription>
            Iscriviti a questo link da Google Calendar, Outlook o Apple Calendar per vedere le
            scadenze dei tuoi contratti direttamente nel tuo calendario
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingFeedUrl ? (
            <p className="text-sm text-muted-foreground">Caricamento...</p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Input readOnly value={calendarFeedUrl ?? ""} className="font-mono text-xs" />
                <Button variant="outline" size="sm" onClick={handleCopyFeedUrl} aria-label="Copia link">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => regenerateFeedMutation.mutate()}
                  disabled={regenerateFeedMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {regenerateFeedMutation.isPending ? "Rigenerazione..." : "Rigenera link"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Chiunque abbia questo link può vedere le scadenze dei tuoi contratti: rigeneralo se
                pensi che sia stato condiviso per errore.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
