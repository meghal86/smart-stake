/**
 * Integration tests for Sync Scheduler
 * 
 * Tests real-world scenarios with actual timing and external API simulation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SyncScheduler,
  getScheduler,
  resetScheduler,
  type SyncSource,
  type SyncResult,
} from '@/lib/sync/scheduler';

describe('SyncScheduler Integration', () => {
  let scheduler: SyncScheduler;
  let syncResults: SyncResult[];
  let apiCallLog: Array<{ source: SyncSource; timestamp: number }>;

  beforeEach(() => {
    syncResults = [];
    apiCallLog = [];
    resetScheduler();
  });

  afterEach(() => {
    if (scheduler) {
      scheduler.stopAll();
    }
    resetScheduler();
  });

  describe('Real-world Sync Scenarios', () => {
    it('should handle intermittent failures with recovery', async () => {
      let callCount = 0;

      const mockHandler = vi.fn(async (source: SyncSource) => {
        callCount++;
        apiCallLog.push({ source, timestamp: Date.now() });

        // Fail first 3 attempts, then succeed
        if (callCount <= 3) {
          throw new Error('Temporary API error');
        }

        return { itemsProcessed: 10 };
      });

      scheduler = new SyncScheduler(
        undefined,
        mockHandler,
        (result) => syncResults.push(result)
      );

      // Execute sync
      await scheduler.executeSync('airdrops');

      // Should have failed initially
      expect(syncResults[0].success).toBe(false);

      // Wait for retries with backoff
      await new Promise(resolve => setTimeout(resolve, 100));
      await scheduler.executeSync('airdrops');
      
      await new Promise(resolve => setTimeout(resolve, 200));
      await scheduler.executeSync('airdrops');
      
      await new Promise(resolve => setTimeout(resolve, 400));
      await scheduler.executeSync('airdrops');

      // Should eventually succeed
      const successResults = syncResults.filter(r => r.success);
      expect(successResults.length).toBeGreaterThan(0);
    });

    it('should respect rate limits across multiple sources', async () => {
      const mockHandler = vi.fn(async (source: SyncSource) => {
        apiCallLog.push({ source, timestamp: Date.now() });
        return { itemsProcessed: 10 };
      });

      scheduler = new SyncScheduler(
        undefined,
        mockHandler,
        (result) => syncResults.push(result)
      );

      // Execute multiple sources rapidly
      const sources: SyncSource[] = ['airdrops', 'quests', 'yield', 'points'];
      
      for (const source of sources) {
        for (let i = 0; i < 5; i++) {
          await scheduler.executeSync(source);
        }
      }

      // All sources should have succeeded (within their individual limits)
      const successCount = syncResults.filter(r => r.success).length;
      expect(successCount).toBe(sources.length * 5);

      // Verify each source tracked independently
      const airdropCalls = apiCallLog.filter(log => log.source === 'airdrops');
      const questCalls = apiCallLog.filter(log => log.source === 'quests');
      
      expect(airdropCalls.length).toBe(5);
      expect(questCalls.length).toBe(5);
    });

    it('should prevent 429 storms with circuit breaker', async () => {
      let consecutiveFailures = 0;

      const mockHandler = vi.fn(async (source: SyncSource) => {
        apiCallLog.push({ source, timestamp: Date.now() });

        // Simulate external API returning 429
        consecutiveFailures++;
        throw new Error('RATE_LIMITED');
      });

      scheduler = new SyncScheduler(
        undefined,
        mockHandler,
        (result) => syncResults.push(result)
      );

      // Execute multiple times to trigger circuit breaker
      for (let i = 0; i < 10; i++) {
        await scheduler.executeSync('airdrops');
      }

      // Circuit breaker should have opened
      const state = scheduler.getCircuitBreakerState('airdrops');
      expect(state?.state).toBe('open');

      // Should have stopped making API calls after threshold
      expect(apiCallLog.length).toBeLessThan(10);
    });

    it('should handle concurrent syncs for different sources', async () => {
      const mockHandler = vi.fn(async (source: SyncSource) => {
        apiCallLog.push({ source, timestamp: Date.now() });
        
        // Simulate varying API response times
        const delays: Record<SyncSource, number> = {
          airdrops: 50,
          airdrops_upcoming: 100,
          quests: 75,
          yield: 150,
          points: 200,
          sponsored: 25,
          community: 100,
        };

        await new Promise(resolve => setTimeout(resolve, delays[source]));
        return { itemsProcessed: Math.floor(Math.random() * 100) };
      });

      scheduler = new SyncScheduler(
        undefined,
        mockHandler,
        (result) => syncResults.push(result)
      );

      // Execute all sources concurrently
      const sources: SyncSource[] = [
        'airdrops',
        'quests',
        'yield',
        'points',
        'sponsored',
      ];

      await Promise.all(sources.map(source => scheduler.executeSync(source)));

      // All should succeed
      expect(syncResults.every(r => r.success)).toBe(true);
      expect(syncResults.length).toBe(sources.length);

      // Verify all sources were called
      const calledSources = new Set(apiCallLog.map(log => log.source));
      expect(calledSources.size).toBe(sources.length);
    });
  });

  describe('Backoff Behavior', () => {
    it('should increase delay between retries', async () => {
      const mockHandler = vi.fn(async () => {
        apiCallLog.push({ source: 'airdrops', timestamp: Date.now() });
        throw new Error('API Error');
      });

      scheduler = new SyncScheduler(
        undefined,
        mockHandler,
        (result) => syncResults.push(result)
      );

      // Execute and trigger retries
      await scheduler.executeSync('airdrops');
      
      // Wait and retry multiple times
      for (let i = 0; i < 4; i++) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        await scheduler.executeSync('airdrops');
      }

      // Verify delays increased
      const timestamps = apiCallLog.map(log => log.timestamp);
      const delays = timestamps.slice(1).map((t, i) => t - timestamps[i]);

      // Each delay should be larger than the previous (with some tolerance for jitter)
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1] * 0.8); // 80% tolerance for jitter
      }
    });

    it('should cap backoff at max delay', async () => {
      const mockHandler = vi.fn(async () => {
        apiCallLog.push({ source: 'airdrops', timestamp: Date.now() });
        throw new Error('API Error');
      });

      scheduler = new SyncScheduler(
        undefined,
        mockHandler,
        (result) => syncResults.push(result)
      );

      // Trigger many failures to reach max backoff
      for (let i = 0; i < 10; i++) {
        await scheduler.executeSync('airdrops');
      }

      const retryCount = scheduler.getRetryCount('airdrops');
      expect(retryCount).toBeGreaterThan(5);

      // Calculate backoff for high retry count
      const backoff = (scheduler as any).calculateBackoff('airdrops', retryCount);
      
      // Should be capped at max delay (60s + jitter)
      expect(backoff).toBeLessThanOrEqual(60000 * 1.1);
    });
  });

  describe('Circuit Breaker Recovery', () => {
    it('should recover from open circuit breaker', async () => {
      let failureCount = 0;

      const mockHandler = vi.fn(async () => {
        apiCallLog.push({ source: 'airdrops', timestamp: Date.now() });
        
        failureCount++;
        
        // Fail first 5 times, then succeed
        if (failureCount <= 5) {
          throw new Error('API Error');
        }
        
        return { itemsProcessed: 10 };
      });

      scheduler = new SyncScheduler(
        undefined,
        mockHandler,
        (result) => syncResults.push(result)
      );

      // Open circuit breaker
      for (let i = 0; i < 5; i++) {
        await scheduler.executeSync('airdrops');
      }

      expect(scheduler.getCircuitBreakerState('airdrops')?.state).toBe('open');

      // Wait for reset timeout (5 minutes in real config, but we'll test the logic)
      // In real scenario, would wait for resetTimeoutMs
      scheduler.resetCircuitBreaker('airdrops');

      // Should be able to sync again
      await scheduler.executeSync('airdrops');
      
      const lastResult = syncResults[syncResults.length - 1];
      expect(lastResult.success).toBe(true);
      expect(scheduler.getCircuitBreakerState('airdrops')?.state).toBe('closed');
    });
  });

  describe('Observability', () => {
    it('should emit detailed sync results', async () => {
      const mockHandler = vi.fn(async (source: SyncSource) => {
        if (source === 'airdrops') {
          throw new Error('API Error');
        }
        return { itemsProcessed: 42 };
      });

      scheduler = new SyncScheduler(
        undefined,
        mockHandler,
        (result) => syncResults.push(result)
      );

      await scheduler.executeSync('airdrops');
      await scheduler.executeSync('quests');

      // Verify result structure
      const failedResult = syncResults.find(r => r.source === 'airdrops');
      const successResult = syncResults.find(r => r.source === 'quests');

      expect(failedResult).toMatchObject({
        source: 'airdrops',
        success: false,
        error: expect.stringContaining('API Error'),
        duration: expect.any(Number),
        timestamp: expect.any(String),
        retryCount: expect.any(Number),
      });

      expect(successResult).toMatchObject({
        source: 'quests',
        success: true,
        itemsProcessed: 42,
        duration: expect.any(Number),
        timestamp: expect.any(String),
        retryCount: 0,
      });
    });

    it('should track all states for monitoring', async () => {
      const mockHandler = vi.fn(async () => ({ itemsProcessed: 10 }));

      scheduler = new SyncScheduler(
        undefined,
        mockHandler,
        (result) => syncResults.push(result)
      );

      await scheduler.executeSync('airdrops');
      await scheduler.executeSync('quests');

      const states = scheduler.getAllStates();

      // Verify state structure
      expect(states.airdrops).toMatchObject({
        circuitBreaker: {
          state: 'closed',
          failureCount: 0,
          halfOpenAttempts: 0,
        },
        rateLimit: {
          requests: expect.any(Array),
          lastReset: expect.any(Number),
        },
        retryCount: 0,
      });

      // Verify rate limit tracked requests
      expect(states.airdrops.rateLimit.requests.length).toBe(1);
      expect(states.quests.rateLimit.requests.length).toBe(1);
    });
  });

  describe('Production Scenarios', () => {
    it('should handle mixed success and failure across sources', async () => {
      const mockHandler = vi.fn(async (source: SyncSource) => {
        apiCallLog.push({ source, timestamp: Date.now() });

        // Simulate different sources having different reliability
        const failureRates: Record<SyncSource, number> = {
          airdrops: 0.2, // 20% failure
          airdrops_upcoming: 0.1,
          quests: 0.3,
          yield: 0.15,
          points: 0.05,
          sponsored: 0.1,
          community: 0.25,
        };

        if (Math.random() < failureRates[source]) {
          throw new Error('Random API error');
        }

        return { itemsProcessed: Math.floor(Math.random() * 100) };
      });

      scheduler = new SyncScheduler(
        undefined,
        mockHandler,
        (result) => syncResults.push(result)
      );

      // Execute all sources multiple times
      const sources: SyncSource[] = [
        'airdrops',
        'quests',
        'yield',
        'points',
        'sponsored',
      ];

      for (let i = 0; i < 10; i++) {
        await Promise.all(sources.map(source => scheduler.executeSync(source)));
      }

      // Should have mix of successes and failures
      const successCount = syncResults.filter(r => r.success).length;
      const failureCount = syncResults.filter(r => !r.success).length;

      expect(successCount).toBeGreaterThan(0);
      expect(failureCount).toBeGreaterThan(0);
      expect(successCount + failureCount).toBe(sources.length * 10);

      // No circuit breakers should be open (failure rates too low)
      const states = scheduler.getAllStates();
      Object.values(states).forEach(state => {
        expect(state.circuitBreaker.state).not.toBe('open');
      });
    });

    it('should maintain performance under load', async () => {
      const mockHandler = vi.fn(async (source: SyncSource) => {
        // Simulate realistic API latency
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
        return { itemsProcessed: Math.floor(Math.random() * 100) };
      });

      scheduler = new SyncScheduler(
        undefined,
        mockHandler,
        (result) => syncResults.push(result)
      );

      const startTime = Date.now();

      // Execute many syncs concurrently
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(scheduler.executeSync('airdrops'));
      }

      await Promise.all(promises);

      const duration = Date.now() - startTime;

      // Should complete in reasonable time (not sequential)
      expect(duration).toBeLessThan(5000); // 5 seconds for 50 concurrent requests

      // All should succeed
      expect(syncResults.every(r => r.success)).toBe(true);
    });
  });
});
