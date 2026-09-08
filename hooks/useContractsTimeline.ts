/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { useQuery } from '@tanstack/react-query';
import { contractsService } from '@/services/contracts.service';

export function useContractsTimeline() {
  return useQuery({
    queryKey: ['contracts', 'stats', 'timeline'],
    queryFn: () => contractsService.getContractsTimeline(),
    staleTime: 5 * 60 * 1000,
  });
}