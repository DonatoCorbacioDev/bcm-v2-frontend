/*
 * Copyright (c) 2025 Donato Corbacio. All rights reserved.
 * Licensed under the terms of the LICENSE file at the repository root.
 */

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";

/**
 * Query keys for dashboard stats
 */
export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardQueryKeys.all, "stats"] as const,
  invoicingSummary: () => [...dashboardQueryKeys.all, "invoicing-summary"] as const,
};

/**
 * Hook to fetch dashboard statistics
 * Cached for 5 minutes
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardQueryKeys.stats(),
    queryFn: dashboardService.getStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch the expected-vs-invoiced summary for the current year
 * Cached for 5 minutes
 */
export function useInvoicingSummary() {
  return useQuery({
    queryKey: dashboardQueryKeys.invoicingSummary(),
    queryFn: dashboardService.getInvoicingSummary,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}