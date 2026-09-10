/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import api from "@/lib/api";
import type { OrganizationInvoicingSummary } from "@/types";

/**
 * Dashboard stats response from backend
 * Matches actual backend ContractStatsResponse
 */
export interface DashboardStats {
  total: number;
  active: number;
  expiring: number;
  expired: number;
  draft: number;
}

export const dashboardService = {
  /**
   * Fetch contract statistics
   * GET /api/v1/contracts/stats
   */
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>("/contracts/stats");
    return response.data;
  },

  /**
   * Fetch expected-vs-invoiced summary for the current year
   * GET /api/v1/contracts/stats/invoicing-summary
   */
  getInvoicingSummary: async (): Promise<OrganizationInvoicingSummary> => {
    const response = await api.get<OrganizationInvoicingSummary>("/contracts/stats/invoicing-summary");
    return response.data;
  },
};