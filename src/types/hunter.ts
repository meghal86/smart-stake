/**
 * Hunter Screen Types
 * 
 * Type definitions for the AlphaWhale Hunter Screen (Feed)
 * Matches database schema and API contracts from design.md
 */

// ============================================================================
// Enums
// ============================================================================

export type OpportunityType = 
  | 'airdrop' 
  | 'quest' 
  | 'staking' 
  | 'yield' 
  | 'points' 
  | 'loyalty' 
  | 'testnet';

export type RewardUnit = 
  | 'TOKEN' 
  | 'USD' 
  | 'APR' 
  | 'APY' 
  | 'POINTS' 
  | 'NFT';

export type Chain = 
  | 'ethereum' 
  | 'base' 
  | 'arbitrum' 
  | 'optimism' 
  | 'polygon' 
  | 'solana' 
  | 'avalanche';

export type TrustLevel = 'green' | 'amber' | 'red';

export type OpportunityStatus = 
  | 'draft' 
  | 'published' 
  | 'expired' 
  | 'flagged' 
  | 'quarantined';

export type UrgencyType = 'ending_soon' | 'new' | 'hot';

export type DifficultyLevel = 'easy' | 'medium' | 'advanced';

export type CTAAction = 
  | 'claim' 
  | 'start_quest' 
  | 'stake' 
  | 'view';

export type BadgeType = 
  | 'featured' 
  | 'sponsored' 
  | 'season_bonus' 
  | 'retroactive';

export type EligibilityStatus = 
  | 'likely' 
  | 'maybe' 
  | 'unlikely' 
  | 'unknown';

export type SortOption = 
  | 'recommended' 
  | 'ends_soon' 
  | 'highest_reward' 
  | 'newest' 
  | 'trust';

export type RewardConfidence = 'estimated' | 'confirmed';

export type SourceType = 'partner' | 'internal' | 'aggregator';

/**
 * Error codes for API responses
 * Requirement 8.14: Stable error code enum
 */
export enum ErrorCode {
  RATE_LIMITED = 'RATE_LIMITED',
  BAD_FILTER = 'BAD_FILTER',
  INTERNAL = 'INTERNAL',
  UNAVAILABLE = 'UNAVAILABLE',
  NOT_ALLOWED_GEO = 'NOT_ALLOWED_GEO',
  NOT_ALLOWED_KYC = 'NOT_ALLOWED_KYC',
  VERSION_UNSUPPORTED = 'VERSION_UNSUPPORTED',
}

// ============================================================================
// Core Data Models
// ============================================================================

/**
 * Badge displayed on opportunity cards
 */
export interface Badge {
  type: BadgeType;
  label: string;
}

/**
 * Protocol information
 */
export interface Protocol {
  name: string;
  logo: string;
}

/**
 * Reward information for an opportunity
 */
export interface Reward {
  min: number;
  max: number;
  currency: RewardUnit;
  confidence: RewardConfidence;
}

/**
 * Trust information from Guardian scans
 */
export interface Trust {
  score: number;
  level: TrustLevel;
  last_scanned_ts: string;
  issues?: string[];
}

/**
 * Eligibility preview for connected wallet
 */
export interface EligibilityPreview {
  status: EligibilityStatus;
  score?: number;
  reasons: string[];
}

/**
 * Main Opportunity interface matching database schema
 * Requirement 1.7: Conforms to API response structure
 */
export interface Opportunity {
  id: string;
  slug: string;
  title: string;
  description?: string;
  protocol: Protocol;
  type: OpportunityType;
  chains: Chain[];
  reward: Reward;
  apr?: number;
  trust: Trust;
  urgency?: UrgencyType;
  difficulty: DifficultyLevel;
  eligibility_preview?: EligibilityPreview;
  featured: boolean;
  sponsored: boolean;
  time_left_sec?: number;
  external_url?: string;
  badges: Badge[];
  status: OpportunityStatus;
  created_at: string;
  updated_at: string;
  published_at?: string;
  expires_at?: string;
}

/**
 * Guardian scan record
 */
export interface GuardianScan {
  id: string;
  opportunity_id: string;
  score: number;
  level: TrustLevel;
  issues: string[];
  scanned_at: string;
  created_at: string;
}

/**
 * Eligibility cache record
 */
export interface EligibilityCache {
  id: string;
  opportunity_id: string;
  wallet_address: string;
  status: EligibilityStatus;
  score: number;
  reasons: string[];
  cached_at: string;
  expires_at: string;
}

/**
 * User preferences
 */
export interface UserPreferences {
  user_id: string;
  preferred_chains?: Chain[];
  trust_tolerance: number;
  time_budget: 'easy_first' | 'any';
  show_risky_consent: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Component Props Interfaces
// ============================================================================

/**
 * OpportunityCard component props
 */
export interface OpportunityCardProps {
  opportunity: Opportunity;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
  onReport: (id: string) => void;
  onCTAClick: (id: string, action: CTAAction) => void;
  isConnected: boolean;
  userWallet?: string;
}

/**
 * FilterDrawer component props
 */
export interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onReset: () => void;
}

/**
 * Filter state for opportunity feed
 * Requirement 4.1-4.12: Comprehensive filtering
 */
export interface FilterState {
  search: string;
  types: OpportunityType[];
  chains: Chain[];
  trustMin: number;
  rewardMin: number;
  rewardMax: number;
  urgency: UrgencyType[];
  eligibleOnly: boolean;
  difficulty: DifficultyLevel[];
  sort: SortOption;
  showRisky: boolean;
}

// ============================================================================
// API Response Schemas
// ============================================================================

/**
 * GET /api/hunter/opportunities response
 * Requirement 1.7: API response structure
 */
export interface OpportunitiesResponse {
  items: Opportunity[];
  cursor: string | null;
  ts: string; // RFC3339 UTC
}

/**
 * Error response structure
 * Requirement 8.10, 8.14: Structured error responses
 */
export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    retry_after_sec?: number;
  };
}

/**
 * GET /api/guardian/summary response
 * Requirement 2.1-2.7: Guardian trust integration
 */
export interface GuardianSummaryResponse {
  summaries: {
    [opportunityId: string]: {
      score: number;
      level: TrustLevel;
      last_scanned_ts: string;
      top_issues: string[];
    };
  };
}

/**
 * GET /api/eligibility/preview response
 * Requirement 6.1-6.8: Eligibility preview
 */
export interface EligibilityPreviewResponse {
  status: EligibilityStatus;
  score: number;
  reasons: string[];
  cached_until: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Cursor tuple for pagination
 * [rank_score, trust_score, expires_at, id]
 */
export type CursorTuple = [number, number, string, string];

/**
 * Eligibility signals for scoring
 */
export interface EligibilitySignals {
  walletAgeDays: number;
  txCount: number;
  holdsOnChain: boolean;
  hasOnChainForChain: (chain: string) => boolean;
  allowlistProofs: boolean;
}

/**
 * Analytics event types
 */
export type AnalyticsEventType = 
  | 'feed_view'
  | 'filter_change'
  | 'card_impression'
  | 'card_click'
  | 'save'
  | 'report'
  | 'cta_click'
  | 'scroll_depth';

/**
 * Analytics event payload
 */
export interface AnalyticsEvent {
  event_type: AnalyticsEventType;
  user_id_hash?: string;
  opportunity_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
