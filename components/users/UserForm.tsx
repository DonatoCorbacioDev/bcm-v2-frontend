import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  userCreateSchema,
  userUpdateSchema,
  type UserCreateFormData,
  type UserUpdateFormData,
} from "@/lib/validations/user.schema";
import { useUpsertUser } from "@/hooks/useUpsertUser";
import { useManagers } from "@/hooks/useManagers";
import { useRoles } from "@/hooks/useRoles";
import type { User } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserFormProps {
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly user?: User | null;
}

export default function UserForm({ onClose, onSuccess, user }: UserFormProps) {
  const isEditing = Boolean(user);
  const upsertMutation = useUpsertUser();

  const { data: managers = [], isLoading: loadingManagers } = useManagers();
  const { data: roles = [], isLoading: loadingRoles } = useRoles();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UserCreateFormData | UserUpdateFormData>({
    resolver: zodResolver(isEditing ? userUpdateSchema : userCreateSchema),
    defaultValues: user
      ? {
        username: user.username,
        password: "",
        managerId: user.managerId,
        roleId: user.roleId,
        verified: user.verified,
      }
      : {
        username: "",
        password: "",
        managerId: 0,
        roleId: 0,
        verified: false,
      },
  });

  const onSubmit = async (data: UserCreateFormData | UserUpdateFormData) => {
    try {
      const payload = {
        ...data,
        password: data.password || undefined,
      };

      await upsertMutation.mutateAsync({
        id: user?.id,
        payload,
      });

      const message = isEditing
        ? "User updated successfully!"
        : "User created successfully!";

      toast.success(message);
      onSuccess();
      onClose();
    } catch (error) {
      const message = isEditing
        ? "Failed to update user"
        : "Failed to create user";

      toast.error(message);
      console.error("Upsert error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Username Field */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-2">
          Username *
        </label>
        <Input
          id="username"
          {...register("username")}
          placeholder="e.g., john_doe"
          className={errors.username ? "border-red-500" : ""}
        />
        {errors.username && (
          <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          Password {isEditing ? "(leave empty to keep current)" : "*"}
        </label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          placeholder={isEditing ? "Enter new password (optional)" : "Enter password"}
          className={errors.password ? "border-red-500" : ""}
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Manager Select */}
      <div>
        <label htmlFor="managerId" className="block text-sm font-medium mb-2">
          Manager *
        </label>
        <Controller
          name="managerId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value?.toString()}
              onValueChange={(value) => field.onChange(Number(value))}
              disabled={loadingManagers}
            >
              <SelectTrigger className={errors.managerId ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id.toString()}>
                    {manager.firstName} {manager.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.managerId && (
          <p className="text-red-500 text-sm mt-1">{errors.managerId.message}</p>
        )}
      </div>

      {/* Role Select */}
      <div>
        <label htmlFor="roleId" className="block text-sm font-medium mb-2">
          Role *
        </label>
        <Controller
          name="roleId"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value?.toString()}
              onValueChange={(value) => field.onChange(Number(value))}
              disabled={loadingRoles}
            >
              <SelectTrigger className={errors.roleId ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.roleId && (
          <p className="text-red-500 text-sm mt-1">{errors.roleId.message}</p>
        )}
      </div>

      {/* Verified Checkbox */}
      <div className="flex items-center space-x-2">
        <Controller
          name="verified"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="verified"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <label
          htmlFor="verified"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Verified Account
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {(() => {
            if (isSubmitting) return "Saving...";
            if (isEditing) return "Update";
            return "Create";
          })()}
        </Button>
      </div>
    </form>
  );
}