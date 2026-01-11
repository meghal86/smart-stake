/**
 * Cockpit Types - Unified Action Model and Related Types
 * 
 * This file defines the canonical types for the Authenticated Decision Cockpit,
 * including the unified Action model that all source adapters must output.
 * 
 * Requirements: F1, F2.1, F2.2, F2.3
 */

// ============================================================================
// Enums and Constants
// ============================================================================

/**
 * Action lanes representing different categories of actions
 */
export type ActionLane = 'Protect' | 'Earn' | 'Watch';

/**
 * Severity levels for actions
 */
export type ActionSeverity = 'critical' | 'high' | 'med' | 'low';

/**
 * Provenance indicates the confidence level of the action data
 * - confirmed: Data from completed scans/verified sources
 * - simulated: Data from simulations or projections
 * - heuristic: Data inferred from partial information
 */
export type ActionProvenance = 'confirmed' | 'simulated' | 'heuristic';

/**
 * CTA (Call-to-Action) kinds
 * - Fix: Remediate a security issue
 * - Execute: Perform an action (e.g., claim rewards)
 * - Review: View details without taking action
 */
export type CTAKind = 'Fix' | 'Execute' | 'Review';

/**
 * Freshness indicates how recent/urgent the action is
 */
export type ActionFreshness = 'new' | 'updated' | 'expiring' | 'stable';

/**
 * Source kinds for actions
 */
export type ActionSourceKind = 'guardian' | 'hunter' | 'portfolio' | 'action_center' | 'proof';

/**
 * Impact chip kinds for displaying action impact
 */
export type ImpactChipKind = 'risk_delta' | 'gas_est_usd' | 'time_est_sec' | 'upside_est_usd';

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * Impact chip displayed on action rows
 */
export interface ImpactChip {
  kind: ImpactChipKind;
  value: number;
}

/**
 * Call-to-action for an action
 */
export interface ActionCTA {
  kind: CTAKind;
  href: string;
}

/**
 * Source information for an action
 */
export interface ActionSource {
  kind: ActionSourceKind;
  ref_id: string;
}

/**
 * Unified Action Model (Appendix F1)
 * 
 * All source adapters MUST normalize their data into this shape before ranking.
 * This is the canonical representation of an action in the cockpit.
 */
export interface Action {
  /** Stable, unique identifier */
  id: string;
  
  /** Action category: Protect, Earn, or Watch */
  lane: ActionLane;
  
  /** Human-readable title */
  title: string;
  
  /** Severity level */
  severity: ActionSeverity;
  
  /** Data confidence level */
  provenance: ActionProvenance;
  
  /** Whether this action can be executed (Fix/Execute) */
  is_executable: boolean;
  
  /** Call-to-action */
  cta: ActionCTA;
  
  /** Impact indicators (max 2) */
  impact_chips: ImpactChip[];
  
  /** Event timestamp (RFC3339/ISO8601) - coalesce(updated_at, created_at) from source */
  event_time: string;
  
  /** Expiration timestamp (RFC3339/ISO8601) or null if no expiration */
  expires_at: string | null;
  
  /** Freshness indicator */
  freshness: ActionFreshness;
  
  /** Urgency score (0-100), 0 if no expires_at */
  urgency_score: number;
  
  /** Relevance score (0-30), used for tie-breaks */
  relevance_score: number;
  
  /** Total computed score (authoritative ordering) */
  score: number;
  
  /** Source system information */
  source: ActionSource;
}

/**
 * Internal Action Draft with timestamps for freshness computation
 * 
 * Adapters produce this internally, then the ranking service strips
 * created_at/updated_at before returning the final Action.
 */
export interface ActionDraft extends Omit<Action, 'freshness' | 'urgency_score' | 'relevance_score' | 'score'> {
  /** Original creation timestamp from source (internal, stripped before response) */
  _created_at: string;
  
  /** Last update timestamp from source (internal, stripped before response) */
  _updated_at: string | null;
}

// ============================================================================
// Source-Specific Input Types
// ============================================================================

/**
 * Guardian finding input for adapter
 */
export interface GuardianFindingInput {
  id: string;
  finding_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description?: string;
  status: 'open' | 'dismissed' | 'resolved';
  wallet_address: string;
  chain: string;
  risk_delta?: number;
  gas_estimate_usd?: number;
  created_at: string;
  updated_at?: string;
  /** Whether this finding came from a completed scan */
  from_completed_scan: boolean;
  /** Whether a deterministic fix flow exists */
  has_fix_flow: boolean;
}

/**
 * Hunter opportunity input for adapter
 */
export interface HunterOpportunityInput {
  id: string;
  slug: string;
  title: string;
  protocol_name: string;
  type: 'airdrop' | 'quest' | 'staking' | 'yield' | 'points' | 'loyalty' | 'testnet';
  chains: string[];
  reward_min?: number;
  reward_max?: number;
  reward_currency: string;
  trust_score: number;
  trust_level: 'green' | 'amber' | 'red';
  upside_estimate_usd?: number;
  time_estimate_sec?: number;
  expires_at?: string;
  created_at: string;
  updated_at?: string;
  /** Whether eligibility and source checks pass */
  eligibility_confirmed: boolean;
}

/**
 * Portfolio delta input for adapter
 */
export interface PortfolioDeltaInput {
  id: string;
  wallet_address: string;
  chain: string;
  token_symbol: string;
  delta_type: 'balance_change' | 'price_change' | 'risk_change';
  delta_value: number;
  delta_usd?: number;
  is_risk_related: boolean;
  created_at: string;
  updated_at?: string;
  /** Whether based on confirmed balance/price snapshots */
  from_confirmed_snapshot: boolean;
}

/**
 * Action Center item input for adapter
 */
export interface ActionCenterItemInput {
  id: string;
  intent_type: string;
  title: string;
  state: 'pending_user' | 'ready_to_execute' | 'needs_review' | 'completed' | 'failed';
  lane?: ActionLane;
  severity?: ActionSeverity;
  gas_estimate_usd?: number;
  risk_delta?: number;
  created_at: string;
  updated_at?: string;
  href: string;
}

/**
 * Proof/Receipt input for adapter
 */
export interface ProofReceiptInput {
  id: string;
  transaction_hash: string;
  title: string;
  chain: string;
  wallet_address: string;
  created_at: string;
  updated_at?: string;
  href: string;
}

// ============================================================================
// Adapter Context
// ============================================================================

/**
 * Context passed to adapters for freshness computation
 */
export interface AdapterContext {
  /** User's last opened timestamp (for new/updated detection) */
  last_opened_at: string | null;
  
  /** Whether the system is in degraded mode */
  degraded_mode: boolean;
  
  /** User's saved items for relevance scoring */
  saved_ref_ids: Set<string>;
  
  /** User's wallet roles for relevance scoring */
  wallet_roles: Map<string, string>;
  
  /** User's alert rule tags for relevance scoring */
  alert_tags: Set<string>;
}

// ============================================================================
// Ranking Types
// ============================================================================

/**
 * Scoring weights (Locked)
 */
export const SCORING_WEIGHTS = {
  lane: {
    Protect: 80,
    Earn: 50,
    Watch: 20,
  },
  severity: {
    critical: 100,
    high: 70,
    med: 40,
    low: 10,
  },
  freshness: {
    new: 25,
    updated: 15,
    expiring: 20,
    stable: 0,
  },
  burst: 10,
  degraded_penalty: -25,
  duplicate_penalty: -30,
} as const;

/**
 * Urgency score thresholds (Locked)
 */
export const URGENCY_THRESHOLDS = {
  /** 24 hours in milliseconds */
  URGENT_24H_MS: 24 * 60 * 60 * 1000,
  /** 72 hours in milliseconds */
  URGENT_72H_MS: 72 * 60 * 60 * 1000,
  /** Base score for <24h */
  SCORE_24H_BASE: 90,
  /** Max score for <24h */
  SCORE_24H_MAX: 100,
  /** Base score for <72h */
  SCORE_72H_BASE: 60,
  /** Max score for <72h */
  SCORE_72H_MAX: 89,
} as const;

/**
 * Relevance score range
 */
export const RELEVANCE_SCORE = {
  MIN: 0,
  MAX: 30,
} as const;

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Cockpit summary response shape
 */
export interface CockpitSummaryResponse {
  data: {
    wallet_scope: 'active' | 'all';
    today_card: TodayCard;
    action_preview: Action[];
    counters: CockpitCounters;
    provider_status: ProviderStatus;
    degraded_mode: boolean;
  };
  error: null;
  meta: { ts: string };
}

/**
 * Today Card state kinds
 */
export type TodayCardKind = 
  | 'onboarding'
  | 'scan_required'
  | 'critical_risk'
  | 'pending_actions'
  | 'daily_pulse'
  | 'portfolio_anchor';

/**
 * Today Card structure
 */
export interface TodayCard {
  kind: TodayCardKind;
  anchor_metric: string;
  context_line: string;
  primary_cta: { label: string; href: string };
  secondary_cta?: { label: string; href: string };
}

/**
 * Cockpit counters
 */
export interface CockpitCounters {
  new_since_last: number;
  expiring_soon: number;
  critical_risk: number;
  pending_actions: number;
}

/**
 * Provider status
 */
export interface ProviderStatus {
  state: 'online' | 'degraded' | 'offline';
  detail: string | null;
}
