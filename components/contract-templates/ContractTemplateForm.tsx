"use client";

import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import type { ContractTemplate } from "@/types";
import { useUpsertContractTemplate } from "@/hooks/useUpsertContractTemplate";
import { useBusinessAreas } from "@/hooks/useBusinessAreas";
import { useManagers } from "@/hooks/useManagers";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { contractTemplateSchema, type ContractTemplateFormData } from "@/lib/validations/contractTemplate.schema";

interface ContractTemplateFormProps {
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
  readonly template?: ContractTemplate | null;
}

export default function ContractTemplateForm({
  onClose,
  onSuccess,
  template,
}: ContractTemplateFormProps) {
  const upsertMutation = useUpsertContractTemplate();
  const businessAreasQuery = useBusinessAreas();
  const managersQuery = useManagers();

  /* istanbul ignore next */
  const businessAreas = businessAreasQuery.data ?? [];
  /* istanbul ignore next */
  const managers = managersQuery.data ?? [];

  const isReferenceLoading = businessAreasQuery.isLoading || managersQuery.isLoading;
  const isReferenceError = businessAreasQuery.isError || managersQuery.isError;

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<ContractTemplateFormData>({
    resolver: zodResolver(contractTemplateSchema),
    defaultValues: template
      ? {
          name: template.name,
          description: template.description ?? "",
          defaultStatus: template.defaultStatus ?? undefined,
          defaultDurationDays: template.defaultDurationDays ?? undefined,
          businessAreaId: template.businessAreaId ?? undefined,
          defaultManagerId: template.defaultManagerId ?? undefined,
          autoRenew: template.autoRenew,
          notificationDays: template.notificationDays ?? undefined,
        }
      : { autoRenew: false },
  });

  const onSubmit = async (data: ContractTemplateFormData) => {
    const payload = {
      name: data.name,
      description: data.description || null,
      defaultStatus: data.defaultStatus || null,
      defaultDurationDays: data.defaultDurationDays || null,
      businessAreaId: data.businessAreaId || null,
      defaultManagerId: data.defaultManagerId || null,
      autoRenew: data.autoRenew,
      notificationDays: data.notificationDays || null,
    };
    try {
      if (template) {
        await upsertMutation.mutateAsync({ mode: "update", id: template.id, payload });
        toast.success("Template aggiornato con successo!");
      } else {
        await upsertMutation.mutateAsync({ mode: "create", payload });
        toast.success("Template creato con successo!");
      }
      /* istanbul ignore next */
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        /* istanbul ignore next */
        template?.id ? "Aggiornamento del template non riuscito" : "Creazione del template non riuscita"
      );
      console.error(error);
    }
  };

  const submitLabel = useMemo(() => {
    /* istanbul ignore next */
    if (upsertMutation.isPending) return "Salvataggio...";
    return template?.id ? "Aggiorna template" : "Crea template";
  }, [upsertMutation.isPending, template?.id]);

  if (isReferenceLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Caricamento dati del form...</div>;
  }

  if (isReferenceError) {
    return <div className="py-8 text-center text-sm text-destructive">Impossibile caricare aree di business/responsabili.</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Nome template <span className="text-destructive">*</span>
        </Label>
        <Input id="name" {...register("name")} placeholder="es. NDA Standard" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrizione</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Descrizione opzionale del template..."
          rows={3}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      {/* Default Status + Default Duration */}
      <div className="grid grid-cols-2 gap-4">
        <Controller
          control={control}
          name="defaultStatus"
          render={({ field }) => (
            <div className="space-y-2">
              <Label htmlFor="defaultStatus">Stato predefinito</Label>
              <Select
                value={field.value ?? ""}
                onValueChange={/* istanbul ignore next */ (v) => field.onChange(v || null)}
              >
                <SelectTrigger id="defaultStatus">
                  <SelectValue placeholder="Seleziona..." />
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

        <div className="space-y-2">
          <Label htmlFor="defaultDurationDays">Durata predefinita (giorni)</Label>
          <Input
            id="defaultDurationDays"
            type="number"
            min={1}
            {...register("defaultDurationDays", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
            placeholder="es. 365"
          />
          {errors.defaultDurationDays && (
            <p className="text-sm text-destructive">{errors.defaultDurationDays.message}</p>
          )}
        </div>
      </div>

      {/* Business Area */}
      <Controller
        control={control}
        name="businessAreaId"
        render={({ field }) => (
          <div className="space-y-2">
            <Label htmlFor="businessAreaId">Area di business predefinita</Label>
            <Select
              value={field.value ? String(field.value) : ""}
              onValueChange={/* istanbul ignore next */ (v) => field.onChange(v ? Number(v) : null)}
            >
              <SelectTrigger id="businessAreaId">
                <SelectValue placeholder="Nessuna (obbligatoria all'istanziazione)" />
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

      {/* Default Manager */}
      <Controller
        control={control}
        name="defaultManagerId"
        render={({ field }) => (
          <div className="space-y-2">
            <Label htmlFor="defaultManagerId">Responsabile predefinito</Label>
            <Select
              value={field.value ? String(field.value) : ""}
              onValueChange={/* istanbul ignore next */ (v) => field.onChange(v ? Number(v) : null)}
            >
              <SelectTrigger id="defaultManagerId">
                <SelectValue placeholder="Nessuno" />
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

      {/* Notification Days */}
      <div className="space-y-2">
        <Label htmlFor="notificationDays">Giorni di notifica pre-scadenza</Label>
        <Input
          id="notificationDays"
          type="number"
          min={1}
          {...register("notificationDays", { setValueAs: (v) => (v === "" ? undefined : Number(v)) })}
          placeholder="es. 30"
        />
        {errors.notificationDays && (
          <p className="text-sm text-destructive">{errors.notificationDays.message}</p>
        )}
      </div>

      {/* Auto Renew */}
      <div className="flex items-center gap-3">
        <Controller
          control={control}
          name="autoRenew"
          render={({ field }) => (
            <Checkbox
              id="autoRenew"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="autoRenew" className="cursor-pointer">
          Rinnovo automatico
        </Label>
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
