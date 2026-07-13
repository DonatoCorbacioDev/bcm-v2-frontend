import api from "@/lib/api";
import type { ContractWorkflowEvent } from "@/types";

export const contractWorkflowService = {
  submit: async (contractId: number): Promise<void> => {
    await api.post(`/contracts/${contractId}/workflow/submit`);
  },

  approve: async (contractId: number): Promise<void> => {
    await api.post(`/contracts/${contractId}/workflow/approve`);
  },

  reject: async (contractId: number, comment: string): Promise<void> => {
    await api.post(`/contracts/${contractId}/workflow/reject`, { comment });
  },

  getEvents: async (contractId: number): Promise<ContractWorkflowEvent[]> => {
    const res = await api.get<ContractWorkflowEvent[]>(`/contracts/${contractId}/workflow/events`);
    return res.data;
  },
};
