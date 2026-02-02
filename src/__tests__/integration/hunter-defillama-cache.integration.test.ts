/**
 * DeFiLlama Cache Integration Tests
 * 
 * Tests the 1-hour (3600000ms) cache TTL for DeFiLlama API responses.
 * Verifies cache hit/miss behavior, expiry, and data preservation.
 * 
 * Requirements: 10.4 (DeFiLlama response caching)
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { fetchPools } from '@/lib/hunter/sync/defillama';

describe('DeFiLlama Cache Integration Tests', () => {
  beforeEach(() => {
    // Clear module cache to reset the in-memory cache
    vi.resetModules();
  });

  test('1. Cache TTL is exactly 1 hour (3600000ms)', async () => {
    // Import fresh module
    const { fetchPools } = await import('@/lib/hunter/sync/defillama');
    
    // Mock fetch to track calls
    let fetchCallCount = 0;
    const mockPools = [
      {
        pool: 'test-pool-1',
        chain: 'Ethereum',
        project: 'Aave',
        symbol: 'USDC',
        tvlUsd: 1000000,
        apy: 5.5,
      },
    ];

    global.fetch = vi.fn(() => {
      fetchCallCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockPools }),
      } as Response);
    });

    // First call - should fetch
    await fetchPools();
    expect(fetchCallCount).toBe(1);

    // Advance time by 59 minutes 59 seconds (3599000ms) - still cached
    vi.setSystemTime(Date.now() + 3599000);
    await fetchPools();
    expect(fetchCallCount).toBe(1); // No new fetch

    // Advance time by 1 more second (total 3600000ms = 1 hour) - cache expired
    vi.setSystemTime(Date.now() + 1000);
    await fetchPools();
    expect(fetchCallCount).toBe(2); // New fetch

    vi.useRealTimers();
  });

  test('2. Multiple calls within 1 hour return cached data', async () => {
    const { fetchPools } = await import('@/lib/hunter/sync/defillama');
    
    let fetchCallCount = 0;
    const mockPools = [
      {
        pool: 'test-pool-2',
        chain: 'Base',
        project: 'Compound',
        symbol: 'ETH',
        tvlUsd: 2000000,
        apy: 3.2,
      },
    ];

    global.fetch = vi.fn(() => {
      fetchCallCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockPools }),
      } as Response);
    });

    // Use fake timers
    vi.useFakeTimers();
    const baseTime = Date.now();

    // First call
    const result1 = await fetchPools();
    expect(fetchCallCount).toBe(1);

    // Second call (10 minutes later)
    vi.setSystemTime(baseTime + 10 * 60 * 1000);
    const result2 = await fetchPools();
    expect(fetchCallCount).toBe(1); // Still cached

    // Third call (30 minutes later)
    vi.setSystemTime(baseTime + 30 * 60 * 1000);
    const result3 = await fetchPools();
    expect(fetchCallCount).toBe(1); // Still cached

    // Fourth call (50 minutes later)
    vi.setSystemTime(baseTime + 50 * 60 * 1000);
    const result4 = await fetchPools();
    expect(fetchCallCount).toBe(1); // Still cached

    // All results should be identical
    expect(result2).toEqual(result1);
    expect(result3).toEqual(result1);
    expect(result4).toEqual(result1);

    vi.useRealTimers();
  });

  test('3. Cache expires after exactly 1 hour and refetches', async () => {
    const { fetchPools } = await import('@/lib/hunter/sync/defillama');
    
    let fetchCallCount = 0;
    const mockPools1 = [
      {
        pool: 'test-pool-3',
        chain: 'Arbitrum',
        project: 'Uniswap',
        symbol: 'USDC-ETH',
        tvlUsd: 5000000,
        apy: 8.5,
      },
    ];
    const mockPools2 = [
      {
        pool: 'test-pool-4',
        chain: 'Optimism',
        project: 'Curve',
        symbol: 'DAI-USDC',
        tvlUsd: 3000000,
        apy: 4.2,
      },
    ];

    global.fetch = vi.fn(() => {
      fetchCallCount++;
      const data = fetchCallCount === 1 ? mockPools1 : mockPools2;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data }),
      } as Response);
    });

    // First call - fetch mockPools1
    const result1 = await fetchPools();
    expect(fetchCallCount).toBe(1);
    expect(result1).toEqual(mockPools1);

    // Advance time by exactly 1 hour (3600000ms)
    vi.setSystemTime(Date.now() + 3600000);

    // Second call - cache expired, fetch mockPools2
    const result2 = await fetchPools();
    expect(fetchCallCount).toBe(2);
    expect(result2).toEqual(mockPools2);
    expect(result2).not.toEqual(result1);

    vi.useRealTimers();
  });

  test('4. Cache at boundary (3599999ms cached, 3600000ms refetch)', async () => {
    const { fetchPools } = await import('@/lib/hunter/sync/defillama');
    
    let fetchCallCount = 0;
    const mockPools = [
      {
        pool: 'test-pool-5',
        chain: 'Polygon',
        project: 'Balancer',
        symbol: 'WMATIC-USDC',
        tvlUsd: 1500000,
        apy: 6.8,
      },
    ];

    global.fetch = vi.fn(() => {
      fetchCallCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockPools }),
      } as Response);
    });

    // Use fake timers
    vi.useFakeTimers();
    const baseTime = Date.now();

    // First call
    await fetchPools();
    expect(fetchCallCount).toBe(1);

    // Advance to 3599999ms (1ms before expiry)
    vi.setSystemTime(baseTime + 3599999);
    await fetchPools();
    expect(fetchCallCount).toBe(1); // Still cached

    // Advance 1ms more to exactly 3600000ms (1 hour)
    vi.setSystemTime(baseTime + 3600000);
    await fetchPools();
    expect(fetchCallCount).toBe(2); // Cache expired, refetch

    vi.useRealTimers();
  });

  test('5. Cached data structure is preserved', async () => {
    const { fetchPools } = await import('@/lib/hunter/sync/defillama');
    
    const mockPools = [
      {
        pool: 'test-pool-6',
        chain: 'Ethereum',
        project: 'Yearn',
        symbol: 'yvUSDC',
        tvlUsd: 10000000,
        apy: 7.3,
        apyBase: 5.0,
        apyReward: 2.3,
        rewardTokens: ['YFI'],
        underlyingTokens: ['USDC'],
        stablecoin: true,
      },
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockPools }),
      } as Response)
    );

    // First call
    const result1 = await fetchPools();

    // Second call (cached)
    vi.setSystemTime(Date.now() + 30 * 60 * 1000); // 30 minutes
    const result2 = await fetchPools();

    // Verify all fields are preserved
    expect(result2).toEqual(result1);
    expect(result2[0]).toEqual(mockPools[0]);
    expect(result2[0].apyBase).toBe(5.0);
    expect(result2[0].apyReward).toBe(2.3);
    expect(result2[0].rewardTokens).toEqual(['YFI']);
    expect(result2[0].underlyingTokens).toEqual(['USDC']);
    expect(result2[0].stablecoin).toBe(true);

    vi.useRealTimers();
  });

  test('6. Cache is independent across different test runs', async () => {
    // This test verifies that cache doesn't leak between test runs
    const { fetchPools } = await import('@/lib/hunter/sync/defillama');
    
    let fetchCallCount = 0;
    const mockPools = [
      {
        pool: 'test-pool-7',
        chain: 'Avalanche',
        project: 'TraderJoe',
        symbol: 'AVAX-USDC',
        tvlUsd: 2500000,
        apy: 9.1,
      },
    ];

    global.fetch = vi.fn(() => {
      fetchCallCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockPools }),
      } as Response);
    });

    // First call in this test
    await fetchPools();
    expect(fetchCallCount).toBe(1);

    // Second call (should be cached)
    vi.setSystemTime(Date.now() + 10 * 60 * 1000);
    await fetchPools();
    expect(fetchCallCount).toBe(1);

    vi.useRealTimers();
  });

  test('7. Cache handles empty response correctly', async () => {
    const { fetchPools } = await import('@/lib/hunter/sync/defillama');
    
    let fetchCallCount = 0;
    const emptyPools: any[] = [];

    global.fetch = vi.fn(() => {
      fetchCallCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: emptyPools }),
      } as Response);
    });

    // First call - empty response
    const result1 = await fetchPools();
    expect(fetchCallCount).toBe(1);
    expect(result1).toEqual([]);

    // Second call (cached)
    vi.setSystemTime(Date.now() + 30 * 60 * 1000);
    const result2 = await fetchPools();
    expect(fetchCallCount).toBe(1); // Still cached
    expect(result2).toEqual([]);

    vi.useRealTimers();
  });

  test('8. Cache handles large datasets efficiently', async () => {
    const { fetchPools } = await import('@/lib/hunter/sync/defillama');
    
    // Generate 1000 mock pools
    const largeMockPools = Array.from({ length: 1000 }, (_, i) => ({
      pool: `test-pool-${i}`,
      chain: 'Ethereum',
      project: `Protocol-${i}`,
      symbol: `TOKEN-${i}`,
      tvlUsd: 100000 + i * 1000,
      apy: 5 + (i % 10),
    }));

    let fetchCallCount = 0;
    global.fetch = vi.fn(() => {
      fetchCallCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: largeMockPools }),
      } as Response);
    });

    // First call
    const startTime1 = Date.now();
    const result1 = await fetchPools();
    const duration1 = Date.now() - startTime1;
    expect(fetchCallCount).toBe(1);
    expect(result1.length).toBe(1000);

    // Second call (cached) - should be much faster
    vi.setSystemTime(Date.now() + 30 * 60 * 1000);
    const startTime2 = Date.now();
    const result2 = await fetchPools();
    const duration2 = Date.now() - startTime2;
    expect(fetchCallCount).toBe(1);
    expect(result2.length).toBe(1000);

    // Cached call should be significantly faster (< 10ms)
    expect(duration2).toBeLessThan(10);

    vi.useRealTimers();
  });

  test('9. Cache survives API errors after initial success', async () => {
    const { fetchPools } = await import('@/lib/hunter/sync/defillama');
    
    const mockPools = [
      {
        pool: 'test-pool-8',
        chain: 'BSC',
        project: 'PancakeSwap',
        symbol: 'CAKE-BNB',
        tvlUsd: 4000000,
        apy: 12.5,
      },
    ];

    let fetchCallCount = 0;
    global.fetch = vi.fn(() => {
      fetchCallCount++;
      if (fetchCallCount === 1) {
        // First call succeeds
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockPools }),
        } as Response);
      } else {
        // Subsequent calls fail (but cache should prevent them)
        return Promise.reject(new Error('Network error'));
      }
    });

    // First call - success
    const result1 = await fetchPools();
    expect(fetchCallCount).toBe(1);
    expect(result1).toEqual(mockPools);

    // Second call (cached) - should not trigger API call
    vi.setSystemTime(Date.now() + 30 * 60 * 1000);
    const result2 = await fetchPools();
    expect(fetchCallCount).toBe(1); // No new fetch
    expect(result2).toEqual(mockPools);

    vi.useRealTimers();
  });

  test('10. Cache expiry triggers new fetch even if previous data exists', async () => {
    const { fetchPools } = await import('@/lib/hunter/sync/defillama');
    
    const mockPools1 = [
      {
        pool: 'test-pool-9',
        chain: 'Ethereum',
        project: 'Lido',
        symbol: 'stETH',
        tvlUsd: 20000000,
        apy: 4.5,
      },
    ];
    const mockPools2 = [
      {
        pool: 'test-pool-10',
        chain: 'Ethereum',
        project: 'Rocket Pool',
        symbol: 'rETH',
        tvlUsd: 15000000,
        apy: 4.8,
      },
    ];

    let fetchCallCount = 0;
    global.fetch = vi.fn(() => {
      fetchCallCount++;
      const data = fetchCallCount === 1 ? mockPools1 : mockPools2;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data }),
      } as Response);
    });

    // First call
    const result1 = await fetchPools();
    expect(fetchCallCount).toBe(1);
    expect(result1).toEqual(mockPools1);

    // Wait 1 hour + 1ms
    vi.setSystemTime(Date.now() + 3600001);

    // Second call - cache expired, should fetch new data
    const result2 = await fetchPools();
    expect(fetchCallCount).toBe(2);
    expect(result2).toEqual(mockPools2);
    expect(result2).not.toEqual(result1);

    vi.useRealTimers();
  });
});
