import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contractId, message }: { contractId: number; message: string }) => {
      await api.post("/notifications", { contractId, message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
