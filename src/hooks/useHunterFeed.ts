import { useQuery } from '@tanstack/react-query';
import type { Quest, HunterFilters } from '@/types/hunter';
import { supabase } from '@/integrations/supabase/client';

function mapOpportunityToQuest(o: any): Quest {
  return {
    id: o.slug,
    protocol: o.protocol,
    network: (o.chains && o.chains[0]) || 'ethereum',
    rewardUSD: Math.round(((o.reward_min ?? 0) + (o.reward_max ?? 0)) || (o.apr ? (o.tvl_usd || 0) * (o.apr / 100) * 0.01 : 0)),
    confidence: (o.trust_score || 70) / 100,
    guardianScore: o.trust_score || 70,
    steps: (o.steps || []).length || 2,
    estimatedTime: o.time_required || '10 min',
    category: (o.type === 'yield' || o.type === 'staking') ? 'Staking' : 'Airdrop',
    isNew: o.isNew || false,
    completionPercent: 0,
  }
}

export const useHunterFeed = (filters?: HunterFilters) => {
  return useQuery({
    queryKey: ['hunter-feed', filters],
    queryFn: async (): Promise<Quest[]> => {
      const { data, error } = await supabase.functions.invoke('hunter-opportunities', {
        body: { filters: {
          type: filters?.category?.toLowerCase() === 'staking' ? 'yield' : undefined,
          chains: filters?.network && filters.network !== 'all' ? [filters.network] : undefined,
          onlyVerified: filters?.safety === '≥95%'
        } }
      })
      if (error) throw error
      const items = data?.data?.opportunities || []
      return items.map(mapOpportunityToQuest)
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}