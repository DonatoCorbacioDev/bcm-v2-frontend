import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AnomalyRecord {
  financialValueId: number;
  contractId: number;
  customerName: string;
  month: number;
  year: number;
  financialAmount: number;
  anomalyScore: number;
  severity: "HIGH" | "MEDIUM" | "LOW";
}

export function useAnomalies() {
  return useQuery<AnomalyRecord[]>({
    queryKey: ["anomalies"],
    queryFn: async () => {
      const res = await api.get<AnomalyRecord[]>("/anomalies");
      return res.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
