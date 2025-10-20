import { useQuery } from '@tanstack/react-query';
import type { Quest, HunterFilters } from '@/types/hunter';

const mockQuests: Quest[] = [
  {
    id: 'dxp',
    protocol: 'DeltaX Protocol',
    network: 'Base',
    rewardUSD: 1200,
    confidence: 0.8,
    guardianScore: 98,
    steps: 3,
    estimatedTime: '6 min',
    category: 'Airdrop',
    isNew: true,
    completionPercent: 0
  },
  {
    id: 'arb-staking',
    protocol: 'Arbitrum Staking',
    network: 'Arbitrum',
    rewardUSD: 850,
    confidence: 0.92,
    guardianScore: 96,
    steps: 2,
    estimatedTime: '4 min',
    category: 'Staking',
    completionPercent: 25
  },
  {
    id: 'base-farm',
    protocol: 'Base Yield Farm',
    network: 'Base',
    rewardUSD: 2100,
    confidence: 0.75,
    guardianScore: 94,
    steps: 4,
    estimatedTime: '8 min',
    category: 'Farming',
    isNew: true,
    completionPercent: 0
  },
  {
    id: 'sol-quest',
    protocol: 'Solana Quest Hub',
    network: 'Solana',
    rewardUSD: 650,
    confidence: 0.88,
    guardianScore: 99,
    steps: 2,
    estimatedTime: '3 min',
    category: 'Quest',
    completionPercent: 60
  }
];

export const useHunterFeed = (filters?: HunterFilters) => {
  return useQuery({
    queryKey: ['hunter-feed', filters],
    queryFn: async (): Promise<Quest[]> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let data = [...mockQuests];
      
      if (filters) {
        data = data.filter((quest: Quest) => {
          if (filters.network !== 'all' && quest.network !== filters.network) return false;
          if (filters.category !== 'all' && quest.category !== filters.category) return false;
          if (filters.safety === '≥95%' && quest.guardianScore < 95) return false;
          return true;
        });
      }
      
      return data;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
};