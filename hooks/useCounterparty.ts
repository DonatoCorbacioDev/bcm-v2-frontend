/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { useQuery } from "@tanstack/react-query";
import { counterpartiesService } from "@/services/counterparties.service";
import type { Counterparty, CounterpartyInvoicingSummary } from "@/types";

export function useCounterparty(id: number) {
  return useQuery<Counterparty>({
    queryKey: ["counterparty", id],
    queryFn: () => counterpartiesService.getById(id),
    enabled: !!id && id > 0,
  });
}

export function useCounterpartyInvoicingSummary(id: number) {
  return useQuery<CounterpartyInvoicingSummary>({
    queryKey: ["counterparty", id, "invoicing-summary"],
    queryFn: () => counterpartiesService.getInvoicingSummary(id),
    enabled: !!id && id > 0,
  });
}
