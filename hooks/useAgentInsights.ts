import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AgentInsights } from "@/types";

export function useAgentInsights() {
  return useQuery<AgentInsights>({
    queryKey: ["agent-insights"],
    queryFn: async () => {
      const res = await api.get<AgentInsights>("/agent/insights");
      return res.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
