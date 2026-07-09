import api from "@/lib/api";

export interface Organization {
  id: number;
  name: string;
  slug: string;
  subscriptionTier: string;
  iban: string | null;
  bic: string | null;
  createdAt: string;
}

export interface UpdateOrganizationPayload {
  name?: string;
  subscriptionTier?: string;
  iban?: string;
  bic?: string;
}

export const organizationService = {
  getMine: async (): Promise<Organization> => {
    const res = await api.get<Organization>("/organizations/me");
    return res.data;
  },

  update: async (payload: UpdateOrganizationPayload): Promise<Organization> => {
    const res = await api.put<Organization>("/organizations/me", payload);
    return res.data;
  },
};
