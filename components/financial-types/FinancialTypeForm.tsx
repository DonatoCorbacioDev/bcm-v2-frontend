import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { financialTypeSchema, type FinancialTypeFormData } from "@/lib/validations/financialType.schema";
import { useUpsertFinancialType } from "@/hooks/useUpsertFinancialType";
import type { FinancialType } from "@/types";

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

interface FinancialTypeFormProps {
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly financialType?: FinancialType | null;
}

export default function FinancialTypeForm({ onClose, onSuccess, financialType }: FinancialTypeFormProps) {
  const isEditing = Boolean(financialType);
  const upsertMutation = useUpsertFinancialType();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FinancialTypeFormData>({
    resolver: zodResolver(financialTypeSchema),
    defaultValues: financialType
      ? { name: financialType.name, description: financialType.description, category: financialType.category }
      : { name: "", description: "", category: "COST" },
  });

  const onSubmit = async (data: FinancialTypeFormData) => {
    try {
      await upsertMutation.mutateAsync({ id: financialType?.id, payload: data });
      toast.success(isEditing ? "Tipo finanziario aggiornato con successo!" : "Tipo finanziario creato con successo!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(isEditing ? "Aggiornamento del tipo finanziario non riuscito" : "Creazione del tipo finanziario non riuscita");
      console.error("Upsert error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Nome *
        </label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Es. Ricavi"
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && (
          <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Descrizione *
        </label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Descrivi questo tipo finanziario..."
          rows={4}
          className={errors.description ? "border-destructive" : ""}
        />
        {errors.description && (
          <p className="text-destructive text-sm mt-1">{errors.description.message}</p>
        )}
      </div>

      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <div>
            <Label htmlFor="category" className="block text-sm font-medium mb-2">
              Categoria *
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
              <p className="text-destructive text-sm mt-1">{errors.category.message}</p>
            )}
          </div>
        )}
      />

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
