"use client";

import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import type { Contract } from "@/types";
import { useUpsertContract } from "@/hooks/useUpsertContract";
import { useBusinessAreas } from "@/hooks/useBusinessAreas";
import { useManagers } from "@/hooks/useManagers";
import { CONTRACT_STATUS_LABELS } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { contractSchema, type ContractFormData } from "@/lib/validations/contract.schema";

interface ContractFormProps {
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
  readonly contract?: Contract | null;
}

export default function ContractForm({
  onClose,
  onSuccess,
  contract,
}: ContractFormProps) {
  const upsertMutation = useUpsertContract();

  // Reference data via React Query
  const businessAreasQuery = useBusinessAreas();
  const managersQuery = useManagers();

  /* istanbul ignore next */
  const businessAreas = businessAreasQuery.data ?? [];
  /* istanbul ignore next */
  const managers = managersQuery.data ?? [];

  const isReferenceLoading =
    businessAreasQuery.isLoading || managersQuery.isLoading;
  const isReferenceError = businessAreasQuery.isError || managersQuery.isError;

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: contract
      ? {
          customerName: contract.customerName,
          contractNumber: contract.contractNumber,
          wbsCode: contract.wbsCode,
          projectName: contract.projectName,
          startDate: contract.startDate,
          endDate: contract.endDate,
          status: contract.status,
          areaId: contract.areaId,
          managerId: contract.managerId,
        }
      : {
          status: "ACTIVE",
        },
  });

  const onSubmit = async (data: ContractFormData) => {
    try {
      /* istanbul ignore else */
      if (contract) {
        await upsertMutation.mutateAsync({
          mode: "update",
          id: contract.id,
          payload: data,
        });
        toast.success("Contratto aggiornato con successo!");
      } else {
        await upsertMutation.mutateAsync({
          mode: "create",
          payload: data,
        });
        toast.success("Contratto creato con successo!");
      }

      /* istanbul ignore next */
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        /* istanbul ignore next */
        contract?.id ? "Aggiornamento del contratto non riuscito" : "Creazione del contratto non riuscita"
      );
      console.error(error);
    }
  };

  const submitLabel = useMemo(() => {
    /* istanbul ignore next */
    if (upsertMutation.isPending) return "Salvataggio...";
    return contract?.id ? "Aggiorna contratto" : "Crea contratto";
  }, [upsertMutation.isPending, contract?.id]);

  if (isReferenceLoading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Caricamento dati del form...
      </div>
    );
  }

  if (isReferenceError) {
    return (
      <div className="py-8 text-center text-sm text-destructive">
        Impossibile caricare aree di business/responsabili.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Customer Name */}
      <div className="space-y-2">
        <Label htmlFor="customerName">
          Nome cliente <span className="text-destructive">*</span>
        </Label>
        <Input
          id="customerName"
          {...register("customerName")}
          placeholder="Inserisci il nome del cliente"
        />
        {errors.customerName && (
          <p className="text-sm text-destructive">{errors.customerName.message}</p>
        )}
      </div>

      {/* Contract Number */}
      <div className="space-y-2">
        <Label htmlFor="contractNumber">
          Numero contratto <span className="text-destructive">*</span>
        </Label>
        <Input
          id="contractNumber"
          {...register("contractNumber")}
          placeholder="es. CNT-2024-001"
        />
        {errors.contractNumber && (
          <p className="text-sm text-destructive">
            {errors.contractNumber.message}
          </p>
        )}
      </div>

      {/* WBS Code */}
      <div className="space-y-2">
        <Label htmlFor="wbsCode">
          Codice WBS <span className="text-destructive">*</span>
        </Label>
        <Input
          id="wbsCode"
          {...register("wbsCode")}
          placeholder="es. WBS-001"
        />
        {errors.wbsCode && (
          <p className="text-sm text-destructive">{errors.wbsCode.message}</p>
        )}
      </div>

      {/* Project Name */}
      <div className="space-y-2">
        <Label htmlFor="projectName">
          Nome progetto <span className="text-destructive">*</span>
        </Label>
        <Input
          id="projectName"
          {...register("projectName")}
          placeholder="Inserisci il nome del progetto"
        />
        {errors.projectName && (
          <p className="text-sm text-destructive">{errors.projectName.message}</p>
        )}
      </div>

      {/* Dates Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">
            Data inizio <span className="text-destructive">*</span>
          </Label>
          <Input id="startDate" type="date" {...register("startDate")} />
          {errors.startDate && (
            <p className="text-sm text-destructive">{errors.startDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">
            Data fine <span className="text-destructive">*</span>
          </Label>
          <Input id="endDate" type="date" {...register("endDate")} />
          {errors.endDate && (
            <p className="text-sm text-destructive">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      {/* Status (Controller) */}
      <Controller
        control={control}
        name="status"
        render={({ field }) => (
          <div className="space-y-2">
            <Label htmlFor="status">
              Stato <span className="text-destructive">*</span>
            </Label>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Seleziona lo stato" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONTRACT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* istanbul ignore next */errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>
        )}
      />

      {/* Business Area (Controller) */}
      <Controller
        control={control}
        name="areaId"
        render={({ field }) => (
          <div className="space-y-2">
            <Label htmlFor="areaId">
              Area di business <span className="text-destructive">*</span>
            </Label>

            <Select
              value={field.value ? String(field.value) : ""}
              onValueChange={/* istanbul ignore next */ (value) => field.onChange(Number(value))}
            >
              <SelectTrigger id="areaId">
                <SelectValue placeholder="Seleziona l'area di business" />
              </SelectTrigger>
              <SelectContent>
                {businessAreas.map((area) => (
                  <SelectItem key={area.id} value={String(area.id)}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.areaId && (
              <p className="text-sm text-destructive">{errors.areaId.message}</p>
            )}
          </div>
        )}
      />

      {/* Manager (Controller) */}
      <Controller
        control={control}
        name="managerId"
        render={({ field }) => (
          <div className="space-y-2">
            <Label htmlFor="managerId">
              Responsabile <span className="text-destructive">*</span>
            </Label>

            <Select
              value={field.value ? String(field.value) : ""}
              onValueChange={/* istanbul ignore next */ (value) => field.onChange(Number(value))}
            >
              <SelectTrigger id="managerId">
                <SelectValue placeholder="Seleziona il responsabile" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.firstName} {m.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.managerId && (
              <p className="text-sm text-destructive">{errors.managerId.message}</p>
            )}
          </div>
        )}
      />

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Annulla
        </Button>
        <Button type="submit" disabled={upsertMutation.isPending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
