/**
 * Action Ranking Algorithm Property-Based Tests
 * 
 * Feature: authenticated-home-cockpit
 * Property 6: Action Ranking Algorithm
 * 
 * Tests that for any set of actions, ranking score is calculated using
 * the exact formula with specified weights.
 * 
 * Formula:
 * score = lane_weight + severity_weight + urgency_weight + 
 *         freshness_weight + relevance_weight + burst_weight + penalty_weight
 * 
 * Weights (Locked):
 * - lane_weight: Protect +80, Earn +50, Watch +20
 * - severity_weight: critical +100, high +70, med +40, low +10
 * - urgency_weight: <24h +90-100, <72h +60-89, else +0
 * - freshness_weight: new +25, updated +15, expiring +20, stable +0
 * - relevance_weight: 0-30
 * - burst_weight: +10 (if aggregated)
 * - penalty_weight: degraded -25, duplicate -30
 * 
 * Validates: Requirements 6.1
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import {
  computeTotalScore,
  applyProvenanceGating,
  isEligibleForPreview,
  finalizeAction,
} from '@/lib/cockpit/scoring/ranking-service';
import { computeUrgencyScore } from '@/lib/cockpit/scoring/urgency';
import { deriveFreshness } from '@/lib/cockpit/scoring/freshness';
import {
  Action,
  ActionDraft,
  ActionLane,
  ActionSeverity,
  ActionFreshness,
  ActionProvenance,
  CTAKind,
  AdapterContext,
  SCORING_WEIGHTS,
} from '@/lib/cockpit/types';

// ============================================================================
// Constants (Locked Weights)
// ============================================================================

const LANE_WEIGHTS: Record<ActionLane, number> = {
  Protect: 80,
  Earn: 50,
  Watch: 20,
};

const SEVERITY_WEIGHTS: Record<ActionSeverity, number> = {
  critical: 100,
  high: 70,
  med: 40,
  low: 10,
};

const FRESHNESS_WEIGHTS: Record<ActionFreshness, number> = {
  new: 25,
  updated: 15,
  expiring: 20,
  stable: 0,
};

const BURST_WEIGHT = 10;
const DEGRADED_PENALTY = -25;
const DUPLICATE_PENALTY = -30;

// ============================================================================
// Generators
// ============================================================================

/**
 * Generator for action lanes
 */
const laneArbitrary = fc.constantFrom<ActionLane>('Protect', 'Earn', 'Watch');

/**
 * Generator for severity levels
 */
const severityArbitrary = fc.constantFrom<ActionSeverity>('critical', 'high', 'med', 'low');

/**
 * Generator for freshness values
 */
const freshnessArbitrary = fc.constantFrom<ActionFreshness>('new', 'updated', 'expiring', 'stable');

/**
 * Generator for provenance values
 */
const provenanceArbitrary = fc.constantFrom<ActionProvenance>('confirmed', 'simulated', 'heuristic');

/**
 * Generator for CTA kinds
 */
const ctaKindArbitrary = fc.constantFrom<CTAKind>('Fix', 'Execute', 'Review');

/**
 * Generator for urgency score (0-100)
 */
const urgencyScoreArbitrary = fc.integer({ min: 0, max: 100 });

/**
 * Generator for relevance score (0-30)
 */
const relevanceScoreArbitrary = fc.integer({ min: 0, max: 30 });

/**
 * Generator for scoring parameters
 */
const scoringParamsArbitrary = fc.record({
  lane: laneArbitrary,
  severity: severityArbitrary,
  urgencyScore: urgencyScoreArbitrary,
  freshness: freshnessArbitrary,
  relevanceScore: relevanceScoreArbitrary,
  isBurst: fc.boolean(),
  isDegraded: fc.boolean(),
  isDuplicate: fc.boolean(),
});

/**
 * Generator for ISO8601 timestamps
 */
const timestampArbitrary = fc.date({
  min: new Date('2024-01-01'),
  max: new Date('2026-12-31'),
}).map(d => d.toISOString());

/**
 * Generator for optional expiration timestamps
 */
const expiresAtArbitrary = fc.option(
  fc.date({
    min: new Date(),
    max: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Up to 7 days from now
  }).map(d => d.toISOString()),
  { nil: null }
);

/**
 * Generator for ActionDraft
 */
const actionDraftArbitrary = fc.record({
  id: fc.uuid(),
  lane: laneArbitrary,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  severity: severityArbitrary,
  provenance: provenanceArbitrary,
  is_executable: fc.boolean(),
  cta: fc.record({
    kind: ctaKindArbitrary,
    href: fc.string({ minLength: 1, maxLength: 200 }),
  }),
  impact_chips: fc.array(
    fc.record({
      kind: fc.constantFrom('risk_delta', 'gas_est_usd', 'time_est_sec', 'upside_est_usd'),
      value: fc.float({ min: -100, max: 1000 }),
    }),
    { minLength: 0, maxLength: 2 }
  ),
  event_time: timestampArbitrary,
  expires_at: expiresAtArbitrary,
  source: fc.record({
    kind: fc.constantFrom('guardian', 'hunter', 'portfolio', 'action_center', 'proof'),
    ref_id: fc.uuid(),
  }),
  _created_at: timestampArbitrary,
  _updated_at: fc.option(timestampArbitrary, { nil: null }),
}) as fc.Arbitrary<ActionDraft>;

/**
 * Generator for AdapterContext
 */
const adapterContextArbitrary = fc.record({
  last_opened_at: fc.option(timestampArbitrary, { nil: null }),
  degraded_mode: fc.boolean(),
  saved_ref_ids: fc.array(fc.uuid()).map(ids => new Set(ids)),
  wallet_roles: fc.array(fc.tuple(fc.string(), fc.string())).map(pairs => new Map(pairs)),
  alert_tags: fc.array(fc.string()).map(tags => new Set(tags)),
}) as fc.Arbitrary<AdapterContext>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Manually computes the expected score using the locked formula
 */
function computeExpectedScore(params: {
  lane: ActionLane;
  severity: ActionSeverity;
  urgencyScore: number;
  freshness: ActionFreshness;
  relevanceScore: number;
  isBurst: boolean;
  isDegraded: boolean;
  isDuplicate: boolean;
}): number {
  let score = 0;
  
  // Lane weight
  score += LANE_WEIGHTS[params.lane];
  
  // Severity weight
  score += SEVERITY_WEIGHTS[params.severity];
  
  // Urgency weight
  score += params.urgencyScore;
  
  // Freshness weight
  score += FRESHNESS_WEIGHTS[params.freshness];
  
  // Relevance weight
  score += params.relevanceScore;
  
  // Burst weight
  if (params.isBurst) {
    score += BURST_WEIGHT;
  }
  
  // Degraded penalty
  if (params.isDegraded) {
    score += DEGRADED_PENALTY;
  }
  
  // Duplicate penalty
  if (params.isDuplicate) {
    score += DUPLICATE_PENALTY;
  }
  
  return score;
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: authenticated-home-cockpit, Property 6: Action Ranking Algorithm', () => {
  // ========================================================================
  // Property 6.1: Score formula is deterministic
  // ========================================================================

  test('score formula is deterministic - same inputs produce same output', () => {
    fc.assert(
      fc.property(scoringParamsArbitrary, (params) => {
        const score1 = computeTotalScore(params);
        const score2 = computeTotalScore(params);
        
        // Property: Same inputs must produce same score
        return score1 === score2;
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 6.2: Score matches expected formula
  // ========================================================================

  test('score matches expected formula with locked weights', () => {
    fc.assert(
      fc.property(scoringParamsArbitrary, (params) => {
        const actualScore = computeTotalScore(params);
        const expectedScore = computeExpectedScore(params);
        
        // Property: Actual score must match expected score
        return actualScore === expectedScore;
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 6.3: Lane weights are correctly applied
  // ========================================================================

  test('lane weights are correctly applied', () => {
    fc.assert(
      fc.property(
        laneArbitrary,
        severityArbitrary,
        freshnessArbitrary,
        relevanceScoreArbitrary,
        (lane, severity, freshness, relevanceScore) => {
          const baseParams = {
            severity,
            urgencyScore: 0,
            freshness,
            relevanceScore,
            isBurst: false,
            isDegraded: false,
            isDuplicate: false,
          };
          
          const protectScore = computeTotalScore({ ...baseParams, lane: 'Protect' });
          const earnScore = computeTotalScore({ ...baseParams, lane: 'Earn' });
          const watchScore = computeTotalScore({ ...baseParams, lane: 'Watch' });
          
          // Property: Protect > Earn > Watch (by 30 points each)
          return protectScore - earnScore === 30 && earnScore - watchScore === 30;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 6.4: Severity weights are correctly applied
  // ========================================================================

  test('severity weights are correctly applied', () => {
    fc.assert(
      fc.property(
        laneArbitrary,
        freshnessArbitrary,
        relevanceScoreArbitrary,
        (lane, freshness, relevanceScore) => {
          const baseParams = {
            lane,
            urgencyScore: 0,
            freshness,
            relevanceScore,
            isBurst: false,
            isDegraded: false,
            isDuplicate: false,
          };
          
          const criticalScore = computeTotalScore({ ...baseParams, severity: 'critical' });
          const highScore = computeTotalScore({ ...baseParams, severity: 'high' });
          const medScore = computeTotalScore({ ...baseParams, severity: 'med' });
          const lowScore = computeTotalScore({ ...baseParams, severity: 'low' });
          
          // Property: critical > high > med > low
          return criticalScore > highScore && 
                 highScore > medScore && 
                 medScore > lowScore;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 6.5: Urgency score is additive
  // ========================================================================

  test('urgency score is additive', () => {
    fc.assert(
      fc.property(
        scoringParamsArbitrary,
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (baseParams, urgency1, urgency2) => {
          const score1 = computeTotalScore({ ...baseParams, urgencyScore: urgency1 });
          const score2 = computeTotalScore({ ...baseParams, urgencyScore: urgency2 });
          
          // Property: Difference in scores equals difference in urgency
          return score1 - score2 === urgency1 - urgency2;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 6.6: Freshness weights are correctly applied
  // ========================================================================

  test('freshness weights are correctly applied', () => {
    fc.assert(
      fc.property(
        laneArbitrary,
        severityArbitrary,
        relevanceScoreArbitrary,
        (lane, severity, relevanceScore) => {
          const baseParams = {
            lane,
            severity,
            urgencyScore: 0,
            relevanceScore,
            isBurst: false,
            isDegraded: false,
            isDuplicate: false,
          };
          
          const newScore = computeTotalScore({ ...baseParams, freshness: 'new' });
          const updatedScore = computeTotalScore({ ...baseParams, freshness: 'updated' });
          const expiringScore = computeTotalScore({ ...baseParams, freshness: 'expiring' });
          const stableScore = computeTotalScore({ ...baseParams, freshness: 'stable' });
          
          // Property: new (+25) > expiring (+20) > updated (+15) > stable (+0)
          return newScore - stableScore === 25 &&
                 expiringScore - stableScore === 20 &&
                 updatedScore - stableScore === 15;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 6.7: Relevance score is additive (0-30)
  // ========================================================================

  test('relevance score is additive within range', () => {
    fc.assert(
      fc.property(
        scoringParamsArbitrary,
        fc.integer({ min: 0, max: 30 }),
        fc.integer({ min: 0, max: 30 }),
        (baseParams, relevance1, relevance2) => {
          const score1 = computeTotalScore({ ...baseParams, relevanceScore: relevance1 });
          const score2 = computeTotalScore({ ...baseParams, relevanceScore: relevance2 });
          
          // Property: Difference in scores equals difference in relevance
          return score1 - score2 === relevance1 - relevance2;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 6.8: Burst weight adds +10
  // ========================================================================

  test('burst weight adds exactly +10', () => {
    fc.assert(
      fc.property(scoringParamsArbitrary, (params) => {
        const withBurst = computeTotalScore({ ...params, isBurst: true });
        const withoutBurst = computeTotalScore({ ...params, isBurst: false });
        
        // Property: Burst adds exactly 10 points
        return withBurst - withoutBurst === BURST_WEIGHT;
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 6.9: Degraded penalty subtracts -25
  // ========================================================================

  test('degraded penalty subtracts exactly -25', () => {
    fc.assert(
      fc.property(scoringParamsArbitrary, (params) => {
        const withDegraded = computeTotalScore({ ...params, isDegraded: true });
        const withoutDegraded = computeTotalScore({ ...params, isDegraded: false });
        
        // Property: Degraded subtracts exactly 25 points
        return withDegraded - withoutDegraded === DEGRADED_PENALTY;
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 6.10: Duplicate penalty subtracts -30
  // ========================================================================

  test('duplicate penalty subtracts exactly -30', () => {
    fc.assert(
      fc.property(scoringParamsArbitrary, (params) => {
        const withDuplicate = computeTotalScore({ ...params, isDuplicate: true });
        const withoutDuplicate = computeTotalScore({ ...params, isDuplicate: false });
        
        // Property: Duplicate subtracts exactly 30 points
        return withDuplicate - withoutDuplicate === DUPLICATE_PENALTY;
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 6.11: Penalties are cumulative
  // ========================================================================

  test('penalties are cumulative', () => {
    fc.assert(
      fc.property(scoringParamsArbitrary, (params) => {
        const noPenalties = computeTotalScore({ 
          ...params, 
          isDegraded: false, 
          isDuplicate: false 
        });
        const degradedOnly = computeTotalScore({ 
          ...params, 
          isDegraded: true, 
          isDuplicate: false 
        });
        const duplicateOnly = computeTotalScore({ 
          ...params, 
          isDegraded: false, 
          isDuplicate: true 
        });
        const bothPenalties = computeTotalScore({ 
          ...params, 
          isDegraded: true, 
          isDuplicate: true 
        });
        
        // Property: Both penalties = sum of individual penalties
        return bothPenalties === noPenalties + DEGRADED_PENALTY + DUPLICATE_PENALTY &&
               degradedOnly === noPenalties + DEGRADED_PENALTY &&
               duplicateOnly === noPenalties + DUPLICATE_PENALTY;
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 6.12: Score is always a number
  // ========================================================================

  test('score is always a finite number', () => {
    fc.assert(
      fc.property(scoringParamsArbitrary, (params) => {
        const score = computeTotalScore(params);
        
        // Property: Score must be a finite number
        return typeof score === 'number' && Number.isFinite(score);
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 6.13: Minimum possible score
  // ========================================================================

  test('minimum score is achievable with worst inputs', () => {
    const minParams = {
      lane: 'Watch' as ActionLane,
      severity: 'low' as ActionSeverity,
      urgencyScore: 0,
      freshness: 'stable' as ActionFreshness,
      relevanceScore: 0,
      isBurst: false,
      isDegraded: true,
      isDuplicate: true,
    };
    
    const minScore = computeTotalScore(minParams);
    const expectedMin = 20 + 10 + 0 + 0 + 0 + 0 + (-25) + (-30); // = -25
    
    expect(minScore).toBe(expectedMin);
  });

  // ========================================================================
  // Property 6.14: Maximum possible score
  // ========================================================================

  test('maximum score is achievable with best inputs', () => {
    const maxParams = {
      lane: 'Protect' as ActionLane,
      severity: 'critical' as ActionSeverity,
      urgencyScore: 100,
      freshness: 'new' as ActionFreshness,
      relevanceScore: 30,
      isBurst: true,
      isDegraded: false,
      isDuplicate: false,
    };
    
    const maxScore = computeTotalScore(maxParams);
    const expectedMax = 80 + 100 + 100 + 25 + 30 + 10 + 0 + 0; // = 345
    
    expect(maxScore).toBe(expectedMax);
  });

  // ========================================================================
  // Property 6.15: SCORING_WEIGHTS constants match expected values
  // ========================================================================

  test('SCORING_WEIGHTS constants match locked values', () => {
    // Lane weights
    expect(SCORING_WEIGHTS.lane.Protect).toBe(80);
    expect(SCORING_WEIGHTS.lane.Earn).toBe(50);
    expect(SCORING_WEIGHTS.lane.Watch).toBe(20);
    
    // Severity weights
    expect(SCORING_WEIGHTS.severity.critical).toBe(100);
    expect(SCORING_WEIGHTS.severity.high).toBe(70);
    expect(SCORING_WEIGHTS.severity.med).toBe(40);
    expect(SCORING_WEIGHTS.severity.low).toBe(10);
    
    // Freshness weights
    expect(SCORING_WEIGHTS.freshness.new).toBe(25);
    expect(SCORING_WEIGHTS.freshness.updated).toBe(15);
    expect(SCORING_WEIGHTS.freshness.expiring).toBe(20);
    expect(SCORING_WEIGHTS.freshness.stable).toBe(0);
    
    // Other weights
    expect(SCORING_WEIGHTS.burst).toBe(10);
    expect(SCORING_WEIGHTS.degraded_penalty).toBe(-25);
    expect(SCORING_WEIGHTS.duplicate_penalty).toBe(-30);
  });

  // ========================================================================
  // Property 6.16: Higher lane always beats lower lane (all else equal)
  // ========================================================================

  test('higher lane always beats lower lane when all else equal', () => {
    fc.assert(
      fc.property(
        severityArbitrary,
        urgencyScoreArbitrary,
        freshnessArbitrary,
        relevanceScoreArbitrary,
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (severity, urgencyScore, freshness, relevanceScore, isBurst, isDegraded, isDuplicate) => {
          const baseParams = {
            severity,
            urgencyScore,
            freshness,
            relevanceScore,
            isBurst,
            isDegraded,
            isDuplicate,
          };
          
          const protectScore = computeTotalScore({ ...baseParams, lane: 'Protect' });
          const earnScore = computeTotalScore({ ...baseParams, lane: 'Earn' });
          const watchScore = computeTotalScore({ ...baseParams, lane: 'Watch' });
          
          // Property: Protect > Earn > Watch always
          return protectScore > earnScore && earnScore > watchScore;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 6.17: Higher severity always beats lower severity (all else equal)
  // ========================================================================

  test('higher severity always beats lower severity when all else equal', () => {
    fc.assert(
      fc.property(
        laneArbitrary,
        urgencyScoreArbitrary,
        freshnessArbitrary,
        relevanceScoreArbitrary,
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (lane, urgencyScore, freshness, relevanceScore, isBurst, isDegraded, isDuplicate) => {
          const baseParams = {
            lane,
            urgencyScore,
            freshness,
            relevanceScore,
            isBurst,
            isDegraded,
            isDuplicate,
          };
          
          const criticalScore = computeTotalScore({ ...baseParams, severity: 'critical' });
          const highScore = computeTotalScore({ ...baseParams, severity: 'high' });
          const medScore = computeTotalScore({ ...baseParams, severity: 'med' });
          const lowScore = computeTotalScore({ ...baseParams, severity: 'low' });
          
          // Property: critical > high > med > low always
          return criticalScore > highScore && 
                 highScore > medScore && 
                 medScore > lowScore;
        }
      ),
      { numRuns: 100 }
    );
  });
});
