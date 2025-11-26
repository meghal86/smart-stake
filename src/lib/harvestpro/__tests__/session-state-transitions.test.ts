/**
 * Property-Based Test: Session State Transitions
 * Feature: harvestpro, Property 9: Session State Transitions
 * Validates: Requirements 8.1
 * 
 * Tests that harvest session state transitions follow valid paths:
 * - draft → executing → completed
 * - draft → cancelled
 * - executing → failed
 * - failed → executing (retry)
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { HarvestSessionStatus } from '@/types/harvestpro';

// Valid state transitions map
const VALID_TRANSITIONS: Record<HarvestSessionStatus, HarvestSessionStatus[]> = {
  draft: ['executing', 'cancelled'],
  executing: ['completed', 'failed'],
  completed: [], // Terminal state
  failed: ['executing', 'cancelled'], // Can retry or give up
  cancelled: [], // Terminal state
};

// Function to check if a transition is valid
export function isValidTransition(
  from: HarvestSessionStatus,
  to: HarvestSessionStatus
): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

// Function to apply a transition (throws if invalid)
export function applyTransition(
  currentStatus: HarvestSessionStatus,
  newStatus: HarvestSessionStatus
): HarvestSessionStatus {
  if (!isValidTransition(currentStatus, newStatus)) {
    throw new Error(
      `Invalid state transition: ${currentStatus} → ${newStatus}`
    );
  }
  return newStatus;
}

// Arbitrary for generating valid status values
const statusArbitrary = fc.constantFrom<HarvestSessionStatus>(
  'draft',
  'executing',
  'completed',
  'failed',
  'cancelled'
);

describe('Session State Transitions (Property 9)', () => {
  it('should only allow valid state transitions', () => {
    fc.assert(
      fc.property(statusArbitrary, statusArbitrary, (fromStatus, toStatus) => {
        const isValid = VALID_TRANSITIONS[fromStatus].includes(toStatus);
        
        if (isValid) {
          // Valid transition should succeed
          const result = applyTransition(fromStatus, toStatus);
          expect(result).toBe(toStatus);
        } else {
          // Invalid transition should throw
          expect(() => applyTransition(fromStatus, toStatus)).toThrow(
            /Invalid state transition/
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should allow draft → executing transition', () => {
    fc.assert(
      fc.property(fc.constant('draft' as HarvestSessionStatus), (status) => {
        const result = applyTransition(status, 'executing');
        expect(result).toBe('executing');
      }),
      { numRuns: 100 }
    );
  });

  it('should allow draft → cancelled transition', () => {
    fc.assert(
      fc.property(fc.constant('draft' as HarvestSessionStatus), (status) => {
        const result = applyTransition(status, 'cancelled');
        expect(result).toBe('cancelled');
      }),
      { numRuns: 100 }
    );
  });

  it('should allow executing → completed transition', () => {
    fc.assert(
      fc.property(fc.constant('executing' as HarvestSessionStatus), (status) => {
        const result = applyTransition(status, 'completed');
        expect(result).toBe('completed');
      }),
      { numRuns: 100 }
    );
  });

  it('should allow executing → failed transition', () => {
    fc.assert(
      fc.property(fc.constant('executing' as HarvestSessionStatus), (status) => {
        const result = applyTransition(status, 'failed');
        expect(result).toBe('failed');
      }),
      { numRuns: 100 }
    );
  });

  it('should allow failed → executing transition (retry)', () => {
    fc.assert(
      fc.property(fc.constant('failed' as HarvestSessionStatus), (status) => {
        const result = applyTransition(status, 'executing');
        expect(result).toBe('executing');
      }),
      { numRuns: 100 }
    );
  });

  it('should allow failed → cancelled transition', () => {
    fc.assert(
      fc.property(fc.constant('failed' as HarvestSessionStatus), (status) => {
        const result = applyTransition(status, 'cancelled');
        expect(result).toBe('cancelled');
      }),
      { numRuns: 100 }
    );
  });

  it('should reject transitions from terminal states (completed, cancelled)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<HarvestSessionStatus>('completed', 'cancelled'),
        statusArbitrary,
        (terminalStatus, targetStatus) => {
          // Terminal states should not allow any transitions
          expect(() => applyTransition(terminalStatus, targetStatus)).toThrow(
            /Invalid state transition/
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid transitions like draft → completed', () => {
    fc.assert(
      fc.property(fc.constant('draft' as HarvestSessionStatus), (status) => {
        expect(() => applyTransition(status, 'completed')).toThrow(
          /Invalid state transition/
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should reject invalid transitions like draft → failed', () => {
    fc.assert(
      fc.property(fc.constant('draft' as HarvestSessionStatus), (status) => {
        expect(() => applyTransition(status, 'failed')).toThrow(
          /Invalid state transition/
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should reject invalid transitions like executing → cancelled', () => {
    fc.assert(
      fc.property(fc.constant('executing' as HarvestSessionStatus), (status) => {
        expect(() => applyTransition(status, 'cancelled')).toThrow(
          /Invalid state transition/
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain state machine invariant: any sequence of valid transitions produces valid state', () => {
    fc.assert(
      fc.property(
        fc.array(statusArbitrary, { minLength: 1, maxLength: 10 }),
        (statusSequence) => {
          let currentStatus: HarvestSessionStatus = 'draft';
          
          for (const targetStatus of statusSequence) {
            if (isValidTransition(currentStatus, targetStatus)) {
              currentStatus = applyTransition(currentStatus, targetStatus);
              
              // After any valid transition, current status should be one of the valid states
              expect(['draft', 'executing', 'completed', 'failed', 'cancelled']).toContain(
                currentStatus
              );
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
