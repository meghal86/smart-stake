/**
 * Property-Based Test: Audit Trail Completeness
 * Feature: unified-portfolio, Property 19: Audit Trail Completeness
 * Validates: Requirements 8.4
 */

import * as fc from 'fast-check';
import { describe, test, expect, beforeEach } from 'vitest';
import { AuditTrailService, type AuditEvent, type PlannedVsExecutedReceipt } from '../audit-trail-system';

// Generator for wallet scope
const walletScopeGen = fc.oneof(
  fc.record({
    mode: fc.constant('active_wallet' as const),
    address: fc.constant('0x1234567890123456789012345678901234567890'),
  }),
  fc.record({
    mode: fc.constant('all_wallets' as const),
  })
);

// Generator for audit events
const auditEventDataGen = fc.record({
  userId: fc.string({ minLength: 8, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
  planId: fc.string({ minLength: 8, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
  stepId: fc.option(fc.string({ minLength: 8, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s))),
  walletScope: walletScopeGen,
  intent: fc.string({ minLength: 10, maxLength: 50 }).filter(s => s.trim().length >= 10 && /^[a-zA-Z0-9\s_-]+$/.test(s)),
  stepCount: fc.integer({ min: 1, max: 10 }),
  transactionHash: fc.option(fc.constant('0x1234567890123456789012345678901234567890123456789012345678901234')),
  gasUsed: fc.option(fc.integer({ min: 21000, max: 1000000 })),
  errorMessage: fc.option(fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length >= 10 && /^[a-zA-Z0-9\s._-]+$/.test(s))),
  policyViolations: fc.array(fc.string({ minLength: 8, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)), { maxLength: 5 }),
  riskLevel: fc.constantFrom('medium', 'high', 'critical'),
});

// Generator for simulation receipt
const simulationReceiptGen = fc.record({
  id: fc.string({ minLength: 8, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
  plan_id: fc.string({ minLength: 8, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
  simulation_status: fc.constantFrom('pass', 'warn', 'block'),
  asset_deltas: fc.array(fc.record({
    token: fc.string({ minLength: 3, maxLength: 10 }).filter(s => /^[A-Z]+$/.test(s)),
    amount: fc.float(),
    valueUsd: fc.option(fc.float({ min: 0 })),
  })),
  permission_deltas: fc.array(fc.record({
    type: fc.constantFrom('approve', 'revoke'),
    token: fc.string({ minLength: 3, maxLength: 10 }).filter(s => /^[A-Z]+$/.test(s)),
    spender: fc.string({ minLength: 8, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
    amount: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[0-9]+$/.test(s)),
  })),
  gas_estimate_usd: fc.float({ min: 0 }),
  warnings: fc.array(fc.string({ minLength: 10, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s._-]+$/.test(s))),
  confidence: fc.float({ min: 0, max: 1 }),
  created_at: fc.date().map(d => d.toISOString()),
});

describe('Feature: unified-portfolio, Property 19: Audit Trail Completeness', () => {
  // Remove shared service instance - each test will create its own

  // Property 19.1: All plan creation events are logged
  test('all plan creation events are logged and retrievable', async () => {
    await fc.assert(
      fc.asyncProperty(
        auditEventDataGen,
        async (eventData) => {
          // Create fresh service instance for each iteration
          const testService = new AuditTrailService();
          
          // Log plan creation
          await testService.logPlanCreation(
            eventData.userId,
            eventData.planId,
            eventData.walletScope,
            eventData.intent,
            eventData.stepCount
          );

          // Query events for this plan
          const events = await testService.getPlanAuditTrail(eventData.planId);

          // Property: Plan creation event should be logged
          expect(events.length).toBeGreaterThan(0);
          
          const planCreationEvent = events.find(e => e.event_type === 'plan_created');
          expect(planCreationEvent).toBeDefined();
          expect(planCreationEvent!.user_id).toBe(eventData.userId);
          expect(planCreationEvent!.plan_id).toBe(eventData.planId);
          expect(planCreationEvent!.metadata.intent).toBe(eventData.intent);
          expect(planCreationEvent!.metadata.step_count).toBe(eventData.stepCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 19.2: All plan execution events are logged
  test('all plan execution events are logged with correct status', async () => {
    await fc.assert(
      fc.asyncProperty(
        auditEventDataGen,
        fc.constantFrom('started', 'completed', 'failed', 'partial'),
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        async (eventData, executionStatus, executedSteps, totalSteps) => {
          // Create fresh service instance for each iteration
          const testService = new AuditTrailService();
          
          // Ensure executed steps doesn't exceed total steps
          const validExecutedSteps = Math.min(executedSteps, totalSteps);

          // Log plan execution
          await testService.logPlanExecution(
            eventData.userId,
            eventData.planId,
            eventData.walletScope,
            executionStatus,
            validExecutedSteps,
            totalSteps
          );

          // Query events
          const events = await testService.getPlanAuditTrail(eventData.planId);

          // Property: Plan execution event should be logged
          const executionEvent = events.find(e => e.event_type === 'plan_executed');
          expect(executionEvent).toBeDefined();
          expect(executionEvent!.metadata.execution_status).toBe(executionStatus);
          expect(executionEvent!.metadata.executed_steps).toBe(validExecutedSteps);
          expect(executionEvent!.metadata.total_steps).toBe(totalSteps);

          // Property: Severity should match execution status
          if (executionStatus === 'failed') {
            expect(executionEvent!.severity).toBe('error');
          } else if (executionStatus === 'partial') {
            expect(executionEvent!.severity).toBe('warning');
          } else {
            expect(executionEvent!.severity).toBe('info');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 19.3: Step execution events include all required metadata
  test('step execution events include all required metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        auditEventDataGen,
        fc.constantFrom('started', 'completed', 'failed'),
        async (eventData, stepStatus) => {
          // Create fresh service instance for each iteration
          const testService = new AuditTrailService();
          
          // Log step execution
          await testService.logStepExecution(
            eventData.userId,
            eventData.planId,
            eventData.stepId || 'test-step',
            eventData.walletScope,
            stepStatus,
            eventData.transactionHash,
            eventData.gasUsed,
            eventData.errorMessage
          );

          // Query events
          const events = await testService.getPlanAuditTrail(eventData.planId);

          // Property: Step execution event should be logged
          const stepEvent = events.find(e => e.event_type === 'step_executed');
          expect(stepEvent).toBeDefined();
          expect(stepEvent!.step_id).toBe(eventData.stepId || 'test-step');
          expect(stepEvent!.metadata.step_status).toBe(stepStatus);

          // Property: Optional metadata should be preserved
          if (eventData.transactionHash) {
            expect(stepEvent!.metadata.transaction_hash).toBe(eventData.transactionHash);
          }
          if (eventData.gasUsed) {
            expect(stepEvent!.metadata.gas_used).toBe(eventData.gasUsed);
          }
          if (eventData.errorMessage) {
            expect(stepEvent!.metadata.error_message).toBe(eventData.errorMessage);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 19.4: Policy block events are logged with violations
  test('policy block events are logged with complete violation information', async () => {
    await fc.assert(
      fc.asyncProperty(
        auditEventDataGen,
        fc.string({ minLength: 10, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s._-]+$/.test(s)),
        async (eventData, blockedReason) => {
          // Create fresh service instance for each iteration
          const testService = new AuditTrailService();
          
          // Log policy block
          await testService.logPolicyBlock(
            eventData.userId,
            eventData.planId,
            eventData.walletScope,
            eventData.policyViolations,
            blockedReason
          );

          // Query events
          const events = await testService.getPlanAuditTrail(eventData.planId);

          // Property: Policy block event should be logged
          const policyEvent = events.find(e => e.event_type === 'policy_block');
          expect(policyEvent).toBeDefined();
          expect(policyEvent!.severity).toBe('warning');
          expect(policyEvent!.metadata.policy_violations).toEqual(eventData.policyViolations);
          expect(policyEvent!.metadata.blocked_reason).toBe(blockedReason);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 19.5: Critical events are properly flagged and retrievable
  test('critical events are properly flagged and retrievable', async () => {
    await fc.assert(
      fc.asyncProperty(
        auditEventDataGen,
        fc.string({ minLength: 10, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s._-]+$/.test(s)),
        fc.string({ minLength: 10, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s._-]+$/.test(s)),
        fc.string({ minLength: 10, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s._-]+$/.test(s)),
        async (eventData, expectedPayload, actualPayload, mismatchReason) => {
          // Create fresh service instance for each iteration
          const testService = new AuditTrailService();
          
          // Log critical payload mismatch event
          await testService.logPayloadMismatchBlock(
            eventData.userId,
            eventData.planId,
            eventData.stepId || 'test-step',
            eventData.walletScope,
            expectedPayload,
            actualPayload,
            mismatchReason
          );

          // Query critical events
          const criticalEvents = await testService.getCriticalAuditEvents(eventData.userId);

          // Property: Critical event should be retrievable
          expect(criticalEvents.length).toBeGreaterThan(0);
          
          const payloadEvent = criticalEvents.find(e => e.event_type === 'payload_mismatch_block');
          expect(payloadEvent).toBeDefined();
          expect(payloadEvent!.severity).toBe('critical');
          expect(payloadEvent!.metadata.expected_payload).toBe(expectedPayload);
          expect(payloadEvent!.metadata.actual_payload).toBe(actualPayload);
          expect(payloadEvent!.metadata.mismatch_reason).toBe(mismatchReason);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 19.6: Planned vs executed receipts are stored and retrievable
  test('planned vs executed receipts are stored and retrievable', async () => {
    await fc.assert(
      fc.asyncProperty(
        simulationReceiptGen,
        fc.array(fc.record({
          step_id: fc.string({ minLength: 8, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          transaction_hash: fc.option(fc.constant('0x1234567890123456789012345678901234567890123456789012345678901234')),
          block_number: fc.option(fc.integer({ min: 1 })),
          gas_used: fc.option(fc.integer({ min: 21000 })),
          status: fc.constantFrom('confirmed', 'failed'),
        }), { minLength: 1, maxLength: 5 }),
        async (simulationReceipt, executedResults) => {
          // Create fresh service instance for each iteration
          const testService = new AuditTrailService();
          
          const receipt: PlannedVsExecutedReceipt = {
            plan_id: simulationReceipt.plan_id,
            planned_simulation: simulationReceipt,
            executed_results: executedResults,
            variance_analysis: {
              gas_variance_percent: 5.2,
              asset_delta_variance: [],
              unexpected_effects: [],
            },
            created_at: new Date().toISOString(),
          };

          // Store receipt
          await testService.storePlannedVsExecutedReceipt(receipt);

          // Retrieve receipts
          const receipts = await testService.getPlannedVsExecutedReceipts(simulationReceipt.plan_id);

          // Property: Receipt should be stored and retrievable
          expect(receipts.length).toBeGreaterThan(0);
          
          const storedReceipt = receipts.find(r => r.plan_id === simulationReceipt.plan_id);
          expect(storedReceipt).toBeDefined();
          expect(storedReceipt!.planned_simulation.id).toBe(simulationReceipt.id);
          expect(storedReceipt!.executed_results.length).toBe(executedResults.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 19.7: Audit event querying with filters works correctly
  test('audit event querying with filters returns correct results', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(auditEventDataGen, { minLength: 2, maxLength: 10 }),
        async (eventDataArray) => {
          // Create fresh service instance for each iteration
          const testService = new AuditTrailService();
          
          // Use unique user IDs for this test iteration
          const uniqueUserId = `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Log multiple events with the same unique user ID
          for (let i = 0; i < eventDataArray.length; i++) {
            const eventData = eventDataArray[i];
            const uniquePlanId = `plan-${uniqueUserId}-${i}`;
            
            await testService.logPlanCreation(
              uniqueUserId, // Use consistent unique user ID
              uniquePlanId,
              eventData.walletScope,
              eventData.intent,
              eventData.stepCount
            );
          }

          // Test filtering by user_id
          const userEvents = await testService.queryAuditEvents({ user_id: uniqueUserId });
          
          // Property: All returned events should belong to the specified user
          userEvents.events.forEach(event => {
            expect(event.user_id).toBe(uniqueUserId);
          });

          // Property: Should have exactly the number of events we logged
          expect(userEvents.events.length).toBe(eventDataArray.length);

          // Test filtering by event_type
          const typeEvents = await testService.queryAuditEvents({ 
            user_id: uniqueUserId, // Filter by user to avoid cross-contamination
            event_type: 'plan_created' 
          });
          
          // Property: All returned events should be of the specified type
          typeEvents.events.forEach(event => {
            expect(event.event_type).toBe('plan_created');
          });

          // Property: Should have exactly the number of plan_created events we logged
          expect(typeEvents.events.length).toBe(eventDataArray.length);

          // Property: Total count should match actual events
          expect(typeEvents.totalCount).toBe(typeEvents.events.length);
        }
      ),
      { numRuns: 50 } // Fewer runs for complex test
    );
  });

  // Property 19.8: Audit summary generation is accurate
  test('audit summary generation provides accurate statistics', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(auditEventDataGen, { minLength: 3, maxLength: 8 }),
        fc.boolean(), // Deterministic flag for critical events
        async (eventDataArray, shouldLogCritical) => {
          // Create completely fresh service instance for each iteration
          const testService = new AuditTrailService();
          
          // Use a unique userId for this test iteration to avoid cross-contamination
          const uniqueUserId = `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Set date range to ensure all events are included
          const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
          
          // Log various types of events with deterministic counts
          let expectedPlanCreations = 0;
          let expectedPlanExecutions = 0;
          let expectedCriticalIssues = 0;

          for (let i = 0; i < eventDataArray.length; i++) {
            const eventData = eventDataArray[i];
            // Use unique plan IDs to avoid conflicts
            const uniquePlanId = `plan-${uniqueUserId}-${i}`;

            await testService.logPlanCreation(uniqueUserId, uniquePlanId, eventData.walletScope, eventData.intent, eventData.stepCount);
            expectedPlanCreations++;

            await testService.logPlanExecution(uniqueUserId, uniquePlanId, eventData.walletScope, 'completed', eventData.stepCount, eventData.stepCount);
            expectedPlanExecutions++;

            // Deterministically log critical events based on the boolean flag and index
            if (shouldLogCritical && i === 0) { // Only log one critical event to make it deterministic
              await testService.logPayloadMismatchBlock(uniqueUserId, uniquePlanId, 'step-1', eventData.walletScope, 'expected', 'actual', 'test mismatch');
              expectedCriticalIssues++;
            }
          }

          // Set end date after all events are logged to ensure they're included
          const endDate = new Date().toISOString();

          // Generate summary
          const summary = await testService.generateAuditSummary(uniqueUserId, startDate, endDate);

          // Property: Summary should accurately reflect logged events
          expect(summary.plansCreated).toBe(expectedPlanCreations);
          expect(summary.plansExecuted).toBe(expectedPlanExecutions);
          expect(summary.criticalIssues).toBe(expectedCriticalIssues);
          
          // Calculate expected total events
          const expectedTotalEvents = expectedPlanCreations + expectedPlanExecutions + expectedCriticalIssues;
          expect(summary.totalEvents).toBe(expectedTotalEvents);

          // Property: Event counts by type should sum correctly
          const totalByType = Object.values(summary.eventsByType).reduce((sum, count) => sum + count, 0);
          expect(totalByType).toBe(summary.totalEvents);
        }
      ),
      { numRuns: 50 } // Fewer runs for complex test
    );
  });

  // Property 19.9: Event timestamps are consistent and ordered
  test('event timestamps are consistent and properly ordered', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(auditEventDataGen, { minLength: 3, maxLength: 5 }),
        async (eventDataArray) => {
          // Create fresh service instance for each iteration
          const testService = new AuditTrailService();
          
          // Use unique user ID for this test iteration
          const uniqueUserId = `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const timestamps: string[] = [];

          // Log events sequentially with unique plan IDs
          for (let i = 0; i < eventDataArray.length; i++) {
            const eventData = eventDataArray[i];
            const uniquePlanId = `plan-${uniqueUserId}-${i}`;
            const beforeLog = new Date().toISOString();
            
            await testService.logPlanCreation(uniqueUserId, uniquePlanId, eventData.walletScope, eventData.intent, eventData.stepCount);
            
            const afterLog = new Date().toISOString();
            timestamps.push(beforeLog, afterLog);
          }

          // Query events for this specific user
          const result = await testService.queryAuditEvents({ user_id: uniqueUserId });

          // Property: Should have exactly the number of events we logged
          expect(result.events.length).toBe(eventDataArray.length);

          // Property: Events should be ordered by timestamp (newest first)
          for (let i = 1; i < result.events.length; i++) {
            const currentTime = new Date(result.events[i].created_at).getTime();
            const previousTime = new Date(result.events[i - 1].created_at).getTime();
            expect(currentTime).toBeLessThanOrEqual(previousTime);
          }

          // Property: All events should have valid timestamps
          result.events.forEach(event => {
            expect(event.created_at).toBeDefined();
            expect(new Date(event.created_at).getTime()).not.toBeNaN();
            expect(event.metadata.timestamp).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});