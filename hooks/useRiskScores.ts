/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RiskScore } from "@/types";

export function useRiskScores() {
  return useQuery<RiskScore[]>({
    queryKey: ["risk-scores"],
    queryFn: async () => {
      const res = await api.get<RiskScore[]>("/risk-scores");
      return res.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
