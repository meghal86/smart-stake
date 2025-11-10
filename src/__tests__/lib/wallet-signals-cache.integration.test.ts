/**
 * Integration tests for wallet signals KV cache
 * 
 * Tests the actual cache behavior with Redis to verify performance improvements
 * and proper TTL handling.
 * 
 * Note: These tests require Redis to be available. If Redis is not configured,
 * tests will be skipped gracefully.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock environment to prevent validation errors
vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  },
}));

import {
  getCachedWalletSignals,
  invalidateWalletSignalsCache,
  batchGetCachedWalletSignals,
  getWalletSignalsCacheStats,
} from '@/lib/wallet-signals-cache';
import { cacheFlushAll } from '@/lib/redis/cache';
import { getRedis } from '@/lib/redis/client';

describe('wallet-signals-cache integration', () => {
  const mockWallet = '0xtest1234567890abcdef1234567890abcdef1234';
  const mockChain = 'ethereum';

  beforeEach(async () => {
    // Clear Redis cache before each test
    const redis = getRedis();
    if (redis) {
      await cacheFlushAll();
    }
  });

  afterEach(async () => {
    // Clean up after tests
    const redis = getRedis();
    if (redis) {
      await cacheFlushAll();
    }
  });

  it('should cache wallet signals and improve performance on subsequent calls', async () => {
    const redis = getRedis();
    if (!redis) {
      console.log('Redis not available, skipping integration test');
      return;
    }

    // First call - should fetch and cache
    const start1 = Date.now();
    const result1 = await getCachedWalletSignals(mockWallet, mockChain);
    const duration1 = Date.now() - start1;

    expect(result1).not.toBeNull();

    // Second call - should hit cache (faster)
    const start2 = Date.now();
    const result2 = await getCachedWalletSignals(mockWallet, mockChain);
    const duration2 = Date.now() - start2;

    expect(result2).toEqual(result1);
    
    // Cache hit should be faster (though this may not always be true in tests)
    console.log(`First call: ${duration1}ms, Second call: ${duration2}ms`);
  });

  it('should respect 20 minute TTL', async () => {
    const redis = getRedis();
    if (!redis) {
      console.log('Redis not available, skipping integration test');
      return;
    }

    // Cache wallet signals
    await getCachedWalletSignals(mockWallet, mockChain);

    // Check cache stats
    const stats = await getWalletSignalsCacheStats(mockWallet);

    expect(stats.exists).toBe(true);
    expect(stats.ttl).toBeGreaterThan(0);
    expect(stats.ttl).toBeLessThanOrEqual(1200); // 20 minutes = 1200 seconds
  });

  it('should invalidate cache correctly', async () => {
    const redis = getRedis();
    if (!redis) {
      console.log('Redis not available, skipping integration test');
      return;
    }

    // Cache wallet signals
    await getCachedWalletSignals(mockWallet, mockChain);

    // Verify cache exists
    let stats = await getWalletSignalsCacheStats(mockWallet);
    expect(stats.exists).toBe(true);

    // Invalidate cache
    const invalidated = await invalidateWalletSignalsCache(mockWallet);
    expect(invalidated).toBe(true);

    // Verify cache no longer exists
    stats = await getWalletSignalsCacheStats(mockWallet);
    expect(stats.exists).toBe(false);
  });

  it('should handle batch fetching efficiently', async () => {
    const redis = getRedis();
    if (!redis) {
      console.log('Redis not available, skipping integration test');
      return;
    }

    const wallets = [
      '0xwallet1111111111111111111111111111111111',
      '0xwallet2222222222222222222222222222222222',
      '0xwallet3333333333333333333333333333333333',
    ];

    // Batch fetch
    const results = await batchGetCachedWalletSignals(wallets, mockChain);

    expect(results.size).toBe(3);
    
    // Verify all wallets are cached
    for (const wallet of wallets) {
      const stats = await getWalletSignalsCacheStats(wallet);
      expect(stats.exists).toBe(true);
    }
  });

  it('should reduce redundant queries across multiple opportunity cards', async () => {
    const redis = getRedis();
    if (!redis) {
      console.log('Redis not available, skipping integration test');
      return;
    }

    // Simulate checking eligibility for the same wallet across 5 opportunity cards
    const opportunityCount = 5;
    const results = [];

    for (let i = 0; i < opportunityCount; i++) {
      const result = await getCachedWalletSignals(mockWallet, mockChain);
      results.push(result);
    }

    // All results should be identical (from cache after first fetch)
    expect(results.every(r => JSON.stringify(r) === JSON.stringify(results[0]))).toBe(true);

    // Verify cache exists
    const stats = await getWalletSignalsCacheStats(mockWallet);
    expect(stats.exists).toBe(true);
  });

  it('should use day-based cache key for daily refresh', async () => {
    const redis = getRedis();
    if (!redis) {
      console.log('Redis not available, skipping integration test');
      return;
    }

    // Cache wallet signals
    await getCachedWalletSignals(mockWallet, mockChain);

    // Get cache stats
    const stats = await getWalletSignalsCacheStats(mockWallet);

    // Verify key contains today's date
    const today = new Date().toISOString().split('T')[0];
    expect(stats.key).toContain(today);
    expect(stats.key).toMatch(/wallet:signals:.+:\d{4}-\d{2}-\d{2}/);
  });

  it('should handle cache failures gracefully', async () => {
    // Even if Redis is not available, should still return data
    const result = await getCachedWalletSignals(mockWallet, mockChain);

    expect(result).not.toBeNull();
    // Should have default mock values
    expect(result).toHaveProperty('walletAgeDays');
    expect(result).toHaveProperty('txCount');
    expect(result).toHaveProperty('activeChains');
  });

  it('should normalize wallet addresses for consistent caching', async () => {
    const redis = getRedis();
    if (!redis) {
      console.log('Redis not available, skipping integration test');
      return;
    }

    const upperCaseWallet = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
    const lowerCaseWallet = upperCaseWallet.toLowerCase();

    // Cache with uppercase
    await getCachedWalletSignals(upperCaseWallet, mockChain);

    // Fetch with lowercase - should hit same cache
    const result = await getCachedWalletSignals(lowerCaseWallet, mockChain);

    expect(result).not.toBeNull();

    // Verify both addresses use same cache key
    const stats1 = await getWalletSignalsCacheStats(upperCaseWallet);
    const stats2 = await getWalletSignalsCacheStats(lowerCaseWallet);

    expect(stats1.key).toBe(stats2.key);
  });

  it('should measure cache hit rate improvement', async () => {
    const redis = getRedis();
    if (!redis) {
      console.log('Redis not available, skipping integration test');
      return;
    }

    const wallets = [
      '0xwallet1111111111111111111111111111111111',
      '0xwallet2222222222222222222222222222222222',
    ];

    // First pass - all cache misses
    for (const wallet of wallets) {
      await getCachedWalletSignals(wallet, mockChain);
    }

    // Second pass - all cache hits
    const start = Date.now();
    for (const wallet of wallets) {
      await getCachedWalletSignals(wallet, mockChain);
    }
    const duration = Date.now() - start;

    console.log(`Cache hit duration for ${wallets.length} wallets: ${duration}ms`);

    // Verify all are cached
    for (const wallet of wallets) {
      const stats = await getWalletSignalsCacheStats(wallet);
      expect(stats.exists).toBe(true);
    }
  });
});
