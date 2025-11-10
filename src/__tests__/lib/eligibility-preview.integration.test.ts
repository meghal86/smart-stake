/**
 * Integration tests for eligibility preview service
 * Tests actual database caching behavior
 * 
 * Note: These tests require a running Supabase instance
 * Run with: npm test -- eligibility-preview.integration.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  getEligibilityPreview,
  clearEligibilityCache,
  clearExpiredEligibilityCache,
} from '../../lib/eligibility-preview';
import { supabase } from '@/integrations/supabase/client';

// Test data
const TEST_WALLET = '0xtest1234567890abcdef';
const TEST_OPPORTUNITY_ID = 'test-opp-' + Date.now();
const TEST_CHAIN = 'ethereum';

describe('Eligibility Preview Integration Tests', () => {
  beforeAll(async () => {
    // Ensure test opportunity exists (or mock it)
    console.log('Integration tests require a running Supabase instance');
  });

  afterAll(async () => {
    // Clean up test data
    await clearEligibilityCache(TEST_OPPORTUNITY_ID);
  });

  beforeEach(async () => {
    // Clear cache before each test
    await clearEligibilityCache(TEST_OPPORTUNITY_ID);
  });

  describe('Cache Behavior', () => {
    it('should cache eligibility result on first call', async () => {
      // First call - should calculate and cache
      const result1 = await getEligibilityPreview(
        TEST_WALLET,
        TEST_OPPORTUNITY_ID,
        TEST_CHAIN
      );

      expect(result1.status).toBeDefined();
      expect(result1.score).toBeGreaterThanOrEqual(0);
      expect(result1.reasons.length).toBeGreaterThan(0);
      expect(result1.cachedUntil).toBeDefined();

      // Verify cache entry was created
      const { data: cached } = await supabase
        .from('eligibility_cache')
        .select('*')
        .eq('opportunity_id', TEST_OPPORTUNITY_ID)
        .eq('wallet_address', TEST_WALLET.toLowerCase())
        .single();

      expect(cached).toBeDefined();
      expect(cached?.status).toBe(result1.status);
      expect(Number(cached?.score)).toBe(result1.score);
    }, 10000);

    it('should return cached result on second call', async () => {
      // First call
      const result1 = await getEligibilityPreview(
        TEST_WALLET,
        TEST_OPPORTUNITY_ID,
        TEST_CHAIN
      );

      // Second call - should use cache
      const result2 = await getEligibilityPreview(
        TEST_WALLET,
        TEST_OPPORTUNITY_ID,
        TEST_CHAIN
      );

      // Results should be identical
      expect(result2.status).toBe(result1.status);
      expect(result2.score).toBe(result1.score);
      expect(result2.cachedUntil).toBe(result1.cachedUntil);
      expect(result2.reasons).toEqual(result1.reasons);
    }, 10000);

    it('should handle multiple wallets for same opportunity', async () => {
      const wallet1 = '0xwallet1';
      const wallet2 = '0xwallet2';

      const result1 = await getEligibilityPreview(
        wallet1,
        TEST_OPPORTUNITY_ID,
        TEST_CHAIN
      );

      const result2 = await getEligibilityPreview(
        wallet2,
        TEST_OPPORTUNITY_ID,
        TEST_CHAIN
      );

      // Both should have valid results
      expect(result1.status).toBeDefined();
      expect(result2.status).toBeDefined();

      // Verify both cache entries exist
      const { data: cacheEntries } = await supabase
        .from('eligibility_cache')
        .select('*')
        .eq('opportunity_id', TEST_OPPORTUNITY_ID);

      expect(cacheEntries?.length).toBeGreaterThanOrEqual(2);
    }, 10000);

    it('should normalize wallet addresses in cache', async () => {
      const mixedCaseWallet = '0xAbCdEf123456';
      const lowerCaseWallet = '0xabcdef123456';

      // Call with mixed case
      const result1 = await getEligibilityPreview(
        mixedCaseWallet,
        TEST_OPPORTUNITY_ID,
        TEST_CHAIN
      );

      // Call with lowercase - should hit cache
      const result2 = await getEligibilityPreview(
        lowerCaseWallet,
        TEST_OPPORTUNITY_ID,
        TEST_CHAIN
      );

      // Should return same cached result
      expect(result2.status).toBe(result1.status);
      expect(result2.score).toBe(result1.score);
      expect(result2.cachedUntil).toBe(result1.cachedUntil);

      // Verify only one cache entry exists
      const { data: cacheEntries } = await supabase
        .from('eligibility_cache')
        .select('*')
        .eq('opportunity_id', TEST_OPPORTUNITY_ID)
        .eq('wallet_address', lowerCaseWallet);

      expect(cacheEntries?.length).toBe(1);
    }, 10000);
  });

  describe('Cache Management', () => {
    it('should clear cache for specific opportunity', async () => {
      // Create cache entry
      await getEligibilityPreview(
        TEST_WALLET,
        TEST_OPPORTUNITY_ID,
        TEST_CHAIN
      );

      // Verify cache exists
      const { data: before } = await supabase
        .from('eligibility_cache')
        .select('*')
        .eq('opportunity_id', TEST_OPPORTUNITY_ID);

      expect(before?.length).toBeGreaterThan(0);

      // Clear cache
      const deletedCount = await clearEligibilityCache(TEST_OPPORTUNITY_ID);
      expect(deletedCount).toBeGreaterThan(0);

      // Verify cache is cleared
      const { data: after } = await supabase
        .from('eligibility_cache')
        .select('*')
        .eq('opportunity_id', TEST_OPPORTUNITY_ID);

      expect(after?.length).toBe(0);
    }, 10000);

    it('should clear expired cache entries', async () => {
      // Create an expired cache entry manually
      const expiredEntry = {
        opportunity_id: TEST_OPPORTUNITY_ID,
        wallet_address: '0xexpired',
        status: 'likely',
        score: 0.8,
        reasons: ['Test expired entry'],
        cached_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        expires_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago (expired)
      };

      await supabase
        .from('eligibility_cache')
        .insert(expiredEntry);

      // Clear expired entries
      const deletedCount = await clearExpiredEligibilityCache();
      expect(deletedCount).toBeGreaterThan(0);

      // Verify expired entry is gone
      const { data: remaining } = await supabase
        .from('eligibility_cache')
        .select('*')
        .eq('wallet_address', '0xexpired');

      expect(remaining?.length).toBe(0);
    }, 10000);
  });

  describe('Error Scenarios', () => {
    it('should handle invalid opportunity ID gracefully', async () => {
      const result = await getEligibilityPreview(
        TEST_WALLET,
        'non-existent-opportunity',
        TEST_CHAIN
      );

      expect(result.status).toBeDefined();
      expect(result.reasons.length).toBeGreaterThan(0);
    }, 10000);

    it('should handle empty wallet address', async () => {
      const result = await getEligibilityPreview(
        '',
        TEST_OPPORTUNITY_ID,
        TEST_CHAIN
      );

      expect(result.status).toBe('unknown');
      expect(result.reasons).toContain('Invalid input: wallet address, opportunity ID, and chain are required');
    }, 10000);

    it('should always include at least one reason', async () => {
      const result = await getEligibilityPreview(
        TEST_WALLET,
        TEST_OPPORTUNITY_ID,
        TEST_CHAIN
      );

      expect(result.reasons).toBeDefined();
      expect(Array.isArray(result.reasons)).toBe(true);
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons[0]).toBeTruthy();
    }, 10000);
  });

  describe('Cache TTL', () => {
    it('should set cache expiry to 60 minutes from now', async () => {
      const beforeCall = Date.now();
      
      const result = await getEligibilityPreview(
        TEST_WALLET,
        TEST_OPPORTUNITY_ID,
        TEST_CHAIN
      );

      const afterCall = Date.now();
      const cachedUntilTime = new Date(result.cachedUntil).getTime();

      // Should be approximately 60 minutes from now
      const expectedMin = beforeCall + 59 * 60 * 1000; // 59 minutes
      const expectedMax = afterCall + 61 * 60 * 1000; // 61 minutes

      expect(cachedUntilTime).toBeGreaterThan(expectedMin);
      expect(cachedUntilTime).toBeLessThan(expectedMax);
    }, 10000);

    it('should not return expired cache entries', async () => {
      // Create an expired cache entry
      const expiredEntry = {
        opportunity_id: TEST_OPPORTUNITY_ID,
        wallet_address: TEST_WALLET.toLowerCase(),
        status: 'likely',
        score: 0.9,
        reasons: ['This should not be returned'],
        cached_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // Expired
      };

      await supabase
        .from('eligibility_cache')
        .insert(expiredEntry);

      // Call should not return expired entry
      const result = await getEligibilityPreview(
        TEST_WALLET,
        TEST_OPPORTUNITY_ID,
        TEST_CHAIN
      );

      // Should calculate fresh result, not return expired one
      expect(result.reasons).not.toContain('This should not be returned');
    }, 10000);
  });

  describe('Concurrent Requests', () => {
    it('should handle concurrent requests for same wallet/opportunity', async () => {
      // Make multiple concurrent requests
      const promises = Array(5).fill(null).map(() =>
        getEligibilityPreview(TEST_WALLET, TEST_OPPORTUNITY_ID, TEST_CHAIN)
      );

      const results = await Promise.all(promises);

      // All results should be consistent
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.status).toBe(firstResult.status);
        expect(result.score).toBe(firstResult.score);
      });

      // Should only have one cache entry
      const { data: cacheEntries } = await supabase
        .from('eligibility_cache')
        .select('*')
        .eq('opportunity_id', TEST_OPPORTUNITY_ID)
        .eq('wallet_address', TEST_WALLET.toLowerCase());

      expect(cacheEntries?.length).toBe(1);
    }, 10000);
  });
});
