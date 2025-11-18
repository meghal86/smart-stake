/**
 * HarvestPro Zod Validation Schemas
 * Runtime validation for HarvestPro data structures
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const RiskLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export const RiskToleranceSchema = z.enum(['conservative', 'moderate', 'aggressive']);
export const TransactionTypeSchema = z.enum(['buy', 'sell', 'transfer_in', 'transfer_out']);
export const TradeTypeSchema = z.enum(['buy', 'sell']);
export const ExecutionStepTypeSchema = z.enum(['on-chain', 'cex-manual']);
export const ExecutionStepStatusSchema = z.enum(['pending', 'executing', 'completed', 'failed']);
export const HarvestSessionStatusSchema = z.enum(['draft', 'executing', 'completed', 'failed', 'cancelled']);
export const RecommendationBadgeSchema = z.enum(['recommended', 'not-recommended', 'high-benefit', 'gas-heavy', 'guardian-flagged']);
export const GasEfficiencyGradeSchema = z.enum(['A', 'B', 'C']);
export const HoldingPeriodFilterSchema = z.enum(['short-term', 'long-term', 'all']);
export const LiquidityFilterSchema = z.enum(['high', 'medium', 'low', 'all']);

// ============================================================================
// DATABASE MODEL SCHEMAS
// ============================================================================

export const LotSchema = z.object({
  lotId: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string().min(1).max(20),
  walletOrCex: z.string().min(1),
  acquiredAt: z.string().datetime(),
  acquiredQty: z.number().positive(),
  acquiredPriceUsd: z.number().nonnegative(),
  currentPriceUsd: z.number().nonnegative(),
  unrealizedPnl: z.number(),
  holdingPeriodDays: z.number().int().nonnegative(),
  longTerm: z.boolean(),
  riskLevel: RiskLevelSchema,
  liquidityScore: z.number().min(0).max(100),
  guardianScore: z.number().min(0).max(10),
  eligibleForHarvest: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const HarvestOpportunityMetadataSchema = z.object({
  walletName: z.string().optional(),
  venue: z.string().optional(),
  reasons: z.array(z.string()).optional(),
}).passthrough();

export const HarvestOpportunitySchema = z.object({
  id: z.string().uuid(),
  lotId: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string().min(1).max(20),
  tokenLogoUrl: z.string().url().nullable(),
  riskLevel: RiskLevelSchema,
  unrealizedLoss: z.number().positive(),
  remainingQty: z.number().positive(),
  gasEstimate: z.number().nonnegative(),
  slippageEstimate: z.number().nonnegative(),
  tradingFees: z.number().nonnegative(),
  netTaxBenefit: z.number(),
  guardianScore: z.number().min(0).max(10),
  executionTimeEstimate: z.string().nullable(),
  confidence: z.number().min(0).max(100),
  recommendationBadge: RecommendationBadgeSchema,
  metadata: HarvestOpportunityMetadataSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ExecutionStepSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  stepNumber: z.number().int().positive(),
  description: z.string().min(1),
  type: ExecutionStepTypeSchema,
  status: ExecutionStepStatusSchema,
  transactionHash: z.string().nullable(),
  cexPlatform: z.string().optional(),
  errorMessage: z.string().nullable(),
  guardianScore: z.number().min(0).max(10).nullable(),
  timestamp: z.string().datetime().nullable(),
  durationMs: z.number().int().nonnegative().optional(),
  createdAt: z.string().datetime(),
});

export const HarvestSessionSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  status: HarvestSessionStatusSchema,
  opportunitiesSelected: z.array(HarvestOpportunitySchema),
  realizedLossesTotal: z.number().nonnegative(),
  netBenefitTotal: z.number(),
  executionSteps: z.array(ExecutionStepSchema),
  exportUrl: z.string().url().nullable(),
  proofHash: z.string().nullable(),
});

export const HarvestUserSettingsSchema = z.object({
  userId: z.string().uuid(),
  taxRate: z.number().min(0).max(1),
  notificationsEnabled: z.boolean(),
  notificationThreshold: z.number().nonnegative(),
  preferredWallets: z.array(z.string()),
  riskTolerance: RiskToleranceSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const WalletTransactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  walletAddress: z.string().min(1),
  token: z.string().min(1).max(20),
  transactionHash: z.string().min(1),
  transactionType: TransactionTypeSchema,
  quantity: z.number().positive(),
  priceUsd: z.number().nonnegative(),
  timestamp: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export const CexAccountSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  exchangeName: z.string().min(1),
  apiKeyEncrypted: z.string().min(1),
  apiSecretEncrypted: z.string().min(1),
  isActive: z.boolean(),
  lastSyncedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CexTradeSchema = z.object({
  id: z.string().uuid(),
  cexAccountId: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string().min(1).max(20),
  tradeType: TradeTypeSchema,
  quantity: z.number().positive(),
  priceUsd: z.number().nonnegative(),
  timestamp: z.string().datetime(),
  createdAt: z.string().datetime(),
});

// ============================================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const OpportunitiesQueryParamsSchema = z.object({
  wallets: z.array(z.string()).optional(),
  minBenefit: z.coerce.number().nonnegative().optional(),
  riskLevels: z.array(RiskLevelSchema).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const OpportunitiesSummarySchema = z.object({
  totalHarvestableLoss: z.number().nonnegative(),
  estimatedNetBenefit: z.number(),
  eligibleTokensCount: z.number().int().nonnegative(),
  gasEfficiencyScore: GasEfficiencyGradeSchema,
});

export const OpportunitiesResponseSchema = z.object({
  items: z.array(HarvestOpportunitySchema),
  cursor: z.string().nullable(),
  ts: z.string().datetime(),
  summary: OpportunitiesSummarySchema,
});

export const PriceResponseSchema = z.object({
  ts: z.string().datetime(),
  prices: z.record(z.string(), z.number().nonnegative()),
});

export const CreateSessionRequestSchema = z.object({
  opportunityIds: z.array(z.string().uuid()).min(1),
});

export const CreateSessionResponseSchema = z.object({
  sessionId: z.string().uuid(),
  status: z.literal('draft'),
  createdAt: z.string().datetime(),
});

export const SessionResponseSchema = z.object({
  session: HarvestSessionSchema,
});

export const ExecuteSessionResponseSchema = z.object({
  sessionId: z.string().uuid(),
  status: z.literal('executing'),
  steps: z.array(ExecutionStepSchema),
});

export const HarvestedLotSchema = z.object({
  token: z.string().min(1),
  dateAcquired: z.date(),
  dateSold: z.date(),
  quantity: z.number().positive(),
  costBasis: z.number().nonnegative(),
  proceeds: z.number().nonnegative(),
  gainLoss: z.number(),
});

export const ProofOfHarvestSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  executedAt: z.string().datetime(),
  lots: z.array(HarvestedLotSchema),
  totalLoss: z.number(),
  netBenefit: z.number(),
  proofHash: z.string().min(1),
});

export const UpdateSettingsRequestSchema = z.object({
  taxRate: z.number().min(0).max(1).optional(),
  notificationsEnabled: z.boolean().optional(),
  notificationThreshold: z.number().nonnegative().optional(),
  preferredWallets: z.array(z.string()).optional(),
  riskTolerance: RiskToleranceSchema.optional(),
});

// ============================================================================
// ERROR SCHEMAS
// ============================================================================

export const ErrorCodeSchema = z.enum([
  'RATE_LIMITED',
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'NOT_FOUND',
  'INTERNAL',
  'UNAVAILABLE',
  'INSUFFICIENT_BALANCE',
  'GAS_ESTIMATION_FAILED',
  'EXECUTION_FAILED',
]);

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
    retry_after_sec: z.number().int().positive().optional(),
  }),
});

// ============================================================================
// FILTER STATE SCHEMAS
// ============================================================================

export const SortOptionSchema = z.enum([
  'net-benefit-desc',
  'loss-amount-desc',
  'guardian-score-desc',
  'gas-efficiency-asc',
  'newest',
]);

export const FilterStateSchema = z.object({
  search: z.string(),
  types: z.array(z.enum(['harvest', 'loss-lot', 'cex-position'])),
  wallets: z.array(z.string()),
  riskLevels: z.array(RiskLevelSchema),
  minBenefit: z.number().nonnegative(),
  holdingPeriod: HoldingPeriodFilterSchema,
  gasEfficiency: z.union([GasEfficiencyGradeSchema, z.literal('all')]),
  liquidity: LiquidityFilterSchema,
  sort: SortOptionSchema,
});

// ============================================================================
// CALCULATION SCHEMAS
// ============================================================================

export const HarvestCalculationSchema = z.object({
  unrealizedLoss: z.number().nonnegative(),
  taxSavings: z.number().nonnegative(),
  gasCost: z.number().nonnegative(),
  slippageCost: z.number().nonnegative(),
  tradingFees: z.number().nonnegative(),
  netBenefit: z.number(),
  recommended: z.boolean(),
});

export const EligibilityCheckSchema = z.object({
  eligible: z.boolean(),
  reasons: z.array(z.string()),
});
