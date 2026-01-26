import { useQuery } from "@tanstack/react-query";
import { managersService } from "@/services/managers.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";

export function useManagers() {
  return useQuery({
    queryKey: referenceQueryKeys.managers,
    queryFn: managersService.list,
    staleTime: 5 * 60 * 1000,
  });
}
