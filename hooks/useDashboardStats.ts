import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";

/**
 * Query keys for dashboard stats
 */
export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardQueryKeys.all, "stats"] as const,
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