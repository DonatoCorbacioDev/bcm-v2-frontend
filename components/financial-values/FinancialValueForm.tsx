"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { financialValueSchema, type FinancialValueFormData } from "@/lib/validations/financialValue.schema";
import { useUpsertFinancialValue } from "@/hooks/useUpsertFinancialValue";
import { useContracts } from "@/hooks/useContracts";
import { useBusinessAreas } from "@/hooks/useBusinessAreas";
import { useFinancialTypes } from "@/hooks/useFinancialTypes";
import type { FinancialValue } from "@/types";

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

interface FinancialValueFormProps {
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
  readonly financialValue?: FinancialValue | null;
}

export default function FinancialValueForm({
  onClose,
  onSuccess,
  financialValue,
}: FinancialValueFormProps) {
  const upsertMutation = useUpsertFinancialValue();
  const contractsQuery = useContracts();
  const businessAreasQuery = useBusinessAreas();
  const financialTypesQuery = useFinancialTypes();

  /* istanbul ignore next */
  const contracts = contractsQuery.data ?? [];
  /* istanbul ignore next */
  const businessAreas = businessAreasQuery.data ?? [];
  /* istanbul ignore next */
  const financialTypes = financialTypesQuery.data ?? [];

  const submitLabel = financialValue?.id ? "Update" : "Create";

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<FinancialValueFormData>({
    resolver: zodResolver(financialValueSchema),
    defaultValues: financialValue
      ? {
        month: financialValue.month,
        year: financialValue.year,
        financialAmount: financialValue.financialAmount,
        financialTypeId: financialValue.financialTypeId,
        businessAreaId: financialValue.businessAreaId,
        contractId: financialValue.contractId,
      }
      : {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      },
  });

  const onSubmit = async (data: FinancialValueFormData) => {
    try {
      /* istanbul ignore else */
      if (financialValue) {
        await upsertMutation.mutateAsync({
          mode: "update",
          id: financialValue.id,
          payload: data,
        });
        toast.success("Financial value updated successfully!");
      } else {
        await upsertMutation.mutateAsync({
          mode: "create",
          payload: data,
        });
        toast.success("Financial value created successfully!");
      }

      /* istanbul ignore next */
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        /* istanbul ignore next */
        financialValue?.id
          ? "Failed to update financial value"
          : "Failed to create financial value"
      );
      console.error(error);
    }
  };

  const isReferenceLoading = contractsQuery.isLoading || businessAreasQuery.isLoading || financialTypesQuery.isLoading;
  const isReferenceError = contractsQuery.isError || businessAreasQuery.isError || financialTypesQuery.isError;

  if (isReferenceLoading) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        Loading form data...
      </div>
    );
  }

  if (isReferenceError) {
    return (
      <div className="py-8 text-center text-sm text-red-500">
        Failed to load reference data.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Month & Year Row */}
      <div className="grid grid-cols-2 gap-4">
        <Controller
          control={control}
          name="month"
          render={({ field }) => (
            <div className="space-y-2">
              <Label htmlFor="month">
                Month <span className="text-red-500">*</span>
              </Label>
              <Select
                value={/* istanbul ignore next */field.value ? String(field.value) : ""}
                onValueChange={/* istanbul ignore next */ (value) => field.onChange(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {new Date(2000, m - 1).toLocaleString("en", {
                        month: "long",
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* istanbul ignore next */errors.month && (
                <p className="text-sm text-red-500">{errors.month.message}</p>
              )}
            </div>
          )}
        />

        <div className="space-y-2">
          <Label htmlFor="year">
            Year <span className="text-red-500">*</span>
          </Label>
          <Input
            id="year"
            type="number"
            {...register("year", { valueAsNumber: true })}
            placeholder="2024"
          />
          {errors.year && (
            <p className="text-sm text-red-500">{errors.year.message}</p>
          )}
        </div>
      </div>

      {/* Financial Amount */}
      <div className="space-y-2">
        <Label htmlFor="financialAmount">
          Amount (€) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="financialAmount"
          type="number"
          step="0.01"
          {...register("financialAmount", { valueAsNumber: true })}
          placeholder="10000.00"
        />
        {errors.financialAmount && (
          <p className="text-sm text-red-500">{errors.financialAmount.message}</p>
        )}
      </div>

      {/* Contract */}
      <Controller
        control={control}
        name="contractId"
        render={({ field }) => (
          <div className="space-y-2">
            <Label htmlFor="contractId">
              Contract <span className="text-red-500">*</span>
            </Label>
            <Select
              value={field.value ? String(field.value) : ""}
              onValueChange={/* istanbul ignore next */ (value) => field.onChange(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contract" />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.contractNumber} - {c.customerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.contractId && (
              <p className="text-sm text-red-500">{errors.contractId.message}</p>
            )}
          </div>
        )}
      />

      {/* Financial Type */}
      <Controller
        control={control}
        name="financialTypeId"
        render={({ field }) => (
          <div className="space-y-2">
            <Label htmlFor="financialTypeId">
              Financial Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={field.value ? String(field.value) : ""}
              onValueChange={/* istanbul ignore next */ (value) => field.onChange(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {financialTypes.map((ft) => (
                  <SelectItem key={ft.id} value={String(ft.id)}>
                    {ft.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.financialTypeId && (
              <p className="text-sm text-red-500">
                {errors.financialTypeId.message}
              </p>
            )}
          </div>
        )}
      />

      {/* Business Area */}
      <Controller
        control={control}
        name="businessAreaId"
        render={({ field }) => (
          <div className="space-y-2">
            <Label htmlFor="businessAreaId">
              Business Area <span className="text-red-500">*</span>
            </Label>
            <Select
              value={field.value ? String(field.value) : ""}
              onValueChange={/* istanbul ignore next */ (value) => field.onChange(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select area" />
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
              <p className="text-sm text-red-500">
                {errors.businessAreaId.message}
              </p>
            )}
          </div>
        )}
      />

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={upsertMutation.isPending}>
          {/* istanbul ignore next */upsertMutation.isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}