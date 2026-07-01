"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogoMark } from "@/components/layout/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inner = submitted ? (
    <Card>
      <CardHeader className="space-y-1">
        <LogoMark className="h-12 w-12 mx-auto mb-2" />
        <CardTitle className="text-2xl font-bold text-center">Controlla la tua email</CardTitle>
        <CardDescription className="text-center">
          Se esiste un account per <span className="font-medium">{email}</span>, abbiamo inviato un link per reimpostare la password.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Link href="/login" className="text-sm text-primary hover:underline">
          Torna al login
        </Link>
      </CardContent>
    </Card>
  ) : (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Password dimenticata</CardTitle>
        <CardDescription className="text-center">
          Inserisci la tua email e ti invieremo un link per reimpostare la password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nome@ente.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Invio in corso…" : "Invia link di reset"}
          </Button>
          <div className="text-center">
            <Link href="/login" className="text-sm text-primary hover:underline">
              Torna al login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <main id="main-content" className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md">{inner}</div>
    </main>
  );
}
