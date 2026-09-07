"use client";

import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import type { Contract } from "@/types";
import { useUpsertContract } from "@/hooks/useUpsertContract";
import { useBusinessAreas } from "@/hooks/useBusinessAreas";
import { useManagers } from "@/hooks/useManagers";
import { useCounterparties } from "@/hooks/useCounterparties";
import { useFinancialTypes } from "@/hooks/useFinancialTypes";
import { CONTRACT_STATUS_LABELS } from "@/lib/utils";

const BILLING_FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: "Mensile",
  QUARTERLY: "Trimestrale",
  SEMIANNUAL: "Semestrale",
  ANNUAL: "Annuale",
};

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/shared/SelectField";

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
  const counterpartiesQuery = useCounterparties();
  const financialTypesQuery = useFinancialTypes();

  /* istanbul ignore next */
  const businessAreas = businessAreasQuery.data ?? [];
  /* istanbul ignore next */
  const managers = managersQuery.data ?? [];
  /* istanbul ignore next */
  const counterparties = counterpartiesQuery.data ?? [];
  /* istanbul ignore next */
  const financialTypes = financialTypesQuery.data ?? [];

  const isReferenceLoading =
    businessAreasQuery.isLoading || managersQuery.isLoading || counterpartiesQuery.isLoading
    || financialTypesQuery.isLoading;
  const isReferenceError =
    businessAreasQuery.isError || managersQuery.isError || counterpartiesQuery.isError
    || financialTypesQuery.isError;

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: contract
      ? {
          counterpartyId: contract.counterpartyId,
          contractNumber: contract.contractNumber,
          wbsCode: contract.wbsCode,
          projectName: contract.projectName,
          startDate: contract.startDate,
          endDate: contract.endDate,
          status: contract.status,
          areaId: contract.areaId,
          managerId: contract.managerId,
          financialTypeId: contract.financialTypeId ?? undefined,
          annualValue: contract.annualValue ?? undefined,
          billingFrequency: contract.billingFrequency ?? undefined,
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
        toast.success("Contratto aggiornato");
      } else {
        await upsertMutation.mutateAsync({
          mode: "create",
          payload: data,
        });
        toast.success("Contratto creato");
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
        Impossibile caricare aree di business/responsabili/controparti.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Counterparty (Controller) */}
      <Controller
        control={control}
        name="counterpartyId"
        render={({ field }) => (
          <SelectField
            id="counterpartyId"
            label={<>Controparte <span className="text-destructive">*</span></>}
            value={field.value ? String(field.value) : ""}
            onValueChange={/* istanbul ignore next */ (value) => field.onChange(Number(value))}
            placeholder="Seleziona la controparte"
            options={counterparties.map((cp) => ({ value: String(cp.id), label: cp.name }))}
            error={errors.counterpartyId?.message}
          />
        )}
      />

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
          <SelectField
            id="status"
            label={<>Stato <span className="text-destructive">*</span></>}
            value={field.value}
            onValueChange={field.onChange}
            placeholder="Seleziona lo stato"
            options={Object.entries(CONTRACT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
            error={/* istanbul ignore next */ errors.status?.message}
          />
        )}
      />

      {/* Business Area (Controller) */}
      <Controller
        control={control}
        name="areaId"
        render={({ field }) => (
          <SelectField
            id="areaId"
            label={<>Area di business <span className="text-destructive">*</span></>}
            value={field.value ? String(field.value) : ""}
            onValueChange={/* istanbul ignore next */ (value) => field.onChange(Number(value))}
            placeholder="Seleziona l'area di business"
            options={businessAreas.map((area) => ({ value: String(area.id), label: area.name }))}
            error={errors.areaId?.message}
          />
        )}
      />

      {/* Manager (Controller) */}
      <Controller
        control={control}
        name="managerId"
        render={({ field }) => (
          <SelectField
            id="managerId"
            label={<>Responsabile <span className="text-destructive">*</span></>}
            value={field.value ? String(field.value) : ""}
            onValueChange={/* istanbul ignore next */ (value) => field.onChange(Number(value))}
            placeholder="Seleziona il responsabile"
            options={managers.map((m) => ({ value: String(m.id), label: `${m.firstName} ${m.lastName}` }))}
            error={errors.managerId?.message}
          />
        )}
      />

      {/* Financial terms (optional) — when all three are set, the backend
          auto-generates this contract's financial values instead of
          requiring them to be entered one row at a time. */}
      <div className="space-y-4 rounded-lg border border-border p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Termini finanziari (opzionale)</p>
          <p className="text-xs text-muted-foreground mt-1">
            Se compilati, i valori finanziari del contratto vengono generati automaticamente.
          </p>
        </div>

        <Controller
          control={control}
          name="financialTypeId"
          render={({ field }) => (
            <SelectField
              id="financialTypeId"
              label="Tipo finanziario"
              value={field.value ? String(field.value) : ""}
              onValueChange={/* istanbul ignore next */ (value) => field.onChange(Number(value))}
              placeholder="Seleziona il tipo finanziario"
              options={financialTypes.map((ft) => ({ value: String(ft.id), label: ft.name }))}
              // The schema's all-or-nothing refine always attaches its error to
              // annualValue (see contract.schema.ts) — financialTypeId has no
              // validator of its own, so this can never actually be set.
              error={/* istanbul ignore next */ errors.financialTypeId?.message}
            />
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="annualValue">Valore annuo (€)</Label>
            <Input
              id="annualValue"
              type="number"
              step="0.01"
              // Not valueAsNumber: an empty optional number input reads as
              // NaN through that path (even untouched), which would fail
              // Zod's z.number() check instead of being treated as unset.
              {...register("annualValue", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
              placeholder="es. 36000"
            />
            {errors.annualValue && (
              <p className="text-sm text-destructive">{errors.annualValue.message}</p>
            )}
          </div>

          <Controller
            control={control}
            name="billingFrequency"
            render={({ field }) => (
              <SelectField
                id="billingFrequency"
                label="Frequenza fatturazione"
                value={field.value ?? ""}
                onValueChange={field.onChange}
                placeholder="Seleziona la frequenza"
                options={Object.entries(BILLING_FREQUENCY_LABELS).map(([value, label]) => ({ value, label }))}
                // Same as financialTypeId above — the refine's error always
                // lands on annualValue, never on this field.
                error={/* istanbul ignore next */ errors.billingFrequency?.message}
              />
            )}
          />
        </div>
      </div>

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
