import { useQuery } from "@tanstack/react-query";
import { contractsService } from "@/services/contracts.service";
import { contractsQueryKeys } from "@/hooks/queries/contracts.queryKeys";
import type { Contract } from "@/types";

export function useContract(id: number) {
  return useQuery<Contract>({
    queryKey: contractsQueryKeys.detail(id),
    queryFn: () => contractsService.getById(id),
    enabled: !!id && id > 0,
  });
}