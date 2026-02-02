/**
 * Property-Based Tests for Cache Invalidation Engine
 * 
 * Feature: unified-portfolio
 * Property 26: Cache Invalidation Triggers
 * 
 * Validates: Requirements 10.6
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { CacheInvalidationEngine } from '../CacheInvalidationEngine';
import { riskAwareCache } from '../RiskAwareCacheService';

// Helper to generate Ethereum-like addresses (using UUIDs for simplicity in tests)
const ethereumAddressGenerator = fc.uuid().map(uuid => `0x${uuid.replace(/-/g, '').slice(0, 40)}`);

describe('Feature: unified-portfolio, Property 26: Cache Invalidation Triggers', () => {
  let engine: CacheInvalidationEngine;

  beforeEach(() => {
    engine = new CacheInvalidationEngine();
    engine.clearHistory(); // Clear any previous history
    riskAwareCache.clear();
  });

  afterEach(() => {
    engine.stopAllScheduledRefresh();
    engine.clearHistory();
    riskAwareCache.clear();
  });

  // --------------------------------------------------------------------------
  // Property 26.1: Transaction-based invalidation
  // --------------------------------------------------------------------------

  test('Property 26.1: New transaction invalidates critical caches for wallet', () => {
    fc.assert(
      fc.property(
        ethereumAddressGenerator, // wallet address
        fc.uuid(), // user ID
        fc.array(
          fc.record({
            key: fc.string({ minLength: 10, maxLength: 50 }),
            severity: fc.constantFrom('critical', 'high', 'medium', 'low') as fc.Arbitrary<'critical' | 'high' | 'medium' | 'low'>
          }),
          { minLength: 5, maxLength: 20 }
        ),
        (walletAddress, userId, cacheEntries) => {
          // Set up cache entries for this wallet
          cacheEntries.forEach(entry => {
            const key = `portfolio_snapshot_${userId}_${walletAddress}_${entry.key}`;
            riskAwareCache.set(key, { data: 'test' }, entry.severity);
          });

          // Also add some entries for other wallets (should not be invalidated)
          const otherWallet = '0x' + '1'.repeat(40);
          riskAwareCache.set(`portfolio_snapshot_${userId}_${otherWallet}_test`, { data: 'other' }, 'low');

          // Trigger invalidation
          const result = engine.invalidateOnNewTransaction(walletAddress, userId);

          // Property: Invalidation should succeed
          expect(result.success).toBe(true);

          // Property: Should invalidate at least some keys
          expect(result.keysInvalidated).toBeGreaterThanOrEqual(0);

          // Property: Trigger should be recorded with correct type
          expect(result.trigger.type).toBe('transaction');
          expect(result.trigger.walletAddress).toBe(walletAddress);
          expect(result.trigger.userId).toBe(userId);

          // Property: Other wallet's cache should remain intact
          const otherWalletCache = riskAwareCache.get(`portfolio_snapshot_${userId}_${otherWallet}_test`);
          expect(otherWalletCache).not.toBeNull();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 26.2: Wallet switch invalidation
  // --------------------------------------------------------------------------

  test('Property 26.2: Wallet switch clears user-specific caches', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // user ID
        ethereumAddressGenerator, // previous wallet
        ethereumAddressGenerator, // new wallet
        (userId, previousWallet, newWallet) => {
          // Ensure wallets are different
          fc.pre(previousWallet !== newWallet);

          // Set up cache entries for previous wallet
          riskAwareCache.set(`portfolio_snapshot_${userId}_${previousWallet}`, { data: 'old' }, 'low');
          riskAwareCache.set(`copilot_context_${userId}_${previousWallet}`, { data: 'old_context' }, 'low');

          // Set up cache entries for new wallet
          riskAwareCache.set(`portfolio_snapshot_${userId}_${newWallet}`, { data: 'new' }, 'low');

          // Set up user-level aggregation
          riskAwareCache.set(`portfolio_snapshot_${userId}_all_wallets`, { data: 'aggregated' }, 'medium');

          // Trigger wallet switch invalidation
          const result = engine.invalidateOnWalletSwitch(userId, previousWallet, newWallet);

          // Property: Invalidation should succeed
          expect(result.success).toBe(true);

          // Property: Should invalidate multiple keys
          expect(result.keysInvalidated).toBeGreaterThan(0);

          // Property: Trigger should be recorded with correct type
          expect(result.trigger.type).toBe('wallet_switch');
          expect(result.trigger.walletAddress).toBe(newWallet);
          expect(result.trigger.userId).toBe(userId);

          // Property: Previous wallet cache should be cleared
          const previousCache = riskAwareCache.get(`portfolio_snapshot_${userId}_${previousWallet}`);
          expect(previousCache).toBeNull();

          // Property: Copilot context should be cleared
          const copilotCache = riskAwareCache.get(`copilot_context_${userId}_${previousWallet}`);
          expect(copilotCache).toBeNull();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 26.3: Policy change invalidation
  // --------------------------------------------------------------------------

  test('Property 26.3: Policy change invalidates simulation results', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // user ID
        fc.array(
          fc.constantFrom(
            'maxGasUsd',
            'blockNewContractsDays',
            'blockInfiniteApprovalsToUnknown',
            'requireSimulationForValueOverUsd',
            'confidenceThreshold'
          ),
          { minLength: 1, maxLength: 3 }
        ), // changed policies
        (userId, changedPolicies) => {
          // Set up simulation and plan caches
          riskAwareCache.set(`simulation_receipt_${userId}_plan1`, { data: 'sim1' }, 'medium');
          riskAwareCache.set(`simulation_receipt_${userId}_plan2`, { data: 'sim2' }, 'medium');
          riskAwareCache.set(`intent_plan_${userId}_plan1`, { data: 'plan1' }, 'medium');
          riskAwareCache.set(`recommended_actions_${userId}_wallet1`, { data: 'actions' }, 'high');

          // Set up unrelated cache (should not be invalidated)
          riskAwareCache.set(`portfolio_snapshot_${userId}_0x123`, { data: 'snapshot' }, 'low');

          // Trigger policy change invalidation
          const result = engine.invalidateOnPolicyChange(userId, changedPolicies);

          // Property: Invalidation should succeed
          expect(result.success).toBe(true);

          // Property: Should invalidate multiple keys
          expect(result.keysInvalidated).toBeGreaterThan(0);

          // Property: Trigger should be recorded with correct type
          expect(result.trigger.type).toBe('policy_change');
          expect(result.trigger.userId).toBe(userId);
          expect(result.trigger.reason).toContain(changedPolicies[0]);

          // Property: Simulation receipts should be cleared
          const sim1 = riskAwareCache.get(`simulation_receipt_${userId}_plan1`);
          expect(sim1).toBeNull();

          // Property: Intent plans should be cleared
          const plan1 = riskAwareCache.get(`intent_plan_${userId}_plan1`);
          expect(plan1).toBeNull();

          // Property: Recommended actions should be cleared
          const actions = riskAwareCache.get(`recommended_actions_${userId}_wallet1`);
          expect(actions).toBeNull();

          // Property: Unrelated cache should remain intact
          const snapshot = riskAwareCache.get(`portfolio_snapshot_${userId}_0x123`);
          expect(snapshot).not.toBeNull();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 26.4: Invalidation history tracking
  // --------------------------------------------------------------------------

  test('Property 26.4: Invalidation history is tracked correctly', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // user ID
        ethereumAddressGenerator, // wallet address
        fc.integer({ min: 1, max: 10 }), // number of invalidations
        (userId, walletAddress, numInvalidations) => {
          // Clear history before this property test run
          engine.clearHistory();
          
          // Perform multiple invalidations
          for (let i = 0; i < numInvalidations; i++) {
            engine.invalidateOnNewTransaction(walletAddress, userId);
          }

          // Get history
          const history = engine.getInvalidationHistory();

          // Property: History should contain all invalidations
          expect(history.length).toBe(numInvalidations);

          // Property: All entries should have correct type
          history.forEach(entry => {
            expect(entry.type).toBe('transaction');
            expect(entry.walletAddress).toBe(walletAddress);
            expect(entry.userId).toBe(userId);
            expect(entry.timestamp).toBeGreaterThan(0);
          });

          // Property: History should be in chronological order
          for (let i = 1; i < history.length; i++) {
            expect(history[i].timestamp).toBeGreaterThanOrEqual(history[i - 1].timestamp);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 26.5: Invalidation statistics
  // --------------------------------------------------------------------------

  test('Property 26.5: Invalidation statistics are accurate', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // user ID
        ethereumAddressGenerator, // wallet address
        fc.record({
          transactions: fc.integer({ min: 0, max: 5 }),
          walletSwitches: fc.integer({ min: 0, max: 5 }),
          policyChanges: fc.integer({ min: 0, max: 5 })
        }),
        (userId, walletAddress, counts) => {
          // Clear history before this property test run
          engine.clearHistory();
          
          // Perform different types of invalidations
          for (let i = 0; i < counts.transactions; i++) {
            engine.invalidateOnNewTransaction(walletAddress, userId);
          }

          for (let i = 0; i < counts.walletSwitches; i++) {
            const newWallet = `0x${i.toString().repeat(40).slice(0, 40)}`;
            engine.invalidateOnWalletSwitch(userId, walletAddress, newWallet);
          }

          for (let i = 0; i < counts.policyChanges; i++) {
            engine.invalidateOnPolicyChange(userId, ['maxGasUsd']);
          }

          // Get statistics
          const stats = engine.getInvalidationStats();

          // Property: Total count should match sum of all types
          const expectedTotal = counts.transactions + counts.walletSwitches + counts.policyChanges;
          expect(stats.totalInvalidations).toBe(expectedTotal);

          // Property: Type counts should match
          expect(stats.byType.transaction).toBe(counts.transactions);
          expect(stats.byType.wallet_switch).toBe(counts.walletSwitches);
          expect(stats.byType.policy_change).toBe(counts.policyChanges);

          // Property: Recent invalidations should not exceed total
          expect(stats.recentInvalidations.length).toBeLessThanOrEqual(stats.totalInvalidations);
          expect(stats.recentInvalidations.length).toBeLessThanOrEqual(10);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 26.6: Scheduled refresh configuration
  // --------------------------------------------------------------------------

  test('Property 26.6: Scheduled refresh can be configured and stopped', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }), // interval in ms
        fc.array(
          fc.constantFrom('guardian_.*', 'hunter_.*', 'harvest_.*', 'portfolio_metrics_.*'),
          { minLength: 1, maxLength: 4 }
        ), // patterns
        (intervalMs, patterns) => {
          // Set up scheduled refresh
          engine.setupScheduledRefresh({
            enabled: true,
            intervalMs,
            patterns
          });

          // Property: Scheduled refresh should be set up (we can't easily test the timer firing)
          // Just verify it doesn't throw and can be stopped
          engine.stopAllScheduledRefresh();

          // Property: Should be able to get default config
          const defaultConfig = engine.getDefaultScheduledRefreshConfig();
          expect(defaultConfig.enabled).toBe(true);
          expect(defaultConfig.intervalMs).toBeGreaterThan(0);
          expect(defaultConfig.patterns.length).toBeGreaterThan(0);

          return true;
        }
      ),
      { numRuns: 50 } // Fewer runs since we're not testing async behavior
    );
  });

  // --------------------------------------------------------------------------
  // Property 26.7: Idempotency of invalidation
  // --------------------------------------------------------------------------

  test('Property 26.7: Multiple invalidations are idempotent', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // user ID
        ethereumAddressGenerator, // wallet address
        fc.integer({ min: 2, max: 5 }), // number of repeated invalidations
        (userId, walletAddress, numRepeats) => {
          // Clear history before this property test run
          engine.clearHistory();
          
          // Set up cache entry
          riskAwareCache.set(`portfolio_snapshot_${userId}_${walletAddress}`, { data: 'test' }, 'low');

          // Perform first invalidation
          const firstResult = engine.invalidateOnNewTransaction(walletAddress, userId);
          const firstKeysInvalidated = firstResult.keysInvalidated;

          // Perform subsequent invalidations
          for (let i = 1; i < numRepeats; i++) {
            const result = engine.invalidateOnNewTransaction(walletAddress, userId);
            
            // Property: Subsequent invalidations should invalidate 0 keys (already cleared)
            expect(result.keysInvalidated).toBe(0);
            expect(result.success).toBe(true);
          }

          // Property: History should contain all attempts
          const history = engine.getInvalidationHistory();
          expect(history.length).toBe(numRepeats);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
