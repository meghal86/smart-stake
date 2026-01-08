/**
 * React Query Hook for Harvest Opportunities
 * Calls Supabase Edge Function directly (Vite app - no Next.js API routes)
 * Enhanced with performance monitoring and optimized cache settings
 * 
 * Query key includes wallet context to ensure refetch on wallet/network changes
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { harvestProPerformanceMonitor } from '@/lib/harvestpro/performance-monitor';
import { useWallet } from '@/contexts/WalletContext';
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
  
  const avgGasPercentage = opportunities.reduce((sum, opp: HarvestOpportunity) => {
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

  // Get wallet context to include in query key for automatic refetch on wallet changes
  const { activeWallet, activeNetwork, isAuthenticated } = useWallet();

  return useQuery({
    queryKey: ['harvest-opportunities', { taxRate, minLossThreshold, maxRiskLevel, excludeWashSale }, activeWallet, activeNetwork, isAuthenticated],
    queryFn: async (): Promise<OpportunitiesResponse> => {
      // Measure API call performance
      return await harvestProPerformanceMonitor.measureOpportunityLoading(
        'api_call',
        async () => {
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
          
          // Measure client-side processing performance
          return await harvestProPerformanceMonitor.measureOpportunityLoading(
            'processing',
            async () => {
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
            {
              opportunityCount: edgeFunctionData.opportunities?.length || 0,
              userId: user.id,
            }
          );
        },
        {
          taxRate,
          minLossThreshold,
          maxRiskLevel,
          excludeWashSale,
        }
      );
    },
    enabled,
    // Optimized cache settings for performance
    staleTime: 3 * 60 * 1000, // 3 minutes - reduced from 5 minutes for fresher data
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in memory longer for better UX
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: true, // Always fetch fresh data on mount
    retry: (failureCount, error) => {
      // Custom retry logic with performance tracking
      harvestProPerformanceMonitor.recordMetric(
        'opportunities:retry',
        failureCount,
        3, // Max 3 retries
        { error: error.message }
      );
      return failureCount < 2; // Retry up to 2 times
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    // Performance monitoring for cache hits/misses
    onSuccess: (data) => {
      harvestProPerformanceMonitor.measureCachePerformance(
        'hit',
        `harvest-opportunities-${JSON.stringify({ taxRate, minLossThreshold, maxRiskLevel, excludeWashSale })}`,
        0, // Cache hits are instant
        {
          opportunityCount: data.items.length,
          totalBenefit: data.summary.estimatedNetBenefit,
        }
      );
    },
    onError: (error) => {
      harvestProPerformanceMonitor.recordMetric(
        'opportunities:error',
        Date.now(),
        0, // Any error is a violation
        { error: error.message }
      );
    },
  });
}
