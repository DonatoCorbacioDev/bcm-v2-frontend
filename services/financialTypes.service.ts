import api from "@/lib/api";
import type { FinancialType } from "@/types";

export type FinancialTypeUpsertPayload = {
  name: string;
  description: string;
};

export const financialTypesService = {
  list: async (): Promise<FinancialType[]> => {
    const res = await api.get<FinancialType[]>("/financial-types");
    return res.data;
  },

  create: async (payload: FinancialTypeUpsertPayload): Promise<FinancialType> => {
    const res = await api.post<FinancialType>("/financial-types", payload);
    return res.data;
  },

  update: async (id: number, payload: FinancialTypeUpsertPayload): Promise<FinancialType> => {
    const res = await api.put<FinancialType>(`/financial-types/${id}`, payload);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/financial-types/${id}`);
  },
};
