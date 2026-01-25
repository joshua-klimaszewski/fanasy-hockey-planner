import { useQuery } from '@tanstack/react-query';
import { getAllPlayers } from '../clients/nhlClient';

/** Query key factory for player queries */
export const playerKeys = {
  all: ['players'] as const,
  allPlayers: () => [...playerKeys.all, 'all'] as const,
};

/** Hook to fetch all NHL players from all 32 teams */
export function useAllPlayers() {
  return useQuery({
    queryKey: playerKeys.allPlayers(),
    queryFn: getAllPlayers,
    // Cache for the entire session - player rosters don't change frequently
    staleTime: Infinity,
    gcTime: Infinity,
    // Refetch on mount only if data is not in cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
