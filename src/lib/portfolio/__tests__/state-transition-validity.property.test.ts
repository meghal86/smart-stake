/**
 * Property-Based Test: State Transition Validity
 * Feature: unified-portfolio, Property 17: State Transition Validity
 * Validates: Requirements 7.1
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import {
  isValidStateTransition,
  updateExecutionStep,
  trackStepProgression,
  getNextExecutableStep,
  areAllStepsComplete,
  addTransactionTracking,
  markStepFailed,
  markStepReady,
  markStepBlocked,
} from '../execution-state-manager';
import type { ExecutionStep } from '@/types/portfolio';

// Generator for execution step status
const executionStepStatusGen = fc.constantFrom(
  'pending',
  'simulated', 
  'blocked',
  'ready',
  'signing',
  'submitted',
  'confirmed',
  'failed'
) as fc.Arbitrary<ExecutionStep['status']>;

// Generator for execution step
const executionStepGen = fc.record({
  stepId: fc.string({ minLength: 1 }),
  kind: fc.constantFrom('revoke', 'approve', 'swap', 'transfer'),
  chainId: fc.integer({ min: 1, max: 100000 }),
  target_address: fc.constant('0x1234567890123456789012345678901234567890'),
  status: executionStepStatusGen,
  payload: fc.option(fc.string()),
  gas_estimate: fc.option(fc.integer({ min: 21000, max: 1000000 })),
  error_message: fc.option(fc.string()),
  transaction_hash: fc.option(fc.constant('0x1234567890123456789012345678901234567890123456789012345678901234')),
  block_number: fc.option(fc.integer({ min: 1, max: 20000000 })),
  step_idempotency_key: fc.option(fc.string()),
}) as fc.Arbitrary<ExecutionStep>;

describe('Feature: unified-portfolio, Property 17: State Transition Validity', () => {
  // Property 17.1: Valid transitions are always allowed
  test('valid state transitions are always allowed', () => {
    fc.assert(
      fc.property(
        executionStepStatusGen,
        executionStepStatusGen,
        (currentStatus, newStatus) => {
          const isValid = isValidStateTransition(currentStatus, newStatus);
          
          // Define expected valid transitions
          const validTransitions: Record<ExecutionStep['status'], ExecutionStep['status'][]> = {
            'pending': ['simulated', 'blocked', 'failed'],
            'simulated': ['blocked', 'ready', 'failed'],
            'blocked': ['pending', 'failed'],
            'ready': ['signing', 'failed'],
            'signing': ['submitted', 'failed'],
            'submitted': ['confirmed', 'failed'],
            'confirmed': [],
            'failed': ['pending'],
          };
          
          const expectedValid = validTransitions[currentStatus].includes(newStatus);
          
          // Property: isValidStateTransition should match expected transitions
          expect(isValid).toBe(expectedValid);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 17.2: Invalid transitions are always rejected
  test('invalid state transitions are always rejected', () => {
    fc.assert(
      fc.property(
        executionStepGen,
        executionStepStatusGen,
        (step, newStatus) => {
          const result = updateExecutionStep(step, { status: newStatus });
          
          const isValidTransition = isValidStateTransition(step.status, newStatus);
          
          if (!isValidTransition && newStatus !== step.status) {
            // Property: Invalid transitions should fail
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid state transition');
          } else {
            // Property: Valid transitions or no-change should succeed (unless other validation fails)
            if (result.success === false && result.error?.includes('Invalid state transition')) {
              // This should not happen for valid transitions
              expect(isValidTransition).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 17.3: Terminal states cannot transition (except failed -> pending)
  test('terminal states have restricted transitions', () => {
    fc.assert(
      fc.property(
        executionStepStatusGen,
        (newStatus) => {
          // Confirmed is terminal (no transitions allowed)
          const fromConfirmed = isValidStateTransition('confirmed', newStatus);
          expect(fromConfirmed).toBe(false);
          
          // Failed can only transition to pending (retry)
          const fromFailed = isValidStateTransition('failed', newStatus);
          if (newStatus === 'pending') {
            expect(fromFailed).toBe(true);
          } else {
            expect(fromFailed).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 17.4: State progression tracking is consistent
  test('state progression tracking is consistent with step states', () => {
    fc.assert(
      fc.property(
        fc.array(executionStepGen, { minLength: 1, maxLength: 10 }),
        (steps) => {
          const progression = trackStepProgression(steps);
          
          // Property: Sum of all state counts equals total steps
          const sumOfStates = progression.pendingSteps + 
                             progression.simulatedSteps +
                             progression.readySteps + 
                             progression.executingSteps + 
                             progression.completedSteps + 
                             progression.failedSteps + 
                             progression.blockedSteps;
          
          expect(sumOfStates).toBe(progression.totalSteps);
          expect(progression.totalSteps).toBe(steps.length);
          
          // Property: Individual counts match actual step states
          expect(progression.pendingSteps).toBe(steps.filter(s => s.status === 'pending').length);
          expect(progression.simulatedSteps).toBe(steps.filter(s => s.status === 'simulated').length);
          expect(progression.readySteps).toBe(steps.filter(s => s.status === 'ready').length);
          expect(progression.executingSteps).toBe(steps.filter(s => ['signing', 'submitted'].includes(s.status)).length);
          expect(progression.completedSteps).toBe(steps.filter(s => s.status === 'confirmed').length);
          expect(progression.failedSteps).toBe(steps.filter(s => s.status === 'failed').length);
          expect(progression.blockedSteps).toBe(steps.filter(s => s.status === 'blocked').length);
          
          // Property: canProceed logic is correct
          const hasReadySteps = progression.readySteps > 0;
          const hasExecutingSteps = progression.executingSteps > 0;
          const expectedCanProceed = hasReadySteps && !hasExecutingSteps;
          expect(progression.canProceed).toBe(expectedCanProceed);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 17.5: Next executable step selection is correct
  test('next executable step selection follows ready state priority', () => {
    fc.assert(
      fc.property(
        fc.array(executionStepGen, { minLength: 1, maxLength: 10 }),
        (steps) => {
          const nextStep = getNextExecutableStep(steps);
          const readySteps = steps.filter(s => s.status === 'ready');
          
          if (readySteps.length === 0) {
            // Property: No ready steps means no executable step
            expect(nextStep).toBeNull();
          } else {
            // Property: Next step should be the first ready step
            expect(nextStep).not.toBeNull();
            expect(nextStep!.status).toBe('ready');
            expect(readySteps).toContain(nextStep);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 17.6: Completion detection is accurate
  test('completion detection matches terminal state criteria', () => {
    fc.assert(
      fc.property(
        fc.array(executionStepGen, { minLength: 1, maxLength: 10 }),
        (steps) => {
          const allComplete = areAllStepsComplete(steps);
          const terminalStates = ['confirmed', 'failed'];
          const expectedComplete = steps.every(s => terminalStates.includes(s.status));
          
          // Property: Completion detection should match terminal state check
          expect(allComplete).toBe(expectedComplete);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 17.7: Transaction tracking updates maintain state consistency
  test('transaction tracking updates maintain state consistency', () => {
    fc.assert(
      fc.property(
        executionStepGen,
        fc.constant('0x1234567890123456789012345678901234567890123456789012345678901234'),
        fc.option(fc.integer({ min: 1, max: 20000000 })),
        (step, txHash, blockNumber) => {
          const result = addTransactionTracking(step, txHash, blockNumber);
          
          if (result.success && result.newStep) {
            // Property: Transaction hash should always be set
            expect(result.newStep.transaction_hash).toBe(txHash);
            
            if (blockNumber) {
              // Property: With block number, status should be confirmed
              expect(result.newStep.status).toBe('confirmed');
              expect(result.newStep.block_number).toBe(blockNumber);
            } else {
              // Property: Without block number, status should be submitted
              expect(result.newStep.status).toBe('submitted');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 17.8: Failed step marking preserves error information
  test('failed step marking preserves error information', () => {
    fc.assert(
      fc.property(
        executionStepGen,
        fc.string({ minLength: 1 }),
        (step, errorMessage) => {
          const result = markStepFailed(step, errorMessage);
          
          if (result.success && result.newStep) {
            // Property: Failed steps should have error message and failed status
            expect(result.newStep.status).toBe('failed');
            expect(result.newStep.error_message).toBe(errorMessage);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 17.9: Ready step marking includes execution data
  test('ready step marking includes execution data', () => {
    fc.assert(
      fc.property(
        executionStepGen,
        fc.option(fc.string()),
        fc.option(fc.integer({ min: 21000, max: 1000000 })),
        (step, payload, gasEstimate) => {
          const result = markStepReady(step, payload, gasEstimate);
          
          if (result.success && result.newStep) {
            // Property: Ready steps should have ready status
            expect(result.newStep.status).toBe('ready');
            
            if (payload) {
              expect(result.newStep.payload).toBe(payload);
            }
            
            if (gasEstimate) {
              expect(result.newStep.gas_estimate).toBe(gasEstimate);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 17.10: Blocked step marking includes reason
  test('blocked step marking includes reason', () => {
    fc.assert(
      fc.property(
        executionStepGen,
        fc.string({ minLength: 1 }),
        (step, reason) => {
          const result = markStepBlocked(step, reason);
          
          if (result.success && result.newStep) {
            // Property: Blocked steps should have blocked status and error message
            expect(result.newStep.status).toBe('blocked');
            expect(result.newStep.error_message).toBe(reason);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});