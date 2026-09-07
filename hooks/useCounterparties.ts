import { useQuery } from "@tanstack/react-query";
import { counterpartiesService } from "@/services/counterparties.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";

export function useCounterparties() {
  return useQuery({
    queryKey: referenceQueryKeys.counterparties,
    queryFn: counterpartiesService.list,
    staleTime: 5 * 60 * 1000,
  });
}
