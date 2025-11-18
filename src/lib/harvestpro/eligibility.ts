/**
 * Eligibility Filtering System
 * Determines which harvest opportunities are eligible based on multiple criteria
 */

import type { OpportunityCandidate } from './opportunity-detection';

// ============================================================================
// TYPES
// ============================================================================

export interface EligibilityCheck {
  eligible: boolean;
  reasons: string[];
}

export interface EligibilityFilters {
  minLossThreshold?: number;
  minLiquidityScore?: number;
  minGuardianScore?: number;
  maxGasCostRatio?: number; // Gas cost as ratio of unrealized loss (e.g., 1.0 = 100%)
  requireTradable?: boolean;
}

export interface EligibilityParams {
  opportunity: OpportunityCandidate;
  gasEstimate: number;
  isTradable: boolean;
  filters?: EligibilityFilters;
}

// ============================================================================
// DEFAULT FILTERS (from requirements)
// ============================================================================

export const DEFAULT_ELIGIBILITY_FILTERS: Required<EligibilityFilters> = {
  minLossThreshold: 20, // Requirement 3.1: > $20
  minLiquidityScore: 50, // Requirement 3.2: Minimum liquidity threshold
  minGuardianScore: 3, // Requirement 3.3: >= 3 out of 10
  maxGasCostRatio: 1.0, // Requirement 3.4: Gas cost < unrealized loss
  requireTradable: true, // Requirement 3.5: Must be tradable
};

// ============================================================================
// ELIGIBILITY CHECKS
// ============================================================================

/**
 * Check if opportunity meets minimum loss threshold
 * 
 * Requirement 3.1: Unrealized loss must exceed $20
 */
export function checkMinimumLoss(
  unrealizedLoss: number,
  minThreshold: number = DEFAULT_ELIGIBILITY_FILTERS.minLossThreshold
): { pass: boolean; reason?: string } {
  if (unrealizedLoss <= minThreshold) {
    return {
      pass: false,
      reason: `Unrealized loss ($${unrealizedLoss.toFixed(2)}) must exceed $${minThreshold.toFixed(2)}`,
    };
  }
  return { pass: true };
}

/**
 * Check if opportunity meets minimum liquidity score
 * 
 * Requirement 3.2: Liquidity score must meet minimum threshold
 */
export function checkLiquidity(
  liquidityScore: number,
  minScore: number = DEFAULT_ELIGIBILITY_FILTERS.minLiquidityScore
): { pass: boolean; reason?: string } {
  if (liquidityScore < minScore) {
    return {
      pass: false,
      reason: `Insufficient liquidity (score: ${liquidityScore}, minimum: ${minScore})`,
    };
  }
  return { pass: true };
}

/**
 * Check if opportunity meets minimum Guardian score
 * 
 * Requirement 3.3: Guardian score must be >= 3
 */
export function checkGuardianScore(
  guardianScore: number,
  minScore: number = DEFAULT_ELIGIBILITY_FILTERS.minGuardianScore
): { pass: boolean; reason?: string } {
  if (guardianScore < minScore) {
    return {
      pass: false,
      reason: `Guardian score too low (${guardianScore.toFixed(1)}/10, minimum: ${minScore})`,
    };
  }
  return { pass: true };
}

/**
 * Check if gas cost is reasonable relative to potential benefit
 * 
 * Requirement 3.4: Gas cost must not exceed unrealized loss
 */
export function checkGasCost(
  gasEstimate: number,
  unrealizedLoss: number,
  maxRatio: number = DEFAULT_ELIGIBILITY_FILTERS.maxGasCostRatio
): { pass: boolean; reason?: string } {
  const ratio = gasEstimate / unrealizedLoss;
  
  if (ratio >= maxRatio) {
    return {
      pass: false,
      reason: `Gas cost ($${gasEstimate.toFixed(2)}) exceeds ${(maxRatio * 100).toFixed(0)}% of potential benefit ($${unrealizedLoss.toFixed(2)})`,
    };
  }
  return { pass: true };
}

/**
 * Check if token is tradable on supported venues
 * 
 * Requirement 3.5: Token must be tradable
 */
export function checkTradability(
  isTradable: boolean
): { pass: boolean; reason?: string } {
  if (!isTradable) {
    return {
      pass: false,
      reason: 'Token not tradable on any supported venue',
    };
  }
  return { pass: true };
}


// ============================================================================
// COMPREHENSIVE ELIGIBILITY CHECK
// ============================================================================

/**
 * Perform comprehensive eligibility check on an opportunity
 * 
 * Requirements 3.1-3.5: Check all eligibility criteria
 * 
 * @param params - Eligibility parameters
 * @returns EligibilityCheck with pass/fail and reasons
 */
export function checkEligibility(params: EligibilityParams): EligibilityCheck {
  const { opportunity, gasEstimate, isTradable, filters } = params;
  const appliedFilters = { ...DEFAULT_ELIGIBILITY_FILTERS, ...filters };
  
  const reasons: string[] = [];
  let eligible = true;
  
  // Check 1: Minimum loss threshold
  const lossCheck = checkMinimumLoss(
    opportunity.unrealizedLoss,
    appliedFilters.minLossThreshold
  );
  if (!lossCheck.pass) {
    eligible = false;
    if (lossCheck.reason) reasons.push(lossCheck.reason);
  }
  
  // Check 2: Liquidity score
  const liquidityCheck = checkLiquidity(
    opportunity.liquidityScore,
    appliedFilters.minLiquidityScore
  );
  if (!liquidityCheck.pass) {
    eligible = false;
    if (liquidityCheck.reason) reasons.push(liquidityCheck.reason);
  }
  
  // Check 3: Guardian score
  const guardianCheck = checkGuardianScore(
    opportunity.guardianScore,
    appliedFilters.minGuardianScore
  );
  if (!guardianCheck.pass) {
    eligible = false;
    if (guardianCheck.reason) reasons.push(guardianCheck.reason);
  }
  
  // Check 4: Gas cost
  const gasCheck = checkGasCost(
    gasEstimate,
    opportunity.unrealizedLoss,
    appliedFilters.maxGasCostRatio
  );
  if (!gasCheck.pass) {
    eligible = false;
    if (gasCheck.reason) reasons.push(gasCheck.reason);
  }
  
  // Check 5: Tradability
  if (appliedFilters.requireTradable) {
    const tradabilityCheck = checkTradability(isTradable);
    if (!tradabilityCheck.pass) {
      eligible = false;
      if (tradabilityCheck.reason) reasons.push(tradabilityCheck.reason);
    }
  }
  
  return {
    eligible,
    reasons,
  };
}

/**
 * Filter opportunities by eligibility
 * 
 * @param opportunities - Array of opportunity candidates
 * @param gasEstimates - Map of opportunity index to gas estimate
 * @param tradabilityMap - Map of opportunity index to tradability
 * @param filters - Optional custom filters
 * @returns Array of eligible opportunities with eligibility info
 */
export function filterEligibleOpportunities(
  opportunities: OpportunityCandidate[],
  gasEstimates: Map<number, number>,
  tradabilityMap: Map<number, boolean>,
  filters?: EligibilityFilters
): Array<OpportunityCandidate & { eligibilityCheck: EligibilityCheck }> {
  const results: Array<OpportunityCandidate & { eligibilityCheck: EligibilityCheck }> = [];
  
  opportunities.forEach((opportunity, index) => {
    const gasEstimate = gasEstimates.get(index) ?? 0;
    const isTradable = tradabilityMap.get(index) ?? false;
    
    const eligibilityCheck = checkEligibility({
      opportunity,
      gasEstimate,
      isTradable,
      filters,
    });
    
    if (eligibilityCheck.eligible) {
      results.push({
        ...opportunity,
        eligibilityCheck,
      });
    }
  });
  
  return results;
}

/**
 * Get eligibility statistics for a set of opportunities
 */
export function getEligibilityStats(
  opportunities: OpportunityCandidate[],
  gasEstimates: Map<number, number>,
  tradabilityMap: Map<number, boolean>,
  filters?: EligibilityFilters
): {
  total: number;
  eligible: number;
  ineligible: number;
  eligibilityRate: number;
  ineligibilityReasons: Record<string, number>;
} {
  const stats = {
    total: opportunities.length,
    eligible: 0,
    ineligible: 0,
    eligibilityRate: 0,
    ineligibilityReasons: {} as Record<string, number>,
  };
  
  opportunities.forEach((opportunity, index) => {
    const gasEstimate = gasEstimates.get(index) ?? 0;
    const isTradable = tradabilityMap.get(index) ?? false;
    
    const eligibilityCheck = checkEligibility({
      opportunity,
      gasEstimate,
      isTradable,
      filters,
    });
    
    if (eligibilityCheck.eligible) {
      stats.eligible++;
    } else {
      stats.ineligible++;
      
      // Count reasons
      eligibilityCheck.reasons.forEach(reason => {
        stats.ineligibilityReasons[reason] = (stats.ineligibilityReasons[reason] || 0) + 1;
      });
    }
  });
  
  stats.eligibilityRate = stats.total > 0 ? stats.eligible / stats.total : 0;
  
  return stats;
}

/**
 * Create a human-readable eligibility report
 */
export function createEligibilityReport(eligibilityCheck: EligibilityCheck): string {
  if (eligibilityCheck.eligible) {
    return 'Eligible for harvest';
  }
  
  return `Not eligible: ${eligibilityCheck.reasons.join('; ')}`;
}
