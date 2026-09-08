/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { useQuery } from '@tanstack/react-query';
import { contractsService } from '@/services/contracts.service';

export function useContractsByArea() {
  return useQuery({
    queryKey: ['contracts', 'stats', 'by-area'],
    queryFn: () => contractsService.getContractsByArea(),
    staleTime: 5 * 60 * 1000,
  });
}