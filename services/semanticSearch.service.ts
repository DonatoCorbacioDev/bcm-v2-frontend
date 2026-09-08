/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import api from "@/lib/api";
import type { SemanticSearchResult } from "@/types";

export const semanticSearchService = {
  search: async (query: string): Promise<SemanticSearchResult[]> => {
    const res = await api.post<SemanticSearchResult[]>("/contracts/search/semantic", { query });
    return res.data;
  },
};
