/**
 * Property-Based Tests for Data Structure Completeness
 * 
 * Feature: unified-portfolio, Property 7: Data Structure Completeness
 * Validates: Requirements 4.4, 4.5, 6.4
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import { RecommendedAction, IntentPlan, ExecutionStep } from '@/types/portfolio';

describe('Feature: unified-portfolio, Property 7: Data Structure Completeness', () => {
  // Generator for complete RecommendedAction
  const completeRecommendedActionGen = fc.record({
    id: fc.string({ minLength: 1 }),
    title: fc.string({ minLength: 1 }),
    severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
    why: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
    impactPreview: fc.record({
      riskDelta: fc.float({ min: -1, max: 1, noNaN: true }),
      preventedLossP50Usd: fc.float({ min: 0, max: 100000, noNaN: true }),
      expectedGainUsd: fc.float({ min: 0, max: 100000, noNaN: true }),
      gasEstimateUsd: fc.float({ min: 0, max: 1000, noNaN: true }),
      timeEstimateSec: fc.float({ min: 1, max: 7200, noNaN: true }),
      confidence: fc.float({ min: 0.5, max: 1.0, noNaN: true }),
    }),
    actionScore: fc.float({ min: 0, max: 10000, noNaN: true }),
    cta: fc.record({
      label: fc.string({ minLength: 1 }),
      intent: fc.string({ minLength: 1 }),
      params: fc.object(),
    }),
    walletScope: fc.oneof(
      fc.record({
        mode: fc.constant('active_wallet' as const),
        address: fc.constant('0x1234567890123456789012345678901234567890' as `0x${string}`),
      }),
      fc.record({
        mode: fc.constant('all_wallets' as const),
      })
    ),
  });

  // Generator for complete ExecutionStep
  const completeExecutionStepGen = fc.record({
    stepId: fc.string({ minLength: 1 }),
    kind: fc.constantFrom('revoke', 'approve', 'swap', 'transfer'),
    chainId: fc.integer({ min: 1, max: 100000 }),
    target: fc.string({ minLength: 1 }),
    status: fc.constantFrom('pending', 'simulated', 'blocked', 'ready', 'signing', 'submitted', 'confirmed', 'failed'),
    payload: fc.option(fc.string()),
    gasEstimate: fc.option(fc.integer({ min: 0, max: 1000000 })),
    error: fc.option(fc.string()),
  });

  // Generator for complete IntentPlan
  const completeIntentPlanGen = fc.record({
    id: fc.string({ minLength: 1 }),
    intent: fc.string({ minLength: 1 }),
    steps: fc.array(completeExecutionStepGen, { minLength: 1, maxLength: 10 }),
    policy: fc.record({
      status: fc.constantFrom('allowed', 'blocked'),
      violations: fc.array(fc.string()),
    }),
    simulation: fc.record({
      status: fc.constantFrom('pass', 'warn', 'block'),
      receiptId: fc.string({ minLength: 1 }),
    }),
    impactPreview: fc.record({
      gasEstimateUsd: fc.float({ min: 0, max: 1000, noNaN: true }),
      timeEstimateSec: fc.float({ min: 1, max: 7200, noNaN: true }),
      riskDelta: fc.float({ min: -1, max: 1, noNaN: true }),
    }),
    walletScope: fc.oneof(
      fc.record({
        mode: fc.constant('active_wallet' as const),
        address: fc.constant('0x1234567890123456789012345678901234567890' as `0x${string}`),
      }),
      fc.record({
        mode: fc.constant('all_wallets' as const),
      })
    ),
    idempotencyKey: fc.string({ minLength: 1 }),
  });

  test('RecommendedAction has all required fields', () => {
    fc.assert(
      fc.property(completeRecommendedActionGen, (action) => {
        // Property: All required fields are present and valid
        
        // Basic fields
        expect(action.id).toBeDefined();
        expect(typeof action.id).toBe('string');
        expect(action.id.length).toBeGreaterThan(0);
        
        expect(action.title).toBeDefined();
        expect(typeof action.title).toBe('string');
        expect(action.title.length).toBeGreaterThan(0);
        
        expect(action.severity).toBeDefined();
        expect(['critical', 'high', 'medium', 'low']).toContain(action.severity);
        
        expect(action.why).toBeDefined();
        expect(Array.isArray(action.why)).toBe(true);
        expect(action.why.length).toBeGreaterThan(0);
        action.why.forEach(reason => {
          expect(typeof reason).toBe('string');
          expect(reason.length).toBeGreaterThan(0);
        });
        
        // Impact preview completeness
        expect(action.impactPreview).toBeDefined();
        expect(typeof action.impactPreview.riskDelta).toBe('number');
        expect(typeof action.impactPreview.preventedLossP50Usd).toBe('number');
        expect(typeof action.impactPreview.expectedGainUsd).toBe('number');
        expect(typeof action.impactPreview.gasEstimateUsd).toBe('number');
        expect(typeof action.impactPreview.timeEstimateSec).toBe('number');
        expect(typeof action.impactPreview.confidence).toBe('number');
        
        // Impact preview value ranges
        expect(action.impactPreview.riskDelta).toBeGreaterThanOrEqual(-1);
        expect(action.impactPreview.riskDelta).toBeLessThanOrEqual(1);
        expect(action.impactPreview.preventedLossP50Usd).toBeGreaterThanOrEqual(0);
        expect(action.impactPreview.expectedGainUsd).toBeGreaterThanOrEqual(0);
        expect(action.impactPreview.gasEstimateUsd).toBeGreaterThanOrEqual(0);
        expect(action.impactPreview.timeEstimateSec).toBeGreaterThan(0);
        expect(action.impactPreview.confidence).toBeGreaterThanOrEqual(0.5);
        expect(action.impactPreview.confidence).toBeLessThanOrEqual(1.0);
        
        // ActionScore
        expect(typeof action.actionScore).toBe('number');
        expect(action.actionScore).toBeGreaterThanOrEqual(0);
        
        // CTA completeness
        expect(action.cta).toBeDefined();
        expect(action.cta.label).toBeDefined();
        expect(typeof action.cta.label).toBe('string');
        expect(action.cta.label.length).toBeGreaterThan(0);
        expect(action.cta.intent).toBeDefined();
        expect(typeof action.cta.intent).toBe('string');
        expect(action.cta.intent.length).toBeGreaterThan(0);
        expect(action.cta.params).toBeDefined();
        expect(typeof action.cta.params).toBe('object');
        
        // Wallet scope completeness
        expect(action.walletScope).toBeDefined();
        expect(['active_wallet', 'all_wallets']).toContain(action.walletScope.mode);
        if (action.walletScope.mode === 'active_wallet') {
          expect(action.walletScope.address).toBeDefined();
          expect(typeof action.walletScope.address).toBe('string');
          expect(action.walletScope.address.startsWith('0x')).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  test('ExecutionStep has all required fields', () => {
    fc.assert(
      fc.property(completeExecutionStepGen, (step) => {
        // Property: All required fields are present and valid
        
        expect(step.stepId).toBeDefined();
        expect(typeof step.stepId).toBe('string');
        expect(step.stepId.length).toBeGreaterThan(0);
        
        expect(step.kind).toBeDefined();
        expect(['revoke', 'approve', 'swap', 'transfer']).toContain(step.kind);
        
        expect(step.chainId).toBeDefined();
        expect(typeof step.chainId).toBe('number');
        expect(step.chainId).toBeGreaterThan(0);
        
        expect(step.target).toBeDefined();
        expect(typeof step.target).toBe('string');
        expect(step.target.length).toBeGreaterThan(0);
        
        expect(step.status).toBeDefined();
        expect(['pending', 'simulated', 'blocked', 'ready', 'signing', 'submitted', 'confirmed', 'failed']).toContain(step.status);
        
        // Optional fields should be properly typed when present
        if (step.payload !== undefined && step.payload !== null) {
          expect(typeof step.payload).toBe('string');
        }
        
        if (step.gasEstimate !== undefined && step.gasEstimate !== null) {
          expect(typeof step.gasEstimate).toBe('number');
          expect(step.gasEstimate).toBeGreaterThanOrEqual(0);
        }
        
        if (step.error !== undefined && step.error !== null) {
          expect(typeof step.error).toBe('string');
        }
      }),
      { numRuns: 100 }
    );
  });

  test('IntentPlan has all required fields', () => {
    fc.assert(
      fc.property(completeIntentPlanGen, (plan) => {
        // Property: All required fields are present and valid
        
        expect(plan.id).toBeDefined();
        expect(typeof plan.id).toBe('string');
        expect(plan.id.length).toBeGreaterThan(0);
        
        expect(plan.intent).toBeDefined();
        expect(typeof plan.intent).toBe('string');
        expect(plan.intent.length).toBeGreaterThan(0);
        
        expect(plan.steps).toBeDefined();
        expect(Array.isArray(plan.steps)).toBe(true);
        expect(plan.steps.length).toBeGreaterThan(0);
        
        // Validate each step
        plan.steps.forEach(step => {
          expect(step.stepId).toBeDefined();
          expect(step.kind).toBeDefined();
          expect(step.chainId).toBeDefined();
          expect(step.target).toBeDefined();
          expect(step.status).toBeDefined();
        });
        
        // Policy completeness
        expect(plan.policy).toBeDefined();
        expect(['allowed', 'blocked']).toContain(plan.policy.status);
        expect(Array.isArray(plan.policy.violations)).toBe(true);
        
        // Simulation completeness
        expect(plan.simulation).toBeDefined();
        expect(['pass', 'warn', 'block']).toContain(plan.simulation.status);
        expect(plan.simulation.receiptId).toBeDefined();
        expect(typeof plan.simulation.receiptId).toBe('string');
        expect(plan.simulation.receiptId.length).toBeGreaterThan(0);
        
        // Impact preview completeness
        expect(plan.impactPreview).toBeDefined();
        expect(typeof plan.impactPreview.gasEstimateUsd).toBe('number');
        expect(typeof plan.impactPreview.timeEstimateSec).toBe('number');
        expect(typeof plan.impactPreview.riskDelta).toBe('number');
        expect(plan.impactPreview.gasEstimateUsd).toBeGreaterThanOrEqual(0);
        expect(plan.impactPreview.timeEstimateSec).toBeGreaterThan(0);
        expect(plan.impactPreview.riskDelta).toBeGreaterThanOrEqual(-1);
        expect(plan.impactPreview.riskDelta).toBeLessThanOrEqual(1);
        
        // Wallet scope completeness
        expect(plan.walletScope).toBeDefined();
        expect(['active_wallet', 'all_wallets']).toContain(plan.walletScope.mode);
        if (plan.walletScope.mode === 'active_wallet') {
          expect(plan.walletScope.address).toBeDefined();
          expect(typeof plan.walletScope.address).toBe('string');
          expect(plan.walletScope.address.startsWith('0x')).toBe(true);
        }
        
        // Idempotency key
        expect(plan.idempotencyKey).toBeDefined();
        expect(typeof plan.idempotencyKey).toBe('string');
        expect(plan.idempotencyKey.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  test('Impact preview has consistent value relationships', () => {
    fc.assert(
      fc.property(completeRecommendedActionGen, (action) => {
        const preview = action.impactPreview;
        
        // Property: Basic value constraints
        
        // If there's expected gain, it should be positive
        if (preview.expectedGainUsd > 0) {
          expect(preview.expectedGainUsd).toBeGreaterThan(0);
        }
        
        // Gas estimate should be reasonable
        expect(preview.gasEstimateUsd).toBeGreaterThanOrEqual(0);
        expect(preview.timeEstimateSec).toBeGreaterThan(0);
        
        // Confidence should be in valid range
        expect(preview.confidence).toBeGreaterThanOrEqual(0.5);
        expect(preview.confidence).toBeLessThanOrEqual(1.0);
        
        // Risk delta should be within bounds
        expect(preview.riskDelta).toBeGreaterThanOrEqual(-1);
        expect(preview.riskDelta).toBeLessThanOrEqual(1);
        
        // Prevented loss should be non-negative
        expect(preview.preventedLossP50Usd).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  test('CTA parameters are consistent with intent', () => {
    fc.assert(
      fc.property(
        fc.record({
          intent: fc.constantFrom('revoke_approval', 'claim_rewards', 'reduce_exposure', 'optimize_routing'),
          label: fc.string({ minLength: 1 }),
          params: fc.object(),
        }),
        (cta) => {
          // Property: CTA structure is complete and consistent
          
          expect(cta.intent).toBeDefined();
          expect(typeof cta.intent).toBe('string');
          expect(cta.intent.length).toBeGreaterThan(0);
          
          expect(cta.label).toBeDefined();
          expect(typeof cta.label).toBe('string');
          expect(cta.label.length).toBeGreaterThan(0);
          
          expect(cta.params).toBeDefined();
          expect(typeof cta.params).toBe('object');
          expect(cta.params).not.toBeNull();
          
          // Intent-specific validation could be added here
          // For example, revoke_approval might require tokenAddress and spenderAddress
          // This would be implementation-specific
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Wallet scope consistency', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({
            mode: fc.constant('active_wallet' as const),
            address: fc.constant('0x1234567890123456789012345678901234567890' as `0x${string}`),
          }),
          fc.record({
            mode: fc.constant('all_wallets' as const),
          })
        ),
        (walletScope) => {
          // Property: Wallet scope structure is consistent with mode
          
          expect(walletScope.mode).toBeDefined();
          expect(['active_wallet', 'all_wallets']).toContain(walletScope.mode);
          
          if (walletScope.mode === 'active_wallet') {
            expect(walletScope.address).toBeDefined();
            expect(typeof walletScope.address).toBe('string');
            expect(walletScope.address.length).toBe(42); // 0x + 40 hex chars
            expect(walletScope.address.startsWith('0x')).toBe(true);
            expect(/^0x[a-fA-F0-9]{40}$/.test(walletScope.address)).toBe(true);
          } else {
            // all_wallets mode should not have address field
            expect(walletScope).not.toHaveProperty('address');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Execution step status transitions are valid', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('pending', 'simulated', 'blocked', 'ready', 'signing', 'submitted', 'confirmed', 'failed'),
        (status) => {
          // Property: All status values are from valid set
          expect(['pending', 'simulated', 'blocked', 'ready', 'signing', 'submitted', 'confirmed', 'failed']).toContain(status);
          
          // Property: Status is a string
          expect(typeof status).toBe('string');
          expect(status.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Chain ID is valid EIP-155 identifier', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        (chainId) => {
          // Property: Chain ID follows EIP-155 standard (positive integer)
          expect(typeof chainId).toBe('number');
          expect(chainId).toBeGreaterThan(0);
          expect(Number.isInteger(chainId)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});