import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AgentAnswer } from "@/types";

export function useAskAgent() {
  return useMutation({
    mutationFn: async (question: string) => {
      const res = await api.post<AgentAnswer>("/agent/ask", { question });
      return res.data;
    },
  });
}
