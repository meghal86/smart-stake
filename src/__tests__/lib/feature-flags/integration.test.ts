/**
 * Integration tests for feature flags
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isFeatureEnabled,
  getFeatureFlags,
  clearFeatureFlagsCache,
} from '@/lib/feature-flags';

describe('Feature Flags Integration', () => {
  beforeEach(() => {
    clearFeatureFlagsCache();
  });
  
  describe('End-to-end flag checking', () => {
    it('should enable sponsoredPlacementV2 for all users', async () => {
      const users = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
      
      const results = await Promise.all(
        users.map(userId => isFeatureEnabled('sponsoredPlacementV2', { userId }))
      );
      
      // All should be enabled (100% rollout)
      expect(results.every(r => r === true)).toBe(true);
    });
    
    it('should disable guardianChipStyleV2 for all users', async () => {
      const users = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
      
      const results = await Promise.all(
        users.map(userId => isFeatureEnabled('guardianChipStyleV2', { userId }))
      );
      
      // All should be disabled (0% rollout)
      expect(results.every(r => r === false)).toBe(true);
    });
    
    it('should distribute rankingModelV2 at ~10%', async () => {
      const users = Array.from({ length: 100 }, (_, i) => `user-${i}`);
      
      const results = await Promise.all(
        users.map(userId => isFeatureEnabled('rankingModelV2', { userId }))
      );
      
      const enabledCount = results.filter(r => r).length;
      
      // Should be approximately 10% (allow reasonable variance for small sample)
      expect(enabledCount).toBeGreaterThan(0);
      expect(enabledCount).toBeLessThan(25); // Allow up to 25% for 100 users
    });
    
    it('should distribute eligibilityPreviewV2 at ~50%', async () => {
      const users = Array.from({ length: 100 }, (_, i) => `user-${i}`);
      
      const results = await Promise.all(
        users.map(userId => isFeatureEnabled('eligibilityPreviewV2', { userId }))
      );
      
      const enabledCount = results.filter(r => r).length;
      
      // Should be approximately 50% (allow 15% variance)
      expect(enabledCount).toBeGreaterThan(35);
      expect(enabledCount).toBeLessThan(65);
    });
  });
  
  describe('Consistency across calls', () => {
    it('should return same result for same user', async () => {
      const userId = 'consistent-user-123';
      
      const results = await Promise.all(
        Array.from({ length: 10 }, () => 
          isFeatureEnabled('rankingModelV2', { userId })
        )
      );
      
      // All results should be identical
      const firstResult = results[0];
      expect(results.every(r => r === firstResult)).toBe(true);
    });
    
    it('should return same flags object for same user', async () => {
      const userId = 'consistent-user-456';
      
      const flags1 = await getFeatureFlags({ userId });
      const flags2 = await getFeatureFlags({ userId });
      const flags3 = await getFeatureFlags({ userId });
      
      expect(flags1).toEqual(flags2);
      expect(flags2).toEqual(flags3);
    });
  });
  
  describe('Context priority', () => {
    it('should use userId over sessionId', async () => {
      const context1 = {
        userId: 'user-123',
        sessionId: 'session-456',
      };
      
      const context2 = {
        userId: 'user-123',
        sessionId: 'session-789', // Different session
      };
      
      const flags1 = await getFeatureFlags(context1);
      const flags2 = await getFeatureFlags(context2);
      
      // Should be the same because userId is the same
      expect(flags1).toEqual(flags2);
    });
    
    it('should use sessionId when userId not available', async () => {
      const context1 = {
        sessionId: 'session-123',
        ipAddress: '192.168.1.1',
      };
      
      const context2 = {
        sessionId: 'session-123',
        ipAddress: '192.168.1.2', // Different IP
      };
      
      const flags1 = await getFeatureFlags(context1);
      const flags2 = await getFeatureFlags(context2);
      
      // Should be the same because sessionId is the same
      expect(flags1).toEqual(flags2);
    });
  });
  
  describe('Performance', () => {
    it('should cache results for fast subsequent calls', async () => {
      const userId = 'perf-test-user';
      
      // First call (uncached)
      const start1 = Date.now();
      await getFeatureFlags({ userId });
      const time1 = Date.now() - start1;
      
      // Second call (cached)
      const start2 = Date.now();
      await getFeatureFlags({ userId });
      const time2 = Date.now() - start2;
      
      // Third call (cached)
      const start3 = Date.now();
      await getFeatureFlags({ userId });
      const time3 = Date.now() - start3;
      
      // Cached calls should be faster
      expect(time2).toBeLessThanOrEqual(time1);
      expect(time3).toBeLessThanOrEqual(time1);
    });
    
    it('should handle concurrent requests efficiently', async () => {
      const users = Array.from({ length: 50 }, (_, i) => `user-${i}`);
      
      const start = Date.now();
      await Promise.all(
        users.map(userId => getFeatureFlags({ userId }))
      );
      const duration = Date.now() - start;
      
      // Should complete in reasonable time (< 1 second for 50 users)
      expect(duration).toBeLessThan(1000);
    });
  });
  
  describe('Real-world scenarios', () => {
    it('should handle anonymous users', async () => {
      const flags = await getFeatureFlags({});
      
      expect(flags).toHaveProperty('rankingModelV2');
      expect(flags).toHaveProperty('eligibilityPreviewV2');
      expect(flags).toHaveProperty('sponsoredPlacementV2');
      expect(flags).toHaveProperty('guardianChipStyleV2');
    });
    
    it('should handle authenticated users', async () => {
      const flags = await getFeatureFlags({ userId: 'auth-user-123' });
      
      expect(flags).toHaveProperty('rankingModelV2');
      expect(typeof flags.rankingModelV2).toBe('boolean');
    });
    
    it('should handle session-based users', async () => {
      const flags = await getFeatureFlags({ sessionId: 'session-abc-123' });
      
      expect(flags).toHaveProperty('rankingModelV2');
      expect(typeof flags.rankingModelV2).toBe('boolean');
    });
    
    it('should handle IP-based users', async () => {
      const flags = await getFeatureFlags({ ipAddress: '203.0.113.42' });
      
      expect(flags).toHaveProperty('rankingModelV2');
      expect(typeof flags.rankingModelV2).toBe('boolean');
    });
  });
  
  describe('Gradual rollout simulation', () => {
    it('should simulate progressive rollout percentages', async () => {
      const users = Array.from({ length: 1000 }, (_, i) => `rollout-user-${i}`);
      
      // Use the actual isInRollout function from the module
      const { isInRollout } = await import('@/lib/feature-flags/rollout');
      
      // Check which users would be in each rollout percentage
      const in1Percent = users.filter(u => isInRollout(u, 1));
      const in10Percent = users.filter(u => isInRollout(u, 10));
      const in50Percent = users.filter(u => isInRollout(u, 50));
      const in100Percent = users.filter(u => isInRollout(u, 100));
      
      // Verify progressive rollout (with some tolerance for randomness)
      expect(in1Percent.length).toBeGreaterThan(0);
      expect(in1Percent.length).toBeLessThan(in10Percent.length);
      expect(in10Percent.length).toBeLessThan(in50Percent.length);
      expect(in50Percent.length).toBeLessThan(in100Percent.length);
      expect(in100Percent.length).toBe(users.length);
      
      // All users in 1% should also be in 10% (consistent hashing)
      expect(in1Percent.every(u => in10Percent.includes(u))).toBe(true);
      
      // All users in 10% should also be in 50%
      expect(in10Percent.every(u => in50Percent.includes(u))).toBe(true);
    });
  });
});
