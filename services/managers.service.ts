import api from "@/lib/api";
import type { Manager } from "@/types";

export type ManagerUpsertPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  department: string;
};

export const managersService = {
  list: async (): Promise<Manager[]> => {
    const res = await api.get<Manager[]>("/managers");
    return res.data;
  },

  create: async (payload: ManagerUpsertPayload): Promise<Manager> => {
    const res = await api.post<Manager>("/managers", payload);
    return res.data;
  },

  update: async (id: number, payload: ManagerUpsertPayload): Promise<Manager> => {
    const res = await api.put<Manager>(`/managers/${id}`, payload);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/managers/${id}`);
  },
};