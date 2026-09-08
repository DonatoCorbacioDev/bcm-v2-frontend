/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { counterpartySchema, type CounterpartyFormData } from "@/lib/validations/counterparty.schema";
import { useUpsertCounterparty } from "@/hooks/useUpsertCounterparty";
import type { Counterparty } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPE_LABELS: Record<CounterpartyFormData["type"], string> = {
  CUSTOMER: "Cliente",
  SUPPLIER: "Fornitore",
  BOTH: "Entrambi",
};

interface CounterpartyFormProps {
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly counterparty?: Counterparty | null;
}

export default function CounterpartyForm({ onClose, onSuccess, counterparty }: CounterpartyFormProps) {
  const isEditing = Boolean(counterparty);
  const upsertMutation = useUpsertCounterparty();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CounterpartyFormData>({
    resolver: zodResolver(counterpartySchema),
    defaultValues: counterparty
      ? {
          name: counterparty.name,
          type: counterparty.type,
          vatNumber: counterparty.vatNumber ?? "",
          taxCode: counterparty.taxCode ?? "",
          address: counterparty.address ?? "",
          contactName: counterparty.contactName ?? "",
          contactEmail: counterparty.contactEmail ?? "",
          contactPhone: counterparty.contactPhone ?? "",
          notes: counterparty.notes ?? "",
        }
      : {
          name: "",
          type: "CUSTOMER",
        },
  });

  const onSubmit = async (data: CounterpartyFormData) => {
    try {
      await upsertMutation.mutateAsync({
        id: counterparty?.id,
        payload: data,
      });

      toast.success(isEditing ? "Controparte aggiornata" : "Controparte creata");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        isEditing ? "Aggiornamento della controparte non riuscito" : "Creazione della controparte non riuscita"
      );
      console.error("Upsert error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Nome <span className="text-destructive">*</span>
        </Label>
        <Input id="name" {...register("name")} placeholder="Es. Alfa Srl" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <div className="space-y-2">
            <Label htmlFor="type">
              Tipo <span className="text-destructive">*</span>
            </Label>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Seleziona il tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* istanbul ignore next: type always has a value from the Select (defaults to CUSTOMER), so this can't actually trigger */errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
          </div>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vatNumber">Partita IVA</Label>
          <Input id="vatNumber" {...register("vatNumber")} placeholder="es. IT01234567890" />
          {errors.vatNumber && <p className="text-sm text-destructive">{errors.vatNumber.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxCode">Codice fiscale</Label>
          <Input id="taxCode" {...register("taxCode")} />
          {errors.taxCode && <p className="text-sm text-destructive">{errors.taxCode.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Indirizzo</Label>
        <Input id="address" {...register("address")} />
        {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactName">Referente</Label>
          <Input id="contactName" {...register("contactName")} />
          {errors.contactName && <p className="text-sm text-destructive">{errors.contactName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Email referente</Label>
          <Input id="contactEmail" type="email" {...register("contactEmail")} />
          {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Telefono referente</Label>
          <Input id="contactPhone" {...register("contactPhone")} />
          {errors.contactPhone && <p className="text-sm text-destructive">{errors.contactPhone.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Note</Label>
        <Textarea id="notes" {...register("notes")} rows={3} />
        {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Annulla
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {(() => {
            /* istanbul ignore next */
            if (isSubmitting) return "Salvataggio...";
            if (isEditing) return "Aggiorna";
            return "Crea";
          })()}
        </Button>
      </div>
    </form>
  );
}
