"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import api from "@/lib/api";
import type { Contract, BusinessArea, Manager } from "@/types";
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

// Zod validation schema
const contractSchema = z.object({
  customerName: z
    .string()
    .min(2, "Customer name must be at least 2 characters"),
  contractNumber: z.string().min(1, "Contract number is required"),
  wbsCode: z.string().min(1, "WBS code is required"),
  projectName: z.string().min(2, "Project name must be at least 2 characters"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "DRAFT"]),
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
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
          status: "DRAFT",
        },
  });

  // Fetch business areas and managers
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
    setIsSubmitting(true);
    try {
      if (contract?.id) {
        // Update existing contract
        await api.put(`/contracts/${contract.id}`, data);
        toast.success("Contract updated successfully!");
      } else {
        // Create new contract
        await api.post("/contracts", data);
        toast.success("Contract created successfully!");
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        contract?.id ? "Failed to update contract" : "Failed to create contract"
      );
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAreaId = watch("areaId");
  const selectedManagerId = watch("managerId");
  const selectedStatus = watch("status");

  // Helper function for submit button text (fix SonarLint warning)
  const getSubmitButtonText = () => {
    if (isSubmitting) return "Saving...";
    return contract?.id ? "Update Contract" : "Create Contract";
  };

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
        <Input
          id="wbsCode"
          {...register("wbsCode")}
          placeholder="e.g., WBS-001"
        />
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

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">
          Status <span className="text-red-500">*</span>
        </Label>
        <Select
          value={selectedStatus}
          onValueChange={(value) =>
            setValue("status", value as ContractFormData["status"])
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        {errors.status && (
          <p className="text-sm text-red-500">{errors.status.message}</p>
        )}
      </div>

      {/* Business Area */}
      <div className="space-y-2">
        <Label htmlFor="areaId">
          Business Area <span className="text-red-500">*</span>
        </Label>
        <Select
          value={selectedAreaId?.toString()}
          onValueChange={(value) =>
            setValue("areaId", Number.parseInt(value, 10))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select business area" />
          </SelectTrigger>
          <SelectContent>
            {businessAreas.map((area) => (
              <SelectItem key={area.id} value={area.id.toString()}>
                {area.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.areaId && (
          <p className="text-sm text-red-500">{errors.areaId.message}</p>
        )}
      </div>

      {/* Manager */}
      <div className="space-y-2">
        <Label htmlFor="managerId">
          Manager <span className="text-red-500">*</span>
        </Label>
        <Select
          value={selectedManagerId?.toString()}
          onValueChange={(value) =>
            setValue("managerId", Number.parseInt(value, 10))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select manager" />
          </SelectTrigger>
          <SelectContent>
            {managers.map((manager) => (
              <SelectItem key={manager.id} value={manager.id.toString()}>
                {manager.firstName} {manager.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.managerId && (
          <p className="text-sm text-red-500">{errors.managerId.message}</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {getSubmitButtonText()}
        </Button>
      </div>
    </form>
  );
}
