/**
 * Tests for feature flag rollout logic
 */

import { describe, it, expect } from 'vitest';
import { isInRollout, getIdentifier, shouldEnableFeature } from '@/lib/feature-flags/rollout';
import { FeatureFlagContext } from '@/lib/feature-flags/types';

describe('Feature Flag Rollout', () => {
  describe('isInRollout', () => {
    it('should return false for 0% rollout', () => {
      expect(isInRollout('user-123', 0)).toBe(false);
      expect(isInRollout('user-456', 0)).toBe(false);
    });
    
    it('should return true for 100% rollout', () => {
      expect(isInRollout('user-123', 100)).toBe(true);
      expect(isInRollout('user-456', 100)).toBe(true);
    });
    
    it('should be deterministic for same identifier', () => {
      const result1 = isInRollout('user-123', 50);
      const result2 = isInRollout('user-123', 50);
      const result3 = isInRollout('user-123', 50);
      
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
    
    it('should distribute users across rollout percentage', () => {
      const users = Array.from({ length: 1000 }, (_, i) => `user-${i}`);
      const enabled = users.filter(user => isInRollout(user, 50));
      
      // Should be approximately 50% (allow 10% variance)
      expect(enabled.length).toBeGreaterThan(450);
      expect(enabled.length).toBeLessThan(550);
    });
    
    it('should handle different identifiers differently', () => {
      const user1 = isInRollout('user-123', 50);
      const user2 = isInRollout('user-456', 50);
      
      // Not guaranteed to be different, but with 50% rollout and enough users,
      // we should see variation
      const users = Array.from({ length: 20 }, (_, i) => `user-${i}`);
      const results = users.map(u => isInRollout(u, 50));
      
      // Should have at least one true and one false with 20 users at 50%
      expect(results.some(r => r)).toBe(true);
      expect(results.some(r => !r)).toBe(true);
    });
    
    it('should handle edge cases', () => {
      expect(isInRollout('', 50)).toBeDefined();
      expect(isInRollout('user-123', -1)).toBe(false);
      expect(isInRollout('user-123', 101)).toBe(true);
    });
  });
  
  describe('getIdentifier', () => {
    it('should prioritize userId', () => {
      const context: FeatureFlagContext = {
        userId: 'user-123',
        sessionId: 'session-456',
        ipAddress: '192.168.1.1',
      };
      
      expect(getIdentifier(context)).toBe('user-123');
    });
    
    it('should use sessionId if userId not available', () => {
      const context: FeatureFlagContext = {
        sessionId: 'session-456',
        ipAddress: '192.168.1.1',
      };
      
      expect(getIdentifier(context)).toBe('session-456');
    });
    
    it('should use ipAddress if userId and sessionId not available', () => {
      const context: FeatureFlagContext = {
        ipAddress: '192.168.1.1',
      };
      
      expect(getIdentifier(context)).toBe('192.168.1.1');
    });
    
    it('should use "anonymous" as fallback', () => {
      const context: FeatureFlagContext = {};
      
      expect(getIdentifier(context)).toBe('anonymous');
    });
  });
  
  describe('shouldEnableFeature', () => {
    it('should return false if feature is disabled', () => {
      const context: FeatureFlagContext = { userId: 'user-123' };
      
      expect(shouldEnableFeature(false, 100, context)).toBe(false);
    });
    
    it('should return true if feature is enabled and user is in rollout', () => {
      const context: FeatureFlagContext = { userId: 'user-123' };
      
      expect(shouldEnableFeature(true, 100, context)).toBe(true);
    });
    
    it('should respect rollout percentage', () => {
      const context: FeatureFlagContext = { userId: 'user-123' };
      
      const result = shouldEnableFeature(true, 50, context);
      expect(typeof result).toBe('boolean');
      
      // Should be deterministic
      const result2 = shouldEnableFeature(true, 50, context);
      expect(result).toBe(result2);
    });
    
    it('should return false for 0% rollout even if enabled', () => {
      const context: FeatureFlagContext = { userId: 'user-123' };
      
      expect(shouldEnableFeature(true, 0, context)).toBe(false);
    });
  });
  
  describe('Rollout distribution', () => {
    it('should distribute 10% rollout correctly', () => {
      const users = Array.from({ length: 1000 }, (_, i) => `user-${i}`);
      const enabled = users.filter(user => isInRollout(user, 10));
      
      // Should be approximately 10% (allow 5% variance)
      expect(enabled.length).toBeGreaterThan(50);
      expect(enabled.length).toBeLessThan(150);
    });
    
    it('should distribute 25% rollout correctly', () => {
      const users = Array.from({ length: 1000 }, (_, i) => `user-${i}`);
      const enabled = users.filter(user => isInRollout(user, 25));
      
      // Should be approximately 25% (allow 7% variance)
      expect(enabled.length).toBeGreaterThan(180);
      expect(enabled.length).toBeLessThan(320);
    });
    
    it('should be consistent across multiple checks', () => {
      const user = 'user-test-123';
      const results = Array.from({ length: 100 }, () => isInRollout(user, 50));
      
      // All results should be the same
      const firstResult = results[0];
      expect(results.every(r => r === firstResult)).toBe(true);
    });
  });
});
