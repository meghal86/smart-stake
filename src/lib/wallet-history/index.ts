/**
 * Wallet History Service
 * 
 * Fetches wallet activity data for personalized ranking:
 * - Chains used by wallet
 * - Completed opportunities
 * - Saved opportunities
 * - Preferred chains from user preferences
 * 
 * Requirements: 17.4, 18.4
 */

import { supabase } from '@/integrations/supabase/client';
import { Chain, OpportunityType } from '@/types/hunter';
import { RedisKeys } from '@/lib/redis/keys';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis/cache';

/**
 * Wallet history data for personalization
 */
export interface WalletHistory {
  walletAddress: string;
  chains: Chain[];
  completedTypes: OpportunityType[];
  savedTypes: OpportunityType[];
  preferredChains: Chain[];
  completedCount: number;
  savedCount: number;
  cachedAt: number;
}

/**
 * Cache TTL for wallet history (5 minutes)
 */
const WALLET_HISTORY_CACHE_TTL = 300; // 5 minutes

/**
 * Fetches wallet history for personalized ranking
 * 
 * This function:
 * 1. Checks Redis cache first
 * 2. Falls back to database query if cache miss
 * 3. Aggregates data from completed_opportunities, saved_opportunities, and user_preferences
 * 4. Caches result for performance
 * 
 * @param walletAddress - Wallet address to fetch history for
 * @param userId - Optional user ID for user preferences lookup
 * @returns Wallet history data
 * 
 * Requirements:
 * - 17.4: Personalized ranking based on wallet history
 * - 18.4: Feed refresh with personalized ranking on wallet change
 */
export async function getWalletHistory(
  walletAddress: string,
  userId?: string
): Promise<WalletHistory> {
  // Check cache first
  const cacheKey = RedisKeys.walletHistory(walletAddress);
  const cached = await cacheGet<WalletHistory>(cacheKey);
  
  if (cached.hit && cached.data) {
    return cached.data;
  }

  // Fetch from database
  // Use client-side Supabase client for browser compatibility
  // Note: This uses the anon key which has RLS policies for data access

  // Fetch completed opportunities
  const { data: completedData, error: completedError } = await supabase
    .from('completed_opportunities')
    .select(`
      opportunity_id,
      opportunities!inner(type, chains)
    `)
    .eq('user_id', userId || walletAddress)
    .order('completed_at', { ascending: false })
    .limit(100); // Last 100 completed opportunities

  if (completedError) {
    console.error('Error fetching completed opportunities:', completedError);
  }

  // Fetch saved opportunities
  const { data: savedData, error: savedError } = await supabase
    .from('saved_opportunities')
    .select(`
      opportunity_id,
      opportunities!inner(type, chains)
    `)
    .eq('user_id', userId || walletAddress)
    .order('saved_at', { ascending: false })
    .limit(100); // Last 100 saved opportunities

  if (savedError) {
    console.error('Error fetching saved opportunities:', savedError);
  }

  // Fetch user preferences
  let preferredChains: Chain[] = [];
  if (userId) {
    const { data: prefsData, error: prefsError } = await supabase
      .from('user_preferences')
      .select('preferred_chains')
      .eq('user_id', userId)
      .single();

    if (!prefsError && prefsData?.preferred_chains) {
      preferredChains = prefsData.preferred_chains as Chain[];
    }
  }

  // Aggregate chains from completed and saved opportunities
  const chainsSet = new Set<Chain>();
  const completedTypesSet = new Set<OpportunityType>();
  const savedTypesSet = new Set<OpportunityType>();

  // Process completed opportunities
  if (completedData) {
    for (const item of completedData) {
      const opp = (item as unknown).opportunities;
      if (opp) {
        completedTypesSet.add(opp.type);
        if (opp.chains) {
          for (const chain of opp.chains) {
            chainsSet.add(chain as Chain);
          }
        }
      }
    }
  }

  // Process saved opportunities
  if (savedData) {
    for (const item of savedData) {
      const opp = (item as unknown).opportunities;
      if (opp) {
        savedTypesSet.add(opp.type);
        if (opp.chains) {
          for (const chain of opp.chains) {
            chainsSet.add(chain as Chain);
          }
        }
      }
    }
  }

  // Add preferred chains to the set
  for (const chain of preferredChains) {
    chainsSet.add(chain);
  }

  // Build wallet history object
  const walletHistory: WalletHistory = {
    walletAddress,
    chains: Array.from(chainsSet),
    completedTypes: Array.from(completedTypesSet),
    savedTypes: Array.from(savedTypesSet),
    preferredChains,
    completedCount: completedData?.length || 0,
    savedCount: savedData?.length || 0,
    cachedAt: Date.now(),
  };

  // Cache the result
  await cacheSet(cacheKey, walletHistory, { ttl: WALLET_HISTORY_CACHE_TTL });

  return walletHistory;
}

/**
 * Invalidates wallet history cache
 * 
 * Call this when wallet completes or saves an opportunity
 * 
 * @param walletAddress - Wallet address to invalidate cache for
 */
export async function invalidateWalletHistoryCache(walletAddress: string): Promise<void> {
  const cacheKey = RedisKeys.walletHistory(walletAddress);
  
  try {
    await cacheDel(cacheKey);
  } catch (error) {
    console.error('Error invalidating wallet history cache:', error);
  }
}
