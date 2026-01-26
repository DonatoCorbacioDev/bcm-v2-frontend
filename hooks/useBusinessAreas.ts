import { useQuery } from "@tanstack/react-query";
import { businessAreasService } from "@/services/businessAreas.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";

export function useBusinessAreas() {
  return useQuery({
    queryKey: referenceQueryKeys.businessAreas,
    queryFn: businessAreasService.list,
    staleTime: 5 * 60 * 1000, 
  });
}
