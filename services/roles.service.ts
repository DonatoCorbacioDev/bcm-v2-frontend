import api from "@/lib/api";
import type { Role } from "@/types";

export const rolesService = {
  list: async (): Promise<Role[]> => {
    const res = await api.get<Role[]>("/roles");
    return res.data;
  },
};