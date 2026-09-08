/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

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
