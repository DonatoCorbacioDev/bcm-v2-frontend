"use client";

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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { instantiateTemplateSchema, type InstantiateTemplateFormData } from "@/lib/validations/contractTemplate.schema";

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
  const businessAreasQuery = useBusinessAreas();
  const managersQuery = useManagers();

  /* istanbul ignore next */
  const businessAreas = businessAreasQuery.data ?? [];
  /* istanbul ignore next */
  const managers = managersQuery.data ?? [];

  const instantiateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: InstantiateTemplateFormData }) =>
      contractTemplatesService.instantiate(id, {
        customerName: payload.customerName,
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
      toast.success("Contratto creato con successo!", {
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Customer Name */}
          <div className="space-y-2">
            <Label htmlFor="inst-customerName">
              Nome cliente <span className="text-destructive">*</span>
            </Label>
            <Input
              id="inst-customerName"
              {...register("customerName")}
              placeholder="Inserisci il nome del cliente"
            />
            {errors.customerName && (
              <p className="text-sm text-destructive">{errors.customerName.message}</p>
            )}
          </div>

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
              <Input id="inst-startDate" type="date" {...register("startDate")} />
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
              <div className="space-y-2">
                <Label htmlFor="inst-status">Stato</Label>
                <Select
                  value={field.value ?? ""}
                  onValueChange={/* istanbul ignore next */ (v) => field.onChange(v || null)}
                >
                  <SelectTrigger id="inst-status">
                    <SelectValue placeholder="Dal template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Bozza</SelectItem>
                    <SelectItem value="ACTIVE">Attivo</SelectItem>
                    <SelectItem value="CANCELLED">Annullato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          {/* Business Area override */}
          <Controller
            control={control}
            name="businessAreaId"
            render={({ field }) => (
              <div className="space-y-2">
                <Label htmlFor="inst-businessAreaId">
                  Area di business
                  {!template?.businessAreaId && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={/* istanbul ignore next */ (v) => field.onChange(v ? Number(v) : null)}
                >
                  <SelectTrigger id="inst-businessAreaId">
                    <SelectValue placeholder={template?.businessAreaId ? "Dal template" : "Seleziona area..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {businessAreas.map((area) => (
                      <SelectItem key={area.id} value={String(area.id)}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          {/* Manager override */}
          <Controller
            control={control}
            name="managerId"
            render={({ field }) => (
              <div className="space-y-2">
                <Label htmlFor="inst-managerId">Responsabile</Label>
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={/* istanbul ignore next */ (v) => field.onChange(v ? Number(v) : null)}
                >
                  <SelectTrigger id="inst-managerId">
                    <SelectValue placeholder="Dal template" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.firstName} {m.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <Button type="submit" disabled={instantiateMutation.isPending}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
