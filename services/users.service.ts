import api from "@/lib/api";
import type { User } from "@/types";

export type UserUpsertPayload = {
  username: string;
  password?: string;
  managerId: number;
  roleId: number;
  verified: boolean;
  canApproveContracts: boolean;
};

export type InviteUserPayload = {
  username: string;
  role: string;
  managerId: number;
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

  invite: async (payload: InviteUserPayload): Promise<void> => {
    await api.post("/users/invite", payload);
  },
};