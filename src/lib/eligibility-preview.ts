/**
 * Eligibility Preview Service
 * 
 * Provides eligibility preview functionality for opportunities based on wallet signals.
 * Implements caching to prevent redundant calculations (60 min TTL).
 * 
 * Requirements: 6.1-6.8
 */

import { supabase } from '@/integrations/supabase/client';
import { calculateEligibilityScore, type EligibilitySignals } from './eligibility';
import { getCachedWalletSignals, type WalletSignals } from './wallet-signals-cache';

export interface EligibilityPreview {
  /** Eligibility status */
  status: 'likely' | 'maybe' | 'unlikely' | 'unknown';
  /** Eligibility score (0-1 range) */
  score: number;
  /** Human-readable reasons explaining the determination */
  reasons: string[];
  /** When the cached result expires (ISO 8601) */
  cachedUntil: string;
}

export interface EligibilityPreviewError {
  status: 'unknown';
  score: 0;
  reasons: string[];
  cachedUntil: string;
}

/**
 * Fetch wallet signals with caching
 * 
 * Uses the wallet signals KV cache to reduce redundant blockchain queries.
 * Cache key: wallet_signals:{wallet}:{day}
 * TTL: 20 minutes
 * 
 * @param walletAddress - Wallet address to fetch signals for
 * @param requiredChain - Required chain for the opportunity
 * @returns Wallet signals or null if unable to fetch
 */
async function fetchWalletSignals(
  walletAddress: string,
  requiredChain: string
): Promise<WalletSignals | null> {
  // Use cached wallet signals to reduce redundant blockchain queries
  return getCachedWalletSignals(walletAddress, requiredChain);
}

/**
 * Get eligibility preview for a wallet and opportunity
 * 
 * Checks cache first, then calculates if needed. Results are cached for 60 minutes.
 * Always includes at least one reason, even for "Unknown" status.
 * 
 * @param walletAddress - Wallet address to check eligibility for
 * @param opportunityId - Opportunity ID to check eligibility against
 * @param requiredChain - Required chain for the opportunity
 * @returns Eligibility preview with status, score, reasons, and cache expiry
 */
export async function getEligibilityPreview(
  walletAddress: string,
  opportunityId: string,
  requiredChain: string
): Promise<EligibilityPreview | EligibilityPreviewError> {
  // Validate inputs
  if (!walletAddress || !opportunityId || !requiredChain) {
    const now = new Date();
    const cachedUntil = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    
    return {
      status: 'unknown',
      score: 0,
      reasons: ['Invalid input: wallet address, opportunity ID, and chain are required'],
      cachedUntil,
    };
  }

  // Normalize wallet address to lowercase for consistent caching
  const normalizedWallet = walletAddress.toLowerCase();

  try {
    // Check cache first
    const { data: cached, error: cacheError } = await supabase
      .from('eligibility_cache')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .eq('wallet_address', normalizedWallet)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!cacheError && cached) {
      // Cache hit - return cached result
      return {
        status: cached.status as 'likely' | 'maybe' | 'unlikely' | 'unknown',
        score: Number(cached.score) || 0,
        reasons: Array.isArray(cached.reasons) ? cached.reasons : ['Cached result'],
        cachedUntil: cached.expires_at,
      };
    }

    // Cache miss - fetch wallet signals and calculate
    const signals = await fetchWalletSignals(normalizedWallet, requiredChain);

    if (!signals) {
      // Unable to fetch signals - return unknown with reason
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

      const result: EligibilityPreviewError = {
        status: 'unknown',
        score: 0,
        reasons: ['Unable to fetch wallet data. Please try again later.'],
        cachedUntil: expiresAt.toISOString(),
      };

      // Cache the unknown result to prevent repeated failed fetches
      await supabase
        .from('eligibility_cache')
        .upsert({
          opportunity_id: opportunityId,
          wallet_address: normalizedWallet,
          status: result.status,
          score: result.score,
          reasons: result.reasons,
          cached_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        }, {
          onConflict: 'opportunity_id,wallet_address',
        });

      return result;
    }

    // Calculate eligibility score
    const eligibilitySignals: EligibilitySignals = {
      walletAgeDays: signals.walletAgeDays,
      txCount: signals.txCount,
      holdsOnChain: signals.holdsOnChain,
      hasActivityOnChain: (chain: string) => signals.activeChains.includes(chain),
      allowlistProofs: signals.allowlistProofs,
      requiredChain,
    };

    const scoreResult = calculateEligibilityScore(eligibilitySignals);

    // Prepare result
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 60 minutes TTL

    const result: EligibilityPreview = {
      status: scoreResult.label,
      score: scoreResult.score,
      reasons: scoreResult.reasons.length > 0 
        ? scoreResult.reasons 
        : ['Eligibility calculated based on wallet activity'],
      cachedUntil: expiresAt.toISOString(),
    };

    // Cache the result
    const { error: insertError } = await supabase
      .from('eligibility_cache')
      .upsert({
        opportunity_id: opportunityId,
        wallet_address: normalizedWallet,
        status: result.status,
        score: result.score,
        reasons: result.reasons,
        cached_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: 'opportunity_id,wallet_address',
      });

    if (insertError) {
      console.error('Error caching eligibility result:', insertError);
      // Continue anyway - we still have the calculated result
    }

    return result;

  } catch (error) {
    console.error('Error in getEligibilityPreview:', error);
    
    // Return unknown status with helpful error message
    const now = new Date();
    const cachedUntil = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    
    return {
      status: 'unknown',
      score: 0,
      reasons: ['An error occurred while checking eligibility. Please try again.'],
      cachedUntil,
    };
  }
}

/**
 * Clear eligibility cache for a specific opportunity
 * Useful when opportunity requirements change
 * 
 * @param opportunityId - Opportunity ID to clear cache for
 * @returns Number of cache entries deleted
 */
export async function clearEligibilityCache(opportunityId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('eligibility_cache')
      .delete()
      .eq('opportunity_id', opportunityId)
      .select();

    if (error) {
      console.error('Error clearing eligibility cache:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error in clearEligibilityCache:', error);
    return 0;
  }
}

/**
 * Clear expired eligibility cache entries
 * Should be run periodically as a cleanup job
 * 
 * @returns Number of expired entries deleted
 */
export async function clearExpiredEligibilityCache(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('eligibility_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) {
      console.error('Error clearing expired eligibility cache:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error in clearExpiredEligibilityCache:', error);
    return 0;
  }
}
