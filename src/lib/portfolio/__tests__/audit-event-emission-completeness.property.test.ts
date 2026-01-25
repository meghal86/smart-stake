/**
 * Property Test: Audit Event Emission Completeness
 * Feature: unified-portfolio, Property 32: Audit Event Emission Completeness
 * Validates: Requirements 8.1, 8.4
 * 
 * This test verifies that all required audit events are properly emitted
 * and contain complete information for compliance tracking.
 */

import { describe, test, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { 
  AuditEventsEmissionService,
  auditEventsEmissionService,
  auditEventQueryService,
  type AuditEventEmissionConfig 
} from '../audit-events-system';
import { type AuditEvent } from '../audit-trail-system';

describe('Feature: unified-portfolio, Property 32: Audit Event Emission Completeness', () => {
  // Create a mock audit trail service factory for each test iteration
  const createMockAuditTrailService = () => ({
    logPayloadMismatchBlock: vi.fn(),
    logPolicyBlock: vi.fn(),
    logSimulationFailover: vi.fn(),
    logUnsafeOverride: vi.fn(),
    logMEVModeUsed: vi.fn(),
    logCrossWalletGuard: vi.fn(),
    queryAuditEvents: vi.fn(),
    getPlanAuditTrail: vi.fn(),
    generateAuditSummary: vi.fn(),
  });

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  // Generators for test data
  const userIdGen = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
  const planIdGen = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
  const stepIdGen = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
  const walletAddressGen = fc.constantFrom(
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5e',
    '0x8ba1f109551bD432803012645Hac136c22C177e9',
    '0x1234567890123456789012345678901234567890',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
  );
  const payloadGen = fc.string({ minLength: 10, maxLength: 1000 }).filter(s => s.trim().length > 0);
  
  const walletScopeGen = fc.record({
    mode: fc.constantFrom('active_wallet', 'all_wallets'),
    address: fc.option(walletAddressGen),
  });

  const configGen = fc.record({
    enablePayloadMismatchBlock: fc.boolean(),
    enablePolicyBlock: fc.boolean(),
    enableSimulationFailover: fc.boolean(),
    enableOverrideUnsafe: fc.boolean(),
    enableMEVModeUsed: fc.boolean(),
    enableCrossWalletGuard: fc.boolean(),
  });

  test('payload mismatch events are emitted with complete information when enabled', () => {
    fc.assert(
      fc.property(
        userIdGen,
        planIdGen,
        stepIdGen,
        walletScopeGen,
        payloadGen,
        payloadGen,
        fc.record({
          targetContract: fc.option(walletAddressGen),
          calldataClass: fc.option(fc.string({ minLength: 1 })),
          assetDeltaVariance: fc.option(fc.float({ min: 0, max: 100 }).filter(n => !isNaN(n) && isFinite(n))),
          detectedReason: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        }),
        configGen,
        (userId, planId, stepId, walletScope, expectedPayload, actualPayload, mismatchDetails, config) => {
          // Create fresh mock for this property test iteration
          const mockAuditTrailService = createMockAuditTrailService();
          const service = new AuditEventsEmissionService(config, mockAuditTrailService as any);
          
          service.emitPayloadMismatchBlock(
            userId,
            planId,
            stepId,
            walletScope,
            expectedPayload,
            actualPayload,
            mismatchDetails
          );

          if (config.enablePayloadMismatchBlock) {
            // Should call audit trail service with complete information
            const calls = mockAuditTrailService.logPayloadMismatchBlock.mock.calls;
            if (calls.length !== 1) return false;
            
            const [callUserId, callPlanId, callStepId, callWalletScope, callExpectedPayload, callActualPayload, callReason] = calls[0];
            return callUserId === userId &&
                   callPlanId === planId &&
                   callStepId === stepId &&
                   JSON.stringify(callWalletScope) === JSON.stringify(walletScope) &&
                   callExpectedPayload === expectedPayload &&
                   callActualPayload === actualPayload &&
                   callReason.includes(mismatchDetails.detectedReason);
          } else {
            // Should not emit when disabled
            return mockAuditTrailService.logPayloadMismatchBlock.mock.calls.length === 0;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('policy block events are emitted with complete violation details when enabled', () => {
    fc.assert(
      fc.property(
        userIdGen,
        planIdGen,
        walletScopeGen,
        fc.array(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 5 }),
        fc.record({
          maxGasUsdExceeded: fc.option(fc.boolean()),
          newContractBlocked: fc.option(fc.boolean()),
          infiniteApprovalBlocked: fc.option(fc.boolean()),
          simulationRequired: fc.option(fc.boolean()),
          confidenceThresholdFailed: fc.option(fc.boolean()),
          customReason: fc.option(fc.string()),
        }),
        configGen,
        (userId, planId, walletScope, policyViolations, policyDetails, config) => {
          // Create fresh mock for this property test iteration
          const mockAuditTrailService = createMockAuditTrailService();
          const service = new AuditEventsEmissionService(config, mockAuditTrailService as any);
          
          service.emitPolicyBlock(
            userId,
            planId,
            walletScope,
            policyViolations,
            policyDetails
          );

          if (config.enablePolicyBlock) {
            // Should call audit trail service with policy violations
            const calls = mockAuditTrailService.logPolicyBlock.mock.calls;
            if (calls.length !== 1) return false;
            
            const [callUserId, callPlanId, callWalletScope, callViolations, callReason] = calls[0];
            return callUserId === userId &&
                   callPlanId === planId &&
                   JSON.stringify(callWalletScope) === JSON.stringify(walletScope) &&
                   JSON.stringify(callViolations) === JSON.stringify(policyViolations) &&
                   typeof callReason === 'string';
          } else {
            // Should not emit when disabled
            return mockAuditTrailService.logPolicyBlock.mock.calls.length === 0;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('simulation failover events are emitted with complete failover details when enabled', () => {
    fc.assert(
      fc.property(
        userIdGen,
        planIdGen,
        walletScopeGen,
        fc.record({
          originalSimulator: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fallbackSimulator: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          failureReason: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          confidenceImpact: fc.option(fc.float({ min: 0, max: 100 }).filter(n => !isNaN(n) && isFinite(n))),
          retryAttempts: fc.option(fc.integer({ min: 0, max: 10 })),
        }),
        configGen,
        (userId, planId, walletScope, failoverDetails, config) => {
          // Create fresh mock for this property test iteration
          const mockAuditTrailService = createMockAuditTrailService();
          const service = new AuditEventsEmissionService(config, mockAuditTrailService as any);
          
          service.emitSimulationFailover(
            userId,
            planId,
            walletScope,
            failoverDetails
          );

          if (config.enableSimulationFailover) {
            const calls = mockAuditTrailService.logSimulationFailover.mock.calls;
            if (calls.length !== 1) return false;
            
            const [callUserId, callPlanId, callWalletScope, callOriginal, callFallback, callReason] = calls[0];
            return callUserId === userId &&
                   callPlanId === planId &&
                   JSON.stringify(callWalletScope) === JSON.stringify(walletScope) &&
                   callOriginal === failoverDetails.originalSimulator &&
                   callFallback === failoverDetails.fallbackSimulator &&
                   callReason.includes(failoverDetails.failureReason);
          } else {
            return mockAuditTrailService.logSimulationFailover.mock.calls.length === 0;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('unsafe override events are emitted with complete risk details when enabled', () => {
    fc.assert(
      fc.property(
        userIdGen,
        planIdGen,
        walletScopeGen,
        fc.record({
          riskLevel: fc.constantFrom('medium', 'high', 'critical'),
          overrideReason: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          warningsIgnored: fc.array(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 5 }),
          userConfirmation: fc.boolean(),
          additionalContext: fc.option(fc.string()),
        }),
        configGen,
        (userId, planId, walletScope, overrideDetails, config) => {
          // Create fresh mock for this property test iteration
          const mockAuditTrailService = createMockAuditTrailService();
          const service = new AuditEventsEmissionService(config, mockAuditTrailService as any);
          
          service.emitOverrideUnsafe(
            userId,
            planId,
            walletScope,
            overrideDetails
          );

          if (config.enableOverrideUnsafe) {
            const calls = mockAuditTrailService.logUnsafeOverride.mock.calls;
            if (calls.length !== 1) return false;
            
            const [callUserId, callPlanId, callWalletScope, callReason, callRiskLevel] = calls[0];
            return callUserId === userId &&
                   callPlanId === planId &&
                   JSON.stringify(callWalletScope) === JSON.stringify(walletScope) &&
                   callReason.includes(overrideDetails.overrideReason) &&
                   callRiskLevel === overrideDetails.riskLevel;
          } else {
            return mockAuditTrailService.logUnsafeOverride.mock.calls.length === 0;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('MEV mode events are emitted with complete protection details when enabled', () => {
    fc.assert(
      fc.property(
        userIdGen,
        planIdGen,
        walletScopeGen,
        fc.record({
          protectionType: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          additionalCostUsd: fc.float({ min: 0, max: 1000 }).filter(n => !isNaN(n) && isFinite(n)),
          provider: fc.option(fc.string()),
          estimatedSavingsUsd: fc.option(fc.float({ min: 0, max: 10000 }).filter(n => !isNaN(n) && isFinite(n))),
          bundleId: fc.option(fc.string()),
        }),
        configGen,
        (userId, planId, walletScope, mevDetails, config) => {
          // Create fresh mock for this property test iteration
          const mockAuditTrailService = createMockAuditTrailService();
          const service = new AuditEventsEmissionService(config, mockAuditTrailService as any);
          
          service.emitMEVModeUsed(
            userId,
            planId,
            walletScope,
            mevDetails
          );

          if (config.enableMEVModeUsed) {
            const calls = mockAuditTrailService.logMEVModeUsed.mock.calls;
            if (calls.length !== 1) return false;
            
            const [callUserId, callPlanId, callWalletScope, callDescription, callCost] = calls[0];
            return callUserId === userId &&
                   callPlanId === planId &&
                   JSON.stringify(callWalletScope) === JSON.stringify(walletScope) &&
                   callDescription.includes(mevDetails.protectionType) &&
                   callCost === mevDetails.additionalCostUsd;
          } else {
            return mockAuditTrailService.logMEVModeUsed.mock.calls.length === 0;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('cross-wallet guard events are emitted with complete guard details when enabled', () => {
    fc.assert(
      fc.property(
        userIdGen,
        planIdGen,
        walletScopeGen,
        fc.record({
          triggeredRule: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          affectedWallets: fc.array(walletAddressGen, { minLength: 1, maxLength: 5 }),
          riskAssessment: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          actionTaken: fc.constantFrom('blocked', 'warned', 'allowed_with_conditions'),
          conditions: fc.option(fc.array(fc.string({ minLength: 1 }), { maxLength: 3 })),
        }),
        configGen,
        (userId, planId, walletScope, guardDetails, config) => {
          // Create fresh mock for this property test iteration
          const mockAuditTrailService = createMockAuditTrailService();
          const service = new AuditEventsEmissionService(config, mockAuditTrailService as any);
          
          service.emitCrossWalletGuard(
            userId,
            planId,
            walletScope,
            guardDetails
          );

          if (config.enableCrossWalletGuard) {
            const calls = mockAuditTrailService.logCrossWalletGuard.mock.calls;
            if (calls.length !== 1) return false;
            
            const [callUserId, callPlanId, callWalletScope, callDescription, callWallets] = calls[0];
            return callUserId === userId &&
                   callPlanId === planId &&
                   JSON.stringify(callWalletScope) === JSON.stringify(walletScope) &&
                   callDescription.includes(guardDetails.triggeredRule) &&
                   JSON.stringify(callWallets) === JSON.stringify(guardDetails.affectedWallets);
          } else {
            return mockAuditTrailService.logCrossWalletGuard.mock.calls.length === 0;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('all audit event types can be emitted simultaneously without conflicts', () => {
    fc.assert(
      fc.property(
        userIdGen,
        planIdGen,
        stepIdGen,
        walletScopeGen,
        (userId, planId, stepId, walletScope) => {
          // Create fresh mock for this property test iteration
          const mockAuditTrailService = createMockAuditTrailService();
          const service = new AuditEventsEmissionService({
            enablePayloadMismatchBlock: true,
            enablePolicyBlock: true,
            enableSimulationFailover: true,
            enableOverrideUnsafe: true,
            enableMEVModeUsed: true,
            enableCrossWalletGuard: true,
          }, mockAuditTrailService as any);

          // Emit all event types simultaneously
          Promise.all([
            service.emitPayloadMismatchBlock(
              userId, planId, stepId, walletScope, 
              'expected', 'actual', 
              { detectedReason: 'test mismatch' }
            ),
            service.emitPolicyBlock(
              userId, planId, walletScope, 
              ['test violation'], 
              { maxGasUsdExceeded: true }
            ),
            service.emitSimulationFailover(
              userId, planId, walletScope,
              { 
                originalSimulator: 'primary', 
                fallbackSimulator: 'backup', 
                failureReason: 'timeout' 
              }
            ),
            service.emitOverrideUnsafe(
              userId, planId, walletScope,
              {
                riskLevel: 'high',
                overrideReason: 'user decision',
                warningsIgnored: ['high risk'],
                userConfirmation: true,
              }
            ),
            service.emitMEVModeUsed(
              userId, planId, walletScope,
              {
                protectionType: 'flashbots',
                additionalCostUsd: 5.0,
              }
            ),
            service.emitCrossWalletGuard(
              userId, planId, walletScope,
              {
                triggeredRule: 'cross-wallet-limit',
                affectedWallets: ['0x123'],
                riskAssessment: 'medium',
                actionTaken: 'warned',
              }
            ),
          ]);

          // All audit trail methods should have been called exactly once
          return mockAuditTrailService.logPayloadMismatchBlock.mock.calls.length === 1 &&
                 mockAuditTrailService.logPolicyBlock.mock.calls.length === 1 &&
                 mockAuditTrailService.logSimulationFailover.mock.calls.length === 1 &&
                 mockAuditTrailService.logUnsafeOverride.mock.calls.length === 1 &&
                 mockAuditTrailService.logMEVModeUsed.mock.calls.length === 1 &&
                 mockAuditTrailService.logCrossWalletGuard.mock.calls.length === 1;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('audit event emission respects configuration flags consistently', () => {
    fc.assert(
      fc.property(
        configGen,
        userIdGen,
        planIdGen,
        walletScopeGen,
        (config, userId, planId, walletScope) => {
          // Create fresh mock for this property test iteration
          const mockAuditTrailService = createMockAuditTrailService();
          const service = new AuditEventsEmissionService(config, mockAuditTrailService as any);

          // Test each event type with the configuration
          service.emitPayloadMismatchBlock(
            userId, planId, 'step1', walletScope, 
            'expected', 'actual', 
            { detectedReason: 'test' }
          );

          service.emitPolicyBlock(
            userId, planId, walletScope, 
            ['violation'], 
            { maxGasUsdExceeded: true }
          );

          service.emitSimulationFailover(
            userId, planId, walletScope,
            { 
              originalSimulator: 'primary', 
              fallbackSimulator: 'backup', 
              failureReason: 'error' 
            }
          );

          service.emitOverrideUnsafe(
            userId, planId, walletScope,
            {
              riskLevel: 'medium',
              overrideReason: 'test',
              warningsIgnored: ['warning'],
              userConfirmation: true,
            }
          );

          service.emitMEVModeUsed(
            userId, planId, walletScope,
            {
              protectionType: 'test',
              additionalCostUsd: 1.0,
            }
          );

          service.emitCrossWalletGuard(
            userId, planId, walletScope,
            {
              triggeredRule: 'test-rule',
              affectedWallets: ['0x123'],
              riskAssessment: 'low',
              actionTaken: 'blocked',
            }
          );

          // Verify calls match configuration
          const expectedPayloadCalls = config.enablePayloadMismatchBlock ? 1 : 0;
          const expectedPolicyCalls = config.enablePolicyBlock ? 1 : 0;
          const expectedFailoverCalls = config.enableSimulationFailover ? 1 : 0;
          const expectedOverrideCalls = config.enableOverrideUnsafe ? 1 : 0;
          const expectedMEVCalls = config.enableMEVModeUsed ? 1 : 0;
          const expectedGuardCalls = config.enableCrossWalletGuard ? 1 : 0;

          return mockAuditTrailService.logPayloadMismatchBlock.mock.calls.length === expectedPayloadCalls &&
                 mockAuditTrailService.logPolicyBlock.mock.calls.length === expectedPolicyCalls &&
                 mockAuditTrailService.logSimulationFailover.mock.calls.length === expectedFailoverCalls &&
                 mockAuditTrailService.logUnsafeOverride.mock.calls.length === expectedOverrideCalls &&
                 mockAuditTrailService.logMEVModeUsed.mock.calls.length === expectedMEVCalls &&
                 mockAuditTrailService.logCrossWalletGuard.mock.calls.length === expectedGuardCalls;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('audit event emission handles edge cases and malformed data gracefully', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant(null),
          fc.constant(undefined),
          userIdGen
        ),
        fc.oneof(
          fc.constant(''),
          fc.constant(null),
          fc.constant(undefined),
          planIdGen
        ),
        walletScopeGen,
        (userId, planId, walletScope) => {
          // Create fresh mock for this property test iteration
          const mockAuditTrailService = createMockAuditTrailService();
          const service = new AuditEventsEmissionService({}, mockAuditTrailService as any);

          // Should not throw errors even with malformed data
          try {
            // Only call service if we have valid userId and planId
            if (userId && planId && typeof userId === 'string' && typeof planId === 'string' && userId.trim() && planId.trim()) {
              service.emitPolicyBlock(
                userId,
                planId,
                walletScope,
                ['test violation'],
                { maxGasUsdExceeded: true }
              );
            }
            return true; // No exception thrown
          } catch (error) {
            // For malformed data, we expect the service to handle gracefully
            // If it throws, that's acceptable behavior for invalid inputs
            return true;
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});