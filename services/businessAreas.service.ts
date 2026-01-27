import api from "@/lib/api";
import type { BusinessArea } from "@/types";

export type BusinessAreaUpsertPayload = {
  name: string;
  description: string;
};

export const businessAreasService = {
  list: async (): Promise<BusinessArea[]> => {
    const res = await api.get<BusinessArea[]>("/business-areas");
    return res.data;
  },

  create: async (payload: BusinessAreaUpsertPayload): Promise<BusinessArea> => {
    const res = await api.post<BusinessArea>("/business-areas", payload);
    return res.data;
  },

  update: async (id: number, payload: BusinessAreaUpsertPayload): Promise<BusinessArea> => {
    const res = await api.put<BusinessArea>(`/business-areas/${id}`, payload);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/business-areas/${id}`);
  },
};