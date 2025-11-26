/**
 * HarvestPro Type Definitions for Edge Functions
 * Tax-Loss Harvesting Module for AlphaWhale
 * 
 * Note: This is a Deno-compatible copy of src/types/harvestpro.ts
 */

// ============================================================================
// CORE DATA TYPES
// ============================================================================

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';
export type TransactionType = 'buy' | 'sell' | 'transfer_in' | 'transfer_out';
export type TradeType = 'buy' | 'sell';
export type ExecutionStepType = 'on-chain' | 'cex-manual';
export type ExecutionStepStatus = 'pending' | 'executing' | 'completed' | 'failed';
export type HarvestSessionStatus = 'draft' | 'executing' | 'completed' | 'failed' | 'cancelled';
export type RecommendationBadge = 'recommended' | 'not-recommended' | 'high-benefit' | 'gas-heavy' | 'guardian-flagged';
export type GasEfficiencyGrade = 'A' | 'B' | 'C';

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface Lot {
  lotId: string;
  userId: string;
  token: string;
  walletOrCex: string;
  acquiredAt: string; // ISO 8601
  acquiredQty: number;
  acquiredPriceUsd: number;
  currentPriceUsd: number;
  unrealizedPnl: number;
  holdingPeriodDays: number;
  longTerm: boolean;
  riskLevel: RiskLevel;
  liquidityScore: number;
  guardianScore: number;
  eligibleForHarvest: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HarvestOpportunity {
  id: string;
  lotId: string;
  userId: string;
  token: string;
  tokenLogoUrl: string | null;
  riskLevel: RiskLevel;
  unrealizedLoss: number;
  remainingQty: number;
  gasEstimate: number;
  slippageEstimate: number;
  tradingFees: number;
  netTaxBenefit: number;
  guardianScore: number;
  executionTimeEstimate: string | null;
  confidence: number;
  recommendationBadge: RecommendationBadge;
  metadata: HarvestOpportunityMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface HarvestOpportunityMetadata {
  walletName?: string;
  venue?: string;
  reasons?: string[];
  [key: string]: unknown;
}

export interface HarvestCalculation {
  unrealizedLoss: number;
  taxSavings: number;
  gasCost: number;
  slippageCost: number;
  tradingFees: number;
  netBenefit: number;
  recommended: boolean;
}

export interface EligibilityCheck {
  eligible: boolean;
  reasons: string[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface EdgeFunctionResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
