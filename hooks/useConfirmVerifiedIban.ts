/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { counterpartiesService, type VerifyIbanPayload } from "@/services/counterparties.service";
import type { Counterparty } from "@/types";

export function useConfirmVerifiedIban(counterpartyId: number) {
  const queryClient = useQueryClient();

  return useMutation<Counterparty, AxiosError<{ message?: string }>, VerifyIbanPayload>({
    mutationFn: (payload: VerifyIbanPayload) =>
      counterpartiesService.confirmVerifiedIban(counterpartyId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["counterparty", counterpartyId] });
    },
  });
}
