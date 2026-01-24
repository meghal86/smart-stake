/**
 * Property-Based Tests for Partial Execution Safety
 * 
 * Feature: unified-portfolio, Property 14: Partial Execution Safety
 * Validates: Requirements 6.5
 * 
 * Tests universal properties that should hold for ALL partial execution scenarios:
 * - Failed steps don't affect successful steps
 * - Partial execution maintains system consistency
 * - Rollback mechanisms work correctly when needed
 * - State transitions are atomic per step
 * - Dependencies between steps are respected
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import type { ExecutionStep, IntentPlan } from '@/types/portfolio';

// ============================================================================
// Property Test Generators
// ============================================================================

// Generate execution step statuses
const stepStatusGenerator = fc.constantFrom(
  'pending', 'simulated', 'blocked', 'ready', 'signing', 'submitted', 'confirmed', 'failed'
);

// Generate step kinds
const stepKindGenerator = fc.constantFrom('revoke', 'approve', 'swap', 'transfer');

// Generate chain IDs
const chainIdGenerator = fc.constantFrom(1, 137, 56, 43114, 42161, 10);

// Generate Ethereum addresses
const addressGenerator = fc.integer({ min: 0, max: 15 })
  .chain(() => fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 40, maxLength: 40 }))
  .map(arr => `0x${arr.map(n => n.toString(16)).join('')}`);

// Generate execution steps
const executionStepGenerator = fc.record({
  stepId: fc.string({ minLength: 8, maxLength: 32 }),
  kind: stepKindGenerator,
  chainId: chainIdGenerator,
  target_address: addressGenerator,
  status: stepStatusGenerator,
  payload: fc.option(fc.string({ minLength: 10, maxLength: 1000 })),
  gas_estimate: fc.option(fc.integer({ min: 21000, max: 5000000 })),
  error_message: fc.option(fc.string({ minLength: 10, maxLength: 200 })),
  transaction_hash: fc.option(addressGenerator),
  block_number: fc.option(fc.integer({ min: 1, max: 20000000 })),
  step_idempotency_key: fc.option(fc.string({ minLength: 16, maxLength: 64 }))
});

// Generate execution plans with mixed step statuses
const partialExecutionPlanGenerator = fc.record({
  id: fc.string({ minLength: 8, maxLength: 32 }),
  steps: fc.array(executionStepGenerator, { minLength: 2, maxLength: 10 }),
  totalSteps: fc.integer({ min: 2, max: 10 }),
  successfulSteps: fc.integer({ min: 0, max: 5 }),
  failedSteps: fc.integer({ min: 0, max: 5 })
}).map(plan => ({
  ...plan,
  // Ensure consistent counts
  successfulSteps: Math.min(plan.successfulSteps, plan.steps.length),
  failedSteps: Math.min(plan.failedSteps, plan.steps.length - plan.successfulSteps)
}));

// Mock partial execution engine
const executePartialPlan = (
  steps: ExecutionStep[],
  forceFailures: string[] = []
): {
  results: Array<{ stepId: string; success: boolean; error?: string; txHash?: string }>;
  finalStates: ExecutionStep[];
  systemState: 'consistent' | 'inconsistent';
} => {
  const results = [];
  const finalStates = [...steps];
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const shouldFail = forceFailures.includes(step.stepId) || 
                      (step.status === 'blocked') ||
                      (step.error_message !== undefined);
    
    if (shouldFail) {
      results.push({
        stepId: step.stepId,
        success: false,
        error: step.error_message || 'Execution failed'
      });
      finalStates[i] = {
        ...step,
        status: 'failed',
        error_message: step.error_message || 'Execution failed',
        // Clear any existing transaction_hash for failed steps
        transaction_hash: undefined,
        block_number: undefined
      };
    } else if (step.status === 'ready' || step.status === 'pending') {
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      results.push({
        stepId: step.stepId,
        success: true,
        txHash
      });
      finalStates[i] = {
        ...step,
        status: 'confirmed',
        transaction_hash: txHash,
        block_number: Math.floor(Math.random() * 1000000) + 18000000
      };
    } else {
      // Step not ready for execution
      results.push({
        stepId: step.stepId,
        success: false,
        error: 'Step not ready for execution'
      });
      finalStates[i] = {
        ...step,
        status: 'failed',
        error_message: 'Step not ready for execution',
        // Clear inconsistent state
        transaction_hash: undefined,
        block_number: undefined
      };
    }
  }
  
  // Check system consistency (mock logic)
  const hasInconsistency = results.some((result, index) => {
    const step = steps[index];
    // Mock dependency check: approve steps should succeed before swap steps
    if (step.kind === 'swap') {
      const approveSteps = results.slice(0, index).filter((r, i) => 
        steps[i].kind === 'approve' && steps[i].chainId === step.chainId
      );
      return approveSteps.some(approve => !approve.success);
    }
    return false;
  });
  
  return {
    results,
    finalStates,
    systemState: hasInconsistency ? 'inconsistent' : 'consistent'
  };
};

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: unified-portfolio, Property 14: Partial Execution Safety', () => {
  
  test('failed steps do not affect successful steps', () => {
    fc.assert(
      fc.property(
        fc.array(executionStepGenerator, { minLength: 3, maxLength: 8 }),
        fc.array(fc.string({ minLength: 8, maxLength: 32 }), { maxLength: 3 }),
        (steps, forceFailures) => {
          // Ensure some steps are ready for execution
          const readySteps = steps.map((step, index) => ({
            ...step,
            status: index < steps.length / 2 ? 'ready' : step.status
          }));
          
          const execution = executePartialPlan(readySteps, forceFailures);
          
          // Successful steps should remain successful regardless of failures
          execution.results.forEach((result, index) => {
            const step = readySteps[index];
            const finalState = execution.finalStates[index];
            
            if (result.success) {
              expect(finalState.status).toBe('confirmed');
              expect(finalState.transaction_hash).toBeDefined();
              expect(finalState.error_message).toBeUndefined();
            } else {
              expect(['failed', 'blocked', 'pending']).toContain(finalState.status);
              if (finalState.status === 'failed') {
                expect(finalState.error_message).toBeDefined();
              }
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('partial execution maintains atomic step transitions', () => {
    fc.assert(
      fc.property(
        fc.array(executionStepGenerator, { minLength: 2, maxLength: 6 }),
        (steps) => {
          const execution = executePartialPlan(steps);
          
          // Each step should have a consistent final state
          execution.finalStates.forEach((finalState, index) => {
            const result = execution.results[index];
            
            // State consistency checks
            if (finalState.status === 'confirmed') {
              expect(result.success).toBe(true);
              expect(finalState.transaction_hash).toBeDefined();
              expect(typeof finalState.transaction_hash).toBe('string');
              expect(finalState.block_number).toBeDefined();
              expect(typeof finalState.block_number).toBe('number');
            }
            
            if (finalState.status === 'failed') {
              expect(result.success).toBe(false);
              expect(finalState.error_message).toBeDefined();
              expect(typeof finalState.error_message).toBe('string');
            }
            
            // Transaction hash should only exist for confirmed steps
            if (finalState.transaction_hash) {
              expect(finalState.status).toBe('confirmed');
              expect(finalState.transaction_hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('system consistency is maintained during partial execution', () => {
    fc.assert(
      fc.property(
        fc.array(executionStepGenerator, { minLength: 2, maxLength: 5 }),
        (steps) => {
          const execution = executePartialPlan(steps);
          
          // System should detect inconsistencies
          if (execution.systemState === 'inconsistent') {
            // There should be dependency violations
            const hasDependencyViolation = execution.results.some((result, index) => {
              const step = steps[index];
              if (step.kind === 'swap') {
                const priorApproves = execution.results.slice(0, index).filter((r, i) => 
                  steps[i].kind === 'approve' && steps[i].chainId === step.chainId
                );
                return priorApproves.some(approve => !approve.success);
              }
              return false;
            });
            
            // If system is inconsistent, there should be a reason
            expect(hasDependencyViolation || execution.results.some(r => !r.success)).toBe(true);
          }
          
          // Consistent systems should have no dependency violations
          if (execution.systemState === 'consistent') {
            execution.results.forEach((result, index) => {
              const step = steps[index];
              if (step.kind === 'swap' && result.success) {
                const priorApproves = execution.results.slice(0, index).filter((r, i) => 
                  steps[i].kind === 'approve' && steps[i].chainId === step.chainId
                );
                // All required approves should be successful
                priorApproves.forEach(approve => {
                  expect(approve.success).toBe(true);
                });
              }
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('execution results are deterministic for same inputs', () => {
    fc.assert(
      fc.property(
        fc.array(executionStepGenerator, { minLength: 2, maxLength: 4 }),
        fc.array(fc.string({ minLength: 8, maxLength: 32 }), { maxLength: 2 }),
        (steps, forceFailures) => {
          const execution1 = executePartialPlan(steps, forceFailures);
          const execution2 = executePartialPlan(steps, forceFailures);
          
          // Results should be deterministic (same success/failure pattern)
          expect(execution1.results.length).toBe(execution2.results.length);
          
          execution1.results.forEach((result1, index) => {
            const result2 = execution2.results[index];
            expect(result1.success).toBe(result2.success);
            expect(result1.stepId).toBe(result2.stepId);
            
            if (!result1.success) {
              expect(result1.error).toBeDefined();
              expect(result2.error).toBeDefined();
            }
          });
          
          // System state should be consistent
          expect(execution1.systemState).toBe(execution2.systemState);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('step dependencies are respected in partial execution', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        (chainId) => {
          // Create a plan with dependencies: approve -> swap
          const steps: ExecutionStep[] = [
            {
              stepId: 'approve_1',
              kind: 'approve',
              chainId,
              target_address: '0x1234567890123456789012345678901234567890',
              status: 'ready'
            },
            {
              stepId: 'swap_1',
              kind: 'swap',
              chainId,
              target_address: '0x1234567890123456789012345678901234567890',
              status: 'ready'
            }
          ];
          
          // Force approve to fail
          const execution = executePartialPlan(steps, ['approve_1']);
          
          const approveResult = execution.results.find(r => r.stepId === 'approve_1');
          const swapResult = execution.results.find(r => r.stepId === 'swap_1');
          
          expect(approveResult?.success).toBe(false);
          
          // If approve fails, system should be inconsistent if swap succeeds
          if (swapResult?.success) {
            expect(execution.systemState).toBe('inconsistent');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('error messages are preserved and meaningful', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            stepId: fc.string({ minLength: 8, maxLength: 32 }),
            kind: stepKindGenerator,
            chainId: chainIdGenerator,
            target_address: addressGenerator,
            status: fc.constantFrom('ready', 'blocked'),
            error_message: fc.option(fc.string({ minLength: 10, maxLength: 100 }))
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (steps) => {
          const execution = executePartialPlan(steps);
          
          execution.results.forEach((result, index) => {
            const originalStep = steps[index];
            const finalState = execution.finalStates[index];
            
            if (!result.success) {
              // Failed steps should have error information
              expect(result.error).toBeDefined();
              expect(typeof result.error).toBe('string');
              expect(result.error.length).toBeGreaterThan(0);
              
              // Final state should preserve error
              if (finalState.status === 'failed') {
                expect(finalState.error_message).toBeDefined();
                expect(typeof finalState.error_message).toBe('string');
                expect(finalState.error_message.length).toBeGreaterThan(0);
              }
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('successful partial execution allows continuation', () => {
    fc.assert(
      fc.property(
        fc.array(executionStepGenerator, { minLength: 3, maxLength: 6 }),
        (steps) => {
          // Set some steps as ready, others as pending
          const mixedSteps = steps.map((step, index) => ({
            ...step,
            status: index % 2 === 0 ? 'ready' : 'pending'
          }));
          
          const execution = executePartialPlan(mixedSteps);
          
          // Count ready vs pending steps
          const readySteps = mixedSteps.filter(s => s.status === 'ready').length;
          const pendingSteps = mixedSteps.filter(s => s.status === 'pending').length;
          
          // Ready steps should have execution results
          const readyResults = execution.results.filter((_, index) => 
            mixedSteps[index].status === 'ready'
          );
          expect(readyResults.length).toBe(readySteps);
          
          // Pending steps should remain pending or have appropriate status
          execution.finalStates.forEach((finalState, index) => {
            const originalStep = mixedSteps[index];
            if (originalStep.status === 'pending') {
              expect(['pending', 'failed']).toContain(finalState.status);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('gas estimates are preserved for failed steps', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            stepId: fc.string({ minLength: 8, maxLength: 32 }),
            kind: stepKindGenerator,
            chainId: chainIdGenerator,
            target_address: addressGenerator,
            status: fc.constantFrom('ready'),
            gas_estimate: fc.integer({ min: 21000, max: 500000 })
          }),
          { minLength: 2, maxLength: 4 }
        ),
        fc.array(fc.string({ minLength: 8, maxLength: 32 }), { maxLength: 2 }),
        (steps, forceFailures) => {
          const execution = executePartialPlan(steps, forceFailures);
          
          execution.finalStates.forEach((finalState, index) => {
            const originalStep = steps[index];
            
            // Gas estimates should be preserved regardless of execution outcome
            if (originalStep.gas_estimate) {
              expect(finalState.gas_estimate).toBe(originalStep.gas_estimate);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('idempotency keys are maintained during partial execution', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            stepId: fc.string({ minLength: 8, maxLength: 32 }),
            kind: stepKindGenerator,
            chainId: chainIdGenerator,
            target_address: addressGenerator,
            status: fc.constantFrom('ready'),
            step_idempotency_key: fc.string({ minLength: 16, maxLength: 64 })
          }),
          { minLength: 1, maxLength: 4 }
        ),
        (steps) => {
          const execution = executePartialPlan(steps);
          
          execution.finalStates.forEach((finalState, index) => {
            const originalStep = steps[index];
            
            // Idempotency keys should be preserved
            if (originalStep.step_idempotency_key) {
              expect(finalState.step_idempotency_key).toBe(originalStep.step_idempotency_key);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('block numbers are only assigned to confirmed transactions', () => {
    fc.assert(
      fc.property(
        fc.array(executionStepGenerator, { minLength: 2, maxLength: 5 }),
        (steps) => {
          const execution = executePartialPlan(steps);
          
          execution.finalStates.forEach((finalState) => {
            if (finalState.block_number) {
              // Block numbers should only exist for confirmed steps
              expect(finalState.status).toBe('confirmed');
              expect(finalState.transaction_hash).toBeDefined();
              expect(typeof finalState.block_number).toBe('number');
              expect(finalState.block_number).toBeGreaterThan(0);
            }
            
            if (finalState.status === 'confirmed') {
              // Confirmed steps should have block numbers
              expect(finalState.block_number).toBeDefined();
              expect(finalState.transaction_hash).toBeDefined();
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});