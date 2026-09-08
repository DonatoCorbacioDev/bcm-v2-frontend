/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetsService, type BudgetUpsertPayload } from "@/services/budgets.service";
import { referenceQueryKeys } from "@/hooks/queries/reference.queryKeys";

type UpsertBudgetParams = {
  id?: number;
  payload: BudgetUpsertPayload;
};

export function useUpsertBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpsertBudgetParams) => {
      return id
        ? budgetsService.update(id, payload)
        : budgetsService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referenceQueryKeys.budgets });
    },
  });
}
