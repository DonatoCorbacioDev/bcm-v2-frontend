import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contractsService, type ContractUpsertPayload } from "@/services/contracts.service";
import { contractsQueryKeys } from "@/hooks/queries/contracts.queryKeys";

type UpsertArgs =
  | { mode: "create"; payload: ContractUpsertPayload }
  | { mode: "update"; id: number; payload: ContractUpsertPayload };

export function useUpsertContract() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: UpsertArgs) => {
      if (args.mode === "create") return contractsService.create(args.payload);
      return contractsService.update(args.id, args.payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: contractsQueryKeys.list() });
    },
  });
}
