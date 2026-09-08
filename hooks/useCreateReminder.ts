/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contractId, message }: { contractId: number; message: string }) => {
      await api.post("/notifications", { contractId, message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
