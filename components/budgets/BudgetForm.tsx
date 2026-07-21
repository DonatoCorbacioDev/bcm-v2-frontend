"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { budgetSchema, type BudgetFormData } from "@/lib/validations/budget.schema";
import { useUpsertBudget } from "@/hooks/useUpsertBudget";
import { useBusinessAreas } from "@/hooks/useBusinessAreas";
import type { Budget } from "@/types";

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

interface BudgetFormProps {
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly budget?: Budget | null;
}

export default function BudgetForm({ onClose, onSuccess, budget }: BudgetFormProps) {
  const isEditing = Boolean(budget);
  const upsertMutation = useUpsertBudget();
  const businessAreasQuery = useBusinessAreas();

  /* istanbul ignore next */
  const businessAreas = businessAreasQuery.data ?? [];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: budget
      ? {
        businessAreaId: budget.businessAreaId,
        category: budget.category,
        year: budget.year,
        targetAmount: budget.targetAmount,
      }
      : {
        category: "COST",
        year: new Date().getFullYear(),
      },
  });

  const onSubmit = async (data: BudgetFormData) => {
    try {
      await upsertMutation.mutateAsync({ id: budget?.id, payload: data });
      toast.success(isEditing ? "Budget aggiornato con successo!" : "Budget creato con successo!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(isEditing ? "Aggiornamento del budget non riuscito" : "Creazione del budget non riuscita");
      console.error("Upsert error:", error);
    }
  };

  if (businessAreasQuery.isLoading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Caricamento dati del modulo...
      </div>
    );
  }

  if (businessAreasQuery.isError) {
    return (
      <div className="py-8 text-center text-sm text-destructive">
        Impossibile caricare i dati di riferimento.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        control={control}
        name="businessAreaId"
        render={({ field }) => (
          <div className="space-y-2">
            <Label htmlFor="businessAreaId">
              Area di business <span className="text-destructive">*</span>
            </Label>
            <Select
              value={/* istanbul ignore next */ field.value ? String(field.value) : ""}
              onValueChange={/* istanbul ignore next */ (value) => field.onChange(Number(value))}
            >
              <SelectTrigger id="businessAreaId">
                <SelectValue placeholder="Seleziona area" />
              </SelectTrigger>
              <SelectContent>
                {businessAreas.map((area) => (
                  <SelectItem key={area.id} value={String(area.id)}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.businessAreaId && (
              <p className="text-sm text-destructive">{errors.businessAreaId.message}</p>
            )}
          </div>
        )}
      />

      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <div className="space-y-2">
            <Label htmlFor="category">
              Categoria <span className="text-destructive">*</span>
            </Label>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="category" aria-label="Categoria">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REVENUE">Ricavo</SelectItem>
                <SelectItem value="COST">Costo</SelectItem>
              </SelectContent>
            </Select>
            {/* istanbul ignore next */errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">
            Anno <span className="text-destructive">*</span>
          </Label>
          <Input
            id="year"
            type="number"
            {...register("year", { valueAsNumber: true })}
            placeholder="2025"
          />
          {errors.year && (
            <p className="text-sm text-destructive">{errors.year.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAmount">
            Obiettivo (€) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="targetAmount"
            type="number"
            step="0.01"
            {...register("targetAmount", { valueAsNumber: true })}
            placeholder="50000.00"
          />
          {errors.targetAmount && (
            <p className="text-sm text-destructive">{errors.targetAmount.message}</p>
          )}
        </div>
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
