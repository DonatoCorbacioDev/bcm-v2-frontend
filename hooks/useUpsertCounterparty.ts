import { useMutation, useQueryClient } from "@tanstack/react-query";
import { counterpartiesService, type CounterpartyUpsertPayload } from "@/services/counterparties.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";

type UpsertCounterpartyParams = {
  id?: number;
  payload: CounterpartyUpsertPayload;
};

export function useUpsertCounterparty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpsertCounterpartyParams) => {
      return id
        ? counterpartiesService.update(id, payload)
        : counterpartiesService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referenceQueryKeys.counterparties });
    },
  });
}
