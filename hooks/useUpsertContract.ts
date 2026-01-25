import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contractsService, type ContractUpsertPayload } from "@/services/contracts.service";
import { contractsQueryKeys } from "@/hooks/useContracts";

type UpsertArgs =
  | { mode: "create"; payload: ContractUpsertPayload }
  | { mode: "update"; id: number; payload: ContractUpsertPayload };

export function useUpsertContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: UpsertArgs) => {
      if (args.mode === "update") {
        return contractsService.update(args.id, args.payload);
      }
      return contractsService.create(args.payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contractsQueryKeys.all });
    },
  });
}
