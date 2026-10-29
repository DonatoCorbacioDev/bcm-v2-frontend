/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import api, { EXPORT_REQUEST_TIMEOUT_MS } from "@/lib/api";
import { filenameFromContentDisposition } from "@/lib/download";

export interface Organization {
  id: number;
  name: string;
  slug: string;
  subscriptionTier: string;
  iban: string | null;
  bic: string | null;
  createdAt: string;
  /** true when the org has a Stripe subscription its admin can manage in the Customer Portal. */
  billingPortalAvailable: boolean;
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

export interface OrganizationExport {
  blob: Blob;
  filename: string;
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

  /** All of the organization's data and files as a ZIP (Terms sez. 13, GDPR art. 20). */
  exportAll: async (): Promise<OrganizationExport> => {
    const res = await api.get<Blob>("/organizations/me/export", {
      responseType: "blob",
      timeout: EXPORT_REQUEST_TIMEOUT_MS,
    });
    const filename =
      filenameFromContentDisposition(res.headers["content-disposition"]) ??
      `bcm-export-${new Date().toISOString().split("T")[0]}.zip`;
    return { blob: res.data, filename };
  },

  /** Returns the Stripe-hosted checkout URL to redirect the browser to. */
  startProCheckout: async (): Promise<string> => {
    const res = await api.post<{ url: string }>("/billing/checkout-session");
    return res.data.url;
  },

  /** Returns the Stripe Customer Portal URL (cancel, change card, invoices). */
  openBillingPortal: async (): Promise<string> => {
    const res = await api.post<{ url: string }>("/billing/portal-session");
    return res.data.url;
  },
};
