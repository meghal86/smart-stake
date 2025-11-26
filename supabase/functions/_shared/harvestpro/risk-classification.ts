/**
 * Risk Classification System (Deno/Edge Functions)
 * Comprehensive risk assessment for harvest opportunities
 * 
 * This is the server-side implementation for Supabase Edge Functions.
 * Migrated from src/lib/harvestpro/risk-classification.ts
 */

import type { RiskLevel } from './types.ts';
import type { OpportunityCandidate } from './opportunity-detection.ts';

// ============================================================================
// TYPES
// ============================================================================

export interface RiskAssessment {
  overallRisk: RiskLevel;
  guardianRisk: RiskLevel;
  liquidityRisk: RiskLevel;
  factors: RiskFactor[];
  score: number; // 0-100, higher is safer
  recommendation: string;
}

export interface RiskFactor {
  category: 'guardian' | 'liquidity' | 'volatility' | 'execution';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface GuardianScore {
  token: string;
  score: number; // 0-10 scale
  riskLevel: RiskLevel;
  lastUpdated: Date;
  source: 'guardian' | 'mock' | 'cache';
}

// ============================================================================
// RISK CLASSIFICATION
// ============================================================================

/**
 * Classify risk level based on Guardian score
 * 
 * Requirements 15.1-15.3:
 * - Score <= 3: HIGH RISK
 * - Score 4-6: MEDIUM RISK
 * - Score >= 7: LOW RISK
 * 
 * @param guardianScore - Guardian score (0-10)
 * @returns Risk level classification
 */
export function classifyRiskFromScore(guardianScore: number): RiskLevel {
  if (guardianScore <= 3) {
    return 'HIGH';
  } else if (guardianScore >= 4 && guardianScore <= 6) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

/**
 * Classify liquidity risk based on liquidity score
 * 
 * - Score >= 80: LOW RISK
 * - Score 50-79: MEDIUM RISK
 * - Score < 50: HIGH RISK
 */
export function classifyLiquidityRisk(liquidityScore: number): RiskLevel {
  if (liquidityScore >= 80) return 'LOW';
  if (liquidityScore >= 50) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Determine overall risk level from Guardian score and liquidity
 * 
 * Requirements 15.1-15.5:
 * - Guardian score <= 3 OR liquidity < 50: HIGH RISK
 * - Guardian score 4-6: MEDIUM RISK
 * - Guardian score >= 7 AND liquidity >= 50: LOW RISK
 */
export function determineOverallRisk(
  guardianScore: number,
  liquidityScore: number
): RiskLevel {
  // Liquidity flag overrides Guardian score (Requirement 15.4)
  if (liquidityScore < 50) {
    return 'HIGH';
  }
  
  // Otherwise use Guardian score classification
  return classifyRiskFromScore(guardianScore);
}

/**
 * Perform comprehensive risk assessment
 * 
 * Requirements 15.1-15.5: Complete risk classification with factors
 */
export function assessRisk(
  opportunity: OpportunityCandidate,
  guardianScore?: GuardianScore
): RiskAssessment {
  const factors: RiskFactor[] = [];
  
  // Guardian risk assessment
  const guardianRisk = classifyRiskFromScore(opportunity.guardianScore);
  if (guardianRisk === 'HIGH') {
    factors.push({
      category: 'guardian',
      severity: 'high',
      description: `Low Guardian score (${opportunity.guardianScore.toFixed(1)}/10)`,
    });
  } else if (guardianRisk === 'MEDIUM') {
    factors.push({
      category: 'guardian',
      severity: 'medium',
      description: `Moderate Guardian score (${opportunity.guardianScore.toFixed(1)}/10)`,
    });
  }
  
  // Liquidity risk assessment
  const liquidityRisk = classifyLiquidityRisk(opportunity.liquidityScore);
  if (liquidityRisk === 'HIGH') {
    factors.push({
      category: 'liquidity',
      severity: 'high',
      description: `Low liquidity (score: ${opportunity.liquidityScore})`,
    });
  } else if (liquidityRisk === 'MEDIUM') {
    factors.push({
      category: 'liquidity',
      severity: 'medium',
      description: `Moderate liquidity (score: ${opportunity.liquidityScore})`,
    });
  }
  
  // Determine overall risk
  const overallRisk = determineOverallRisk(
    opportunity.guardianScore,
    opportunity.liquidityScore
  );
  
  // Calculate risk score (0-100, higher is safer)
  const guardianComponent = (opportunity.guardianScore / 10) * 60; // 60% weight
  const liquidityComponent = (opportunity.liquidityScore / 100) * 40; // 40% weight
  const score = Math.round(guardianComponent + liquidityComponent);
  
  // Generate recommendation
  let recommendation: string;
  if (overallRisk === 'LOW') {
    recommendation = 'Safe to proceed with harvest';
  } else if (overallRisk === 'MEDIUM') {
    recommendation = 'Review risk factors before proceeding';
  } else {
    recommendation = 'High risk - proceed with caution or skip';
  }
  
  return {
    overallRisk,
    guardianRisk,
    liquidityRisk,
    factors,
    score,
    recommendation,
  };
}

/**
 * Generate risk chip data for UI
 * 
 * Requirement 15.5: Display risk as colored chip
 */
export function generateRiskChip(riskLevel: RiskLevel): {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
} {
  switch (riskLevel) {
    case 'LOW':
      return {
        label: 'Low Risk',
        color: 'var(--harvest-risk-low)',
        bgColor: 'var(--harvest-risk-low-bg)',
        icon: '✓',
      };
    case 'MEDIUM':
      return {
        label: 'Medium Risk',
        color: 'var(--harvest-risk-medium)',
        bgColor: 'var(--harvest-risk-medium-bg)',
        icon: '⚠',
      };
    case 'HIGH':
      return {
        label: 'High Risk',
        color: 'var(--harvest-risk-high)',
        bgColor: 'var(--harvest-risk-high-bg)',
        icon: '⚠',
      };
  }
}

/**
 * Sort opportunities by risk (safest first)
 */
export function sortByRisk(
  opportunities: Array<OpportunityCandidate & { riskAssessment: RiskAssessment }>
): Array<OpportunityCandidate & { riskAssessment: RiskAssessment }> {
  return [...opportunities].sort((a, b) => {
    // Sort by risk score (higher is safer)
    return b.riskAssessment.score - a.riskAssessment.score;
  });
}

/**
 * Filter opportunities by maximum acceptable risk
 */
export function filterByMaxRisk(
  opportunities: OpportunityCandidate[],
  maxRisk: RiskLevel
): OpportunityCandidate[] {
  const riskOrder = { LOW: 0, MEDIUM: 1, HIGH: 2 };
  const maxRiskLevel = riskOrder[maxRisk];
  
  return opportunities.filter(opp => {
    const oppRiskLevel = riskOrder[opp.riskLevel];
    return oppRiskLevel <= maxRiskLevel;
  });
}
