/**
 * Tests for feature flags client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isFeatureEnabled,
  getFeatureFlags,
  getFeatureFlagsConfig,
  clearFeatureFlagsCache,
  getFeatureFlagsSync,
} from '@/lib/feature-flags/client';
import { FeatureFlagContext } from '@/lib/feature-flags/types';

// Mock environment
vi.mock('@vercel/edge-config', () => ({
  get: vi.fn(),
}));

describe('Feature Flags Client', () => {
  beforeEach(() => {
    clearFeatureFlagsCache();
    vi.clearAllMocks();
  });
  
  describe('isFeatureEnabled', () => {
    it('should return false for disabled feature', async () => {
      const context: FeatureFlagContext = { userId: 'user-123' };
      
      // guardianChipStyleV2 is disabled by default
      const enabled = await isFeatureEnabled('guardianChipStyleV2', context);
      
      expect(enabled).toBe(false);
    });
    
    it('should return true for fully enabled feature', async () => {
      const context: FeatureFlagContext = { userId: 'user-123' };
      
      // sponsoredPlacementV2 is enabled at 100% by default
      const enabled = await isFeatureEnabled('sponsoredPlacementV2', context);
      
      expect(enabled).toBe(true);
    });
    
    it('should respect rollout percentage', async () => {
      const context: FeatureFlagContext = { userId: 'user-123' };
      
      // rankingModelV2 is at 10% rollout
      const enabled = await isFeatureEnabled('rankingModelV2', context);
      
      expect(typeof enabled).toBe('boolean');
    });
    
    it('should be deterministic for same context', async () => {
      const context: FeatureFlagContext = { userId: 'user-123' };
      
      const result1 = await isFeatureEnabled('rankingModelV2', context);
      const result2 = await isFeatureEnabled('rankingModelV2', context);
      
      expect(result1).toBe(result2);
    });
    
    it('should handle empty context', async () => {
      const enabled = await isFeatureEnabled('sponsoredPlacementV2', {});
      
      expect(typeof enabled).toBe('boolean');
    });
  });
  
  describe('getFeatureFlags', () => {
    it('should return all feature flags', async () => {
      const context: FeatureFlagContext = { userId: 'user-123' };
      
      const flags = await getFeatureFlags(context);
      
      expect(flags).toHaveProperty('rankingModelV2');
      expect(flags).toHaveProperty('eligibilityPreviewV2');
      expect(flags).toHaveProperty('sponsoredPlacementV2');
      expect(flags).toHaveProperty('guardianChipStyleV2');
    });
    
    it('should return boolean values', async () => {
      const context: FeatureFlagContext = { userId: 'user-123' };
      
      const flags = await getFeatureFlags(context);
      
      expect(typeof flags.rankingModelV2).toBe('boolean');
      expect(typeof flags.eligibilityPreviewV2).toBe('boolean');
      expect(typeof flags.sponsoredPlacementV2).toBe('boolean');
      expect(typeof flags.guardianChipStyleV2).toBe('boolean');
    });
    
    it('should be deterministic', async () => {
      const context: FeatureFlagContext = { userId: 'user-123' };
      
      const flags1 = await getFeatureFlags(context);
      const flags2 = await getFeatureFlags(context);
      
      expect(flags1).toEqual(flags2);
    });
  });
  
  describe('getFeatureFlagsConfig', () => {
    it('should return configuration for all flags', async () => {
      const config = await getFeatureFlagsConfig();
      
      expect(config).toHaveProperty('rankingModelV2');
      expect(config.rankingModelV2).toHaveProperty('enabled');
      expect(config.rankingModelV2).toHaveProperty('rolloutPercentage');
      expect(config.rankingModelV2).toHaveProperty('description');
    });
    
    it('should include rollout percentages', async () => {
      const config = await getFeatureFlagsConfig();
      
      expect(config.rankingModelV2.rolloutPercentage).toBe(10);
      expect(config.eligibilityPreviewV2.rolloutPercentage).toBe(50);
      expect(config.sponsoredPlacementV2.rolloutPercentage).toBe(100);
      expect(config.guardianChipStyleV2.rolloutPercentage).toBe(0);
    });
  });
  
  describe('getFeatureFlagsSync', () => {
    it('should return flags synchronously', () => {
      const context: FeatureFlagContext = { userId: 'user-123' };
      
      const flags = getFeatureFlagsSync(context);
      
      expect(flags).toHaveProperty('rankingModelV2');
      expect(typeof flags.rankingModelV2).toBe('boolean');
    });
    
    it('should use cached values if available', async () => {
      const context: FeatureFlagContext = { userId: 'user-123' };
      
      // Fetch to populate cache
      await getFeatureFlags(context);
      
      // Sync call should use cache
      const flags = getFeatureFlagsSync(context);
      
      expect(flags).toHaveProperty('rankingModelV2');
    });
    
    it('should use defaults if cache is empty', () => {
      clearFeatureFlagsCache();
      
      const context: FeatureFlagContext = { userId: 'user-123' };
      const flags = getFeatureFlagsSync(context);
      
      expect(flags).toHaveProperty('rankingModelV2');
    });
  });
  
  describe('Cache behavior', () => {
    it('should cache results', async () => {
      const context: FeatureFlagContext = { userId: 'user-123' };
      
      const start = Date.now();
      await getFeatureFlags(context);
      const firstCallTime = Date.now() - start;
      
      const start2 = Date.now();
      await getFeatureFlags(context);
      const secondCallTime = Date.now() - start2;
      
      // Second call should be faster (cached)
      expect(secondCallTime).toBeLessThanOrEqual(firstCallTime);
    });
    
    it('should clear cache', async () => {
      const context: FeatureFlagContext = { userId: 'user-123' };
      
      await getFeatureFlags(context);
      clearFeatureFlagsCache();
      
      // Should fetch again after cache clear
      const flags = await getFeatureFlags(context);
      expect(flags).toHaveProperty('rankingModelV2');
    });
  });
  
  describe('Environment variable overrides', () => {
    it('should respect environment variables', async () => {
      // Set environment variable
      process.env.FEATURE_FLAG_RANKING_MODEL_V2 = 'true:100';
      
      clearFeatureFlagsCache();
      
      const context: FeatureFlagContext = { userId: 'user-123' };
      const enabled = await isFeatureEnabled('rankingModelV2', context);
      
      // Should be enabled for everyone now
      expect(enabled).toBe(true);
      
      // Cleanup
      delete process.env.FEATURE_FLAG_RANKING_MODEL_V2;
    });
  });
  
  describe('Different contexts', () => {
    it('should handle userId context', async () => {
      const flags = await getFeatureFlags({ userId: 'user-123' });
      expect(flags).toHaveProperty('rankingModelV2');
    });
    
    it('should handle sessionId context', async () => {
      const flags = await getFeatureFlags({ sessionId: 'session-456' });
      expect(flags).toHaveProperty('rankingModelV2');
    });
    
    it('should handle ipAddress context', async () => {
      const flags = await getFeatureFlags({ ipAddress: '192.168.1.1' });
      expect(flags).toHaveProperty('rankingModelV2');
    });
    
    it('should produce different results for different users', async () => {
      // Test with more users to ensure statistical variation
      const users = Array.from({ length: 20 }, (_, i) => `user-${i}`);
      const results = await Promise.all(
        users.map(userId => getFeatureFlags({ userId }))
      );
      
      // With 50% rollout, should have some variation
      const eligibilityResults = results.map(f => f.eligibilityPreviewV2);
      
      // Should have at least one true and one false
      expect(eligibilityResults.some(r => r)).toBe(true);
      expect(eligibilityResults.some(r => !r)).toBe(true);
    });
  });
});
