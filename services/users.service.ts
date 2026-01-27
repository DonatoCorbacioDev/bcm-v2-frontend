import api from "@/lib/api";
import type { User } from "@/types";

export type UserUpsertPayload = {
  username: string;
  password?: string; // Optional for updates (only if changing password)
  managerId: number;
  roleId: number;
  verified: boolean;
};

export const usersService = {
  list: async (): Promise<User[]> => {
    const res = await api.get<User[]>("/users");
    return res.data;
  },

  create: async (payload: UserUpsertPayload): Promise<User> => {
    const res = await api.post<User>("/users", payload);
    return res.data;
  },

  update: async (id: number, payload: UserUpsertPayload): Promise<User> => {
    const res = await api.put<User>(`/users/${id}`, payload);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};