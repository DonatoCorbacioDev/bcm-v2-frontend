import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { businessAreaSchema, type BusinessAreaFormData } from "@/lib/validations/businessArea.schema";
import { useUpsertBusinessArea } from "@/hooks/useUpsertBusinessArea";
import type { BusinessArea } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BusinessAreaFormProps {
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly businessArea?: BusinessArea | null;
}

export default function BusinessAreaForm({ onClose, onSuccess, businessArea }: BusinessAreaFormProps) {
  const isEditing = Boolean(businessArea);
  const upsertMutation = useUpsertBusinessArea();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BusinessAreaFormData>({
    resolver: zodResolver(businessAreaSchema),
    defaultValues: businessArea
      ? {
        name: businessArea.name,
        description: businessArea.description,
      }
      : {
        name: "",
        description: "",
      },
  });

  const onSubmit = async (data: BusinessAreaFormData) => {
    try {
      await upsertMutation.mutateAsync({
        id: businessArea?.id,
        payload: data,
      });

      const message = isEditing
        ? "Business area updated successfully!"
        : "Business area created successfully!";

      toast.success(message);
      onSuccess();
      onClose();
    } catch (error) {
      const message = isEditing
        ? "Failed to update business area"
        : "Failed to create business area";

      toast.error(message);
      console.error("Upsert error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Name *
        </label>
        <Input
          id="name"
          {...register("name")}
          placeholder="e.g., IT Department"
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Description Field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Description *
        </label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Describe the business area..."
          rows={4}
          className={errors.description ? "border-red-500" : ""}
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
        )}
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