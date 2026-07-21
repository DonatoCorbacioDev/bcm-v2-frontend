import api from "@/lib/api";
import type { Budget, FinancialCategory } from "@/types";

export type BudgetUpsertPayload = {
  businessAreaId: number;
  category: FinancialCategory;
  year: number;
  targetAmount: number;
};

export const budgetsService = {
  list: async (): Promise<Budget[]> => {
    const res = await api.get<Budget[]>("/budgets");
    return res.data;
  },

  create: async (payload: BudgetUpsertPayload): Promise<Budget> => {
    const res = await api.post<Budget>("/budgets", payload);
    return res.data;
  },

  update: async (id: number, payload: BudgetUpsertPayload): Promise<Budget> => {
    const res = await api.put<Budget>(`/budgets/${id}`, payload);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/budgets/${id}`);
  },
};
