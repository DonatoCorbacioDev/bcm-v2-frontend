/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { useQuery } from "@tanstack/react-query";
import { budgetsService } from "@/services/budgets.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";

export function useBudgets() {
  return useQuery({
    queryKey: referenceQueryKeys.budgets,
    queryFn: budgetsService.list,
    staleTime: 60 * 1000,
  });
}
