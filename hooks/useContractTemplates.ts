/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { useQuery } from "@tanstack/react-query";
import { contractTemplatesService } from "@/services/contractTemplates.service";
import { contractTemplatesQueryKeys } from "@/hooks/queries/contractTemplates.queryKeys";

export function useContractTemplates() {
  return useQuery({
    queryKey: contractTemplatesQueryKeys.list(),
    queryFn: contractTemplatesService.list,
  });
}
