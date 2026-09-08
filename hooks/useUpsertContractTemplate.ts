/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contractTemplatesService, type ContractTemplateUpsertPayload } from "@/services/contractTemplates.service";
import { contractTemplatesQueryKeys } from "@/hooks/queries/contractTemplates.queryKeys";

type UpsertArgs =
  | { mode: "create"; payload: ContractTemplateUpsertPayload }
  | { mode: "update"; id: number; payload: ContractTemplateUpsertPayload };

export function useUpsertContractTemplate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: UpsertArgs) => {
      if (args.mode === "create") return contractTemplatesService.create(args.payload);
      return contractTemplatesService.update(args.id, args.payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: contractTemplatesQueryKeys.list() });
    },
  });
}
