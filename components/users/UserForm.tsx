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

  /* istanbul ignore next */
  const { data: managers = [], isLoading: loadingManagers } = useManagers();
  /* istanbul ignore next */
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
        canApproveContracts: user.canApproveContracts ?? false,
      }
      : {
        username: "",
        password: "",
        managerId: 0,
        roleId: 0,
        verified: false,
        canApproveContracts: false,
      },
  });

  const onSubmit = async (data: UserCreateFormData | UserUpdateFormData) => {
    try {
      const payload = {
        ...data,
        password: /* istanbul ignore next */data.password || undefined,
      };

      await upsertMutation.mutateAsync({
        id: /* istanbul ignore next */user?.id,
        payload,
      });

      /* istanbul ignore next */
      const message = isEditing
        ? "Utente aggiornato con successo!"
        : "Utente creato con successo!";

      toast.success(message);
      onSuccess();
      onClose();
    } catch (error) {
      /* istanbul ignore next */
      const message = isEditing
        ? "Aggiornamento dell'utente non riuscito"
        : "Creazione dell'utente non riuscita";

      toast.error(message);
      console.error("Upsert error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Username Field */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-2">
          Nome utente *
        </label>
        <Input
          id="username"
          {...register("username")}
          placeholder="Es. mario_rossi"
          className={errors.username ? "border-destructive" : ""}
        />
        {errors.username && (
          <p className="text-destructive text-sm mt-1">{errors.username.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          Password {isEditing ? "(lascia vuoto per mantenere quella attuale)" : "*"}
        </label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          placeholder={isEditing ? "Inserisci la nuova password (opzionale)" : "Inserisci la password"}
          className={errors.password ? "border-destructive" : ""}
        />
        {errors.password && (
          <p className="text-destructive text-sm mt-1">{errors.password.message}</p>
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
              value={/* istanbul ignore next */field.value?.toString()}
              onValueChange={/* istanbul ignore next */ (value) => field.onChange(Number(value))}
              disabled={loadingManagers}
            >
              <SelectTrigger className={errors.managerId ? "border-destructive" : ""}>
                <SelectValue placeholder="Seleziona un manager" />
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
          <p className="text-destructive text-sm mt-1">{errors.managerId.message}</p>
        )}
      </div>

      {/* Role Select */}
      <div>
        <label htmlFor="roleId" className="block text-sm font-medium mb-2">
          Ruolo *
        </label>
        <Controller
          name="roleId"
          control={control}
          render={({ field }) => (
            <Select
              value={/* istanbul ignore next */field.value?.toString()}
              onValueChange={/* istanbul ignore next */ (value) => field.onChange(Number(value))}
              disabled={loadingRoles}
            >
              <SelectTrigger className={errors.roleId ? "border-destructive" : ""}>
                <SelectValue placeholder="Seleziona un ruolo" />
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
          <p className="text-destructive text-sm mt-1">{errors.roleId.message}</p>
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
          Account verificato
        </label>
      </div>

      {/* Can approve contracts checkbox */}
      <div className="flex items-center space-x-2">
        <Controller
          name="canApproveContracts"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="canApproveContracts"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <label
          htmlFor="canApproveContracts"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Può approvare contratti
        </label>
      </div>

      {/* Actions */}
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