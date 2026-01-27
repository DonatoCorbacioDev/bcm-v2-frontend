import { useMutation, useQueryClient } from "@tanstack/react-query";
import { businessAreasService, type BusinessAreaUpsertPayload } from "@/services/businessAreas.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";

type UpsertBusinessAreaParams = {
  id?: number;
  payload: BusinessAreaUpsertPayload;
};

export function useUpsertBusinessArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpsertBusinessAreaParams) => {
      return id
        ? businessAreasService.update(id, payload)
        : businessAreasService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referenceQueryKeys.businessAreas });
    },
  });
}