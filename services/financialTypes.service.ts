import api from "@/lib/api";
import type { FinancialType } from "@/types";

export const financialTypesService = {
  list: async (): Promise<FinancialType[]> => {
    const res = await api.get<FinancialType[]>("/financial-types");
    return res.data;
  },
};
