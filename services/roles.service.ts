/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import api from "@/lib/api";
import type { Role } from "@/types";

export const rolesService = {
  list: async (): Promise<Role[]> => {
    const res = await api.get<Role[]>("/roles");
    return res.data;
  },
};