/**
 * Today Card Priority Determinism Property-Based Tests
 * 
 * Feature: authenticated-home-cockpit
 * Property 4: Today Card Priority Determinism
 * 
 * Tests that for any set of input conditions, Today Card state is determined
 * by evaluating conditions in exact order and selecting first true.
 * 
 * Priority order (Locked):
 * 1. onboarding
 * 2. scan_required
 * 3. critical_risk
 * 4. pending_actions
 * 5. daily_pulse
 * 6. portfolio_anchor (fallback)
 * 
 * Validates: Requirements 3.3, 3.4
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import {
  determineTodayCardKind,
  TodayCardInputs,
  getTodayCardPriority,
  noHigherPriorityCondition,
  validateTodayCardKind,
} from '@/lib/cockpit/today-card';
import { TodayCardKind } from '@/lib/cockpit/types';

// ============================================================================
// Constants
// ============================================================================

/**
 * All possible Today Card kinds in priority order
 */
const TODAY_CARD_KINDS: TodayCardKind[] = [
  'onboarding',
  'scan_required',
  'critical_risk',
  'pending_actions',
  'daily_pulse',
  'portfolio_anchor',
];

/**
 * Priority mapping for verification
 */
const PRIORITY_MAP: Record<TodayCardKind, number> = {
  onboarding: 0,
  scan_required: 1,
  critical_risk: 2,
  pending_actions: 3,
  daily_pulse: 4,
  portfolio_anchor: 5,
};

// ============================================================================
// Generators
// ============================================================================

/**
 * Generator for scan state
 */
const scanStateArbitrary = fc.constantFrom<'fresh' | 'stale' | 'missing'>('fresh', 'stale', 'missing');

/**
 * Generator for TodayCardInputs
 */
const todayCardInputsArbitrary = fc.record({
  onboarding_needed: fc.boolean(),
  scan_state: scanStateArbitrary,
  critical_risk_count: fc.nat({ max: 100 }),
  pending_actions_count: fc.nat({ max: 100 }),
  daily_pulse_available: fc.boolean(),
  degraded_mode: fc.boolean(),
});

/**
 * Generator for inputs where onboarding is needed
 */
const onboardingInputsArbitrary = todayCardInputsArbitrary.map(inputs => ({
  ...inputs,
  onboarding_needed: true,
}));

/**
 * Generator for inputs where scan is required (not onboarding)
 */
const scanRequiredInputsArbitrary = todayCardInputsArbitrary.map(inputs => ({
  ...inputs,
  onboarding_needed: false,
  scan_state: fc.sample(fc.constantFrom<'stale' | 'missing'>('stale', 'missing'), 1)[0],
}));

/**
 * Generator for inputs where critical risk exists (no higher priority)
 */
const criticalRiskInputsArbitrary = todayCardInputsArbitrary.map(inputs => ({
  ...inputs,
  onboarding_needed: false,
  scan_state: 'fresh' as const,
  critical_risk_count: Math.max(1, inputs.critical_risk_count),
}));

/**
 * Generator for inputs where pending actions exist (no higher priority)
 */
const pendingActionsInputsArbitrary = todayCardInputsArbitrary.map(inputs => ({
  ...inputs,
  onboarding_needed: false,
  scan_state: 'fresh' as const,
  critical_risk_count: 0,
  pending_actions_count: Math.max(1, inputs.pending_actions_count),
}));

/**
 * Generator for inputs where daily pulse is available (no higher priority)
 */
const dailyPulseInputsArbitrary = todayCardInputsArbitrary.map(inputs => ({
  ...inputs,
  onboarding_needed: false,
  scan_state: 'fresh' as const,
  critical_risk_count: 0,
  pending_actions_count: 0,
  daily_pulse_available: true,
}));

/**
 * Generator for inputs where portfolio anchor is the fallback
 */
const portfolioAnchorInputsArbitrary = fc.record({
  onboarding_needed: fc.constant(false),
  scan_state: fc.constant<'fresh'>('fresh'),
  critical_risk_count: fc.constant(0),
  pending_actions_count: fc.constant(0),
  daily_pulse_available: fc.constant(false),
  degraded_mode: fc.boolean(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Checks if a condition at a given priority level is true
 */
function isConditionTrue(inputs: TodayCardInputs, priority: number): boolean {
  switch (priority) {
    case 0: return inputs.onboarding_needed;
    case 1: return inputs.scan_state === 'missing' || inputs.scan_state === 'stale';
    case 2: return inputs.critical_risk_count > 0;
    case 3: return inputs.pending_actions_count > 0;
    case 4: return inputs.daily_pulse_available;
    case 5: return true; // portfolio_anchor is always available as fallback
    default: return false;
  }
}

/**
 * Gets the expected kind based on priority evaluation
 */
function getExpectedKind(inputs: TodayCardInputs): TodayCardKind {
  for (let i = 0; i < TODAY_CARD_KINDS.length; i++) {
    if (isConditionTrue(inputs, i)) {
      return TODAY_CARD_KINDS[i];
    }
  }
  return 'portfolio_anchor';
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: authenticated-home-cockpit, Property 4: Today Card Priority Determinism', () => {
  // ========================================================================
  // Property 4.1: Determinism - same inputs always produce same output
  // ========================================================================

  test('same inputs always produce same output', () => {
    fc.assert(
      fc.property(todayCardInputsArbitrary, (inputs) => {
        const result1 = determineTodayCardKind(inputs);
        const result2 = determineTodayCardKind(inputs);
        
        // Property: Results must be identical
        return result1 === result2;
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 4.2: Priority order is respected
  // ========================================================================

  test('priority order is respected - first true condition wins', () => {
    fc.assert(
      fc.property(todayCardInputsArbitrary, (inputs) => {
        const result = determineTodayCardKind(inputs);
        const resultPriority = PRIORITY_MAP[result];
        
        // Property: No higher priority condition should be true
        for (let i = 0; i < resultPriority; i++) {
          if (isConditionTrue(inputs, i)) {
            return false; // A higher priority condition was true but not selected
          }
        }
        
        // Property: The selected condition must be true (or be the fallback)
        return isConditionTrue(inputs, resultPriority);
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 4.3: Onboarding has highest priority
  // ========================================================================

  test('onboarding always wins when onboarding_needed is true', () => {
    fc.assert(
      fc.property(onboardingInputsArbitrary, (inputs) => {
        const result = determineTodayCardKind(inputs);
        
        // Property: When onboarding_needed is true, result must be 'onboarding'
        return result === 'onboarding';
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 4.4: Scan required has second priority
  // ========================================================================

  test('scan_required wins when scan is stale/missing and no onboarding', () => {
    fc.assert(
      fc.property(
        todayCardInputsArbitrary.filter(
          inputs => !inputs.onboarding_needed && 
                   (inputs.scan_state === 'stale' || inputs.scan_state === 'missing')
        ),
        (inputs) => {
          const result = determineTodayCardKind(inputs);
          
          // Property: When scan is stale/missing and no onboarding, result must be 'scan_required'
          return result === 'scan_required';
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 4.5: Critical risk has third priority
  // ========================================================================

  test('critical_risk wins when critical_risk_count > 0 and no higher priority', () => {
    fc.assert(
      fc.property(criticalRiskInputsArbitrary, (inputs) => {
        const result = determineTodayCardKind(inputs);
        
        // Property: When critical_risk_count > 0 and no higher priority, result must be 'critical_risk'
        return result === 'critical_risk';
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 4.6: Pending actions has fourth priority
  // ========================================================================

  test('pending_actions wins when pending_actions_count > 0 and no higher priority', () => {
    fc.assert(
      fc.property(pendingActionsInputsArbitrary, (inputs) => {
        const result = determineTodayCardKind(inputs);
        
        // Property: When pending_actions_count > 0 and no higher priority, result must be 'pending_actions'
        return result === 'pending_actions';
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 4.7: Daily pulse has fifth priority
  // ========================================================================

  test('daily_pulse wins when daily_pulse_available and no higher priority', () => {
    fc.assert(
      fc.property(dailyPulseInputsArbitrary, (inputs) => {
        const result = determineTodayCardKind(inputs);
        
        // Property: When daily_pulse_available and no higher priority, result must be 'daily_pulse'
        return result === 'daily_pulse';
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 4.8: Portfolio anchor is the fallback
  // ========================================================================

  test('portfolio_anchor is selected when no other conditions are true', () => {
    fc.assert(
      fc.property(portfolioAnchorInputsArbitrary, (inputs) => {
        const result = determineTodayCardKind(inputs);
        
        // Property: When no conditions are true, result must be 'portfolio_anchor'
        return result === 'portfolio_anchor';
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 4.9: Result matches expected kind from priority evaluation
  // ========================================================================

  test('result matches expected kind from priority evaluation', () => {
    fc.assert(
      fc.property(todayCardInputsArbitrary, (inputs) => {
        const result = determineTodayCardKind(inputs);
        const expected = getExpectedKind(inputs);
        
        // Property: Result must match expected kind
        return result === expected;
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 4.10: validateTodayCardKind returns true for correct kind
  // ========================================================================

  test('validateTodayCardKind returns true for correct kind', () => {
    fc.assert(
      fc.property(todayCardInputsArbitrary, (inputs) => {
        const result = determineTodayCardKind(inputs);
        
        // Property: validateTodayCardKind should return true for the determined kind
        return validateTodayCardKind(inputs, result) === true;
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 4.11: validateTodayCardKind returns false for wrong kind
  // ========================================================================

  test('validateTodayCardKind returns false for wrong kind', () => {
    fc.assert(
      fc.property(
        todayCardInputsArbitrary,
        fc.constantFrom(...TODAY_CARD_KINDS),
        (inputs, randomKind) => {
          const correctKind = determineTodayCardKind(inputs);
          
          // If randomKind is the correct kind, validation should pass
          // If randomKind is wrong, validation should fail
          const isCorrect = randomKind === correctKind;
          const validationResult = validateTodayCardKind(inputs, randomKind);
          
          return validationResult === isCorrect;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 4.12: noHigherPriorityCondition is consistent
  // ========================================================================

  test('noHigherPriorityCondition returns true for determined kind', () => {
    fc.assert(
      fc.property(todayCardInputsArbitrary, (inputs) => {
        const result = determineTodayCardKind(inputs);
        
        // Property: noHigherPriorityCondition should return true for the determined kind
        return noHigherPriorityCondition(inputs, result) === true;
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 4.13: getTodayCardPriority returns correct priority
  // ========================================================================

  test('getTodayCardPriority returns correct priority for all kinds', () => {
    fc.assert(
      fc.property(fc.constantFrom(...TODAY_CARD_KINDS), (kind) => {
        const priority = getTodayCardPriority(kind);
        const expectedPriority = PRIORITY_MAP[kind];
        
        // Property: Priority should match expected
        return priority === expectedPriority;
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 4.14: degraded_mode does not affect priority selection
  // ========================================================================

  test('degraded_mode does not affect priority selection', () => {
    fc.assert(
      fc.property(todayCardInputsArbitrary, (inputs) => {
        const inputsWithDegraded = { ...inputs, degraded_mode: true };
        const inputsWithoutDegraded = { ...inputs, degraded_mode: false };
        
        const resultWithDegraded = determineTodayCardKind(inputsWithDegraded);
        const resultWithoutDegraded = determineTodayCardKind(inputsWithoutDegraded);
        
        // Property: degraded_mode should not affect the kind selection
        return resultWithDegraded === resultWithoutDegraded;
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 4.15: Result is always a valid TodayCardKind
  // ========================================================================

  test('result is always a valid TodayCardKind', () => {
    fc.assert(
      fc.property(todayCardInputsArbitrary, (inputs) => {
        const result = determineTodayCardKind(inputs);
        
        // Property: Result must be one of the valid kinds
        return TODAY_CARD_KINDS.includes(result);
      }),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 4.16: Boundary conditions - zero counts
  // ========================================================================

  test('zero counts do not trigger their respective states', () => {
    fc.assert(
      fc.property(
        fc.record({
          onboarding_needed: fc.constant(false),
          scan_state: fc.constant<'fresh'>('fresh'),
          critical_risk_count: fc.constant(0),
          pending_actions_count: fc.constant(0),
          daily_pulse_available: fc.boolean(),
          degraded_mode: fc.boolean(),
        }),
        (inputs) => {
          const result = determineTodayCardKind(inputs);
          
          // Property: With zero counts and fresh scan, result should be daily_pulse or portfolio_anchor
          return result === 'daily_pulse' || result === 'portfolio_anchor';
        }
      ),
      { numRuns: 100 }
    );
  });

  // ========================================================================
  // Property 4.17: Scan state 'fresh' does not trigger scan_required
  // ========================================================================

  test('scan_state fresh does not trigger scan_required', () => {
    fc.assert(
      fc.property(
        todayCardInputsArbitrary.map(inputs => ({
          ...inputs,
          onboarding_needed: false,
          scan_state: 'fresh' as const,
        })),
        (inputs) => {
          const result = determineTodayCardKind(inputs);
          
          // Property: With fresh scan and no onboarding, result should not be scan_required
          return result !== 'scan_required';
        }
      ),
      { numRuns: 100 }
    );
  });
});
