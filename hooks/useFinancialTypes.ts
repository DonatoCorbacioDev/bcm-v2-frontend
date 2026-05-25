import { useQuery } from "@tanstack/react-query";
import { financialTypesService } from "@/services/financialTypes.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";

export function useFinancialTypes() {
  return useQuery({
    queryKey: referenceQueryKeys.financialTypes,
    queryFn: financialTypesService.list,
    staleTime: 5 * 60 * 1000,
  });
}
