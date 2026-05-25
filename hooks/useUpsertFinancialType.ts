import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financialTypesService, type FinancialTypeUpsertPayload } from "@/services/financialTypes.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";

type UpsertFinancialTypeParams = {
  id?: number;
  payload: FinancialTypeUpsertPayload;
};

export function useUpsertFinancialType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpsertFinancialTypeParams) => {
      return id
        ? financialTypesService.update(id, payload)
        : financialTypesService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referenceQueryKeys.financialTypes });
    },
  });
}
