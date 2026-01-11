/**
 * Action Scoring and Ranking Service
 * 
 * Implements the ranking pipeline (Locked order):
 * 1. Adapter normalization: source item → Action draft (with internal created_at/updated_at)
 * 2. Provenance gating: heuristic + Fix/Execute → downgrade to Review + is_executable=false
 * 3. Candidate selection: Fix/Execute require is_executable=true; Review allowed
 * 4. Score computation: urgency_score, relevance_score (0-30), freshness, total score
 * 5. Sort + tie-breaks (Locked): severity → expires_at rule → relevance → event_time
 * 
 * Requirements: 6.1, 6.2, 6.9, Ranking Pipeline (Locked)
 */

import {
  Action,
  ActionDraft,
  ActionFreshness,
  ActionSeverity,
  AdapterContext,
  SCORING_WEIGHTS,
} from '../types';
import { computeUrgencyScore } from './urgency';
import { deriveFreshness } from './freshness';
import { computeRelevanceScore } from './relevance';
import { calculateDuplicatePenalty, getDedupeKeyFromAction } from './dedupe';

// ============================================================================
// Scoring Weights (Locked)
// ============================================================================

/**
 * Gets the lane weight for scoring.
 */
function getLaneWeight(lane: Action['lane']): number {
  return SCORING_WEIGHTS.lane[lane];
}

/**
 * Gets the severity weight for scoring.
 */
function getSeverityWeight(severity: ActionSeverity): number {
  return SCORING_WEIGHTS.severity[severity];
}

/**
 * Gets the freshness weight for scoring.
 */
function getFreshnessWeight(freshness: ActionFreshness): number {
  return SCORING_WEIGHTS.freshness[freshness];
}

// ============================================================================
// Provenance Gating
// ============================================================================

/**
 * Applies provenance gating to an action draft.
 * 
 * Rule: If provenance="heuristic" and CTA would be Fix/Execute:
 * - MUST downgrade cta.kind="Review"
 * - MUST set is_executable=false
 * 
 * @param action - The action draft
 * @returns Action draft with provenance gating applied
 */
export function applyProvenanceGating(action: ActionDraft): ActionDraft {
  if (action.provenance === 'heuristic') {
    if (action.cta.kind === 'Fix' || action.cta.kind === 'Execute') {
      return {
        ...action,
        cta: {
          ...action.cta,
          kind: 'Review',
        },
        is_executable: false,
      };
    }
  }
  
  return action;
}

// ============================================================================
// Candidate Selection
// ============================================================================

/**
 * Checks if an action is eligible for Action Preview.
 * 
 * Rules:
 * - Actions with cta.kind in ("Fix","Execute") MUST have is_executable=true to be eligible
 * - Actions with cta.kind="Review" are always eligible
 * 
 * @param action - The action draft
 * @returns true if eligible for Action Preview
 */
export function isEligibleForPreview(action: ActionDraft): boolean {
  if (action.cta.kind === 'Review') {
    return true;
  }
  
  // Fix/Execute require is_executable=true
  return action.is_executable;
}

// ============================================================================
// Score Computation
// ============================================================================

/**
 * Computes the total score for an action.
 * 
 * Formula:
 * score = lane_weight + severity_weight + urgency_weight + 
 *         freshness_weight + relevance_weight + burst_weight + penalty_weight
 * 
 * @param params - Scoring parameters
 * @returns Total score
 */
export function computeTotalScore(params: {
  lane: Action['lane'];
  severity: ActionSeverity;
  urgencyScore: number;
  freshness: ActionFreshness;
  relevanceScore: number;
  isBurst: boolean;
  isDegraded: boolean;
  isDuplicate: boolean;
}): number {
  const {
    lane,
    severity,
    urgencyScore,
    freshness,
    relevanceScore,
    isBurst,
    isDegraded,
    isDuplicate,
  } = params;
  
  let score = 0;
  
  // Lane weight
  score += getLaneWeight(lane);
  
  // Severity weight
  score += getSeverityWeight(severity);
  
  // Urgency weight (already computed as 0-100)
  score += urgencyScore;
  
  // Freshness weight
  score += getFreshnessWeight(freshness);
  
  // Relevance weight (0-30)
  score += relevanceScore;
  
  // Burst weight
  if (isBurst) {
    score += SCORING_WEIGHTS.burst;
  }
  
  // Degraded penalty
  if (isDegraded) {
    score += SCORING_WEIGHTS.degraded_penalty;
  }
  
  // Duplicate penalty
  if (isDuplicate) {
    score += SCORING_WEIGHTS.duplicate_penalty;
  }
  
  return score;
}

// ============================================================================
// Tie-Breaker Comparison
// ============================================================================

/**
 * Severity order for tie-breaking (higher = more severe)
 */
const SEVERITY_ORDER: Record<ActionSeverity, number> = {
  critical: 4,
  high: 3,
  med: 2,
  low: 1,
};

/**
 * Compares two actions for tie-breaking.
 * 
 * Tie-breaker order (Locked):
 * 1. Higher severity wins
 * 2. expires_at rule: if both have expires_at, sooner wins; if only one has expires_at, it wins; if both null, skip
 * 3. Higher relevance wins
 * 4. Newer event_time wins
 * 
 * @param a - First action
 * @param b - Second action
 * @returns Negative if a should come first, positive if b should come first, 0 if equal
 */
export function compareTieBreakers(a: Action, b: Action): number {
  // 1. Higher severity wins
  const severityDiff = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
  if (severityDiff !== 0) {
    return severityDiff;
  }
  
  // 2. expires_at rule
  const aHasExpiry = a.expires_at !== null;
  const bHasExpiry = b.expires_at !== null;
  
  if (aHasExpiry && bHasExpiry) {
    // Both have expires_at: sooner wins
    const aExpiry = new Date(a.expires_at!).getTime();
    const bExpiry = new Date(b.expires_at!).getTime();
    if (aExpiry !== bExpiry) {
      return aExpiry - bExpiry; // Sooner (smaller) comes first
    }
  } else if (aHasExpiry && !bHasExpiry) {
    // Only a has expires_at: a wins
    return -1;
  } else if (!aHasExpiry && bHasExpiry) {
    // Only b has expires_at: b wins
    return 1;
  }
  // Both null: skip to next tie-breaker
  
  // 3. Higher relevance wins
  const relevanceDiff = b.relevance_score - a.relevance_score;
  if (relevanceDiff !== 0) {
    return relevanceDiff;
  }
  
  // 4. Newer event_time wins
  const aEventTime = new Date(a.event_time).getTime();
  const bEventTime = new Date(b.event_time).getTime();
  return bEventTime - aEventTime; // Newer (larger) comes first
}

// ============================================================================
// Main Ranking Pipeline
// ============================================================================

/**
 * Options for the ranking pipeline.
 */
export interface RankingOptions {
  /** Maximum number of actions to return */
  limit?: number;
  /** Whether to detect burst patterns */
  detectBursts?: boolean;
  /** Set of recently shown dedupe keys (for duplicate penalty) */
  recentlyShownKeys?: Set<string>;
}

/**
 * Converts an ActionDraft to a final Action with computed scores.
 * 
 * @param draft - The action draft
 * @param context - Adapter context
 * @param options - Additional options
 * @returns Final Action with all scores computed
 */
export function finalizeAction(
  draft: ActionDraft,
  context: AdapterContext,
  options: {
    isBurst?: boolean;
    recentlyShownKeys?: Set<string>;
  } = {}
): Action {
  const { isBurst = false, recentlyShownKeys = new Set() } = options;
  
  // Compute urgency score
  const urgencyScore = computeUrgencyScore(draft.expires_at);
  
  // Derive freshness
  const freshness = deriveFreshness({
    expiresAt: draft.expires_at,
    eventTime: draft.event_time,
    createdAt: draft._created_at,
    updatedAt: draft._updated_at,
    lastOpenedAt: context.last_opened_at,
  });
  
  // Compute relevance score
  const relevanceScore = computeRelevanceScore(draft, context);
  
  // Check for duplicate
  const duplicatePenalty = calculateDuplicatePenalty(draft, recentlyShownKeys);
  const isDuplicate = duplicatePenalty !== 0;
  
  // Compute total score
  const score = computeTotalScore({
    lane: draft.lane,
    severity: draft.severity,
    urgencyScore,
    freshness,
    relevanceScore,
    isBurst,
    isDegraded: context.degraded_mode,
    isDuplicate,
  });
  
  // Create final action (strip internal timestamps)
  const { _created_at, _updated_at, ...rest } = draft;
  
  return {
    ...rest,
    freshness,
    urgency_score: urgencyScore,
    relevance_score: relevanceScore,
    score,
  };
}

/**
 * Runs the complete ranking pipeline on a set of action drafts.
 * 
 * Pipeline steps:
 * 1. Provenance gating
 * 2. Candidate selection
 * 3. Score computation
 * 4. Sort by score + tie-breakers
 * 5. Limit results
 * 
 * @param drafts - Array of action drafts from adapters
 * @param context - Adapter context
 * @param options - Ranking options
 * @returns Sorted array of final Actions
 */
export function rankActions(
  drafts: ActionDraft[],
  context: AdapterContext,
  options: RankingOptions = {}
): Action[] {
  const { limit = 3, recentlyShownKeys = new Set() } = options;
  
  // Step 1: Apply provenance gating
  const gatedDrafts = drafts.map(applyProvenanceGating);
  
  // Step 2: Filter to eligible candidates
  const eligibleDrafts = gatedDrafts.filter(isEligibleForPreview);
  
  // Step 3: Finalize actions with scores
  const actions = eligibleDrafts.map(draft => 
    finalizeAction(draft, context, { recentlyShownKeys })
  );
  
  // Step 4: Sort by score (descending) with tie-breakers
  actions.sort((a, b) => {
    // Primary: score descending
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    
    // Tie-breakers
    return compareTieBreakers(a, b);
  });
  
  // Step 5: Limit results
  return actions.slice(0, limit);
}

/**
 * Gets the dedupe keys for a set of actions (for recording shown actions).
 * 
 * @param actions - Array of actions
 * @returns Array of dedupe keys
 */
export function getDedupeKeysForActions(actions: Action[]): string[] {
  return actions.map(action => 
    `${action.source.kind}:${action.source.ref_id}:${action.cta.kind}`
  );
}
