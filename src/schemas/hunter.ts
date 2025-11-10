/**
 * Hunter Screen Zod Schemas
 * 
 * Runtime validation schemas for the AlphaWhale Hunter Screen (Feed)
 * Used for API request/response validation and type safety
 */

import { z } from 'zod';
import { ErrorCode } from '../types/hunter';

// ============================================================================
// Enum Schemas
// ============================================================================

export const OpportunityTypeSchema = z.enum([
  'airdrop',
  'quest',
  'staking',
  'yield',
  'points',
  'loyalty',
  'testnet',
]);

export const RewardUnitSchema = z.enum([
  'TOKEN',
  'USD',
  'APR',
  'APY',
  'POINTS',
  'NFT',
]);

export const ChainSchema = z.enum([
  'ethereum',
  'base',
  'arbitrum',
  'optimism',
  'polygon',
  'solana',
  'avalanche',
]);

export const TrustLevelSchema = z.enum(['green', 'amber', 'red']);

export const OpportunityStatusSchema = z.enum([
  'draft',
  'published',
  'expired',
  'flagged',
  'quarantined',
]);

export const UrgencyTypeSchema = z.enum(['ending_soon', 'new', 'hot']);

export const DifficultyLevelSchema = z.enum(['easy', 'medium', 'advanced']);

export const CTAActionSchema = z.enum(['claim', 'start_quest', 'stake', 'view']);

export const BadgeTypeSchema = z.enum([
  'featured',
  'sponsored',
  'season_bonus',
  'retroactive',
]);

export const EligibilityStatusSchema = z.enum([
  'likely',
  'maybe',
  'unlikely',
  'unknown',
]);

export const SortOptionSchema = z.enum([
  'recommended',
  'ends_soon',
  'highest_reward',
  'newest',
  'trust',
]);

export const RewardConfidenceSchema = z.enum(['estimated', 'confirmed']);

export const SourceTypeSchema = z.enum(['partner', 'internal', 'aggregator']);

export const ErrorCodeSchema = z.nativeEnum(ErrorCode);

// ============================================================================
// Core Data Model Schemas
// ============================================================================

export const BadgeSchema = z.object({
  type: BadgeTypeSchema,
  label: z.string(),
});

export const ProtocolSchema = z.object({
  name: z.string(),
  logo: z.string().url(),
});

export const RewardSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
  currency: RewardUnitSchema,
  confidence: RewardConfidenceSchema,
});

export const TrustSchema = z.object({
  score: z.number().int().min(0).max(100),
  level: TrustLevelSchema,
  last_scanned_ts: z.string().datetime(),
  issues: z.array(z.string()).optional(),
});

export const EligibilityPreviewSchema = z.object({
  status: EligibilityStatusSchema,
  score: z.number().min(0).max(1).optional(),
  reasons: z.array(z.string()),
});

/**
 * Main Opportunity schema
 * Requirement 1.7: Runtime validation for API responses
 */
export const OpportunitySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string().optional(),
  protocol: ProtocolSchema,
  type: OpportunityTypeSchema,
  chains: z.array(ChainSchema).min(1),
  reward: RewardSchema,
  apr: z.number().nonnegative().optional(),
  trust: TrustSchema,
  urgency: UrgencyTypeSchema.optional(),
  difficulty: DifficultyLevelSchema,
  eligibility_preview: EligibilityPreviewSchema.optional(),
  featured: z.boolean(),
  sponsored: z.boolean(),
  time_left_sec: z.number().int().nonnegative().optional(),
  external_url: z.string().url().optional(),
  badges: z.array(BadgeSchema),
  status: OpportunityStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  published_at: z.string().datetime().optional(),
  expires_at: z.string().datetime().optional(),
});

export const GuardianScanSchema = z.object({
  id: z.string().uuid(),
  opportunity_id: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  level: TrustLevelSchema,
  issues: z.array(z.string()),
  scanned_at: z.string().datetime(),
  created_at: z.string().datetime(),
});

export const EligibilityCacheSchema = z.object({
  id: z.string().uuid(),
  opportunity_id: z.string().uuid(),
  wallet_address: z.string(),
  status: EligibilityStatusSchema,
  score: z.number().min(0).max(1),
  reasons: z.array(z.string()),
  cached_at: z.string().datetime(),
  expires_at: z.string().datetime(),
});

export const UserPreferencesSchema = z.object({
  user_id: z.string().uuid(),
  preferred_chains: z.array(ChainSchema).optional(),
  trust_tolerance: z.number().int().min(0).max(100),
  time_budget: z.enum(['easy_first', 'any']),
  show_risky_consent: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// ============================================================================
// Filter State Schema
// ============================================================================

/**
 * Filter state schema for validation
 * Requirement 4.1-4.12: Comprehensive filtering
 */
export const FilterStateSchema = z.object({
  search: z.string(),
  types: z.array(OpportunityTypeSchema),
  chains: z.array(ChainSchema),
  trustMin: z.number().int().min(0).max(100),
  rewardMin: z.number().nonnegative(),
  rewardMax: z.number().nonnegative(),
  urgency: z.array(UrgencyTypeSchema),
  eligibleOnly: z.boolean(),
  difficulty: z.array(DifficultyLevelSchema),
  sort: SortOptionSchema,
  showRisky: z.boolean(),
});

// ============================================================================
// API Request/Response Schemas
// ============================================================================

/**
 * Query parameters for GET /api/hunter/opportunities
 * Requirement 1.7: API request validation
 */
export const OpportunitiesQuerySchema = z.object({
  q: z.string().optional(),
  type: z.array(OpportunityTypeSchema).optional(),
  chains: z.array(ChainSchema).optional(),
  trust_min: z.coerce.number().int().min(0).max(100).default(80),
  reward_min: z.coerce.number().nonnegative().optional(),
  reward_max: z.coerce.number().nonnegative().optional(),
  urgency: z.array(UrgencyTypeSchema).optional(),
  eligible: z.coerce.boolean().optional(),
  difficulty: z.array(DifficultyLevelSchema).optional(),
  sort: SortOptionSchema.default('recommended'),
  cursor: z.string().nullish(),
  mode: z.enum(['fixtures']).optional(),
});

/**
 * Response schema for GET /api/hunter/opportunities
 * Requirement 1.7: API response validation
 */
export const OpportunitiesResponseSchema = z.object({
  items: z.array(OpportunitySchema),
  cursor: z.string().nullable(),
  ts: z.string().datetime(),
});

/**
 * Error response schema
 * Requirement 8.10, 8.14: Structured error responses
 */
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
    retry_after_sec: z.number().int().nonnegative().optional(),
  }),
});

/**
 * Guardian summary response schema
 * Requirement 2.1-2.7: Guardian trust integration
 */
export const GuardianSummaryResponseSchema = z.object({
  summaries: z.record(
    z.string().uuid(),
    z.object({
      score: z.number().int().min(0).max(100),
      level: TrustLevelSchema,
      last_scanned_ts: z.string().datetime(),
      top_issues: z.array(z.string()),
    })
  ),
});

/**
 * Eligibility preview response schema
 * Requirement 6.1-6.8: Eligibility preview
 */
export const EligibilityPreviewResponseSchema = z.object({
  status: EligibilityStatusSchema,
  score: z.number().min(0).max(1),
  reasons: z.array(z.string()).min(1),
  cached_until: z.string().datetime(),
});

// ============================================================================
// Utility Schemas
// ============================================================================

/**
 * Cursor tuple schema for pagination
 */
export const CursorTupleSchema = z.tuple([
  z.number(), // rank_score
  z.number(), // trust_score
  z.string(), // expires_at (RFC3339)
  z.string(), // id
]);

/**
 * Eligibility signals schema
 * Note: hasOnChainForChain is a function and cannot be fully validated with Zod
 */
export const EligibilitySignalsSchema = z.object({
  walletAgeDays: z.number().nonnegative(),
  txCount: z.number().int().nonnegative(),
  holdsOnChain: z.boolean(),
  hasOnChainForChain: z.function(),
  allowlistProofs: z.boolean(),
});

/**
 * Analytics event schema
 */
export const AnalyticsEventSchema = z.object({
  event_type: z.enum([
    'feed_view',
    'filter_change',
    'card_impression',
    'card_click',
    'save',
    'report',
    'cta_click',
    'scroll_depth',
  ]),
  user_id_hash: z.string().optional(),
  opportunity_id: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.any()),
  created_at: z.string().datetime(),
});

// ============================================================================
// Type Inference Helpers
// ============================================================================

// Export inferred types for convenience
export type OpportunityInput = z.input<typeof OpportunitySchema>;
export type OpportunityOutput = z.output<typeof OpportunitySchema>;
export type OpportunitiesQuery = z.infer<typeof OpportunitiesQuerySchema>;
export type OpportunitiesResponseOutput = z.output<typeof OpportunitiesResponseSchema>;
export type ErrorResponseOutput = z.output<typeof ErrorResponseSchema>;
export type GuardianSummaryResponseOutput = z.output<typeof GuardianSummaryResponseSchema>;
export type EligibilityPreviewResponseOutput = z.output<typeof EligibilityPreviewResponseSchema>;
export type FilterStateInput = z.input<typeof FilterStateSchema>;
export type FilterStateOutput = z.output<typeof FilterStateSchema>;
