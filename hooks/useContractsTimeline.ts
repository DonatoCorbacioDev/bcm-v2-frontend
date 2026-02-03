import { useQuery } from '@tanstack/react-query';
import { contractsService } from '@/services/contracts.service';

export function useContractsTimeline() {
  return useQuery({
    queryKey: ['contracts', 'stats', 'timeline'],
    queryFn: () => contractsService.getContractsTimeline(),
    staleTime: 5 * 60 * 1000,
  });
}