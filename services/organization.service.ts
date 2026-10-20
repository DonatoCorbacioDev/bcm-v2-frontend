/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

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
  iban?: string;
  bic?: string;
}

export interface OrganizationUsage {
  contractsUsed: number;
  /** null means the tier has no limit (ENTERPRISE). */
  contractsLimit: number | null;
}

export const organizationService = {
  getMine: async (): Promise<Organization> => {
    const res = await api.get<Organization>("/organizations/me");
    return res.data;
  },

  getUsage: async (): Promise<OrganizationUsage> => {
    const res = await api.get<OrganizationUsage>("/organizations/me/usage");
    return res.data;
  },

  update: async (payload: UpdateOrganizationPayload): Promise<Organization> => {
    const res = await api.put<Organization>("/organizations/me", payload);
    return res.data;
  },

  /** Returns the Stripe-hosted checkout URL to redirect the browser to. */
  startProCheckout: async (): Promise<string> => {
    const res = await api.post<{ url: string }>("/billing/checkout-session");
    return res.data.url;
  },
};
