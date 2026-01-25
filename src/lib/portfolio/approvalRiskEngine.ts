/**
 * Approval Risk Scoring Engine for Unified Portfolio System
 * 
 * Calculates risk scores incorporating all required factors:
 * - age_days, scope, value_at_risk_usd, spender_trust, contract_risk, interaction_context
 * - Special rules for infinite approvals and proxy contracts
 * - Permit2 detection and scoring
 */

import { ApprovalRisk } from '@/types/portfolio';

// Known risk categories
export const KNOWN_SCAM_SPENDERS = new Set([
  '0x0000000000000000000000000000000000000000',
  // Add more known scam addresses - would come from maintained database
]);

export const HIGH_RISK_SPENDERS = new Set([
  // Known compromised or high-risk protocol addresses
  // Would be maintained from security intelligence feeds
]);

export const TRUSTED_SPENDERS = new Set([
  '0xa0b86a33e6441e8c8c7014b5c1e2c8b5e8b5e8b5', // Example: Uniswap V3
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', // Example: Uniswap V2 Router
  // Add more trusted protocol addresses
]);

export const PERMIT2_ADDRESSES = new Set([
  '0x000000000022d473030f116ddee9f6b43ac78ba3', // Uniswap Permit2
]);

export const PROXY_PATTERNS = [
  /^0x[a-fA-F0-9]{40}$/, // Standard proxy detection would be more sophisticated
];

// Risk factor weights (must sum to 1.0)
export const RISK_WEIGHTS = {
  age: 0.15,           // Age-based risk
  scope: 0.20,         // Approval scope (unlimited vs limited)
  valueAtRisk: 0.25,   // Dollar amount at risk
  spenderTrust: 0.20,  // Spender reputation
  contractRisk: 0.15,  // Contract security analysis
  context: 0.05,       // Interaction context
} as const;

// Risk thresholds
export const RISK_THRESHOLDS = {
  critical: 0.80,
  high: 0.60,
  medium: 0.40,
  low: 0.00,
} as const;

// Value at risk thresholds (USD)
export const VAR_THRESHOLDS = {
  critical: 50000,
  high: 10000,
  medium: 1000,
  low: 100,
} as const;

export interface RiskFactorAnalysis {
  factor: string;
  weight: number;
  score: number; // 0-1, higher = more risky
  description: string;
}

export interface ApprovalRiskCalculation {
  riskScore: number; // 0-1
  severity: 'critical' | 'high' | 'medium' | 'low';
  valueAtRisk: number;
  riskReasons: string[];
  contributingFactors: RiskFactorAnalysis[];
  isPermit2: boolean;
}

/**
 * Calculate comprehensive approval risk score
 */
export function calculateApprovalRisk(
  token: string,
  spender: string,
  amount: string,
  ageInDays: number,
  chainId: number,
  tokenPriceUsd?: number,
  tokenDecimals?: number
): ApprovalRiskCalculation {
  const factors: RiskFactorAnalysis[] = [];
  const reasons: string[] = [];
  
  // 1. Age-based risk (older approvals are riskier)
  const ageScore = calculateAgeRisk(ageInDays);
  factors.push({
    factor: 'Age Risk',
    weight: RISK_WEIGHTS.age,
    score: ageScore,
    description: `Approval is ${ageInDays} days old`
  });
  
  if (ageInDays > 365) {
    reasons.push('OLD_APPROVAL');
  }
  
  // 2. Scope risk (unlimited vs limited)
  const { scopeScore, isUnlimited } = calculateScopeRisk(amount);
  factors.push({
    factor: 'Scope Risk',
    weight: RISK_WEIGHTS.scope,
    score: scopeScore,
    description: isUnlimited ? 'Unlimited approval' : 'Limited approval'
  });
  
  if (isUnlimited) {
    reasons.push('INFINITE_ALLOWANCE');
  }
  
  // 3. Value at risk calculation
  const valueAtRisk = calculateValueAtRisk(amount, tokenPriceUsd, tokenDecimals);
  const varScore = calculateVARRisk(valueAtRisk);
  factors.push({
    factor: 'Value at Risk',
    weight: RISK_WEIGHTS.valueAtRisk,
    score: varScore,
    description: `$${valueAtRisk.toLocaleString()} at risk`
  });
  
  if (valueAtRisk > VAR_THRESHOLDS.high) {
    reasons.push('HIGH_VALUE_AT_RISK');
  }
  
  // 4. Spender trust analysis
  const spenderScore = calculateSpenderTrust(spender);
  factors.push({
    factor: 'Spender Trust',
    weight: RISK_WEIGHTS.spenderTrust,
    score: spenderScore,
    description: getSpenderDescription(spender)
  });
  
  if (KNOWN_SCAM_SPENDERS.has(spender.toLowerCase())) {
    reasons.push('KNOWN_SCAM_SPENDER');
  } else if (HIGH_RISK_SPENDERS.has(spender.toLowerCase())) {
    reasons.push('HIGH_RISK_SPENDER');
  } else if (!TRUSTED_SPENDERS.has(spender.toLowerCase())) {
    reasons.push('UNKNOWN_SPENDER');
  }
  
  // 5. Contract risk analysis
  const contractScore = calculateContractRisk(spender);
  factors.push({
    factor: 'Contract Risk',
    weight: RISK_WEIGHTS.contractRisk,
    score: contractScore,
    description: getContractRiskDescription(spender)
  });
  
  if (isProxyContract(spender)) {
    reasons.push('PROXY_CONTRACT');
  }
  
  // 6. Interaction context
  const contextScore = calculateContextRisk(chainId, token);
  factors.push({
    factor: 'Context Risk',
    weight: RISK_WEIGHTS.context,
    score: contextScore,
    description: `Chain ${chainId} context analysis`
  });
  
  // Detect Permit2
  const isPermit2 = PERMIT2_ADDRESSES.has(spender.toLowerCase());
  if (isPermit2) {
    reasons.push('PERMIT2_APPROVAL');
  }
  
  // Calculate weighted risk score
  const weightedScore = factors.reduce((sum, factor) => {
    return sum + (factor.score * factor.weight);
  }, 0);
  
  // Apply special rules
  let finalScore = weightedScore;
  
  // Special rule: known scam spenders = critical by default
  if (KNOWN_SCAM_SPENDERS.has(spender.toLowerCase())) {
    finalScore = Math.max(finalScore, RISK_THRESHOLDS.critical);
    reasons.push('KNOWN_SCAM_SPENDER_RULE');
  }
  
  // Special rule: infinite + unknown spenders = critical by default
  if (isUnlimited && !TRUSTED_SPENDERS.has(spender.toLowerCase())) {
    finalScore = Math.max(finalScore, RISK_THRESHOLDS.critical);
    reasons.push('INFINITE_UNKNOWN_RULE');
  }
  
  // Special rule: proxy + recently upgraded = critical
  if (isProxyContract(spender) && ageInDays < 30) {
    finalScore = Math.max(finalScore, RISK_THRESHOLDS.critical);
    reasons.push('RECENT_PROXY_UPGRADE');
  }
  
  // Special rule: Permit2 operator not verified
  if (isPermit2 && !TRUSTED_SPENDERS.has(spender.toLowerCase())) {
    finalScore = Math.max(finalScore, RISK_THRESHOLDS.critical);
    reasons.push('UNVERIFIED_PERMIT2_OPERATOR');
  }
  
  // Determine severity
  const severity = getSeverityFromScore(finalScore);
  
  return {
    riskScore: Math.min(1.0, finalScore),
    severity,
    valueAtRisk,
    riskReasons: reasons,
    contributingFactors: factors,
    isPermit2
  };
}

/**
 * Calculate age-based risk (0-1, higher = more risky)
 */
function calculateAgeRisk(ageInDays: number): number {
  // Risk increases with age, plateaus after 2 years
  const maxAge = 730; // 2 years
  const normalizedAge = Math.min(ageInDays, maxAge) / maxAge;
  
  // Exponential curve: older approvals are disproportionately riskier
  return Math.pow(normalizedAge, 1.5);
}

/**
 * Calculate scope-based risk
 */
function calculateScopeRisk(amount: string): { scopeScore: number; isUnlimited: boolean } {
  const isUnlimited = amount === 'unlimited' || 
    amount === '115792089237316195423570985008687907853269984665640564039457584007913129639935' ||
    BigInt(amount || '0') > BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') / BigInt(2);
  
  return {
    scopeScore: isUnlimited ? 1.0 : 0.1, // Unlimited is very risky
    isUnlimited
  };
}

/**
 * Calculate value at risk in USD
 */
function calculateValueAtRisk(
  amount: string,
  tokenPriceUsd: number | null = null,
  tokenDecimals: number = 18
): number {
  if (amount === 'unlimited') {
    // For unlimited approvals, estimate based on typical wallet holdings
    if (tokenPriceUsd === null || tokenPriceUsd === 0) {
      // When price is unknown, use a conservative estimate for unlimited approvals
      return 10000; // $10k conservative estimate for unlimited approval risk
    }
    return Math.min(100000, tokenPriceUsd * 10000); // Assume max 10k tokens
  }
  
  // For limited approvals without price data, return 0
  if (tokenPriceUsd === null || tokenPriceUsd === 0) {
    return 0;
  }
  
  try {
    const amountBigInt = BigInt(amount);
    const amountFloat = Number(amountBigInt) / Math.pow(10, tokenDecimals);
    return amountFloat * tokenPriceUsd;
  } catch {
    return 0;
  }
}

/**
 * Calculate VAR-based risk score
 */
function calculateVARRisk(valueAtRisk: number): number {
  if (valueAtRisk >= VAR_THRESHOLDS.critical) return 1.0;
  if (valueAtRisk >= VAR_THRESHOLDS.high) return 0.8;
  if (valueAtRisk >= VAR_THRESHOLDS.medium) return 0.6;
  if (valueAtRisk >= VAR_THRESHOLDS.low) return 0.4;
  return 0.2;
}

/**
 * Calculate spender trust score (0-1, higher = more risky)
 */
function calculateSpenderTrust(spender: string): number {
  const lowerSpender = spender.toLowerCase();
  
  if (KNOWN_SCAM_SPENDERS.has(lowerSpender)) return 1.0;
  if (HIGH_RISK_SPENDERS.has(lowerSpender)) return 0.8;
  if (TRUSTED_SPENDERS.has(lowerSpender)) return 0.1;
  
  // Unknown spender = moderate risk
  return 0.6;
}

/**
 * Get spender description for UI
 */
function getSpenderDescription(spender: string): string {
  const lowerSpender = spender.toLowerCase();
  
  if (KNOWN_SCAM_SPENDERS.has(lowerSpender)) return 'Known scam address';
  if (HIGH_RISK_SPENDERS.has(lowerSpender)) return 'High-risk protocol';
  if (TRUSTED_SPENDERS.has(lowerSpender)) return 'Trusted protocol';
  
  return 'Unknown spender';
}

/**
 * Calculate contract-specific risk
 */
function calculateContractRisk(spender: string): number {
  if (isProxyContract(spender)) return 0.7; // Proxy contracts are riskier
  return 0.3; // Base contract risk
}

/**
 * Get contract risk description
 */
function getContractRiskDescription(spender: string): string {
  if (isProxyContract(spender)) return 'Upgradeable proxy contract';
  return 'Standard contract';
}

/**
 * Check if address is a proxy contract
 */
function isProxyContract(address: string): boolean {
  // In production, this would check on-chain for proxy patterns
  // For now, use simple heuristics
  return PROXY_PATTERNS.some(pattern => pattern.test(address));
}

/**
 * Calculate context-based risk
 */
function calculateContextRisk(chainId: number, token: string): number {
  // Different chains have different risk profiles
  const chainRisk = getChainRisk(chainId);
  const tokenRisk = getTokenRisk(token);
  
  return (chainRisk + tokenRisk) / 2;
}

/**
 * Get chain-specific risk multiplier
 */
function getChainRisk(chainId: number): number {
  switch (chainId) {
    case 1: return 0.2; // Ethereum mainnet - low risk
    case 137: return 0.3; // Polygon - low-medium risk
    case 56: return 0.4; // BSC - medium risk
    case 43114: return 0.3; // Avalanche - low-medium risk
    default: return 0.6; // Unknown chains - higher risk
  }
}

/**
 * Get token-specific risk
 */
function getTokenRisk(token: string): number {
  // In production, this would check token reputation databases
  return 0.3; // Base token risk
}

/**
 * Convert risk score to severity level
 */
function getSeverityFromScore(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= RISK_THRESHOLDS.critical) return 'critical';
  if (score >= RISK_THRESHOLDS.high) return 'high';
  if (score >= RISK_THRESHOLDS.medium) return 'medium';
  return 'low';
}

/**
 * Generate risk reasons array from analysis
 */
export function generateRiskReasons(
  isUnlimited: boolean,
  spender: string,
  ageInDays: number,
  valueAtRisk: number,
  isPermit2: boolean
): string[] {
  const reasons: string[] = [];
  
  if (isUnlimited) reasons.push('INFINITE_ALLOWANCE');
  if (KNOWN_SCAM_SPENDERS.has(spender.toLowerCase())) reasons.push('KNOWN_SCAM_SPENDER');
  if (HIGH_RISK_SPENDERS.has(spender.toLowerCase())) reasons.push('HIGH_RISK_SPENDER');
  if (!TRUSTED_SPENDERS.has(spender.toLowerCase())) reasons.push('UNKNOWN_SPENDER');
  if (ageInDays > 365) reasons.push('OLD_APPROVAL');
  if (valueAtRisk > VAR_THRESHOLDS.high) reasons.push('HIGH_VALUE_AT_RISK');
  if (isProxyContract(spender)) reasons.push('PROXY_CONTRACT');
  if (isPermit2) reasons.push('PERMIT2_APPROVAL');
  
  return reasons;
}

/**
 * Create ApprovalRisk object from calculation
 */
export function createApprovalRisk(
  id: string,
  token: string,
  spender: string,
  amount: string,
  ageInDays: number,
  chainId: number,
  tokenPriceUsd?: number,
  tokenDecimals?: number
): ApprovalRisk {
  const calculation = calculateApprovalRisk(
    token,
    spender,
    amount,
    ageInDays,
    chainId,
    tokenPriceUsd,
    tokenDecimals
  );
  
  return {
    id,
    token,
    spender,
    amount,
    riskScore: calculation.riskScore,
    severity: calculation.severity,
    valueAtRisk: calculation.valueAtRisk,
    riskReasons: calculation.riskReasons,
    contributingFactors: calculation.contributingFactors,
    ageInDays,
    isPermit2: calculation.isPermit2,
    chainId
  };
}