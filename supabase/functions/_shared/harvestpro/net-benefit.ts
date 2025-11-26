/**
 * Net Benefit Calculation Engine (Deno/Edge Functions)
 * Calculates the net tax benefit after accounting for all costs
 * 
 * This is the server-side implementation for Supabase Edge Functions.
 * Migrated from src/lib/harvestpro/net-benefit.ts
 */

import type { HarvestCalculation } from './types.ts';

// ============================================================================
// TYPES
// ============================================================================

export interface NetBenefitParams {
  unrealizedLoss: number;
  taxRate: number;
  gasEstimate: number;
  slippageEstimate: number;
  tradingFees: number;
}

export interface CostBreakdown {
  gasCost: number;
  slippageCost: number;
  tradingFees: number;
  totalCosts: number;
}

// ============================================================================
// NET BENEFIT CALCULATION
// ============================================================================

/**
 * Calculate tax savings from unrealized loss
 * 
 * Requirement 4.1: Tax savings = unrealized loss * tax rate
 * 
 * @param unrealizedLoss - Absolute value of loss in USD
 * @param taxRate - Tax rate as decimal (e.g., 0.24 for 24%)
 * @returns Tax savings in USD
 */
export function calculateTaxSavings(
  unrealizedLoss: number,
  taxRate: number
): number {
  return unrealizedLoss * taxRate;
}

/**
 * Calculate total costs for harvest execution
 * 
 * Requirements 4.2-4.4: Sum of gas, slippage, and trading fees
 * 
 * @param gasEstimate - Estimated gas cost in USD
 * @param slippageEstimate - Estimated slippage cost in USD
 * @param tradingFees - Trading fees in USD
 * @returns Cost breakdown
 */
export function calculateTotalCosts(
  gasEstimate: number,
  slippageEstimate: number,
  tradingFees: number
): CostBreakdown {
  return {
    gasCost: gasEstimate,
    slippageCost: slippageEstimate,
    tradingFees,
    totalCosts: gasEstimate + slippageEstimate + tradingFees,
  };
}

/**
 * Calculate net tax benefit
 * 
 * Requirements 4.1-4.4: Net benefit = tax savings - all costs
 * 
 * Formula: (unrealized_loss * tax_rate) - gas - slippage - fees
 * 
 * @param params - Net benefit calculation parameters
 * @returns Net benefit in USD
 */
export function calculateNetBenefit(params: NetBenefitParams): number {
  const { unrealizedLoss, taxRate, gasEstimate, slippageEstimate, tradingFees } = params;
  
  const taxSavings = calculateTaxSavings(unrealizedLoss, taxRate);
  const costs = calculateTotalCosts(gasEstimate, slippageEstimate, tradingFees);
  
  return taxSavings - costs.totalCosts;
}

/**
 * Calculate comprehensive harvest calculation
 * 
 * Requirements 4.1-4.5: Complete calculation with recommendation
 * 
 * @param params - Net benefit calculation parameters
 * @returns Complete harvest calculation
 */
export function calculateHarvestBenefit(params: NetBenefitParams): HarvestCalculation {
  const { unrealizedLoss, taxRate, gasEstimate, slippageEstimate, tradingFees } = params;
  
  const taxSavings = calculateTaxSavings(unrealizedLoss, taxRate);
  const costs = calculateTotalCosts(gasEstimate, slippageEstimate, tradingFees);
  const netBenefit = taxSavings - costs.totalCosts;
  
  // Requirement 4.5: Not recommended if net benefit <= 0
  const recommended = netBenefit > 0;
  
  return {
    unrealizedLoss,
    taxSavings,
    gasCost: costs.gasCost,
    slippageCost: costs.slippageCost,
    tradingFees: costs.tradingFees,
    netBenefit,
    recommended,
  };
}

/**
 * Calculate benefit-to-cost ratio
 * 
 * Higher ratio = better opportunity
 * 
 * @param taxSavings - Tax savings in USD
 * @param totalCosts - Total costs in USD
 * @returns Ratio (e.g., 2.5 means $2.50 benefit per $1 cost)
 */
export function calculateBenefitCostRatio(
  taxSavings: number,
  totalCosts: number
): number {
  if (totalCosts === 0) return Infinity;
  return taxSavings / totalCosts;
}

/**
 * Calculate efficiency score (0-100)
 * 
 * Measures how much of the tax savings is retained after costs
 * 
 * @param netBenefit - Net benefit in USD
 * @param taxSavings - Tax savings in USD
 * @returns Efficiency score (0-100)
 */
export function calculateEfficiencyScore(
  netBenefit: number,
  taxSavings: number
): number {
  if (taxSavings === 0) return 0;
  const efficiency = (netBenefit / taxSavings) * 100;
  return Math.max(0, Math.min(100, efficiency));
}

/**
 * Classify gas efficiency grade
 * 
 * Based on gas cost as percentage of unrealized loss:
 * - A: < 5%
 * - B: 5-15%
 * - C: > 15%
 * 
 * @param gasCost - Gas cost in USD
 * @param unrealizedLoss - Unrealized loss in USD
 * @returns Gas efficiency grade
 */
export function classifyGasEfficiency(
  gasCost: number,
  unrealizedLoss: number
): 'A' | 'B' | 'C' {
  if (unrealizedLoss === 0) return 'C';
  
  const gasPercentage = (gasCost / unrealizedLoss) * 100;
  
  if (gasPercentage < 5) return 'A';
  if (gasPercentage < 15) return 'B';
  return 'C';
}

/**
 * Calculate break-even tax rate
 * 
 * The minimum tax rate needed for the harvest to be profitable
 * 
 * @param unrealizedLoss - Unrealized loss in USD
 * @param totalCosts - Total costs in USD
 * @returns Break-even tax rate as decimal
 */
export function calculateBreakEvenTaxRate(
  unrealizedLoss: number,
  totalCosts: number
): number {
  if (unrealizedLoss === 0) return Infinity;
  return totalCosts / unrealizedLoss;
}

/**
 * Estimate time to recover costs through tax savings
 * 
 * @param netBenefit - Net benefit in USD
 * @param totalCosts - Total costs in USD
 * @returns Payback period description
 */
export function estimatePaybackPeriod(
  netBenefit: number,
  totalCosts: number
): string {
  if (netBenefit <= 0) {
    return 'Never (costs exceed benefits)';
  }
  
  if (netBenefit >= totalCosts) {
    return 'Immediate (at tax filing)';
  }
  
  const ratio = totalCosts / netBenefit;
  if (ratio < 0.5) {
    return 'Less than 6 months';
  } else if (ratio < 1) {
    return '6-12 months';
  } else {
    return 'More than 1 year';
  }
}

/**
 * Calculate aggregate statistics for multiple opportunities
 */
export function calculateAggregateStats(
  calculations: HarvestCalculation[]
): {
  totalUnrealizedLoss: number;
  totalTaxSavings: number;
  totalCosts: number;
  totalNetBenefit: number;
  averageNetBenefit: number;
  recommendedCount: number;
  notRecommendedCount: number;
  averageEfficiency: number;
} {
  const totalUnrealizedLoss = calculations.reduce((sum, calc) => sum + calc.unrealizedLoss, 0);
  const totalTaxSavings = calculations.reduce((sum, calc) => sum + calc.taxSavings, 0);
  const totalCosts = calculations.reduce(
    (sum, calc) => sum + calc.gasCost + calc.slippageCost + calc.tradingFees,
    0
  );
  const totalNetBenefit = calculations.reduce((sum, calc) => sum + calc.netBenefit, 0);
  const averageNetBenefit = calculations.length > 0 ? totalNetBenefit / calculations.length : 0;
  
  const recommendedCount = calculations.filter(calc => calc.recommended).length;
  const notRecommendedCount = calculations.length - recommendedCount;
  
  const efficiencies = calculations.map(calc =>
    calculateEfficiencyScore(calc.netBenefit, calc.taxSavings)
  );
  const averageEfficiency = efficiencies.length > 0
    ? efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length
    : 0;
  
  return {
    totalUnrealizedLoss,
    totalTaxSavings,
    totalCosts,
    totalNetBenefit,
    averageNetBenefit,
    recommendedCount,
    notRecommendedCount,
    averageEfficiency,
  };
}
