/**
 * HarvestPro Type Definitions
 * Tax-Loss Harvesting Module for AlphaWhale
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
export type HoldingPeriodFilter = 'short-term' | 'long-term' | 'all';
export type LiquidityFilter = 'high' | 'medium' | 'low' | 'all';

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

export interface HarvestSession {
  sessionId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  status: HarvestSessionStatus;
  opportunitiesSelected: HarvestOpportunity[];
  realizedLossesTotal: number;
  netBenefitTotal: number;
  executionSteps: ExecutionStep[];
  exportUrl: string | null;
  proofHash: string | null;
}

export interface ExecutionStep {
  id: string;
  sessionId: string;
  stepNumber: number;
  description: string;
  type: ExecutionStepType;
  status: ExecutionStepStatus;
  transactionHash: string | null;
  cexPlatform?: string;
  errorMessage: string | null;
  guardianScore: number | null;
  timestamp: string | null;
  durationMs?: number;
  createdAt: string;
  metadata?: ExecutionStepMetadata;
}

export interface ExecutionStepMetadata {
  instruction?: string;
  platform?: string;
  tokenPair?: string;
  orderType?: string;
  token?: string;
  quantity?: number;
  [key: string]: unknown;
}

export interface HarvestUserSettings {
  userId: string;
  taxRate: number;
  notificationsEnabled: boolean;
  notificationThreshold: number;
  preferredWallets: string[];
  riskTolerance: RiskTolerance;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  walletAddress: string;
  token: string;
  transactionHash: string;
  transactionType: TransactionType;
  quantity: number;
  priceUsd: number;
  timestamp: string;
  createdAt: string;
}

export interface CexAccount {
  id: string;
  userId: string;
  exchangeName: string;
  apiKeyEncrypted: string;
  apiSecretEncrypted: string;
  isActive: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CexTrade {
  id: string;
  cexAccountId: string;
  userId: string;
  token: string;
  tradeType: TradeType;
  quantity: number;
  priceUsd: number;
  timestamp: string;
  createdAt: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface OpportunitiesQueryParams {
  wallets?: string[];
  minBenefit?: number;
  riskLevels?: RiskLevel[];
  cursor?: string;
  limit?: number;
}

export interface OpportunitiesResponse {
  items: HarvestOpportunity[];
  cursor: string | null;
  ts: string; // RFC3339 UTC
  summary: OpportunitiesSummary;
}

export interface OpportunitiesSummary {
  totalHarvestableLoss: number;
  estimatedNetBenefit: number;
  eligibleTokensCount: number;
  gasEfficiencyScore: GasEfficiencyGrade;
}

export interface PriceResponse {
  ts: string; // RFC3339 UTC
  prices: Record<string, number>; // token symbol -> USD price
}

export interface CreateSessionRequest {
  opportunityIds: string[];
}

export interface CreateSessionResponse {
  sessionId: string;
  status: 'draft';
  createdAt: string;
}

export interface SessionResponse {
  session: HarvestSession;
}

export interface ExecuteSessionResponse {
  sessionId: string;
  status: 'executing';
  steps: ExecutionStep[];
}

export interface ProofOfHarvest {
  sessionId: string;
  userId: string;
  executedAt: string;
  lots: HarvestedLot[];
  totalLoss: number;
  netBenefit: number;
  proofHash: string;
}

export interface HarvestedLot {
  token: string;
  dateAcquired: Date;
  dateSold: Date;
  quantity: number;
  costBasis: number;
  proceeds: number;
  gainLoss: number;
  term: 'Short-term' | 'Long-term';
  source: string;
  txHash: string | null;
  feeUsd: number;
}

export interface UpdateSettingsRequest {
  taxRate?: number;
  notificationsEnabled?: boolean;
  notificationThreshold?: number;
  preferredWallets?: string[];
  riskTolerance?: RiskTolerance;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export type ErrorCode =
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'INTERNAL'
  | 'UNAVAILABLE'
  | 'INSUFFICIENT_BALANCE'
  | 'GAS_ESTIMATION_FAILED'
  | 'EXECUTION_FAILED';

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    retry_after_sec?: number;
  };
}

// ============================================================================
// FILTER STATE TYPES
// ============================================================================

export type SortOption =
  | 'net-benefit-desc'
  | 'loss-amount-desc'
  | 'guardian-score-desc'
  | 'gas-efficiency-asc'
  | 'newest';

export interface FilterState {
  search: string;
  types: ('harvest' | 'loss-lot' | 'cex-position')[];
  wallets: string[];
  riskLevels: RiskLevel[];
  minBenefit: number;
  holdingPeriod: HoldingPeriodFilter;
  gasEfficiency: GasEfficiencyGrade | 'all';
  liquidity: LiquidityFilter;
  sort: SortOption;
}

// ============================================================================
// CALCULATION TYPES
// ============================================================================

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
// COMPONENT PROP TYPES
// ============================================================================

export interface HarvestOpportunityCardProps {
  opportunity: HarvestOpportunity;
  onStartHarvest: (id: string) => void;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
  onReport: (id: string) => void;
  isConnected: boolean;
  userWallet?: string;
}

export interface HarvestSessionProps {
  sessionId: string;
  onComplete: (sessionId: string) => void;
  onCancel: (sessionId: string) => void;
}
