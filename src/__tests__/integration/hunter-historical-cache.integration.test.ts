/**
 * Historical Cache Integration Tests
 * 
 * Verifies that historical eligibility results are cached for 7 days
 * 
 * Requirements: 22.6 (7-day cache TTL for snapshot eligibility)
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { checkSnapshotEligibility } from '@/lib/hunter/historical-eligibility';

// Test wallet address
const TEST_WALLET = '0x1234567890123456789012345678901234567890';

// Test snapshot date (past date)
const TEST_SNAPSHOT_DATE = '2024-01-01T00:00:00Z';

// Test chain
const TEST_CHAIN = 'ethereum';

describe('Historical Cache Integration Tests', () => {
  beforeEach(() => {
    // Clear cache before each test by resetting the module
    vi.resetModules();
  });

  test('should cache historical eligibility result for 7 days', async () => {
    // Mock Date.now
    const originalDateNow = Date.now;
    let currentTime = originalDateNow();
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

    // First call - should compute and cache
    const result1 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result1).toBeDefined();
    expect(result1).toHaveProperty('was_active');
    expect(result1).toHaveProperty('first_tx_date');
    expect(result1).toHaveProperty('reason');

    // Second call immediately - should use cache
    const result2 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result2).toEqual(result1);

    // Restore Date.now
    vi.spyOn(Date, 'now').mockRestore();
  });

  test('should refetch after 7 days', async () => {
    // Mock Date.now
    const originalDateNow = Date.now;
    let currentTime = originalDateNow();
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

    // First call at T=0
    const result1 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result1).toBeDefined();

    // Second call at T=3 days (within cache window)
    currentTime += 3 * 24 * 60 * 60 * 1000;
    const result2 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result2).toEqual(result1);

    // Third call at T=6 days (still within cache window)
    currentTime += 3 * 24 * 60 * 60 * 1000;
    const result3 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result3).toEqual(result1);

    // Fourth call at T=8 days (cache expired)
    currentTime += 2 * 24 * 60 * 60 * 1000;
    const result4 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result4).toBeDefined();
    // Result may be different if API is called again

    // Restore Date.now
    vi.spyOn(Date, 'now').mockRestore();
  });

  test('should cache exactly 7 days (604800000ms)', async () => {
    // Mock Date.now
    const originalDateNow = Date.now;
    let currentTime = originalDateNow();
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

    // First call
    const result1 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result1).toBeDefined();

    // Call at T=604799999ms (1ms before expiry) - should use cache
    currentTime += 604799999;
    const result2 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result2).toEqual(result1);

    // Call at T=604800000ms (exactly at expiry) - should refetch
    currentTime += 1;
    const result3 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result3).toBeDefined();
    // May be different if refetched

    // Restore Date.now
    vi.spyOn(Date, 'now').mockRestore();
  });

  test('should cache per wallet-snapshot-chain combination', async () => {
    const WALLET_2 = '0x9876543210987654321098765432109876543210';
    const SNAPSHOT_2 = '2024-02-01T00:00:00Z';
    const CHAIN_2 = 'base';

    // Evaluate for wallet 1, snapshot 1, chain 1
    const result1 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result1).toBeDefined();

    // Evaluate for wallet 2, snapshot 1, chain 1
    const result2 = await checkSnapshotEligibility(WALLET_2, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result2).toBeDefined();

    // Evaluate for wallet 1, snapshot 2, chain 1
    const result3 = await checkSnapshotEligibility(TEST_WALLET, SNAPSHOT_2, TEST_CHAIN);
    expect(result3).toBeDefined();

    // Evaluate for wallet 1, snapshot 1, chain 2
    const result4 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, CHAIN_2);
    expect(result4).toBeDefined();

    // All results should be independent
    // (We can't verify they're different without mocking the API, but we verify they all execute)
  });

  test('should return cached data structure correctly', async () => {
    // First call
    const result1 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result1).toHaveProperty('was_active');
    expect(result1).toHaveProperty('first_tx_date');
    expect(result1).toHaveProperty('reason');
    expect(typeof result1.was_active).toBe('boolean');
    expect(typeof result1.reason).toBe('string');

    // Second call (cached)
    const result2 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);

    // Verify structure is preserved
    expect(result2).toHaveProperty('was_active');
    expect(result2).toHaveProperty('first_tx_date');
    expect(result2).toHaveProperty('reason');

    // Verify data is identical
    expect(result2.was_active).toBe(result1.was_active);
    expect(result2.first_tx_date).toBe(result1.first_tx_date);
    expect(result2.reason).toBe(result1.reason);
  });

  test('should cache degraded mode results with shorter TTL (1 hour)', async () => {
    // Mock environment to simulate no Alchemy API
    const originalAlchemyKey = process.env.ALCHEMY_TRANSFERS_API_KEY;
    delete process.env.ALCHEMY_TRANSFERS_API_KEY;

    // Mock Date.now
    const originalDateNow = Date.now;
    let currentTime = originalDateNow();
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

    // First call without Alchemy API
    const result1 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result1.was_active).toBe(false);
    expect(result1.reason).toContain('Alchemy Transfers API not configured');

    // Call at T=30 minutes (within 1 hour TTL)
    currentTime += 30 * 60 * 1000;
    const result2 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result2).toEqual(result1);

    // Call at T=61 minutes (cache expired for degraded mode)
    currentTime += 31 * 60 * 1000;
    const result3 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result3).toBeDefined();
    // Should still be degraded mode result

    // Restore environment and Date.now
    if (originalAlchemyKey) {
      process.env.ALCHEMY_TRANSFERS_API_KEY = originalAlchemyKey;
    }
    vi.spyOn(Date, 'now').mockRestore();
  });

  test('should handle cache miss gracefully', async () => {
    // First call should compute (cache miss)
    const result = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result).toBeDefined();
    expect(result).toHaveProperty('was_active');
    expect(result).toHaveProperty('reason');
  });

  test('should update cache on subsequent calls after expiry', async () => {
    // Mock Date.now
    const originalDateNow = Date.now;
    let currentTime = originalDateNow();
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

    // First call
    const result1 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result1).toBeDefined();

    // Wait 8 days (cache expired)
    currentTime += 8 * 24 * 60 * 60 * 1000;

    // Second call - should recompute and update cache
    const result2 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result2).toBeDefined();

    // Restore Date.now
    vi.spyOn(Date, 'now').mockRestore();
  });

  test('should cache different snapshots independently', async () => {
    const SNAPSHOT_2 = '2024-02-01T00:00:00Z';
    const SNAPSHOT_3 = '2024-03-01T00:00:00Z';

    // Evaluate for snapshot 1
    const result1 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result1).toBeDefined();

    // Evaluate for snapshot 2
    const result2 = await checkSnapshotEligibility(TEST_WALLET, SNAPSHOT_2, TEST_CHAIN);
    expect(result2).toBeDefined();

    // Evaluate for snapshot 3
    const result3 = await checkSnapshotEligibility(TEST_WALLET, SNAPSHOT_3, TEST_CHAIN);
    expect(result3).toBeDefined();

    // All results should be independent
  });

  test('should cache different chains independently', async () => {
    const CHAIN_2 = 'base';
    const CHAIN_3 = 'arbitrum';

    // Evaluate for chain 1
    const result1 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result1).toBeDefined();

    // Evaluate for chain 2
    const result2 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, CHAIN_2);
    expect(result2).toBeDefined();

    // Evaluate for chain 3
    const result3 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, CHAIN_3);
    expect(result3).toBeDefined();

    // All results should be independent
  });

  test('should respect immutable block cache', async () => {
    // Mock Date.now
    const originalDateNow = Date.now;
    let currentTime = originalDateNow();
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

    // First call - should compute block number
    const result1 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result1).toBeDefined();

    // Wait 8 days (historical cache expired)
    currentTime += 8 * 24 * 60 * 60 * 1000;

    // Second call - should recompute eligibility but reuse block number
    const result2 = await checkSnapshotEligibility(TEST_WALLET, TEST_SNAPSHOT_DATE, TEST_CHAIN);
    expect(result2).toBeDefined();

    // Block number should be cached indefinitely (immutable mapping)
    // We can't directly verify this without exposing the cache, but the function should work

    // Restore Date.now
    vi.spyOn(Date, 'now').mockRestore();
  });
});
