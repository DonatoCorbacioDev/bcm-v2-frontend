/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

"use client";

import { useState } from "react";
import { isAxiosError } from "axios";

import api from "@/lib/api";
import { useReauthStore } from "@/lib/reauth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  keepOpenOnOutsideClick,
} from "@/components/ui/dialog";

/**
 * Asks for the password again, and the 2FA code if the account uses one,
 * when the backend wants a fresh confirmation (lib/reauth.ts). Mounted once in
 * the dashboard layout; opens by itself.
 */
export function ReauthDialog() {
  const open = useReauthStore((s) => s.open);
  const confirmed = useReauthStore((s) => s.confirmed);
  const cancelled = useReauthStore((s) => s.cancelled);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setPassword("");
    setCode("");
    setError(null);
    setBusy(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ reauthToken: string }>("/auth/reauth", {
        password,
        code: code.trim() === "" ? undefined : code.trim(),
      });
      reset();
      confirmed(res.data.reauthToken);
    } catch (err) {
      setBusy(false);
      const message = isAxiosError(err) ? (err.response?.data as { message?: string } | undefined)?.message : undefined;
      setError(message ?? "Conferma non riuscita, riprova");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
          cancelled();
        }
      }}
    >
      <DialogContent onInteractOutside={keepOpenOnOutsideClick}>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Conferma la tua identità</DialogTitle>
            <DialogDescription>
              Per questa operazione serve di nuovo la tua password. La conferma vale 5 minuti.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reauth-password">Password</Label>
            <Input
              id="reauth-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reauth-code">Codice di verifica (solo se hai attivato la 2FA)</Label>
            <Input
              id="reauth-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={32}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                cancelled();
              }}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={busy || password === ""}>
              {busy ? "Verifica…" : "Conferma"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
