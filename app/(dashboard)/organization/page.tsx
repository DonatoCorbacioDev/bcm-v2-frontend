"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { organizationService } from "@/services/organization.service";
import { tierLabel } from "@/lib/tierLabels";
import {
  organizationBankDetailsSchema,
  type OrganizationBankDetailsFormData,
} from "@/lib/validations/organization.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OrganizationPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAdmin) router.replace("/dashboard");
  }, [isAdmin, router]);

  const { data: organization, isLoading } = useQuery({
    queryKey: ["organization", "me"],
    queryFn: organizationService.getMine,
    enabled: isAdmin,
  });

  // The API returns iban/bic masked (e.g. "IT...3456"), never the full
  // value -- so these inputs are "set a NEW value" fields, not an editable
  // copy of the current one. They always start blank: pre-filling with the
  // masked string would let someone accidentally save "IT...3456" back as
  // if it were a real IBAN.
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationBankDetailsFormData>({
    resolver: zodResolver(organizationBankDetailsSchema),
    defaultValues: { iban: "", bic: "" },
  });

  const updateMutation = useMutation({
    mutationFn: organizationService.update,
    onSuccess: (updated) => {
      queryClient.setQueryData(["organization", "me"], updated);
      toast.success("Dati bancari aggiornati");
      reset({ iban: "", bic: "" });
    },
    onError: () => toast.error("Aggiornamento dei dati bancari non riuscito"),
  });

  const removeMutation = useMutation({
    mutationFn: organizationService.update,
    onSuccess: (updated) => {
      queryClient.setQueryData(["organization", "me"], updated);
      toast.success("Rimosso");
    },
    onError: () => toast.error("Rimozione non riuscita"),
  });

  // A blank field means "leave it as is": only non-empty inputs are sent,
  // so the backend's own null-means-unchanged rule for this endpoint holds.
  const onSubmit = (data: OrganizationBankDetailsFormData) => {
    const payload: { iban?: string; bic?: string } = {};
    if (data.iban !== "") payload.iban = data.iban;
    if (data.bic !== "") payload.bic = data.bic;
    updateMutation.mutate(payload);
  };

  const handleRemove = (field: "iban" | "bic") => {
    const label = field === "iban" ? "l'IBAN" : "il BIC";
    if (!window.confirm(`Rimuovere ${label} salvato per questa organizzazione?`)) return;
    removeMutation.mutate({ [field]: "" });
  };

  if (!isAdmin) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Organizzazione</h1>
        <p className="text-muted-foreground mt-2">
          Impostazioni dell&apos;organizzazione e conto di addebito per i pagamenti SEPA
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dettagli organizzazione</CardTitle>
          <CardDescription>Informazioni generali dell&apos;account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Caricamento...</p>
          ) : (
            <>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Nome</span>
                <span className="text-sm font-medium">{organization?.name}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Piano</span>
                <Badge variant="secondary">{organization?.subscriptionTier ? tierLabel(organization.subscriptionTier) : ""}</Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conto di addebito SEPA</CardTitle>
          <CardDescription>
            IBAN e BIC usati come conto debitore quando generi un pagamento SEPA per una fattura fornitore
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">IBAN attuale</span>
              <span className="flex items-center gap-2">
                <span className="font-mono">{organization?.iban ?? "Non impostato"}</span>
                {organization?.iban && (
                  <button
                    type="button"
                    onClick={() => handleRemove("iban")}
                    className="text-xs text-muted-foreground underline hover:text-destructive"
                  >
                    Rimuovi
                  </button>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">BIC attuale</span>
              <span className="flex items-center gap-2">
                <span className="font-mono">{organization?.bic ?? "Non impostato"}</span>
                {organization?.bic && (
                  <button
                    type="button"
                    onClick={() => handleRemove("bic")}
                    className="text-xs text-muted-foreground underline hover:text-destructive"
                  >
                    Rimuovi
                  </button>
                )}
              </span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Per motivi di sicurezza l&apos;IBAN/BIC completo non viene più mostrato — inserisci un valore
              nuovo qui sotto solo se vuoi sostituirlo.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="iban" className="block text-sm font-medium mb-2">
                Nuovo IBAN
              </label>
              <Input
                id="iban"
                {...register("iban")}
                placeholder="IT60X0542811101000000123456"
                className={errors.iban ? "border-destructive" : ""}
              />
              {errors.iban && (
                <p className="text-destructive text-sm mt-1">{errors.iban.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="bic" className="block text-sm font-medium mb-2">
                Nuovo BIC / SWIFT
              </label>
              <Input
                id="bic"
                {...register("bic")}
                placeholder="UNCRITMMXXX"
                className={errors.bic ? "border-destructive" : ""}
              />
              {errors.bic && (
                <p className="text-destructive text-sm mt-1">{errors.bic.message}</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting ? "Salvataggio..." : "Salva"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
