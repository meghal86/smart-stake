/**
 * Unified Portfolio System TypeScript Types
 * 
 * Shared types and interfaces for the unified portfolio system.
 * Follows reuse-first architecture - extends existing types where possible.
 */

// ============================================================================
// CORE SCOPE AND WALLET TYPES
// ============================================================================

export type ScopeMode = 'active_wallet' | 'all_wallets';

export type WalletScope =
  | { mode: 'active_wallet'; address: `0x${string}` }
  | { mode: 'all_wallets' };

// ============================================================================
// FRESHNESS AND CONFIDENCE TRACKING
// ============================================================================

export interface FreshnessConfidence {
  freshnessSec: number;
  confidence: number; // 0.5000..1.0000 (NUMERIC(5,4))
  confidenceThreshold: number; // default 0.70, min 0.50
  degraded: boolean;
  degradedReasons?: string[];
}

// ============================================================================
// PORTFOLIO SNAPSHOT TYPES
// ============================================================================

export interface PortfolioSnapshot {
  id: string;
  userId: string;
  walletAddress?: string; // nullable if scope_mode = all_wallets
  scopeMode: ScopeMode;
  scopeKey: string;
  netWorth: number;
  delta24h: number;
  freshnessSec: number;
  confidence: number; // NUMERIC(5,4)
  riskScore: number; // NUMERIC(5,4)
  positions: Position[];
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  token: string;
  symbol: string;
  balance: number;
  valueUsd: number;
  chain: string;
  protocol?: string;
  category: 'token' | 'nft' | 'defi' | 'staking';
}

// ============================================================================
// APPROVAL RISK TYPES (extends existing guardian types)
// ============================================================================

export interface PortfolioApprovalRisk {
  id: string;
  userId: string;
  walletAddress: string;
  chainId: number; // EIP-155 chain ID
  tokenAddress: string;
  spenderAddress: string;
  amount: string; // "unlimited" or specific amount
  riskScore: number; // NUMERIC(5,4)
  severity: 'critical' | 'high' | 'medium' | 'low';
  valueAtRiskUsd: number;
  riskReasons: string[];
  contributingFactors: Array<{
    factor: string;
    weight: number;
    description: string;
  }>;
  ageDays: number;
  isPermit2: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// RECOMMENDED ACTIONS TYPES
// ============================================================================

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

// ============================================================================
// INTENT PLANNING AND EXECUTION TYPES
// ============================================================================

export interface IntentPlan {
  id: string;
  userId: string;
  intent: string;
  walletScope: WalletScope;
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
  idempotencyKey: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionStep {
  id: string;
  planId: string;
  stepId: string;
  kind: 'revoke' | 'approve' | 'swap' | 'transfer';
  chainId: number; // EIP-155 chain ID
  targetAddress: string;
  status: 'pending' | 'simulated' | 'blocked' | 'ready' | 'signing' | 'submitted' | 'confirmed' | 'failed';
  payload?: string;
  gasEstimate?: number;
  errorMessage?: string;
  transactionHash?: string;
  blockNumber?: number;
  stepIdempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface SimulationReceipt {
  id: string;
  planId: string;
  userId: string;
  walletScopeHash: string;
  chainSetHash: string;
  simulatorVersion: string;
  assetDeltas: AssetDelta[];
  permissionDeltas: PermissionDelta[];
  warnings: string[];
  createdAt: string;
  expiresAt: string;
}

export interface AssetDelta {
  token: string;
  symbol: string;
  amount: string;
  valueUsd: number;
  direction: 'in' | 'out';
}

export interface PermissionDelta {
  token: string;
  spender: string;
  oldAmount: string;
  newAmount: string;
  action: 'grant' | 'revoke' | 'modify';
}

// ============================================================================
// POLICY ENGINE TYPES
// ============================================================================

export interface PolicyEngineConfig {
  maxGasUsd: number; // user configurable, default 50
  blockNewContractsDays: number; // default 7
  blockInfiniteApprovalsToUnknown: boolean; // default true
  requireSimulationForValueOverUsd: number; // default 250
  confidenceThreshold: number; // default 0.70, min 0.50
  allowedSlippagePercent: number; // default 2.0
  maxDailyTransactionCount: number; // default 20
}

// ============================================================================
// AUDIT AND NOTIFICATION TYPES
// ============================================================================

export interface AuditEvent {
  id: string;
  userId: string;
  walletScope: WalletScope;
  eventType: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  planId?: string;
  stepId?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface NotificationPrefs {
  userId: string;
  dnd: boolean;
  caps: number; // 0-50
  severityThreshold: 'critical' | 'high' | 'medium' | 'low';
  channels: string[]; // ['email', 'push', 'sms']
  updatedAt: string;
}

export interface NotificationEvent {
  id: string;
  userId: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  scopeKey: string;
  deepLink?: string;
  payload: Record<string, any>;
  createdAt: string;
}

export interface NotificationDelivery {
  id: string;
  eventId: string;
  channel: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ListResponse<T> {
  items: T[];
  nextCursor?: string;
  freshness: FreshnessConfidence;
}

export interface ApiResponse<T> {
  data: T;
  apiVersion: string; // "v1"
  ts: string; // ISO 8601 UTC
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    retryAfterSec?: number;
  };
  apiVersion: string;
}

// ============================================================================
// COPILOT INTEGRATION TYPES
// ============================================================================

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

export interface PreFlightCard {
  assetDeltas: AssetDelta[];
  permissionDeltas: PermissionDelta[];
  gasEstimate: number;
  warnings: string[];
  confidence: number;
}

export type CopilotStreamEvent =
  | { type: 'message'; text: string }
  | { type: 'action_card'; payload: ActionCard }
  | { type: 'intent_plan'; payload: IntentPlan }
  | { type: 'capability_notice'; payload: { code: string; message: string } }
  | { type: 'done' };

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type ChainId = number; // EIP-155 chain identifiers

export type Address = `0x${string}`;

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isActiveWalletScope(scope: WalletScope): scope is { mode: 'active_wallet'; address: Address } {
  return scope.mode === 'active_wallet';
}

export function isAllWalletsScope(scope: WalletScope): scope is { mode: 'all_wallets' } {
  return scope.mode === 'all_wallets';
}

export function isValidSeverity(value: string): value is Severity {
  return ['critical', 'high', 'medium', 'low'].includes(value);
}

export function isValidConfidence(value: number): boolean {
  return value >= 0.5000 && value <= 1.0000;
}

export function isValidRiskScore(value: number): boolean {
  return value >= 0.0000 && value <= 1.0000;
}