/**
 * React Query Hook for Harvest Opportunities
 * Fetches opportunities from API which calls Edge Function
 */

import { useQuery } from '@tanstack/react-query';
import type { OpportunitiesResponse } from '@/types/harvestpro';

export interface UseHarvestOpportunitiesOptions {
  taxRate?: number;
  minLossThreshold?: number;
  maxRiskLevel?: 'low' | 'medium' | 'high';
  excludeWashSale?: boolean;
  enabled?: boolean;
}

export function useHarvestOpportunities(options: UseHarvestOpportunitiesOptions = {}) {
  const {
    taxRate = 0.24,
    minLossThreshold = 100,
    maxRiskLevel = 'medium',
    excludeWashSale = true,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: ['harvest-opportunities', { taxRate, minLossThreshold, maxRiskLevel, excludeWashSale }],
    queryFn: async (): Promise<OpportunitiesResponse> => {
      const params = new URLSearchParams({
        taxRate: String(taxRate),
        minLossThreshold: String(minLossThreshold),
        maxRiskLevel,
        excludeWashSale: String(excludeWashSale),
      });

      const response = await fetch(`/api/harvest/opportunities?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch opportunities');
      }

      return response.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
