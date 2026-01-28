import api from "@/lib/api";
import type { Contract } from "@/types";

export type ContractStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export type ContractUpsertPayload = {
  customerName: string;
  contractNumber: string;
  wbsCode: string;
  projectName: string;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  areaId: number;
  managerId: number;
};


export const contractsService = {
  list: async (): Promise<Contract[]> => {
    const res = await api.get<Contract[]>("/contracts");
    return res.data;
  },

  create: async (payload: ContractUpsertPayload): Promise<Contract> => {
    const res = await api.post<Contract>("/contracts", payload);
    return res.data;
  },

  update: async (id: number, payload: ContractUpsertPayload): Promise<Contract> => {
    const res = await api.put<Contract>(`/contracts/${id}`, payload);
    return res.data;
  },

  getById: async (id: number): Promise<Contract> => {
    const res = await api.get<Contract>(`/contracts/${id}`);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/contracts/${id}`);
  },
};