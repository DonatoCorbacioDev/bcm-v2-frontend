import api from "@/lib/api";

/**
 * Dashboard stats response from backend
 * Matches actual backend ContractStatsResponse
 */
export interface DashboardStats {
  total: number;
  active: number;
  expiring: number;
  expired: number;
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
};