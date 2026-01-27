"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { managerSchema, type ManagerFormData } from "@/lib/validations/manager.schema";
import { useUpsertManager } from "@/hooks/useUpsertManager";
import type { Manager } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ManagerFormProps {
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
  readonly manager?: Manager | null;
}

export default function ManagerForm({
  onClose,
  onSuccess,
  manager,
}: ManagerFormProps) {
  const upsertMutation = useUpsertManager();

  const submitLabel = manager?.id ? "Update Manager" : "Create Manager";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ManagerFormData>({
    resolver: zodResolver(managerSchema),
    defaultValues: manager
      ? {
        firstName: manager.firstName,
        lastName: manager.lastName,
        email: manager.email,
        phoneNumber: manager.phoneNumber,
        department: manager.department,
      }
      : undefined,
  });

  const onSubmit = async (data: ManagerFormData) => {
    try {
      if (manager?.id) {
        await upsertMutation.mutateAsync({
          mode: "update",
          id: manager.id,
          payload: data,
        });
        toast.success("Manager updated successfully!");
      } else {
        await upsertMutation.mutateAsync({
          mode: "create",
          payload: data,
        });
        toast.success("Manager created successfully!");
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        manager?.id ? "Failed to update manager" : "Failed to create manager"
      );
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* First Name */}
      <div className="space-y-2">
        <Label htmlFor="firstName">
          First Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="firstName"
          {...register("firstName")}
          placeholder="Enter first name"
        />
        {errors.firstName && (
          <p className="text-sm text-red-500">{errors.firstName.message}</p>
        )}
      </div>

      {/* Last Name */}
      <div className="space-y-2">
        <Label htmlFor="lastName">
          Last Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="lastName"
          {...register("lastName")}
          placeholder="Enter last name"
        />
        {errors.lastName && (
          <p className="text-sm text-red-500">{errors.lastName.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="manager@example.com"
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Phone Number */}
      <div className="space-y-2">
        <Label htmlFor="phoneNumber">
          Phone Number <span className="text-red-500">*</span>
        </Label>
        <Input
          id="phoneNumber"
          {...register("phoneNumber")}
          placeholder="+39 123 456 7890"
        />
        {errors.phoneNumber && (
          <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
        )}
      </div>

      {/* Department */}
      <div className="space-y-2">
        <Label htmlFor="department">
          Department <span className="text-red-500">*</span>
        </Label>
        <Input
          id="department"
          {...register("department")}
          placeholder="e.g., Sales, IT, HR"
        />
        {errors.department && (
          <p className="text-sm text-red-500">{errors.department.message}</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={upsertMutation.isPending}>
          {upsertMutation.isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}