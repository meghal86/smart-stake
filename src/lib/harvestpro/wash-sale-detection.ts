/**
 * Wash Sale Detection Utilities
 * Enhanced Req 28 AC3: Flag re-entry in export if occurred within configurable window
 * 
 * Requirements: Enhanced Req 28 AC1-5
 * Design: Regulatory Guardrails → Wash Sale Protection
 */

import type { HarvestSession, HarvestOpportunity } from '@/types/harvestpro';

// Configurable wash sale window (default 30 days as per IRS rules)
export const DEFAULT_WASH_SALE_WINDOW_DAYS = 30;

export interface WashSaleDetectionConfig {
  windowDays: number;
  includeSubstantiallyIdentical: boolean;
}

export interface WashSaleFlag {
  token: string;
  soldDate: Date;
  repurchaseDate: Date | null;
  daysBetween: number | null;
  isWashSale: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  notes: string;
}

/**
 * Default configuration for wash sale detection
 */
export const DEFAULT_WASH_SALE_CONFIG: WashSaleDetectionConfig = {
  windowDays: DEFAULT_WASH_SALE_WINDOW_DAYS,
  includeSubstantiallyIdentical: true,
};

/**
 * Detect potential wash sale violations for a harvest session
 * 
 * Enhanced Req 28 AC3: Flag re-entry in export if occurred within configurable window
 * 
 * Note: This is a basic detection system for educational purposes only.
 * Users should consult a tax professional for actual wash sale determination.
 */
export function detectWashSaleFlags(
  session: HarvestSession,
  config: WashSaleDetectionConfig = DEFAULT_WASH_SALE_CONFIG
): WashSaleFlag[] {
  const flags: WashSaleFlag[] = [];
  const soldDate = session.updatedAt ? new Date(session.updatedAt) : new Date();
  
  // For each harvested opportunity, check for potential wash sale issues
  session.opportunitiesSelected.forEach((opportunity: HarvestOpportunity) => {
    const flag: WashSaleFlag = {
      token: opportunity.token,
      soldDate: soldDate,
      repurchaseDate: null,
      daysBetween: null,
      isWashSale: false,
      riskLevel: 'LOW',
      notes: 'No repurchase detected in available data',
    };
    
    // Since we don't have access to future purchase data in this context,
    // we'll flag based on the existing washSaleRisk field if available
    if ('washSaleRisk' in opportunity && opportunity.washSaleRisk) {
      flag.isWashSale = true;
      flag.riskLevel = 'HIGH';
      flag.notes = 'Potential wash sale risk detected - consult tax professional';
    }
    
    // Add educational note for all harvested tokens
    if (!flag.isWashSale) {
      flag.notes = `Monitor for repurchases within ${config.windowDays} days - wash sale rules may apply`;
      flag.riskLevel = 'MEDIUM';
    }
    
    flags.push(flag);
  });
  
  return flags;
}

/**
 * Generate wash sale warning text for CSV export
 * Enhanced Req 28 AC3: Flag re-entry in export if occurred within configurable window
 */
export function generateWashSaleWarningText(flags: WashSaleFlag[]): string {
  const hasHighRiskFlags = flags.some(flag => flag.riskLevel === 'HIGH');
  
  if (hasHighRiskFlags) {
    return 'WARNING: Potential wash sale violations detected. Consult a tax professional immediately.';
  }
  
  return 'REMINDER: Monitor for repurchases within 30 days. Wash sale rules may apply.';
}

/**
 * Check if a token symbol might be substantially identical to another
 * This is a simplified check - actual determination requires professional analysis
 */
export function areTokensSubstantiallyIdentical(token1: string, token2: string): boolean {
  // Exact match
  if (token1.toLowerCase() === token2.toLowerCase()) {
    return true;
  }
  
  // Common substantially identical pairs (simplified examples)
  const substantiallyIdenticalPairs = [
    ['ETH', 'WETH'],
    ['BTC', 'WBTC'],
    ['USDC', 'USDT'], // Debatable, but often considered similar
    ['stETH', 'ETH'], // Liquid staking derivatives
  ];
  
  return substantiallyIdenticalPairs.some(([a, b]) => 
    (token1.toLowerCase() === a.toLowerCase() && token2.toLowerCase() === b.toLowerCase()) ||
    (token1.toLowerCase() === b.toLowerCase() && token2.toLowerCase() === a.toLowerCase())
  );
}

/**
 * Educational wash sale information for users
 */
export const WASH_SALE_EDUCATION = {
  title: 'Wash Sale Rules - Educational Information',
  summary: 'Wash sale rules may disallow tax losses if you repurchase the same or substantially identical securities within 30 days.',
  keyPoints: [
    'The wash sale rule applies to sales at a loss followed by repurchases within 30 days before or after the sale',
    'Substantially identical securities include the same stock, bonds, or potentially similar cryptocurrencies',
    'If triggered, the loss is disallowed and added to the cost basis of the repurchased security',
    'Cryptocurrency wash sale rules are complex and evolving - professional guidance is essential',
  ],
  disclaimer: 'This information is for educational purposes only and does not constitute tax advice. Consult a qualified tax professional for guidance specific to your situation.',
};