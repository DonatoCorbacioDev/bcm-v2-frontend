"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { organizationService } from "@/services/organization.service";
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationBankDetailsFormData>({
    resolver: zodResolver(organizationBankDetailsSchema),
    values: {
      iban: organization?.iban ?? "",
      bic: organization?.bic ?? "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: organizationService.update,
    onSuccess: (updated) => {
      queryClient.setQueryData(["organization", "me"], updated);
      toast.success("Dati bancari aggiornati con successo");
      reset({ iban: updated.iban ?? "", bic: updated.bic ?? "" });
    },
    onError: () => toast.error("Aggiornamento dei dati bancari non riuscito"),
  });

  const onSubmit = (data: OrganizationBankDetailsFormData) => {
    updateMutation.mutate({ iban: data.iban, bic: data.bic });
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
                <Badge variant="secondary">{organization?.subscriptionTier}</Badge>
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
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="iban" className="block text-sm font-medium mb-2">
                IBAN
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
                BIC / SWIFT
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
