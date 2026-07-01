import api from "@/lib/api";
import type { ContractTemplate, Contract } from "@/types";

export type ContractTemplateUpsertPayload = {
  name: string;
  description?: string | null;
  defaultStatus?: "ACTIVE" | "EXPIRED" | "CANCELLED" | "DRAFT" | null;
  defaultDurationDays?: number | null;
  businessAreaId?: number | null;
  defaultManagerId?: number | null;
  autoRenew: boolean;
  notificationDays?: number | null;
};

export type InstantiateTemplatePayload = {
  customerName: string;
  contractNumber: string;
  wbsCode?: string | null;
  projectName?: string | null;
  startDate: string;
  endDate?: string | null;
  businessAreaId?: number | null;
  managerId?: number | null;
  status?: "ACTIVE" | "EXPIRED" | "CANCELLED" | "DRAFT" | null;
};

export const contractTemplatesService = {
  list: async (): Promise<ContractTemplate[]> => {
    const res = await api.get<ContractTemplate[]>("/contract-templates");
    return res.data;
  },

  getById: async (id: number): Promise<ContractTemplate> => {
    const res = await api.get<ContractTemplate>(`/contract-templates/${id}`);
    return res.data;
  },

  create: async (payload: ContractTemplateUpsertPayload): Promise<ContractTemplate> => {
    const res = await api.post<ContractTemplate>("/contract-templates", payload);
    return res.data;
  },

  update: async (id: number, payload: ContractTemplateUpsertPayload): Promise<ContractTemplate> => {
    const res = await api.put<ContractTemplate>(`/contract-templates/${id}`, payload);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/contract-templates/${id}`);
  },

  instantiate: async (id: number, payload: InstantiateTemplatePayload): Promise<Contract> => {
    const res = await api.post<Contract>(`/contract-templates/${id}/instantiate`, payload);
    return res.data;
  },
};
