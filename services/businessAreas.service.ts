import api from "@/lib/api";
import type { BusinessArea } from "@/types";

export const businessAreasService = {
  list: async (): Promise<BusinessArea[]> => {
    const res = await api.get<BusinessArea[]>("/business-areas");
    return res.data;
  },
};
