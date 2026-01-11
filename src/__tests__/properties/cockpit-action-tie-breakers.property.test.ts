/**
 * Action Ranking Tie-Breakers Property-Based Tests
 * 
 * Feature: authenticated-home-cockpit
 * Property 7: Action Ranking Tie-Breakers
 * 
 * Tests that for any set of actions with identical scores, ordering follows
 * tie-breakers in exact sequence.
 * 
 * Tie-breaker order (Locked):
 * 1. Higher severity wins
 * 2. expires_at rule: if both have expires_at, sooner wins; if only one has expires_at, it wins; if both null, skip
 * 3. Higher relevance wins
 * 4. Newer event_time wins
 * 
 * Validates: Requirements 6.9
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import { compareTieBreakers } from '@/lib/cockpit/scoring/ranking-service';
import {
  Action,
  ActionLane,
  ActionSeverity,
  ActionFreshness,
  ActionProvenance,
  CTAKind,
} from '@/lib/cockpit/types';

// ============================================================================
// Constants
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
 * Generator for ISO8601 timestamps (using integer to avoid invalid dates)
 */
const timestampArbitrary = fc.integer({
  min: new Date('2024-01-01').getTime(),
  max: new Date('2026-12-31').getTime(),
}).map(ms => new Date(ms).toISOString());

/**
 * Generator for optional expiration timestamps (using integer to avoid invalid dates)
 */
const NOW_MS = Date.now();
const expiresAtArbitrary = fc.option(
  fc.integer({
    min: NOW_MS,
    max: NOW_MS + 7 * 24 * 60 * 60 * 1000,
  }).map(ms => new Date(ms).toISOString()),
  { nil: null }
);

/**
 * Generator for relevance score (0-30)
 */
const relevanceScoreArbitrary = fc.integer({ min: 0, max: 30 });

/**
 * Generator for urgency score (0-100)
 */
const urgencyScoreArbitrary = fc.integer({ min: 0, max: 100 });

/**
 * Generator for a complete Action
 */
const actionArbitrary = fc.record({
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
  freshness: freshnessArbitrary,
  urgency_score: urgencyScoreArbitrary,
  relevance_score: relevanceScoreArbitrary,
  score: fc.integer({ min: -100, max: 500 }),
  source: fc.record({
    kind: fc.constantFrom('guardian', 'hunter', 'portfolio', 'action_center', 'proof'),
    ref_id: fc.uuid(),
  }),
}) as fc.Arbitrary<Action>;

/**
 * Generator for two actions with the same score (for tie-breaking tests)
 */
const tiedActionsArbitrary = fc.tuple(actionArbitrary, actionArbitrary).map(([a, b]) => {
  // Ensure same score
  return [a, { ...b, score: a.score }] as [Action, Action];
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates an action with specific properties for testing
 */
function createAction(overrides: Partial<Action>): Action {
  const baseAction: Action = {
    id: 'test-id',
    lane: 'Protect',
    title: 'Test Action',
    severity: 'med',
    provenance: 'confirmed',
    is_executable: true,
    cta: { kind: 'Fix', href: '/test' },
    impact_chips: [],
    event_time: '2026-01-09T12:00:00Z',
    expires_at: null,
    freshness: 'stable',
    urgency_score: 0,
    relevance_score: 15,
    score: 100,
    source: { kind: 'guardian', ref_id: 'ref-1' },
  };
  
  return { ...baseAction, ...overrides };
}

/**
 * Manually implements tie-breaker comparison for verification
 */
function manualCompareTieBreakers(a: Action, b: Action): number {
  // 1. Higher severity wins
  const severityDiff = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
  if (severityDiff !== 0) {
    return severityDiff;
  }
  
  // 2. expires_at rule
  const aHasExpiry = a.expires_at !== null;
  const bHasExpiry = b.expires_at !== null;
  
  if (aHasExpiry && bHasExpiry) {
    const aExpiry = new Date(a.expires_at!).getTime();
    const bExpiry = new Date(b.expires_at!).getTime();
    if (aExpiry !== bExpiry) {
      return aExpiry - bExpiry;
    }
  } else if (aHasExpiry && !bHasExpiry) {
    return -1;
  } else if (!aHasExpiry && bHasExpiry) {
    return 1;
  }
  
  // 3. Higher relevance wins
  const relevanceDiff = b.relevance_score - a.relevance_score;
  if (relevanceDiff !== 0) {
    return relevanceDiff;
  }
  
  // 4. Newer event_time wins
  const aEventTime = new Date(a.event_time).getTime();
  const bEventTime = new Date(b.event_time).getTime();
  return bEventTime - aEventTime;
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: authenticated-home-cockpit, Property 7: Action Ranking Tie-Breakers', () => {
  // ========================================================================
  // Property 7.1: Tie-breaker comparison is deterministic
  // ========================================================================

  test('tie-breaker comparison is deterministic', () => {
    fc.assert(
      fc.property(tiedActionsArbitrary, ([a, b]) => {
        const result1 = compareTieBreakers(a, b);
        const result2 = compareTieBreakers(a, b);
        
        // Property: Same inputs must produce same result
        return result1 === result2;
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 7.2: Tie-breaker matches manual implementation
  // ========================================================================

  test('tie-breaker matches manual implementation', () => {
    fc.assert(
      fc.property(tiedActionsArbitrary, ([a, b]) => {
        const actual = compareTieBreakers(a, b);
        const expected = manualCompareTieBreakers(a, b);
        
        // Property: Sign of result must match (negative, zero, or positive)
        return Math.sign(actual) === Math.sign(expected);
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 7.3: Higher severity wins (first tie-breaker)
  // ========================================================================

  test('higher severity wins when all else equal', () => {
    fc.assert(
      fc.property(
        actionArbitrary,
        fc.constantFrom<ActionSeverity>('critical', 'high', 'med', 'low'),
        fc.constantFrom<ActionSeverity>('critical', 'high', 'med', 'low'),
        (baseAction, severity1, severity2) => {
          if (severity1 === severity2) return true; // Skip equal severities
          
          const action1 = { ...baseAction, severity: severity1 };
          const action2 = { 
            ...baseAction, 
            severity: severity2,
            id: 'different-id',
          };
          
          const result = compareTieBreakers(action1, action2);
          const severity1Higher = SEVERITY_ORDER[severity1] > SEVERITY_ORDER[severity2];
          
          // Property: Higher severity should come first (negative result)
          return severity1Higher ? result < 0 : result > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 7.4: Sooner expires_at wins when both have expiration
  // ========================================================================

  test('sooner expires_at wins when both have expiration and same severity', () => {
    const now = Date.now();
    fc.assert(
      fc.property(
        actionArbitrary,
        fc.integer({ min: now, max: now + 3 * 24 * 60 * 60 * 1000 }),
        fc.integer({ min: now + 4 * 24 * 60 * 60 * 1000, max: now + 7 * 24 * 60 * 60 * 1000 }),
        (baseAction, soonerMs, laterMs) => {
          const action1 = { 
            ...baseAction, 
            expires_at: new Date(soonerMs).toISOString(),
          };
          const action2 = { 
            ...baseAction, 
            expires_at: new Date(laterMs).toISOString(),
            id: 'different-id',
          };
          
          const result = compareTieBreakers(action1, action2);
          
          // Property: Sooner expiration should come first (negative result)
          return result < 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 7.5: Action with expires_at wins over action without
  // ========================================================================

  test('action with expires_at wins over action without when same severity', () => {
    const now = Date.now();
    fc.assert(
      fc.property(
        actionArbitrary,
        fc.integer({ min: now, max: now + 7 * 24 * 60 * 60 * 1000 }),
        (baseAction, expiryMs) => {
          const actionWithExpiry = { 
            ...baseAction, 
            expires_at: new Date(expiryMs).toISOString(),
          };
          const actionWithoutExpiry = { 
            ...baseAction, 
            expires_at: null,
            id: 'different-id',
          };
          
          const result = compareTieBreakers(actionWithExpiry, actionWithoutExpiry);
          
          // Property: Action with expiry should come first (negative result)
          return result < 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 7.6: Higher relevance wins when severity and expires_at equal
  // ========================================================================

  test('higher relevance wins when severity and expires_at equal', () => {
    fc.assert(
      fc.property(
        actionArbitrary,
        fc.integer({ min: 0, max: 15 }),
        fc.integer({ min: 16, max: 30 }),
        (baseAction, lowerRelevance, higherRelevance) => {
          const action1 = { 
            ...baseAction, 
            relevance_score: higherRelevance,
            expires_at: null, // Same expiry
          };
          const action2 = { 
            ...baseAction, 
            relevance_score: lowerRelevance,
            expires_at: null, // Same expiry
            id: 'different-id',
          };
          
          const result = compareTieBreakers(action1, action2);
          
          // Property: Higher relevance should come first (negative result)
          return result < 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 7.7: Newer event_time wins when all else equal
  // ========================================================================

  test('newer event_time wins when all else equal', () => {
    const olderMin = new Date('2024-01-01').getTime();
    const olderMax = new Date('2025-06-01').getTime();
    const newerMin = new Date('2025-06-02').getTime();
    const newerMax = new Date('2026-12-31').getTime();
    
    fc.assert(
      fc.property(
        actionArbitrary,
        fc.integer({ min: olderMin, max: olderMax }),
        fc.integer({ min: newerMin, max: newerMax }),
        (baseAction, olderMs, newerMs) => {
          const action1 = { 
            ...baseAction, 
            event_time: new Date(newerMs).toISOString(),
            expires_at: null,
          };
          const action2 = { 
            ...baseAction, 
            event_time: new Date(olderMs).toISOString(),
            expires_at: null,
            id: 'different-id',
          };
          
          const result = compareTieBreakers(action1, action2);
          
          // Property: Newer event_time should come first (negative result)
          return result < 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 7.8: Antisymmetry - compare(a,b) = -compare(b,a)
  // ========================================================================

  test('comparison is antisymmetric', () => {
    fc.assert(
      fc.property(tiedActionsArbitrary, ([a, b]) => {
        const resultAB = compareTieBreakers(a, b);
        const resultBA = compareTieBreakers(b, a);
        
        // Property: compare(a,b) should be opposite sign of compare(b,a)
        // (or both zero if equal)
        return Math.sign(resultAB) === -Math.sign(resultBA);
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 7.9: Reflexivity - compare(a,a) = 0
  // ========================================================================

  test('comparison is reflexive (same action equals zero)', () => {
    fc.assert(
      fc.property(actionArbitrary, (action) => {
        const result = compareTieBreakers(action, action);
        
        // Property: Comparing action to itself should return 0
        return result === 0;
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 7.10: Tie-breaker order is respected
  // ========================================================================

  test('tie-breaker order is respected - severity before expires_at', () => {
    // Create actions where severity differs but expires_at would favor the other
    const criticalAction = createAction({
      id: 'critical',
      severity: 'critical',
      expires_at: '2026-12-31T23:59:59Z', // Later expiry
    });
    
    const lowAction = createAction({
      id: 'low',
      severity: 'low',
      expires_at: '2026-01-01T00:00:00Z', // Sooner expiry
    });
    
    const result = compareTieBreakers(criticalAction, lowAction);
    
    // Property: Critical severity should win despite later expiry
    expect(result).toBeLessThan(0);
  });

  // ========================================================================
  // Property 7.11: Tie-breaker order - expires_at before relevance
  // ========================================================================

  test('tie-breaker order is respected - expires_at before relevance', () => {
    // Create actions where expires_at differs but relevance would favor the other
    const expiringAction = createAction({
      id: 'expiring',
      severity: 'med',
      expires_at: '2026-01-10T00:00:00Z',
      relevance_score: 5, // Lower relevance
    });
    
    const noExpiryAction = createAction({
      id: 'no-expiry',
      severity: 'med',
      expires_at: null,
      relevance_score: 30, // Higher relevance
    });
    
    const result = compareTieBreakers(expiringAction, noExpiryAction);
    
    // Property: Action with expiry should win despite lower relevance
    expect(result).toBeLessThan(0);
  });

  // ========================================================================
  // Property 7.12: Tie-breaker order - relevance before event_time
  // ========================================================================

  test('tie-breaker order is respected - relevance before event_time', () => {
    // Create actions where relevance differs but event_time would favor the other
    const highRelevanceAction = createAction({
      id: 'high-relevance',
      severity: 'med',
      expires_at: null,
      relevance_score: 30,
      event_time: '2024-01-01T00:00:00Z', // Older
    });
    
    const lowRelevanceAction = createAction({
      id: 'low-relevance',
      severity: 'med',
      expires_at: null,
      relevance_score: 5,
      event_time: '2026-12-31T23:59:59Z', // Newer
    });
    
    const result = compareTieBreakers(highRelevanceAction, lowRelevanceAction);
    
    // Property: Higher relevance should win despite older event_time
    expect(result).toBeLessThan(0);
  });

  // ========================================================================
  // Property 7.13: Both null expires_at skips to next tie-breaker
  // ========================================================================

  test('both null expires_at skips to relevance tie-breaker', () => {
    fc.assert(
      fc.property(
        actionArbitrary,
        fc.integer({ min: 0, max: 14 }),
        fc.integer({ min: 15, max: 30 }),
        (baseAction, lowerRelevance, higherRelevance) => {
          const action1 = { 
            ...baseAction, 
            expires_at: null,
            relevance_score: higherRelevance,
          };
          const action2 = { 
            ...baseAction, 
            expires_at: null,
            relevance_score: lowerRelevance,
            id: 'different-id',
          };
          
          const result = compareTieBreakers(action1, action2);
          
          // Property: When both have null expires_at, higher relevance wins
          return result < 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 7.14: Same expires_at skips to relevance tie-breaker
  // ========================================================================

  test('same expires_at skips to relevance tie-breaker', () => {
    const now = Date.now();
    fc.assert(
      fc.property(
        actionArbitrary,
        fc.integer({ min: now, max: now + 7 * 24 * 60 * 60 * 1000 }),
        fc.integer({ min: 0, max: 14 }),
        fc.integer({ min: 15, max: 30 }),
        (baseAction, expiryMs, lowerRelevance, higherRelevance) => {
          const expiryStr = new Date(expiryMs).toISOString();
          
          const action1 = { 
            ...baseAction, 
            expires_at: expiryStr,
            relevance_score: higherRelevance,
          };
          const action2 = { 
            ...baseAction, 
            expires_at: expiryStr,
            relevance_score: lowerRelevance,
            id: 'different-id',
          };
          
          const result = compareTieBreakers(action1, action2);
          
          // Property: When expires_at is same, higher relevance wins
          return result < 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 7.15: All tie-breakers equal results in event_time comparison
  // ========================================================================

  test('all tie-breakers equal results in event_time comparison', () => {
    const olderMin = new Date('2024-01-01').getTime();
    const olderMax = new Date('2025-06-01').getTime();
    const newerMin = new Date('2025-06-02').getTime();
    const newerMax = new Date('2026-12-31').getTime();
    
    fc.assert(
      fc.property(
        actionArbitrary,
        fc.integer({ min: olderMin, max: olderMax }),
        fc.integer({ min: newerMin, max: newerMax }),
        (baseAction, olderMs, newerMs) => {
          const action1 = { 
            ...baseAction, 
            event_time: new Date(newerMs).toISOString(),
          };
          const action2 = { 
            ...baseAction, 
            event_time: new Date(olderMs).toISOString(),
            id: 'different-id',
          };
          
          const result = compareTieBreakers(action1, action2);
          
          // Property: When all else equal, newer event_time wins
          return result < 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 7.16: Completely identical actions return 0
  // ========================================================================

  test('completely identical actions return 0', () => {
    fc.assert(
      fc.property(actionArbitrary, (action) => {
        // Create a copy with same values
        const actionCopy = { ...action };
        
        const result = compareTieBreakers(action, actionCopy);
        
        // Property: Identical actions should return 0
        return result === 0;
      }),
      { numRuns: 100 }
    );
  });
});
