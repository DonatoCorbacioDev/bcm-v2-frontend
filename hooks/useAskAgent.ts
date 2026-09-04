import { useMutation } from "@tanstack/react-query";
import { api, AGENT_REQUEST_TIMEOUT_MS } from "@/lib/api";
import type { AgentAnswer } from "@/types";

export function useAskAgent() {
  return useMutation({
    mutationFn: async (question: string) => {
      const res = await api.post<AgentAnswer>(
        "/agent/ask",
        { question },
        { timeout: AGENT_REQUEST_TIMEOUT_MS }
      );
      return res.data;
    },
  });
}
