import { useQuery } from "@tanstack/react-query";
import { contractsService } from "@/services/contracts.service";

export const contractsQueryKeys = {
  all: ["contracts"] as const,
}

export const useContracts = () => {
  return useQuery({
    queryKey: contractsQueryKeys.all,
    queryFn: contractsService.list,
  });
};