import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { contractsService, type ContractSearchParams } from "@/services/contracts.service";
import { contractsQueryKeys } from "@/hooks/queries/contracts.queryKeys";

export function useContractsPaged(params: ContractSearchParams) {
  return useQuery({
    queryKey: [...contractsQueryKeys.list(), "paged", params],
    queryFn: () => contractsService.searchPaged(params),
    placeholderData: keepPreviousData, // use placeholderData instead of keepPreviousData
  });
}