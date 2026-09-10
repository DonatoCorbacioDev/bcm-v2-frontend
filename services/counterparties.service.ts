/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import api from "@/lib/api";
import type { Counterparty, CounterpartyInvoicingSummary, CounterpartyType } from "@/types";

export type CounterpartyUpsertPayload = {
  name: string;
  type: CounterpartyType;
  vatNumber?: string;
  taxCode?: string;
  address?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
};

export const counterpartiesService = {
  list: async (): Promise<Counterparty[]> => {
    const res = await api.get<Counterparty[]>("/counterparties");
    return res.data;
  },

  getById: async (id: number): Promise<Counterparty> => {
    const res = await api.get<Counterparty>(`/counterparties/${id}`);
    return res.data;
  },

  getInvoicingSummary: async (id: number): Promise<CounterpartyInvoicingSummary> => {
    const res = await api.get<CounterpartyInvoicingSummary>(`/counterparties/${id}/invoicing-summary`);
    return res.data;
  },

  create: async (payload: CounterpartyUpsertPayload): Promise<Counterparty> => {
    const res = await api.post<Counterparty>("/counterparties", payload);
    return res.data;
  },

  update: async (id: number, payload: CounterpartyUpsertPayload): Promise<Counterparty> => {
    const res = await api.put<Counterparty>(`/counterparties/${id}`, payload);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/counterparties/${id}`);
  },
};
