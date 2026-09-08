/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

export const contractsQueryKeys = {
  all: ["contracts"] as const,
  list: () => [...contractsQueryKeys.all] as const,
  detail: (id: number) => [...contractsQueryKeys.all, "detail", id] as const,
};