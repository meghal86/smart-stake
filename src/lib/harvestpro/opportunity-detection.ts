/**
 * Harvest Opportunity Detection
 * Evaluates lots to identify tax-loss harvesting opportunities
 */

import type { Lot } from './fifo';
import type { RiskLevel } from '@/types/harvestpro';
import {
  calculateUnrealizedPnL,
  calculateHoldingPeriod,
  isLongTerm,
} from './fifo';

// ============================================================================
// TYPES
// ============================================================================

export interface OpportunityCandidate {
  lot: Lot;
  unrealizedPnl: number;
  unrealizedLoss: number;
  holdingPeriodDays: number;
  longTerm: boolean;
  riskLevel: RiskLevel;
  liquidityScore: number;
  guardianScore: number;
}

export interface OpportunityDetectionParams {
  lots: Lot[];
  currentPrice: number;
  liquidityScore: number;
  guardianScore: number;
  currentDate?: Date;
}

// ============================================================================
// OPPORTUNITY DETECTION
// ============================================================================

/**
 * Classify risk level based on Guardian score and liquidity
 * 
 * Requirements 15.1-15.4:
 * - Guardian score <= 3: HIGH RISK
 * - Guardian score 4-6: MEDIUM RISK  
 * - Guardian score >= 7: LOW RISK
 * - Liquidity flag false: HIGH RISK (overrides Guardian score)
 */
export function classifyRiskLevel(
  guardianScore: number,
  liquidityScore: number
): RiskLevel {
  // Check liquidity first (overrides Guardian score)
  if (liquidityScore < 50) {
    return 'HIGH';
  }
  
  // Classify based on Guardian score
  if (guardianScore <= 3) {
    return 'HIGH';
  } else if (guardianScore >= 4 && guardianScore <= 6) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

/**
 * Detect harvest opportunities from lots
 * 
 * Requirements 2.2-2.4:
 * - Calculate unrealized PnL for each lot
 * - Calculate holding period
 * - Determine long-term vs short-term classification
 * 
 * @param params - Detection parameters
 * @returns Array of opportunity candidates
 */
export function detectOpportunities(
  params: OpportunityDetectionParams
): OpportunityCandidate[] {
  const { lots, currentPrice, liquidityScore, guardianScore, currentDate } = params;
  
  const opportunities: OpportunityCandidate[] = [];
  
  for (const lot of lots) {
    // Calculate unrealized PnL
    const unrealizedPnl = calculateUnrealizedPnL(lot, currentPrice);
    
    // Only consider losses (negative PnL)
    if (unrealizedPnl >= 0) {
      continue;
    }
    
    // Calculate holding period
    const holdingPeriodDays = calculateHoldingPeriod(lot, currentDate);
    const longTerm = isLongTerm(lot, currentDate);
    
    // Classify risk level
    const riskLevel = classifyRiskLevel(guardianScore, liquidityScore);
    
    opportunities.push({
      lot,
      unrealizedPnl,
      unrealizedLoss: Math.abs(unrealizedPnl),
      holdingPeriodDays,
      longTerm,
      riskLevel,
      liquidityScore,
      guardianScore,
    });
  }
  
  return opportunities;
}


/**
 * Filter opportunities by minimum loss threshold
 * 
 * Requirement 2.3: Only flag lots with unrealized loss > $20
 * 
 * @param opportunities - Array of opportunity candidates
 * @param minLossThreshold - Minimum loss in USD (default: $20)
 * @returns Filtered opportunities
 */
export function filterByMinimumLoss(
  opportunities: OpportunityCandidate[],
  minLossThreshold: number = 20
): OpportunityCandidate[] {
  return opportunities.filter(opp => opp.unrealizedLoss > minLossThreshold);
}

/**
 * Sort opportunities by various criteria
 */
export function sortOpportunities(
  opportunities: OpportunityCandidate[],
  sortBy: 'loss-desc' | 'loss-asc' | 'holding-period-desc' | 'holding-period-asc' | 'risk-asc' = 'loss-desc'
): OpportunityCandidate[] {
  const sorted = [...opportunities];
  
  switch (sortBy) {
    case 'loss-desc':
      return sorted.sort((a, b) => b.unrealizedLoss - a.unrealizedLoss);
    case 'loss-asc':
      return sorted.sort((a, b) => a.unrealizedLoss - b.unrealizedLoss);
    case 'holding-period-desc':
      return sorted.sort((a, b) => b.holdingPeriodDays - a.holdingPeriodDays);
    case 'holding-period-asc':
      return sorted.sort((a, b) => a.holdingPeriodDays - b.holdingPeriodDays);
    case 'risk-asc': {
      // Sort by risk level (LOW < MEDIUM < HIGH)
      const riskOrder = { LOW: 0, MEDIUM: 1, HIGH: 2 };
      return sorted.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
    }
    default:
      return sorted;
  }
}

/**
 * Group opportunities by holding period type
 */
export function groupByHoldingPeriod(
  opportunities: OpportunityCandidate[]
): {
  longTerm: OpportunityCandidate[];
  shortTerm: OpportunityCandidate[];
} {
  const longTerm: OpportunityCandidate[] = [];
  const shortTerm: OpportunityCandidate[] = [];
  
  for (const opp of opportunities) {
    if (opp.longTerm) {
      longTerm.push(opp);
    } else {
      shortTerm.push(opp);
    }
  }
  
  return { longTerm, shortTerm };
}

/**
 * Group opportunities by risk level
 */
export function groupByRiskLevel(
  opportunities: OpportunityCandidate[]
): {
  low: OpportunityCandidate[];
  medium: OpportunityCandidate[];
  high: OpportunityCandidate[];
} {
  const low: OpportunityCandidate[] = [];
  const medium: OpportunityCandidate[] = [];
  const high: OpportunityCandidate[] = [];
  
  for (const opp of opportunities) {
    switch (opp.riskLevel) {
      case 'LOW':
        low.push(opp);
        break;
      case 'MEDIUM':
        medium.push(opp);
        break;
      case 'HIGH':
        high.push(opp);
        break;
    }
  }
  
  return { low, medium, high };
}

/**
 * Calculate summary statistics for opportunities
 */
export function calculateOpportunitySummary(opportunities: OpportunityCandidate[]): {
  totalOpportunities: number;
  totalUnrealizedLoss: number;
  averageUnrealizedLoss: number;
  longTermCount: number;
  shortTermCount: number;
  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
} {
  const totalOpportunities = opportunities.length;
  const totalUnrealizedLoss = opportunities.reduce((sum, opp) => sum + opp.unrealizedLoss, 0);
  const averageUnrealizedLoss = totalOpportunities > 0 ? totalUnrealizedLoss / totalOpportunities : 0;
  
  const { longTerm, shortTerm } = groupByHoldingPeriod(opportunities);
  const { low, medium, high } = groupByRiskLevel(opportunities);
  
  return {
    totalOpportunities,
    totalUnrealizedLoss,
    averageUnrealizedLoss,
    longTermCount: longTerm.length,
    shortTermCount: shortTerm.length,
    lowRiskCount: low.length,
    mediumRiskCount: medium.length,
    highRiskCount: high.length,
  };
}
