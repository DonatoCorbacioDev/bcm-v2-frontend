/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

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
