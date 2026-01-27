import { useMutation, useQueryClient } from "@tanstack/react-query";
import { managersService, type ManagerUpsertPayload } from "@/services/managers.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";

type UpsertManagerParams =
  | { mode: "create"; payload: ManagerUpsertPayload }
  | { mode: "update"; id: number; payload: ManagerUpsertPayload };

export function useUpsertManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpsertManagerParams) => {
      if (params.mode === "create") {
        return managersService.create(params.payload);
      } else {
        return managersService.update(params.id, params.payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referenceQueryKeys.managers });
    },
  });
}