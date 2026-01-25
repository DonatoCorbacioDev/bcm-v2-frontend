import api from "@/lib/api";
import type { Contract } from "@/types";

export type ContractUpsertPayload = Omit<Contract, "id" | "createdAt">;

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
};