/**
 * React Query Hook for Harvest Opportunities
 * Calls Supabase Edge Function directly (Vite app - no Next.js API routes)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { OpportunitiesResponse, HarvestOpportunity, GasEfficiencyGrade } from '@/types/harvestpro';

export interface UseHarvestOpportunitiesOptions {
  taxRate?: number;
  minLossThreshold?: number;
  maxRiskLevel?: 'low' | 'medium' | 'high';
  excludeWashSale?: boolean;
  enabled?: boolean;
}

/**
 * Calculate gas efficiency grade based on opportunities
 */
function calculateGasEfficiencyGrade(opportunities: HarvestOpportunity[]): GasEfficiencyGrade {
  if (opportunities.length === 0) return 'C';
  
  const avgGasPercentage = opportunities.reduce((sum, opp) => {
    const gasPercentage = (opp.gasEstimate / opp.unrealizedLoss) * 100;
    return sum + gasPercentage;
  }, 0) / opportunities.length;
  
  if (avgGasPercentage < 5) return 'A';
  if (avgGasPercentage < 15) return 'B';
  return 'C';
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
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Authentication required');
      }
      
      // Call Edge Function directly
      const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke(
        'harvest-recompute-opportunities',
        {
          body: {
            userId: user.id,
            taxRate,
            minLossThreshold,
            maxRiskLevel,
            excludeWashSale,
          },
        }
      );
      
      if (edgeFunctionError) {
        console.error('Edge Function error:', edgeFunctionError);
        throw new Error('Failed to compute opportunities');
      }
      
      // Format response for UI consumption
      const opportunities = edgeFunctionData.opportunities || [];
      
      const summary = {
        totalHarvestableLoss: edgeFunctionData.totalPotentialSavings || 0,
        estimatedNetBenefit: edgeFunctionData.totalPotentialSavings || 0,
        eligibleTokensCount: edgeFunctionData.opportunitiesFound || 0,
        gasEfficiencyScore: calculateGasEfficiencyGrade(opportunities),
      };
      
      return {
        items: opportunities,
        cursor: null,
        ts: edgeFunctionData.lastComputedAt || new Date().toISOString(),
        summary,
      };
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
