/**
 * useEligibilityCheck Hook
 * 
 * Provides eligibility checking functionality for opportunities with:
 * - Active wallet integration
 * - Automatic refresh on wallet change
 * - Manual recalculation with throttling
 * - Loading states
 * - Per-wallet + opportunity caching
 * 
 * Requirements: 17.5, 18.5
 * Task: 47
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef } from 'react';
import { useWallet } from '@/contexts/WalletContext';

export interface EligibilityResult {
  status: 'likely' | 'maybe' | 'unlikely' | 'unknown';
  score: number;
  reasons: string[];
  cachedUntil: string;
}

interface UseEligibilityCheckProps {
  opportunityId: string;
  chain: string;
  enabled?: boolean;
}

/**
 * Hook for checking eligibility with active wallet integration
 * 
 * Features:
 * - Uses activeWallet from WalletContext
 * - Query key includes activeWallet for automatic refresh on wallet change
 * - Manual recalculation with 5-second throttling
 * - Loading states for both initial load and recalculation
 * - Caches results per wallet + opportunity pair
 * 
 * @param opportunityId - Opportunity ID to check eligibility for
 * @param chain - Required chain for the opportunity
 * @param enabled - Whether to enable the query (default: true)
 * @returns Eligibility result, loading states, and recalculate function
 */
export function useEligibilityCheck({
  opportunityId,
  chain,
  enabled = true,
}: UseEligibilityCheckProps) {
  const { activeWallet } = useWallet();
  const queryClient = useQueryClient();
  const [isRecalculating, setIsRecalculating] = useState(false);
  const lastRecalculateTime = useRef<number>(0);

  // Query key includes activeWallet to trigger refetch on wallet change (Requirement 18.5)
  const queryKey = ['eligibility', opportunityId, chain, activeWallet];

  // Fetch eligibility from API
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // If no wallet is connected, return unknown status
      if (!activeWallet) {
        return {
          status: 'unknown' as const,
          score: 0,
          reasons: ['Connect a wallet to check eligibility'],
          cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        };
      }

      // Call eligibility API
      const params = new URLSearchParams({
        wallet: activeWallet,
        opportunityId,
        chain,
      });

      const response = await fetch(`/api/eligibility/preview?${params.toString()}`);

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new Error(`Rate limited. Retry after ${retryAfter} seconds.`);
        }

        // Handle other errors
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to check eligibility');
      }

      const result = await response.json();
      return result as EligibilityResult;
    },
    enabled: enabled && !!opportunityId && !!chain,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour (formerly cacheTime)
    retry: 1,
    retryDelay: 1000,
  });

  /**
   * Manually recalculate eligibility
   * Throttled to 1 call per 5 seconds to prevent API abuse (Requirement 47)
   */
  const recalculate = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRecalculate = now - lastRecalculateTime.current;

    // Throttle to 1 per 5 seconds
    if (timeSinceLastRecalculate < 5000) {
      const remainingTime = Math.ceil((5000 - timeSinceLastRecalculate) / 1000);
      console.log(`[Eligibility] Throttled. Please wait ${remainingTime} more seconds.`);
      return;
    }

    // Update throttle timestamp
    lastRecalculateTime.current = now;

    // Set recalculating state
    setIsRecalculating(true);

    try {
      // Invalidate cache and refetch
      await queryClient.invalidateQueries({ queryKey });
      await refetch();
    } catch (error) {
      console.error('[Eligibility] Recalculation failed:', error);
    } finally {
      // Clear recalculating state after a short delay for UX
      setTimeout(() => {
        setIsRecalculating(false);
      }, 500);
    }
  }, [queryClient, queryKey, refetch]);

  return {
    eligibility: data,
    isLoading: isLoading || !activeWallet,
    isRecalculating,
    error: error as Error | null,
    recalculate,
    hasWallet: !!activeWallet,
  };
}
