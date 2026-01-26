import api from "@/lib/api";
import type { Manager } from "@/types";

export const managersService = {
  list: async (): Promise<Manager[]> => {
    const res = await api.get<Manager[]>("/managers");
    return res.data;
  },
};
