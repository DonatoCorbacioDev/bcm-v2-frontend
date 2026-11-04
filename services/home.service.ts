/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import api from "@/lib/api";
import type { HomeAttention } from "@/types";

export const homeService = {
  /** GET /api/v1/home/attention — what needs attention, scoped to the user. */
  getAttention: async (): Promise<HomeAttention> => {
    const response = await api.get<HomeAttention>("/home/attention");
    return response.data;
  },
};
