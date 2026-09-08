/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { contractsService, type ContractSearchParams } from "@/services/contracts.service";
import { contractsQueryKeys } from "@/hooks/queries/contracts.queryKeys";

export function useContractsPaged(params: ContractSearchParams) {
  return useQuery({
    queryKey: [...contractsQueryKeys.list(), "paged", params],
    queryFn: () => contractsService.searchPaged(params),
    placeholderData: keepPreviousData, // use placeholderData instead of keepPreviousData
  });
}