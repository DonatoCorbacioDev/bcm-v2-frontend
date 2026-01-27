import { useQuery } from "@tanstack/react-query";
import { rolesService } from "@/services/roles.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";

export function useRoles() {
  return useQuery({
    queryKey: referenceQueryKeys.roles,
    queryFn: rolesService.list,
    staleTime: 5 * 60 * 1000,
  });
}