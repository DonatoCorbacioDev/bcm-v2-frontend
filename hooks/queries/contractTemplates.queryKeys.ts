/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

export const contractTemplatesQueryKeys = {
  all: ["contract-templates"] as const,
  list: () => [...contractTemplatesQueryKeys.all] as const,
  detail: (id: number) => [...contractTemplatesQueryKeys.all, "detail", id] as const,
};
