// Core Portfolio Types for Unified Portfolio System

export type ScopeMode = 'active_wallet' | 'all_wallets';

export type WalletScope =
  | { mode: 'active_wallet'; address: `0x${string}` }
  | { mode: 'all_wallets' };

export interface FreshnessConfidence {
  freshnessSec: number;
  confidence: number; // 0.50..1.00
  confidenceThreshold: number; // default 0.70, min 0.50
  degraded: boolean;
  degradedReasons?: string[];
}

export interface WalletProfile {
  id: string;
  address: string;
  label: string;
  group?: string;
  isActive?: boolean;
}

export interface PortfolioSnapshot {
  userId: string;
  netWorth: number;
  delta24h: number;
  freshness: FreshnessConfidence;
  positions: Position[];
  approvals: ApprovalRisk[];
  recommendedActions: RecommendedAction[];
  riskSummary: {
    overallScore: number;
    criticalIssues: number;
    highRiskApprovals: number;
    exposureByChain: Record<string, number>;
  };
  lastUpdated: string;
}

export interface Position {
  id: string;
  token: string;
  symbol: string;
  amount: string;
  valueUsd: number;
  chainId: number;
  protocol?: string;
  category: 'token' | 'lp' | 'nft' | 'defi';
}

export interface ApprovalRisk {
  id: string;
  token: string;
  spender: string;
  amount: string; // "unlimited" or specific amount
  riskScore: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  valueAtRisk: number;
  riskReasons: string[];
  contributingFactors: Array<{
    factor: string;
    weight: number;
    description: string;
  }>;
  ageInDays: number;
  isPermit2: boolean;
  chainId: number;
}

export interface RecommendedAction {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  why: string[];
  impactPreview: {
    riskDelta: number;
    preventedLossP50Usd: number;
    expectedGainUsd: number;
    gasEstimateUsd: number;
    timeEstimateSec: number;
    confidence: number;
  };
  actionScore: number;
  cta: {
    label: string;
    intent: string;
    params: Record<string, any>;
  };
  walletScope: WalletScope;
}

export interface ExecutionStep {
  stepId: string;
  kind: 'revoke' | 'approve' | 'swap' | 'transfer';
  chainId: number;
  target: string;
  status: 'pending' | 'simulated' | 'blocked' | 'ready' | 'signing' | 'submitted' | 'confirmed' | 'failed';
  payload?: string;
  gasEstimate?: number;
  error?: string;
}

export interface IntentPlan {
  id: string;
  intent: string;
  steps: ExecutionStep[];
  policy: {
    status: 'allowed' | 'blocked';
    violations: string[];
  };
  simulation: {
    status: 'pass' | 'warn' | 'block';
    receiptId: string;
  };
  impactPreview: {
    gasEstimateUsd: number;
    timeEstimateSec: number;
    riskDelta: number;
  };
  walletScope: WalletScope;
  idempotencyKey: string;
}

export interface PolicyEngineConfig {
  maxGasUsd: number; // user configurable, default 50
  blockNewContractsDays: number; // default 7
  blockInfiniteApprovalsToUnknown: boolean; // default true
  requireSimulationForValueOverUsd: number; // default 250
  confidenceThreshold: number; // default 0.70, min 0.50
  allowedSlippagePercent: number; // default 2.0
  maxDailyTransactionCount: number; // default 20
}

// API Response Types
export interface ListResponse<T> {
  items: T[];
  nextCursor?: string;
  freshness: FreshnessConfidence;
}

export interface ApiResponse<T> {
  data: T;
  apiVersion: string;
  ts: string;
}

// Copilot Types
export type CopilotStreamEvent =
  | { type: 'message'; text: string }
  | { type: 'action_card'; payload: ActionCard }
  | { type: 'intent_plan'; payload: IntentPlan }
  | { type: 'capability_notice'; payload: { code: string; message: string } }
  | { type: 'done' };

export interface ActionCard {
  type: 'ActionCard';
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  why: string[];
  impactPreview: {
    riskDelta: number;
    preventedLossP50Usd: number;
    expectedGainUsd: number;
    gasEstimateUsd: number;
    timeEstimateSec: number;
    confidence: number;
  };
  cta: { 
    label: string; 
    intent: string; 
    params: Record<string, any>; 
  };
  walletScope: WalletScope;
}