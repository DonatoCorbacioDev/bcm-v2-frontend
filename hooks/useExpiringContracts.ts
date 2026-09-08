/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Contract } from "@/types";

export function useExpiringContracts(days: number = 30) {
  return useQuery({
    queryKey: ["contracts", "expiring", days],
    queryFn: async () => {
      const response = await api.get<Contract[]>(`/contracts/expiring?days=${days}`);
      return response.data;
    },
  });
}