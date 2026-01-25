"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import api from "@/lib/api";

import type { Contract, BusinessArea, Manager } from "@/types";
import { useUpsertContract } from "@/hooks/useUpsertContract";

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

// Zod validation schema (allineato al backend)
const contractSchema = z.object({
  customerName: z.string().min(2, "Customer name must be at least 2 characters"),
  contractNumber: z.string().min(1, "Contract number is required"),
  wbsCode: z.string().min(1, "WBS code is required"),
  projectName: z.string().min(2, "Project name must be at least 2 characters"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED"]),
  areaId: z.number().min(1, "Business area is required"),
  managerId: z.number().min(1, "Manager is required"),
});

type ContractFormData = z.infer<typeof contractSchema>;

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
  const [businessAreas, setBusinessAreas] = useState<BusinessArea[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);

  const upsertMutation = useUpsertContract();

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

  // Fetch business areas and managers (step successivo: React Query)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [areasRes, managersRes] = await Promise.all([
          api.get<BusinessArea[]>("/business-areas"),
          api.get<Manager[]>("/managers"),
        ]);
        setBusinessAreas(areasRes.data);
        setManagers(managersRes.data);
      } catch (error) {
        toast.error("Failed to load form data");
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (data: ContractFormData) => {
    try {
      if (contract?.id) {
        await upsertMutation.mutateAsync({
          mode: "update",
          id: contract.id,
          payload: data,
        });
        toast.success("Contract updated successfully!");
      } else {
        await upsertMutation.mutateAsync({
          mode: "create",
          payload: data,
        });
        toast.success("Contract created successfully!");
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        contract?.id ? "Failed to update contract" : "Failed to create contract"
      );
      console.error(error);
    }
  };

  const submitLabel = useMemo(() => {
    if (upsertMutation.isPending) return "Saving...";
    return contract?.id ? "Update Contract" : "Create Contract";
  }, [upsertMutation.isPending, contract?.id]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Customer Name */}
      <div className="space-y-2">
        <Label htmlFor="customerName">
          Customer Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="customerName"
          {...register("customerName")}
          placeholder="Enter customer name"
        />
        {errors.customerName && (
          <p className="text-sm text-red-500">{errors.customerName.message}</p>
        )}
      </div>

      {/* Contract Number */}
      <div className="space-y-2">
        <Label htmlFor="contractNumber">
          Contract Number <span className="text-red-500">*</span>
        </Label>
        <Input
          id="contractNumber"
          {...register("contractNumber")}
          placeholder="e.g., CNT-2024-001"
        />
        {errors.contractNumber && (
          <p className="text-sm text-red-500">
            {errors.contractNumber.message}
          </p>
        )}
      </div>

      {/* WBS Code */}
      <div className="space-y-2">
        <Label htmlFor="wbsCode">
          WBS Code <span className="text-red-500">*</span>
        </Label>
        <Input id="wbsCode" {...register("wbsCode")} placeholder="e.g., WBS-001" />
        {errors.wbsCode && (
          <p className="text-sm text-red-500">{errors.wbsCode.message}</p>
        )}
      </div>

      {/* Project Name */}
      <div className="space-y-2">
        <Label htmlFor="projectName">
          Project Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="projectName"
          {...register("projectName")}
          placeholder="Enter project name"
        />
        {errors.projectName && (
          <p className="text-sm text-red-500">{errors.projectName.message}</p>
        )}
      </div>

      {/* Dates Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">
            Start Date <span className="text-red-500">*</span>
          </Label>
          <Input id="startDate" type="date" {...register("startDate")} />
          {errors.startDate && (
            <p className="text-sm text-red-500">{errors.startDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">
            End Date <span className="text-red-500">*</span>
          </Label>
          <Input id="endDate" type="date" {...register("endDate")} />
          {errors.endDate && (
            <p className="text-sm text-red-500">{errors.endDate.message}</p>
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
              Status <span className="text-red-500">*</span>
            </Label>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status.message}</p>
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
              Business Area <span className="text-red-500">*</span>
            </Label>

            <Select
              value={field.value ? String(field.value) : ""}
              onValueChange={(value) => field.onChange(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business area" />
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
              <p className="text-sm text-red-500">{errors.areaId.message}</p>
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
              Manager <span className="text-red-500">*</span>
            </Label>

            <Select
              value={field.value ? String(field.value) : ""}
              onValueChange={(value) => field.onChange(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select manager" />
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
              <p className="text-sm text-red-500">{errors.managerId.message}</p>
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
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
