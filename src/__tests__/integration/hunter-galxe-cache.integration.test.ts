/**
 * Galxe Cache Integration Tests
 * 
 * Verifies that Galxe sync service caches responses for 10 minutes
 * 
 * Requirements: 21.9 (10-minute cache TTL)
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

describe('Galxe Cache Integration Tests', () => {
  beforeEach(() => {
    // Clear module cache to reset the in-memory cache
    vi.resetModules();
  });

  test('should cache Galxe response for 10 minutes', async () => {
    // Import fresh module
    const { syncGalxeOpportunities } = await import('@/lib/hunter/sync/galxe');

    // Mock fetch to track calls
    let fetchCallCount = 0;
    global.fetch = vi.fn(async () => {
      fetchCallCount++;
      return {
        ok: true,
        json: async () => ({
          data: {
            campaigns: {
              pageInfo: {
                endCursor: 'cursor1',
                hasNextPage: false,
              },
              list: [
                {
                  id: 'test-campaign-1',
                  name: 'Test Airdrop Campaign',
                  description: 'Claim your airdrop tokens',
                  startTime: Math.floor(Date.now() / 1000),
                  endTime: Math.floor(Date.now() / 1000) + 86400,
                  status: 'Active',
                  chain: 'ETHEREUM',
                },
                {
                  id: 'test-campaign-2',
                  name: 'Test Quest Campaign',
                  description: 'Complete tasks to earn rewards',
                  startTime: Math.floor(Date.now() / 1000),
                  endTime: Math.floor(Date.now() / 1000) + 86400,
                  status: 'Active',
                  chain: 'BASE',
                },
              ],
            },
          },
        }),
      } as Response;
    });

    // First call - should fetch from API
    const result1 = await syncGalxeOpportunities(1);
    expect(fetchCallCount).toBe(1);
    expect(result1.total_fetched).toBe(2);
    expect(result1.airdrops.length).toBe(1);
    expect(result1.quests.length).toBe(1);

    // Second call immediately - should use cache
    const result2 = await syncGalxeOpportunities(1);
    expect(fetchCallCount).toBe(1); // No additional fetch
    expect(result2).toEqual(result1); // Same data

    // Third call immediately - should still use cache
    const result3 = await syncGalxeOpportunities(1);
    expect(fetchCallCount).toBe(1); // Still no additional fetch
    expect(result3).toEqual(result1);
  });

  test('should refetch after 10 minutes', async () => {
    // Import fresh module
    const { syncGalxeOpportunities } = await import('@/lib/hunter/sync/galxe');

    // Mock Date.now to control time
    const originalDateNow = Date.now;
    let currentTime = originalDateNow();
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

    // Mock fetch
    let fetchCallCount = 0;
    global.fetch = vi.fn(async () => {
      fetchCallCount++;
      return {
        ok: true,
        json: async () => ({
          data: {
            campaigns: {
              pageInfo: {
                endCursor: 'cursor1',
                hasNextPage: false,
              },
              list: [
                {
                  id: `test-campaign-${fetchCallCount}`,
                  name: `Test Campaign ${fetchCallCount}`,
                  description: 'Test description',
                  startTime: Math.floor(currentTime / 1000),
                  endTime: Math.floor(currentTime / 1000) + 86400,
                  status: 'Active',
                  chain: 'ETHEREUM',
                },
              ],
            },
          },
        }),
      } as Response;
    });

    // First call at T=0
    const result1 = await syncGalxeOpportunities(1);
    expect(fetchCallCount).toBe(1);
    expect(result1.total_fetched).toBe(1);

    // Second call at T=5 minutes (within cache window)
    currentTime += 5 * 60 * 1000;
    const result2 = await syncGalxeOpportunities(1);
    expect(fetchCallCount).toBe(1); // Still cached
    expect(result2).toEqual(result1);

    // Third call at T=9 minutes (still within cache window)
    currentTime += 4 * 60 * 1000;
    const result3 = await syncGalxeOpportunities(1);
    expect(fetchCallCount).toBe(1); // Still cached
    expect(result3).toEqual(result1);

    // Fourth call at T=11 minutes (cache expired)
    currentTime += 2 * 60 * 1000;
    const result4 = await syncGalxeOpportunities(1);
    expect(fetchCallCount).toBe(2); // New fetch!
    expect(result4.total_fetched).toBe(1);
    expect(result4).not.toEqual(result1); // Different data

    // Restore Date.now
    vi.spyOn(Date, 'now').mockRestore();
  });

  test('should cache exactly 10 minutes (600000ms)', async () => {
    // Import fresh module
    const { syncGalxeOpportunities } = await import('@/lib/hunter/sync/galxe');

    // Mock Date.now
    const originalDateNow = Date.now;
    let currentTime = originalDateNow();
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

    // Mock fetch
    let fetchCallCount = 0;
    global.fetch = vi.fn(async () => {
      fetchCallCount++;
      return {
        ok: true,
        json: async () => ({
          data: {
            campaigns: {
              pageInfo: {
                endCursor: 'cursor1',
                hasNextPage: false,
              },
              list: [
                {
                  id: 'test-campaign',
                  name: 'Test Campaign',
                  description: 'Test',
                  startTime: Math.floor(currentTime / 1000),
                  endTime: Math.floor(currentTime / 1000) + 86400,
                  status: 'Active',
                  chain: 'ETHEREUM',
                },
              ],
            },
          },
        }),
      } as Response;
    });

    // First call
    await syncGalxeOpportunities(1);
    expect(fetchCallCount).toBe(1);

    // Call at T=599999ms (1ms before expiry) - should use cache
    currentTime += 599999;
    await syncGalxeOpportunities(1);
    expect(fetchCallCount).toBe(1); // Still cached

    // Call at T=600000ms (exactly at expiry) - should refetch
    currentTime += 1;
    await syncGalxeOpportunities(1);
    expect(fetchCallCount).toBe(2); // Cache expired, new fetch

    // Restore Date.now
    vi.spyOn(Date, 'now').mockRestore();
  });

  test('should cache independently per module instance', async () => {
    // Import module twice
    const module1 = await import('@/lib/hunter/sync/galxe');
    
    // Clear and reimport to get fresh instance
    vi.resetModules();
    const module2 = await import('@/lib/hunter/sync/galxe');

    // Mock fetch
    let fetchCallCount = 0;
    global.fetch = vi.fn(async () => {
      fetchCallCount++;
      return {
        ok: true,
        json: async () => ({
          data: {
            campaigns: {
              pageInfo: {
                endCursor: 'cursor1',
                hasNextPage: false,
              },
              list: [
                {
                  id: 'test-campaign',
                  name: 'Test Campaign',
                  description: 'Test',
                  startTime: Math.floor(Date.now() / 1000),
                  endTime: Math.floor(Date.now() / 1000) + 86400,
                  status: 'Active',
                  chain: 'ETHEREUM',
                },
              ],
            },
          },
        }),
      } as Response;
    });

    // Call from module1
    await module1.syncGalxeOpportunities(1);
    expect(fetchCallCount).toBe(1);

    // Call from module2 (fresh instance, no cache)
    await module2.syncGalxeOpportunities(1);
    expect(fetchCallCount).toBe(2); // New fetch because fresh module
  });

  test('should return cached data structure correctly', async () => {
    // Import fresh module
    const { syncGalxeOpportunities } = await import('@/lib/hunter/sync/galxe');

    // Mock fetch
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        data: {
          campaigns: {
            pageInfo: {
              endCursor: 'cursor1',
              hasNextPage: false,
            },
            list: [
              {
                id: 'airdrop-1',
                name: 'Airdrop Campaign',
                description: 'Claim your airdrop',
                startTime: Math.floor(Date.now() / 1000),
                endTime: Math.floor(Date.now() / 1000) + 86400,
                status: 'Active',
                chain: 'ETHEREUM',
              },
              {
                id: 'quest-1',
                name: 'Quest Campaign',
                description: 'Complete tasks',
                startTime: Math.floor(Date.now() / 1000),
                endTime: Math.floor(Date.now() / 1000) + 86400,
                status: 'Active',
                chain: 'BASE',
              },
            ],
          },
        },
      }),
    })) as any;

    // First call
    const result1 = await syncGalxeOpportunities(1);
    expect(result1).toHaveProperty('airdrops');
    expect(result1).toHaveProperty('quests');
    expect(result1).toHaveProperty('total_fetched');
    expect(result1).toHaveProperty('pages_fetched');

    // Second call (cached)
    const result2 = await syncGalxeOpportunities(1);
    
    // Verify structure is preserved
    expect(result2).toHaveProperty('airdrops');
    expect(result2).toHaveProperty('quests');
    expect(result2).toHaveProperty('total_fetched');
    expect(result2).toHaveProperty('pages_fetched');
    
    // Verify data is identical
    expect(result2.airdrops).toEqual(result1.airdrops);
    expect(result2.quests).toEqual(result1.quests);
    expect(result2.total_fetched).toBe(result1.total_fetched);
    expect(result2.pages_fetched).toBe(result1.pages_fetched);
  });

  test('should cache even with different maxPages parameter', async () => {
    // Import fresh module
    const { syncGalxeOpportunities } = await import('@/lib/hunter/sync/galxe');

    // Mock fetch
    let fetchCallCount = 0;
    global.fetch = vi.fn(async () => {
      fetchCallCount++;
      return {
        ok: true,
        json: async () => ({
          data: {
            campaigns: {
              pageInfo: {
                endCursor: 'cursor1',
                hasNextPage: false,
              },
              list: [
                {
                  id: 'test-campaign',
                  name: 'Test Campaign',
                  description: 'Test',
                  startTime: Math.floor(Date.now() / 1000),
                  endTime: Math.floor(Date.now() / 1000) + 86400,
                  status: 'Active',
                  chain: 'ETHEREUM',
                },
              ],
            },
          },
        }),
      } as Response;
    });

    // First call with maxPages=5
    const result1 = await syncGalxeOpportunities(5);
    expect(fetchCallCount).toBe(1);

    // Second call with maxPages=1 - should still use cache
    const result2 = await syncGalxeOpportunities(1);
    expect(fetchCallCount).toBe(1); // Cache hit
    expect(result2).toEqual(result1);

    // Third call with maxPages=10 - should still use cache
    const result3 = await syncGalxeOpportunities(10);
    expect(fetchCallCount).toBe(1); // Cache hit
    expect(result3).toEqual(result1);
  });
});
