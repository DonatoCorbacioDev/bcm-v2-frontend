import api from "@/lib/api";
import type { FinancialValue } from "@/types";

export type FinancialValueUpsertPayload = {
  month: number;
  year: number;
  financialAmount: number;
  financialTypeId: number;
  businessAreaId: number;
  contractId: number;
};

export const financialValuesService = {
  list: async (): Promise<FinancialValue[]> => {
    const res = await api.get<FinancialValue[]>("/financial-values");
    return res.data;
  },

  create: async (payload: FinancialValueUpsertPayload): Promise<FinancialValue> => {
    const res = await api.post<FinancialValue>("/financial-values", payload);
    return res.data;
  },

  update: async (id: number, payload: FinancialValueUpsertPayload): Promise<FinancialValue> => {
    const res = await api.put<FinancialValue>(`/financial-values/${id}`, payload);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/financial-values/${id}`);
  },
};