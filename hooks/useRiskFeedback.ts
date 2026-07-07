import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RiskFeedback, RiskFeedbackRequest } from "@/types";

const riskFeedbackQueryKey = ["risk-feedback"];

export function useRiskFeedback() {
  return useQuery<RiskFeedback[]>({
    queryKey: riskFeedbackQueryKey,
    queryFn: async () => {
      const res = await api.get<RiskFeedback[]>("/risk-feedback");
      return res.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitRiskFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contractId, ...payload }: RiskFeedbackRequest & { contractId: number }) => {
      const res = await api.post<RiskFeedback>(`/risk-feedback/contracts/${contractId}`, payload);
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: riskFeedbackQueryKey });
    },
  });
}
