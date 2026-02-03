import { useQuery } from '@tanstack/react-query';
import { contractsService } from '@/services/contracts.service';

export function useContractsByArea() {
  return useQuery({
    queryKey: ['contracts', 'stats', 'by-area'],
    queryFn: () => contractsService.getContractsByArea(),
    staleTime: 5 * 60 * 1000,
  });
}