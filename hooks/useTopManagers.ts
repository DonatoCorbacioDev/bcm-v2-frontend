import { useQuery } from '@tanstack/react-query';
import { contractsService } from '@/services/contracts.service';

export function useTopManagers() {
  return useQuery({
    queryKey: ['contracts', 'stats', 'top-managers'],
    queryFn: () => contractsService.getTopManagers(),
    staleTime: 5 * 60 * 1000,
  });
}