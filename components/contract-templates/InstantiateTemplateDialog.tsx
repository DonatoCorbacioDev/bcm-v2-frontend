"use client";

/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import type { ContractTemplate } from "@/types";
import { contractTemplatesService } from "@/services/contractTemplates.service";
import { contractsQueryKeys } from "@/hooks/queries/contracts.queryKeys";
import { useBusinessAreas } from "@/hooks/useBusinessAreas";
import { useManagers } from "@/hooks/useManagers";
import { useCounterparties } from "@/hooks/useCounterparties";
import { useAuthStore } from "@/store/authStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MissingPrerequisiteBanner } from "@/components/shared/MissingPrerequisiteBanner";
import { SelectField } from "@/components/shared/SelectField";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { instantiateTemplateSchema, type InstantiateTemplateFormData } from "@/lib/validations/contractTemplate.schema";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Bozza" },
  { value: "ACTIVE", label: "Attivo" },
  { value: "CANCELLED", label: "Annullato" },
] as const;

interface InstantiateTemplateDialogProps {
  readonly template: ContractTemplate | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export default function InstantiateTemplateDialog({
  template,
  open,
  onOpenChange,
}: InstantiateTemplateDialogProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN");
  const businessAreasQuery = useBusinessAreas();
  const managersQuery = useManagers();
  const counterpartiesQuery = useCounterparties();

  /* istanbul ignore next */
  const businessAreas = businessAreasQuery.data ?? [];
  /* istanbul ignore next */
  const managers = managersQuery.data ?? [];
  /* istanbul ignore next */
  const counterparties = counterpartiesQuery.data ?? [];

  // The template's own default area covers the requirement when it has one; only
  // block when this instantiation would need a fresh pick and none exist (mirrors
  // the backend check in ContractTemplateService.instantiateTemplate).
  const missingRequiredArea =
    !template?.businessAreaId && businessAreasQuery.isSuccess && businessAreas.length === 0;

  const instantiateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: InstantiateTemplateFormData }) =>
      contractTemplatesService.instantiate(id, {
        counterpartyId: payload.counterpartyId,
        contractNumber: payload.contractNumber,
        wbsCode: payload.wbsCode || null,
        projectName: payload.projectName || null,
        startDate: payload.startDate,
        endDate: payload.endDate || null,
        businessAreaId: payload.businessAreaId || null,
        managerId: payload.managerId || null,
        status: payload.status || null,
      }),
    onSuccess: async (contract) => {
      await qc.invalidateQueries({ queryKey: contractsQueryKeys.list() });
      toast.success("Contratto creato", {
        action: {
          label: "Visualizza",
          onClick: () => router.push(`/contracts/${contract.id}`),
        },
      });
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Creazione del contratto non riuscita");
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm<InstantiateTemplateFormData>({
    resolver: zodResolver(instantiateTemplateSchema),
    defaultValues: {
      status: template?.defaultStatus ?? undefined,
      businessAreaId: template?.businessAreaId ?? undefined,
      managerId: template?.defaultManagerId ?? undefined,
    },
  });

  const onSubmit = async (data: InstantiateTemplateFormData) => {
    /* istanbul ignore next */
    if (!template) return;
    await instantiateMutation.mutateAsync({ id: template.id, payload: data });
    reset();
  };

  const submitLabel = useMemo(() => {
    /* istanbul ignore next */
    if (instantiateMutation.isPending) return "Creazione...";
    return "Crea contratto";
  }, [instantiateMutation.isPending]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crea contratto da template</DialogTitle>
          <DialogDescription>
            Template: <span className="font-medium">{template?.name}</span>
            {template?.defaultDurationDays && (
              <span className="text-muted-foreground ml-2">
                · durata predefinita {template.defaultDurationDays} giorni
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {missingRequiredArea && (
          <MissingPrerequisiteBanner
            message={
              isAdmin
                ? "Questo template non ha un'area di business predefinita e l'organizzazione non ne ha ancora nessuna: serve prima crearne una."
                : "Questo template non ha un'area di business predefinita e l'organizzazione non ne ha ancora nessuna. Contatta un amministratore."
            }
            actions={isAdmin ? [{ label: "Crea un'area di business", href: "/business-areas" }] : []}
          />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Counterparty */}
          <Controller
            control={control}
            name="counterpartyId"
            render={({ field }) => (
              <SelectField
                id="inst-counterpartyId"
                label={<>Controparte <span className="text-destructive">*</span></>}
                value={field.value ? String(field.value) : ""}
                onValueChange={/* istanbul ignore next */ (v) => field.onChange(Number(v))}
                placeholder="Seleziona la controparte"
                options={counterparties.map((cp) => ({ value: String(cp.id), label: cp.name }))}
                error={errors.counterpartyId?.message}
              />
            )}
          />

          {/* Contract Number */}
          <div className="space-y-2">
            <Label htmlFor="inst-contractNumber">
              Numero contratto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="inst-contractNumber"
              {...register("contractNumber")}
              placeholder="es. CTR-2026-001"
            />
            {errors.contractNumber && (
              <p className="text-sm text-destructive">{errors.contractNumber.message}</p>
            )}
          </div>

          {/* WBS + Project */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inst-wbsCode">Codice WBS</Label>
              <Input id="inst-wbsCode" {...register("wbsCode")} placeholder="es. WBS-001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inst-projectName">Nome progetto</Label>
              <Input id="inst-projectName" {...register("projectName")} placeholder="Nome progetto" />
            </div>
          </div>

          {/* Start Date + End Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inst-startDate">
                Data inizio <span className="text-destructive">*</span>
              </Label>
              <Input id="inst-startDate" type="date" data-testid="inst-startDate" {...register("startDate")} />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="inst-endDate">
                Data fine
                {template?.defaultDurationDays && (
                  <span className="text-muted-foreground text-xs ml-1">
                    (calcolata se vuota)
                  </span>
                )}
              </Label>
              <Input id="inst-endDate" type="date" {...register("endDate")} />
            </div>
          </div>

          {/* Status override */}
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <SelectField
                id="inst-status"
                label="Stato"
                value={field.value ?? ""}
                onValueChange={/* istanbul ignore next */ (v) => field.onChange(v || null)}
                placeholder="Dal template"
                options={STATUS_OPTIONS}
              />
            )}
          />

          {/* Business Area override */}
          <Controller
            control={control}
            name="businessAreaId"
            render={({ field }) => (
              <SelectField
                id="inst-businessAreaId"
                label={
                  <>
                    Area di business
                    {!template?.businessAreaId && <span className="text-destructive ml-1">*</span>}
                  </>
                }
                value={field.value ? String(field.value) : ""}
                onValueChange={/* istanbul ignore next */ (v) => field.onChange(v ? Number(v) : null)}
                placeholder={template?.businessAreaId ? "Dal template" : "Seleziona area..."}
                options={businessAreas.map((area) => ({ value: String(area.id), label: area.name }))}
              />
            )}
          />

          {/* Manager override */}
          <Controller
            control={control}
            name="managerId"
            render={({ field }) => (
              <SelectField
                id="inst-managerId"
                label="Responsabile"
                value={field.value ? String(field.value) : ""}
                onValueChange={/* istanbul ignore next */ (v) => field.onChange(v ? Number(v) : null)}
                placeholder="Dal template"
                options={managers.map((m) => ({ value: String(m.id), label: `${m.firstName} ${m.lastName}` }))}
              />
            )}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={instantiateMutation.isPending}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={instantiateMutation.isPending || missingRequiredArea}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
