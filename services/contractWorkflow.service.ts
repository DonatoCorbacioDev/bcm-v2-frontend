/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import api from "@/lib/api";
import type { ContractWorkflowEvent } from "@/types";

export const contractWorkflowService = {
  submit: async (contractId: string): Promise<void> => {
    await api.post(`/contracts/${contractId}/workflow/submit`);
  },

  approve: async (contractId: string): Promise<void> => {
    await api.post(`/contracts/${contractId}/workflow/approve`);
  },

  reject: async (contractId: string, comment: string): Promise<void> => {
    await api.post(`/contracts/${contractId}/workflow/reject`, { comment });
  },

  getEvents: async (contractId: string): Promise<ContractWorkflowEvent[]> => {
    const res = await api.get<ContractWorkflowEvent[]>(`/contracts/${contractId}/workflow/events`);
    return res.data;
  },
};
