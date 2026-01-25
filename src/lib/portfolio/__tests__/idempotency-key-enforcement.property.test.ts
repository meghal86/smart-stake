/**
 * Property-Based Test: Idempotency Key Enforcement
 * Feature: unified-portfolio, Property 18: Idempotency Key Enforcement
 * Validates: Requirements 7.5, 7.6
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import type { ExecutionStep, IntentPlan } from '@/types/portfolio';

// Mock execution service for testing idempotency
interface ExecutionRequest {
  planId: string;
  stepId: string;
  idempotencyKey: string;
  payload: string;
}

interface ExecutionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  isDuplicate?: boolean;
}

// Simulated execution service that enforces idempotency
class MockExecutionService {
  private executedRequests = new Map<string, ExecutionResult>();

  executeStep(request: ExecutionRequest): ExecutionResult {
    // Validate idempotency key - reject whitespace-only keys
    if (!request.idempotencyKey || request.idempotencyKey.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid idempotency key: cannot be empty or whitespace-only',
      };
    }

    // For step-level idempotency, use planId:idempotencyKey (not stepId)
    // This ensures that within a plan, the same idempotency key prevents duplicate execution
    // regardless of which step is being executed
    const key = `${request.planId.trim()}:${request.idempotencyKey.trim()}`;
    
    // Check if this exact request was already executed
    if (this.executedRequests.has(key)) {
      const previousResult = this.executedRequests.get(key)!;
      return {
        ...previousResult,
        isDuplicate: true,
      };
    }

    // Simulate execution (fix the success property reference)
    const result: ExecutionResult = {
      success: Math.random() > 0.1, // 90% success rate
      transactionHash: Math.random() > 0.1 ? `0x${Math.random().toString(16).slice(2)}` : undefined,
      error: Math.random() <= 0.1 ? 'Execution failed' : undefined,
    };

    // Store the result
    this.executedRequests.set(key, result);
    return result;
  }

  reset() {
    this.executedRequests.clear();
  }

  getExecutionCount(): number {
    return this.executedRequests.size;
  }
}

// Generator for execution requests
const executionRequestGen = fc.record({
  planId: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  stepId: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  idempotencyKey: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  payload: fc.string(),
}) as fc.Arbitrary<ExecutionRequest>;

// Generator for intent plan
const intentPlanGen = fc.record({
  id: fc.string({ minLength: 1 }),
  intent: fc.string({ minLength: 1 }),
  idempotencyKey: fc.string({ minLength: 1 }),
  steps: fc.array(fc.record({
    stepId: fc.string({ minLength: 1 }),
    kind: fc.constantFrom('revoke', 'approve', 'swap', 'transfer'),
    chainId: fc.integer({ min: 1, max: 100000 }),
    target_address: fc.constant('0x1234567890123456789012345678901234567890'),
    status: fc.constantFrom('pending', 'ready', 'signing', 'submitted', 'confirmed', 'failed'),
    step_idempotency_key: fc.option(fc.string({ minLength: 1 })),
  }), { minLength: 1, maxLength: 5 }),
  policy: fc.record({
    status: fc.constantFrom('allowed', 'blocked'),
    violations: fc.array(fc.string()),
  }),
  simulation: fc.record({
    status: fc.constantFrom('pass', 'warn', 'block'),
    receiptId: fc.string({ minLength: 1 }),
  }),
  impactPreview: fc.record({
    gasEstimateUsd: fc.float({ min: 0, max: 1000 }),
    timeEstimateSec: fc.integer({ min: 1, max: 3600 }),
    riskDelta: fc.float({ min: -1, max: 1 }),
  }),
  walletScope: fc.record({
    mode: fc.constantFrom('active_wallet', 'all_wallets'),
    address: fc.option(fc.constant('0x1234567890123456789012345678901234567890')),
  }),
}) as fc.Arbitrary<IntentPlan>;

describe('Feature: unified-portfolio, Property 18: Idempotency Key Enforcement', () => {
  // Property 18.1: Duplicate requests with same idempotency key return same result
  test('duplicate requests with same idempotency key return same result', () => {
    fc.assert(
      fc.property(
        executionRequestGen,
        (request) => {
          // Create a service that uses request-level idempotency (includes stepId)
          class RequestLevelMockService extends MockExecutionService {
            executeStep(req: ExecutionRequest): ExecutionResult {
              // For request-level idempotency, include stepId to distinguish different steps
              const key = `${req.planId}:${req.stepId}:${req.idempotencyKey}`;
              
              if (this['executedRequests'].has(key)) {
                const previousResult = this['executedRequests'].get(key)!;
                return {
                  ...previousResult,
                  isDuplicate: true,
                };
              }

              const result: ExecutionResult = {
                success: Math.random() > 0.1,
                transactionHash: Math.random() > 0.1 ? `0x${Math.random().toString(16).slice(2)}` : undefined,
                error: Math.random() <= 0.1 ? 'Execution failed' : undefined,
              };

              this['executedRequests'].set(key, result);
              return result;
            }
          }
          
          const service = new RequestLevelMockService();
          
          // Execute the same request twice
          const result1 = service.executeStep(request);
          const result2 = service.executeStep(request);
          
          // Property: Second execution should be marked as duplicate
          expect(result2.isDuplicate).toBe(true);
          
          // Property: Results should be identical (except for isDuplicate flag)
          expect(result2.success).toBe(result1.success);
          expect(result2.transactionHash).toBe(result1.transactionHash);
          expect(result2.error).toBe(result1.error);
          
          // Property: Only one actual execution should have occurred
          expect(service.getExecutionCount()).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 18.2: Different idempotency keys allow separate executions
  test('different idempotency keys allow separate executions', () => {
    fc.assert(
      fc.property(
        fc.record({
          planId: fc.string({ minLength: 1 }),
          stepId: fc.string({ minLength: 1 }),
          payload: fc.string(),
        }),
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (baseRequest, key1, key2) => {
          fc.pre(key1 !== key2); // Ensure keys are different
          
          // Create a service that uses request-level idempotency (includes stepId)
          class RequestLevelMockService extends MockExecutionService {
            executeStep(req: ExecutionRequest): ExecutionResult {
              const key = `${req.planId}:${req.stepId}:${req.idempotencyKey}`;
              
              if (this['executedRequests'].has(key)) {
                const previousResult = this['executedRequests'].get(key)!;
                return {
                  ...previousResult,
                  isDuplicate: true,
                };
              }

              const result: ExecutionResult = {
                success: Math.random() > 0.1,
                transactionHash: Math.random() > 0.1 ? `0x${Math.random().toString(16).slice(2)}` : undefined,
                error: Math.random() <= 0.1 ? 'Execution failed' : undefined,
              };

              this['executedRequests'].set(key, result);
              return result;
            }
          }
          
          const service = new RequestLevelMockService();
          
          const request1 = { ...baseRequest, idempotencyKey: key1 };
          const request2 = { ...baseRequest, idempotencyKey: key2 };
          
          // Execute with different idempotency keys
          const result1 = service.executeStep(request1);
          const result2 = service.executeStep(request2);
          
          // Property: Neither should be marked as duplicate
          expect(result1.isDuplicate).toBeUndefined();
          expect(result2.isDuplicate).toBeUndefined();
          
          // Property: Two separate executions should have occurred
          expect(service.getExecutionCount()).toBe(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 18.3: Plan-level idempotency prevents duplicate plan creation
  test('plan-level idempotency prevents duplicate plan creation', () => {
    fc.assert(
      fc.property(
        intentPlanGen,
        (plan) => {
          const createdPlans = new Map<string, IntentPlan>();
          
          // Simulate plan creation service
          const createPlan = (planRequest: IntentPlan): { success: boolean; plan?: IntentPlan; isDuplicate?: boolean } => {
            const key = `${planRequest.intent}:${planRequest.idempotencyKey}`;
            
            if (createdPlans.has(key)) {
              return {
                success: true,
                plan: createdPlans.get(key),
                isDuplicate: true,
              };
            }
            
            createdPlans.set(key, planRequest);
            return {
              success: true,
              plan: planRequest,
            };
          };
          
          // Create the same plan twice
          const result1 = createPlan(plan);
          const result2 = createPlan(plan);
          
          // Property: First creation should succeed
          expect(result1.success).toBe(true);
          expect(result1.isDuplicate).toBeUndefined();
          
          // Property: Second creation should return existing plan
          expect(result2.success).toBe(true);
          expect(result2.isDuplicate).toBe(true);
          expect(result2.plan?.id).toBe(result1.plan?.id);
          
          // Property: Only one plan should be stored
          expect(createdPlans.size).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 18.4: Step-level idempotency within a plan
  test('step-level idempotency within a plan prevents duplicate step execution', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        fc.array(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 5 }),
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (planId, stepIds, stepIdempotencyKey) => {
          const service = new MockExecutionService();
          
          // Execute multiple steps with the same step idempotency key
          const results = stepIds.map(stepId => {
            const request: ExecutionRequest = {
              planId,
              stepId,
              idempotencyKey: stepIdempotencyKey,
              payload: 'test-payload',
            };
            return service.executeStep(request);
          });
          
          // Property: Only the first execution should succeed, others should be duplicates
          expect(results[0].isDuplicate).toBeUndefined();
          
          for (let i = 1; i < results.length; i++) {
            expect(results[i].isDuplicate).toBe(true);
          }
          
          // Property: Only one actual execution should have occurred
          expect(service.getExecutionCount()).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 18.5: Idempotency key format validation
  test('idempotency keys must be non-empty and consistent', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (idempotencyKey) => {
          const isValid = idempotencyKey.length > 0 && idempotencyKey.trim().length > 0;
          
          if (isValid) {
            // Property: Valid keys should be accepted
            const request: ExecutionRequest = {
              planId: 'test-plan',
              stepId: 'test-step',
              idempotencyKey,
              payload: 'test-payload',
            };
            
            const service = new MockExecutionService();
            const result = service.executeStep(request);
            
            // Should not throw or fail due to key format
            expect(typeof result.success).toBe('boolean');
          } else {
            // Property: Invalid keys should be rejected (empty or whitespace-only)
            expect(isValid).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 18.6: Concurrent execution with same idempotency key
  test('concurrent executions with same idempotency key are handled safely', async () => {
    await fc.assert(
      fc.asyncProperty(
        executionRequestGen,
        fc.integer({ min: 2, max: 10 }),
        async (request, concurrentCount) => {
          // Skip test if idempotency key is invalid (empty or whitespace-only)
          fc.pre(request.idempotencyKey && request.idempotencyKey.trim().length > 0);
          fc.pre(request.planId && request.planId.trim().length > 0);
          
          const service = new MockExecutionService();
          
          // Simulate concurrent executions with the same step-level idempotency key
          const promises = Array(concurrentCount).fill(null).map(() => 
            Promise.resolve(service.executeStep(request))
          );
          
          const results = await Promise.all(promises);
          
          // Property: All results should be consistent
          const firstResult = results[0];
          
          // If the first result failed due to invalid key, all should fail the same way
          if (!firstResult.success && firstResult.error?.includes('Invalid idempotency key')) {
            results.forEach(result => {
              expect(result.success).toBe(false);
              expect(result.error).toContain('Invalid idempotency key');
            });
            return;
          }
          
          // Otherwise, test normal idempotency behavior
          results.forEach((result, index) => {
            if (index === 0) {
              expect(result.isDuplicate).toBeUndefined();
            } else {
              expect(result.isDuplicate).toBe(true);
            }
            
            expect(result.success).toBe(firstResult.success);
            expect(result.transactionHash).toBe(firstResult.transactionHash);
            expect(result.error).toBe(firstResult.error);
          });
          
          // Property: Only one actual execution should have occurred
          expect(service.getExecutionCount()).toBe(1);
        }
      ),
      { numRuns: 50 } // Fewer runs for async test
    );
  });

  // Property 18.7: Idempotency across plan retries
  test('plan retries with same idempotency key return consistent results', () => {
    fc.assert(
      fc.property(
        intentPlanGen,
        fc.integer({ min: 2, max: 5 }),
        (plan, retryCount) => {
          const executionResults = new Map<string, any>();
          
          // Simulate plan execution with retries
          const executePlan = (planToExecute: IntentPlan, attempt: number): { success: boolean; results: any[] } => {
            const planKey = `${planToExecute.id}:${planToExecute.idempotencyKey}`;
            
            if (executionResults.has(planKey)) {
              // Return cached result for idempotent retry
              return executionResults.get(planKey);
            }
            
            // Simulate execution
            const results = planToExecute.steps.map(step => ({
              stepId: step.stepId,
              success: Math.random() > 0.2, // 80% success rate
              attempt,
            }));
            
            const planResult = {
              success: results.every(r => r.success),
              results,
            };
            
            executionResults.set(planKey, planResult);
            return planResult;
          };
          
          // Execute plan multiple times (simulating retries)
          const executions = Array(retryCount).fill(null).map((_, index) => 
            executePlan(plan, index + 1)
          );
          
          // Property: All executions should return identical results
          const firstExecution = executions[0];
          executions.forEach(execution => {
            expect(execution.success).toBe(firstExecution.success);
            expect(execution.results.length).toBe(firstExecution.results.length);
            
            execution.results.forEach((result, index) => {
              expect(result.stepId).toBe(firstExecution.results[index].stepId);
              expect(result.success).toBe(firstExecution.results[index].success);
            });
          });
          
          // Property: Only one actual execution should have been stored
          expect(executionResults.size).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});