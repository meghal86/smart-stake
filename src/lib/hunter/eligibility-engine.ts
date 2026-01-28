/**
 * Eligibility Engine
 * 
 * Evaluates whether a wallet qualifies for an opportunity.
 * Requirements: 5.1-5.11
 */

import { createServiceClient } from '@/integrations/supabase/service';
import type { WalletSignals } from './wallet-signals';
import type { Opportunity } from './types';

/**
 * Eligibility result interface
 */
export interface EligibilityResult {
  status: 'likely' | 'maybe' | 'unlikely';
  score: number; // 0-1
  reasons: string[];
}

/**
 * Opportunity requirements interface (parsed from JSONB)
 */
interface OpportunityRequirements {
  chains?: string[];
  min_wallet_age_days?: number;
  min_tx_count?: number;
  required_tokens?: string[];
  minBalance?: { amount: number; token: string };
  walletAge?: number;
  previousTxCount?: number;
}

/**
 * Cache TTL in milliseconds (24 hours)
 */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Shorter cache TTL for null signals (1 hour)
 */
const NULL_SIGNALS_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Parse requirements from opportunity
 * Requirements: 5.1
 */
function parseRequirements(opportunity: Opportunity): OpportunityRequirements {
  try {
    // Opportunity.requirements is already typed, but we need to handle both formats
    const reqs = opportunity.requirements || {};
    
    // Normalize field names (handle both snake_case and camelCase)
    return {
      chains: reqs.chains || [],
      min_wallet_age_days: reqs.min_wallet_age_days || reqs.walletAge,
      min_tx_count: reqs.min_tx_count || reqs.previousTxCount,
      required_tokens: reqs.required_tokens,
      minBalance: reqs.minBalance,
    };
  } catch (error) {
    console.error('Error parsing requirements:', error);
    return {};
  }
}

/**
 * Calculate eligibility score based on wallet signals and requirements
 * Requirements: 5.2-5.6
 * 
 * Scoring logic:
 * - Start with score = 1.0
 * - Deduct points for each unmet requirement
 * - Return score clamped to [0, 1]
 */
function calculateEligibilityScore(
  walletSignals: WalletSignals,
  requirements: OpportunityRequirements
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 1.0;

  // Check if requirements are empty
  const hasRequirements = 
    (requirements.chains && requirements.chains.length > 0) ||
    requirements.min_wallet_age_days !== undefined ||
    requirements.min_tx_count !== undefined ||
    (requirements.required_tokens && requirements.required_tokens.length > 0) ||
    requirements.minBalance !== undefined;

  // Requirement 5.1: Empty requirements → maybe status
  if (!hasRequirements) {
    return {
      score: 0.5,
      reasons: ['No specific requirements'],
    };
  }

  // Requirement 5.2: Null signals → maybe status
  const hasNullSignals = 
    walletSignals.wallet_age_days === null &&
    walletSignals.tx_count_90d === null &&
    walletSignals.chains_active.length === 0;

  if (hasNullSignals) {
    return {
      score: 0.5,
      reasons: ['Wallet data unavailable'],
    };
  }

  // Check chain requirements
  if (requirements.chains && requirements.chains.length > 0) {
    const hasRequiredChain = requirements.chains.some(chain =>
      walletSignals.chains_active.includes(chain.toLowerCase())
    );

    if (!hasRequiredChain) {
      // Requirement 5.3: Not active on required chain → unlikely
      score -= 0.3;
      reasons.push('Not active on required chains');
    } else {
      reasons.push('Active on required chains');
    }
  }

  // Check wallet age requirement
  if (requirements.min_wallet_age_days !== undefined) {
    if (walletSignals.wallet_age_days === null) {
      // Unknown wallet age
      score -= 0.1;
      reasons.push('Wallet age unknown');
    } else if (walletSignals.wallet_age_days < requirements.min_wallet_age_days) {
      // Requirement 5.4: Wallet age too low → unlikely
      score -= 0.3;
      reasons.push(`Wallet age below minimum (${requirements.min_wallet_age_days} days required)`);
    } else {
      reasons.push('Meets wallet age requirement');
    }
  }

  // Check transaction count requirement
  if (requirements.min_tx_count !== undefined) {
    if (walletSignals.tx_count_90d === null) {
      // Unknown tx count
      score -= 0.1;
      reasons.push('Transaction count unknown');
    } else if (walletSignals.tx_count_90d < requirements.min_tx_count) {
      // Requirement 5.5: Tx count too low → unlikely
      score -= 0.2;
      reasons.push(`Transaction count below minimum (${requirements.min_tx_count} required)`);
    } else {
      reasons.push('Meets transaction count requirement');
    }
  }

  // Check required tokens
  if (requirements.required_tokens && requirements.required_tokens.length > 0) {
    const hasRequiredTokens = requirements.required_tokens.every(token =>
      walletSignals.top_assets.some(asset => 
        asset.symbol.toLowerCase() === token.toLowerCase()
      )
    );

    if (!hasRequiredTokens) {
      // Requirement 5.6: Missing required tokens → unlikely
      score -= 0.2;
      reasons.push('Missing required tokens');
    } else {
      reasons.push('Holds required tokens');
    }
  }

  // Check minimum balance requirement
  if (requirements.minBalance) {
    const hasMinBalance = walletSignals.top_assets.some(asset =>
      asset.symbol.toLowerCase() === requirements.minBalance!.token.toLowerCase() &&
      asset.amount >= requirements.minBalance!.amount
    );

    if (!hasMinBalance) {
      score -= 0.2;
      reasons.push(`Insufficient ${requirements.minBalance.token} balance`);
    } else {
      reasons.push(`Meets ${requirements.minBalance.token} balance requirement`);
    }
  }

  // Ensure we have at least 2 reasons
  if (reasons.length === 0) {
    reasons.push('Partial requirements met');
  }
  if (reasons.length === 1) {
    reasons.push('Some criteria unknown');
  }

  // Clamp score to [0, 1]
  score = Math.max(0, Math.min(1, score));

  return { score, reasons };
}

/**
 * Map eligibility score to status
 * Requirements: 5.7-5.9
 */
function mapScoreToStatus(score: number): 'likely' | 'maybe' | 'unlikely' {
  if (score >= 0.8) {
    return 'likely'; // Requirement 5.7
  } else if (score >= 0.5) {
    return 'maybe'; // Requirement 5.8
  } else {
    return 'unlikely'; // Requirement 5.9
  }
}

/**
 * Ensure reasons array has 2-5 reasons
 * Requirements: 5.10
 */
function normalizeReasons(reasons: string[]): string[] {
  // Trim to max 5 reasons
  if (reasons.length > 5) {
    return reasons.slice(0, 5);
  }

  // Pad to min 2 reasons
  while (reasons.length < 2) {
    if (reasons.length === 0) {
      reasons.push('Eligibility criteria evaluated');
    } else {
      reasons.push('Additional criteria may apply');
    }
  }

  return reasons;
}

/**
 * Check cache for existing eligibility result
 * Requirements: 5.11
 */
async function checkCache(
  walletAddress: string,
  opportunityId: string
): Promise<EligibilityResult | null> {
  try {
    const supabase = createServiceClient();

    // Query cache with TTL check (24 hours)
    const { data, error } = await supabase
      .from('eligibility_cache')
      .select('eligibility_status, eligibility_score, reasons, created_at')
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('opportunity_id', opportunityId)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if cache entry is still fresh (within TTL)
    const createdAt = new Date(data.created_at);
    const now = new Date();
    const ageMs = now.getTime() - createdAt.getTime();

    // Use shorter TTL for null signals (1 hour)
    const ttl = data.eligibility_status === 'maybe' && 
                 data.reasons?.includes('Wallet data unavailable')
      ? NULL_SIGNALS_CACHE_TTL_MS
      : CACHE_TTL_MS;

    if (ageMs > ttl) {
      // Cache expired
      return null;
    }

    // Return cached result
    return {
      status: data.eligibility_status as 'likely' | 'maybe' | 'unlikely',
      score: parseFloat(data.eligibility_score),
      reasons: data.reasons || [],
    };
  } catch (error) {
    console.error('Error checking eligibility cache:', error);
    return null;
  }
}

/**
 * Store eligibility result in cache
 * Requirements: 5.11
 */
async function storeInCache(
  walletAddress: string,
  opportunityId: string,
  result: EligibilityResult
): Promise<void> {
  try {
    const supabase = createServiceClient();

    // Upsert into cache
    const { error } = await supabase
      .from('eligibility_cache')
      .upsert(
        {
          wallet_address: walletAddress.toLowerCase(),
          opportunity_id: opportunityId,
          eligibility_status: result.status,
          eligibility_score: result.score,
          reasons: result.reasons,
          is_eligible: result.status === 'likely', // Legacy field
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'wallet_address,opportunity_id',
        }
      );

    if (error) {
      console.error('Error storing eligibility in cache:', error);
    }
  } catch (error) {
    console.error('Error storing eligibility in cache:', error);
  }
}

/**
 * Evaluate eligibility for a wallet and opportunity
 * Requirements: 5.1-5.11
 * 
 * @param walletSignals - Wallet characteristics
 * @param opportunity - Opportunity to evaluate
 * @returns EligibilityResult with status, score, and reasons
 */
export async function evaluateEligibility(
  walletSignals: WalletSignals,
  opportunity: Opportunity
): Promise<EligibilityResult> {
  try {
    // Check cache first
    const cached = await checkCache(walletSignals.address, opportunity.id);
    if (cached) {
      return cached;
    }

    // Parse requirements
    const requirements = parseRequirements(opportunity);

    // Calculate eligibility score and reasons
    const { score, reasons } = calculateEligibilityScore(walletSignals, requirements);

    // Map score to status
    const status = mapScoreToStatus(score);

    // Normalize reasons (2-5 reasons)
    const normalizedReasons = normalizeReasons(reasons);

    // Build result
    const result: EligibilityResult = {
      status,
      score,
      reasons: normalizedReasons,
    };

    // Store in cache (fire and forget - don't block on cache write)
    storeInCache(walletSignals.address, opportunity.id, result).catch(err => {
      console.error('Failed to cache eligibility result:', err);
    });

    return result;
  } catch (error) {
    console.error('Error evaluating eligibility:', error);

    // Return default "maybe" result on error
    return {
      status: 'maybe',
      score: 0.5,
      reasons: ['Error evaluating eligibility', 'Please try again later'],
    };
  }
}

/**
 * Batch evaluate eligibility for multiple opportunities
 * 
 * @param walletSignals - Wallet characteristics
 * @param opportunities - Array of opportunities to evaluate
 * @returns Array of EligibilityResults in same order as input
 */
export async function batchEvaluateEligibility(
  walletSignals: WalletSignals,
  opportunities: Opportunity[]
): Promise<EligibilityResult[]> {
  // Evaluate all opportunities in parallel
  const results = await Promise.all(
    opportunities.map(opp => evaluateEligibility(walletSignals, opp))
  );

  return results;
}

/**
 * Clear eligibility cache for a wallet (for testing)
 */
export async function clearEligibilityCache(walletAddress: string): Promise<void> {
  try {
    const supabase = createServiceClient();

    await supabase
      .from('eligibility_cache')
      .delete()
      .eq('wallet_address', walletAddress.toLowerCase());
  } catch (error) {
    console.error('Error clearing eligibility cache:', error);
  }
}
