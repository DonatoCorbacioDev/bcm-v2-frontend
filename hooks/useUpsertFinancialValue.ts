import { useMutation, useQueryClient } from "@tanstack/react-query";
import { financialValuesService, type FinancialValueUpsertPayload } from "@/services/financialValues.service";
import { financialValuesQueryKeys } from "@/hooks/useFinancialValues";

type UpsertFinancialValueParams =
  | { mode: "create"; payload: FinancialValueUpsertPayload }
  | { mode: "update"; id: number; payload: FinancialValueUpsertPayload };

export function useUpsertFinancialValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpsertFinancialValueParams) => {
      if (params.mode === "create") {
        return financialValuesService.create(params.payload);
      } else {
        return financialValuesService.update(params.id, params.payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialValuesQueryKeys.all });
    },
  });
}