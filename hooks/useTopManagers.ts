/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { useQuery } from '@tanstack/react-query';
import { contractsService } from '@/services/contracts.service';

export function useTopManagers() {
  return useQuery({
    queryKey: ['contracts', 'stats', 'top-managers'],
    queryFn: () => contractsService.getTopManagers(),
    staleTime: 5 * 60 * 1000,
  });
}