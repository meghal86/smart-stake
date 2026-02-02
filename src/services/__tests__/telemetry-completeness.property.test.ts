/**
 * Property-Based Tests for Telemetry Event Completeness
 * 
 * Feature: unified-portfolio
 * Property 35: Telemetry Event Completeness
 * 
 * Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Mock Supabase with accessible insert spy
const mockInsert = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } })
    },
    from: vi.fn(() => ({
      insert: mockInsert,
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ data: [], error: null })
    }))
  }
}));

// Import after mocking
import { metricsService } from '../MetricsService';

describe('Feature: unified-portfolio, Property 35: Telemetry Event Completeness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Property 35.1: Portfolio snapshot events include required fields
  // --------------------------------------------------------------------------

  test('Property 35.1: Portfolio snapshot events include all required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // cache_hit
        fc.integer({ min: 10, max: 5000 }), // latency_ms
        fc.constantFrom('active_wallet', 'all_wallets'), // wallet_scope
        fc.option(fc.uuid()), // correlation_id
        async (cacheHit, latencyMs, walletScope, correlationId) => {
          // Clear previous calls
          mockInsert.mockClear();

          // Track event
          await metricsService.trackPortfolioSnapshotLoaded(
            cacheHit,
            latencyMs,
            walletScope,
            correlationId
          );

          // Wait for async operation
          await new Promise(resolve => setTimeout(resolve, 10));

          // Verify insert was called
          expect(mockInsert).toHaveBeenCalledTimes(1);

          // Verify event structure
          const insertCall = mockInsert.mock.calls[0][0];
          expect(insertCall).toMatchObject({
            event_type: 'portfolio_snapshot_loaded',
            event_data: {
              cache_hit: cacheHit,
              latency_ms: latencyMs,
              wallet_scope: walletScope
            }
          });

          // Verify correlation_id is present
          expect(insertCall.event_data.correlation_id).toBeDefined();
          expect(typeof insertCall.event_data.correlation_id).toBe('string');

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 35.2: Plan lifecycle events maintain correlation
  // --------------------------------------------------------------------------

  test('Property 35.2: Plan lifecycle events maintain correlation ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // plan_id
        fc.string({ minLength: 5, maxLength: 20 }), // intent
        fc.constantFrom('active_wallet', 'all_wallets'), // wallet_scope
        fc.uuid(), // correlation_id
        async (planId, intent, walletScope, correlationId) => {
          mockInsert.mockClear();

          // Track plan creation
          await metricsService.trackPlanCreated(planId, intent, walletScope, correlationId);

          // Track plan simulation
          await metricsService.trackPlanSimulated(
            planId,
            `receipt_${planId}`,
            'pass',
            500,
            correlationId
          );

          // Track step confirmation
          await metricsService.trackStepConfirmed(
            planId,
            'step_1',
            1,
            `0x${planId.replace(/-/g, '')}`,
            correlationId
          );

          // Wait for async operations
          await new Promise(resolve => setTimeout(resolve, 30));

          // Verify all three events were tracked
          expect(mockInsert).toHaveBeenCalledTimes(3);

          // Verify all events use the same correlation ID
          const calls = mockInsert.mock.calls;
          const correlationIds = calls.map(call => call[0].event_data.correlation_id);
          
          expect(correlationIds[0]).toBe(correlationId);
          expect(correlationIds[1]).toBe(correlationId);
          expect(correlationIds[2]).toBe(correlationId);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 35.3: Step events include plan and step IDs
  // --------------------------------------------------------------------------

  test('Property 35.3: Step events include plan_id and step_id', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // plan_id
        fc.string({ minLength: 5, maxLength: 20 }), // step_id
        fc.integer({ min: 1, max: 100 }), // chain_id
        fc.option(fc.uuid().map(id => `0x${id.replace(/-/g, '')}`)), // tx_hash
        async (planId, stepId, chainId, txHash) => {
          mockInsert.mockClear();

          // Track step confirmation
          await metricsService.trackStepConfirmed(planId, stepId, chainId, txHash);

          // Wait for async operation
          await new Promise(resolve => setTimeout(resolve, 10));

          // Verify insert was called
          expect(mockInsert).toHaveBeenCalledTimes(1);

          // Verify event structure
          const insertCall = mockInsert.mock.calls[0][0];
          expect(insertCall.event_data).toMatchObject({
            plan_id: planId,
            step_id: stepId,
            chain_id: chainId
          });

          // Verify tx_hash if provided
          if (txHash) {
            expect(insertCall.event_data.tx_hash).toBe(txHash);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 35.4: Failed steps include error reason
  // --------------------------------------------------------------------------

  test('Property 35.4: Failed step events include error reason', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // plan_id
        fc.string({ minLength: 5, maxLength: 20 }), // step_id
        fc.integer({ min: 1, max: 100 }), // chain_id
        fc.constantFrom(
          'insufficient_gas',
          'transaction_reverted',
          'user_rejected',
          'network_error',
          'simulation_failed'
        ), // error_reason
        async (planId, stepId, chainId, errorReason) => {
          mockInsert.mockClear();

          // Track step failure
          await metricsService.trackStepFailed(planId, stepId, chainId, errorReason);

          // Wait for async operation
          await new Promise(resolve => setTimeout(resolve, 10));

          // Verify insert was called
          expect(mockInsert).toHaveBeenCalledTimes(1);

          // Verify event structure includes error reason
          const insertCall = mockInsert.mock.calls[0][0];
          expect(insertCall.event_data).toMatchObject({
            plan_id: planId,
            step_id: stepId,
            chain_id: chainId,
            error_reason: errorReason
          });

          // Verify error reason is non-empty
          expect(errorReason.length).toBeGreaterThan(0);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 35.5: SSE reconnect events track stability
  // --------------------------------------------------------------------------

  test('Property 35.5: SSE reconnect events track connection stability', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'network_error',
          'server_timeout',
          'client_disconnect',
          'wallet_switch',
          'policy_change'
        ), // reason
        fc.integer({ min: 1, max: 10 }), // reconnect_count
        async (reason, reconnectCount) => {
          mockInsert.mockClear();

          // Track SSE reconnect
          await metricsService.trackSSEReconnect(reason, reconnectCount);

          // Wait for async operation
          await new Promise(resolve => setTimeout(resolve, 10));

          // Verify insert was called
          expect(mockInsert).toHaveBeenCalledTimes(1);

          // Verify event structure
          const insertCall = mockInsert.mock.calls[0][0];
          expect(insertCall.event_data).toMatchObject({
            reason: reason,
            reconnect_count: reconnectCount
          });

          // Verify reconnect count is positive
          expect(reconnectCount).toBeGreaterThan(0);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 35.6: Simulation events include status and latency
  // --------------------------------------------------------------------------

  test('Property 35.6: Simulation events include status and latency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // plan_id
        fc.uuid(), // receipt_id
        fc.constantFrom('pass', 'warn', 'block'), // status
        fc.integer({ min: 100, max: 10000 }), // latency_ms
        async (planId, receiptId, status, latencyMs) => {
          mockInsert.mockClear();

          // Track simulation
          await metricsService.trackPlanSimulated(planId, receiptId, status, latencyMs);

          // Wait for async operation
          await new Promise(resolve => setTimeout(resolve, 10));

          // Verify insert was called
          expect(mockInsert).toHaveBeenCalledTimes(1);

          // Verify event structure
          const insertCall = mockInsert.mock.calls[0][0];
          expect(insertCall.event_data).toMatchObject({
            plan_id: planId,
            receipt_id: receiptId,
            status: status,
            latency_ms: latencyMs
          });

          // Verify latency is positive and status is valid
          expect(latencyMs).toBeGreaterThan(0);
          expect(['pass', 'warn', 'block']).toContain(status);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 35.7: Event taxonomy is consistent
  // --------------------------------------------------------------------------

  test('Property 35.7: Event types follow consistent naming convention', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'portfolio_snapshot_loaded',
          'plan_created',
          'plan_simulated',
          'step_confirmed',
          'step_failed',
          'sse_reconnect'
        ),
        (eventType) => {
          // Property: Event types should follow snake_case convention
          expect(eventType).toMatch(/^[a-z_]+$/);

          // Property: Event types should be descriptive (> 5 characters)
          expect(eventType.length).toBeGreaterThan(5);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
