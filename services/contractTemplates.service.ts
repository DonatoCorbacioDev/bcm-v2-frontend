/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import api from "@/lib/api";
import type { ContractTemplate, Contract } from "@/types";

export type ContractTemplateUpsertPayload = {
  name: string;
  description?: string | null;
  defaultStatus?: "ACTIVE" | "EXPIRED" | "CANCELLED" | "DRAFT" | null;
  defaultDurationDays?: number | null;
  businessAreaId?: string | null;
  defaultManagerId?: string | null;
  autoRenew: boolean;
  notificationDays?: number | null;
};

export type InstantiateTemplatePayload = {
  counterpartyId: string;
  contractNumber: string;
  wbsCode?: string | null;
  projectName?: string | null;
  startDate: string;
  endDate?: string | null;
  businessAreaId?: string | null;
  managerId?: string | null;
  status?: "ACTIVE" | "EXPIRED" | "CANCELLED" | "DRAFT" | null;
};

export const contractTemplatesService = {
  list: async (): Promise<ContractTemplate[]> => {
    const res = await api.get<ContractTemplate[]>("/contract-templates");
    return res.data;
  },

  getById: async (id: string): Promise<ContractTemplate> => {
    const res = await api.get<ContractTemplate>(`/contract-templates/${id}`);
    return res.data;
  },

  create: async (payload: ContractTemplateUpsertPayload): Promise<ContractTemplate> => {
    const res = await api.post<ContractTemplate>("/contract-templates", payload);
    return res.data;
  },

  update: async (id: string, payload: ContractTemplateUpsertPayload): Promise<ContractTemplate> => {
    const res = await api.put<ContractTemplate>(`/contract-templates/${id}`, payload);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/contract-templates/${id}`);
  },

  instantiate: async (id: string, payload: InstantiateTemplatePayload): Promise<Contract> => {
    const res = await api.post<Contract>(`/contract-templates/${id}/instantiate`, payload);
    return res.data;
  },
};
