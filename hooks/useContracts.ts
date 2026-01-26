import { useQuery } from "@tanstack/react-query";
import { contractsService } from "@/services/contracts.service";
import { contractsQueryKeys } from "@/hooks/queries/contracts.queryKeys";
import type { Contract } from "@/types";

export function useContracts() {
  return useQuery<Contract[]>({
    queryKey: contractsQueryKeys.list(),
    queryFn: async () => {
      const res = await contractsService.list(); 
      return res;
    },
  });
}
