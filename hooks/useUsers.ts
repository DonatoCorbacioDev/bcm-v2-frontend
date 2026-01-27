import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";

export const usersQueryKeys = {
  all: ["users"] as const,
  list: () => [...usersQueryKeys.all] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: usersQueryKeys.list(),
    queryFn: usersService.list,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}