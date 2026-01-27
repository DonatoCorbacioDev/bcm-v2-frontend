import { useQuery } from "@tanstack/react-query";
import { financialValuesService } from "@/services/financialValues.service";

export const financialValuesQueryKeys = {
  all: ["financial-values"] as const,
  list: () => [...financialValuesQueryKeys.all] as const,
};

export function useFinancialValues() {
  return useQuery({
    queryKey: financialValuesQueryKeys.list(),
    queryFn: financialValuesService.list,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}