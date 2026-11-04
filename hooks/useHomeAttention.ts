/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { useQuery } from "@tanstack/react-query";
import { homeService } from "@/services/home.service";

export const homeQueryKeys = {
  attention: ["home", "attention"] as const,
};

/** The home page's "what to do" list. Refetched on focus: it changes as the user works. */
export function useHomeAttention() {
  return useQuery({
    queryKey: homeQueryKeys.attention,
    queryFn: homeService.getAttention,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
