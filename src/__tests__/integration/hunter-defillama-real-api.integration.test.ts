/**
 * Integration Tests for DeFiLlama Real API Sync
 * 
 * Tests the complete flow with REAL DeFiLlama API:
 * - Fetches real data from DeFiLlama API
 * - Verifies response format and data quality
 * - Tests filtering and transformation
 * - Validates database upsert
 * - Verifies caching behavior
 * 
 * Requirements: 2.1, 2.5, 2.6, 10.4
 * Task: Phase 2 - Verify DeFiLlama data syncs
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  syncYieldOpportunities,
  fetchPools,
  filterPools,
  transformToOpportunities,
  type DeFiLlamaPool,
} from '@/lib/hunter/sync/defillama';

// Test database setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

describe('DeFiLlama Real API Integration Tests', () => {
  let supabase: ReturnType<typeof createClient> | null = null;

  beforeAll(() => {
    // Only create client if credentials are available
    if (supabaseKey && supabaseUrl) {
      supabase = createClient(supabaseUrl, supabaseKey);
    }
  });

  afterAll(async () => {
    // Cleanup: Delete test opportunities created during this test
    if (supabase) {
      // We'll only clean up opportunities with specific test markers
      // Real synced data should remain for manual verification
    }
  });

  test('fetchPools returns real data from DeFiLlama API', async () => {
    console.log('[Test] Fetching real pools from DeFiLlama API...');
    
    const pools = await fetchPools();

    // Verify response structure
    expect(Array.isArray(pools)).toBe(true);
    expect(pools.length).toBeGreaterThan(0);

    console.log(`[Test] Fetched ${pools.length} pools from DeFiLlama`);

    // Verify pool structure
    const samplePool = pools[0];
    expect(samplePool).toHaveProperty('pool');
    expect(samplePool).toHaveProperty('chain');
    expect(samplePool).toHaveProperty('project');
    expect(samplePool).toHaveProperty('symbol');
    expect(samplePool).toHaveProperty('tvlUsd');
    expect(samplePool).toHaveProperty('apy');

    // Verify data types
    expect(typeof samplePool.pool).toBe('string');
    expect(typeof samplePool.chain).toBe('string');
    expect(typeof samplePool.project).toBe('string');
    expect(typeof samplePool.symbol).toBe('string');
    expect(typeof samplePool.tvlUsd).toBe('number');
    expect(typeof samplePool.apy).toBe('number');

    console.log('[Test] Sample pool:', {
      pool: samplePool.pool,
      chain: samplePool.chain,
      project: samplePool.project,
      symbol: samplePool.symbol,
      tvlUsd: samplePool.tvlUsd,
      apy: samplePool.apy,
    });
  }, 30000); // 30 second timeout for API call

  test('filterPools correctly filters real DeFiLlama data', async () => {
    console.log('[Test] Testing filter logic on real data...');
    
    const pools = await fetchPools();
    const filtered = filterPools(pools);

    console.log(`[Test] Filtered ${filtered.length} pools from ${pools.length} total`);

    // Verify all filtered pools meet criteria
    filtered.forEach((pool) => {
      // APY > 0
      expect(pool.apy).toBeGreaterThan(0);

      // TVL > $100k
      expect(pool.tvlUsd).toBeGreaterThan(100000);

      // Chain is supported
      const supportedChains = [
        'Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon', 'Avalanche', 'BSC', 'Binance'
      ];
      const isSupported = supportedChains.includes(pool.chain) ||
        ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'bsc'].includes(pool.chain.toLowerCase());
      expect(isSupported).toBe(true);
    });

    // Verify we have a reasonable number of filtered pools
    expect(filtered.length).toBeGreaterThan(10);
    expect(filtered.length).toBeLessThan(pools.length);

    console.log('[Test] Filter criteria verified for all filtered pools');
  }, 30000);

  test('transformToOpportunities creates valid opportunities from real data', async () => {
    console.log('[Test] Testing transformation on real data...');
    
    const pools = await fetchPools();
    const filtered = filterPools(pools);
    const opportunities = transformToOpportunities(filtered.slice(0, 10)); // Test first 10

    console.log(`[Test] Transformed ${opportunities.length} opportunities`);

    // Verify all opportunities have required fields
    opportunities.forEach((opp) => {
      // Required fields
      expect(opp.slug).toBeTruthy();
      expect(opp.title).toBeTruthy();
      expect(opp.description).toBeTruthy();
      expect(opp.protocol.name).toBeTruthy();
      expect(opp.type).toMatch(/^(yield|staking)$/);
      expect(Array.isArray(opp.chains)).toBe(true);
      expect(opp.chains.length).toBeGreaterThan(0);
      expect(opp.reward_currency).toBe('USD');
      expect(opp.apr).toBeGreaterThan(0);
      expect(opp.tvl_usd).toBeGreaterThan(100000);
      expect(opp.trust_score).toBe(80);
      expect(opp.source).toBe('defillama');
      expect(opp.source_ref).toBeTruthy();

      // Requirements object
      expect(opp.requirements).toBeDefined();
      expect(Array.isArray(opp.requirements.chains)).toBe(true);
      expect(opp.requirements.min_wallet_age_days).toBe(0);
      expect(opp.requirements.min_tx_count).toBe(1);

      // Yield-specific fields
      expect(opp.apy).toBeGreaterThan(0);
      expect(Array.isArray(opp.underlying_assets)).toBe(true);
    });

    console.log('[Test] Sample transformed opportunity:', {
      slug: opportunities[0].slug,
      title: opportunities[0].title,
      type: opportunities[0].type,
      chains: opportunities[0].chains,
      apy: opportunities[0].apy,
      tvl_usd: opportunities[0].tvl_usd,
    });
  }, 30000);

  test('syncYieldOpportunities completes full sync with real API', async () => {
    // Skip if no Supabase credentials
    if (!supabaseKey || !supabaseUrl || !supabase) {
      console.log('[Test] Skipping: No Supabase credentials');
      return;
    }

    console.log('[Test] Running full sync with real DeFiLlama API...');
    
    const startTime = Date.now();
    const result = await syncYieldOpportunities();
    const duration = Date.now() - startTime;

    console.log('[Test] Sync result:', result);
    console.log(`[Test] Sync completed in ${duration}ms`);

    // Verify sync result structure
    expect(result).toHaveProperty('count');
    expect(result).toHaveProperty('source');
    expect(result).toHaveProperty('duration_ms');

    // Verify sync was successful
    expect(result.source).toBe('defillama');
    expect(result.count).toBeGreaterThan(0);
    expect(result.duration_ms).toBeGreaterThan(0);

    // Verify sync completed within reasonable time (30 seconds)
    expect(result.duration_ms).toBeLessThan(30000);

    // Verify data in database
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('source', 'defillama')
      .limit(10);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThan(0);

    console.log(`[Test] Verified ${data!.length} opportunities in database`);

    // Verify sample opportunity structure
    const sampleOpp = data![0];
    expect(sampleOpp.slug).toBeTruthy();
    expect(sampleOpp.title).toBeTruthy();
    expect(sampleOpp.type).toMatch(/^(yield|staking)$/);
    expect(Array.isArray(sampleOpp.chains)).toBe(true);
    expect(sampleOpp.apy).toBeGreaterThan(0);
    expect(sampleOpp.tvl_usd).toBeGreaterThan(100000);
    expect(sampleOpp.source).toBe('defillama');
    expect(sampleOpp.source_ref).toBeTruthy();
    expect(sampleOpp.last_synced_at).toBeTruthy();

    console.log('[Test] Sample database opportunity:', {
      slug: sampleOpp.slug,
      title: sampleOpp.title,
      type: sampleOpp.type,
      chains: sampleOpp.chains,
      apy: sampleOpp.apy,
      tvl_usd: sampleOpp.tvl_usd,
      last_synced_at: sampleOpp.last_synced_at,
    });
  }, 60000); // 60 second timeout for full sync

  test('running sync twice does not create duplicates', async () => {
    // Skip if no Supabase credentials
    if (!supabaseKey || !supabaseUrl || !supabase) {
      console.log('[Test] Skipping: No Supabase credentials');
      return;
    }

    console.log('[Test] Testing deduplication with real API...');

    // Get count before first sync
    const { count: countBefore } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'defillama');

    console.log(`[Test] Opportunities before sync: ${countBefore}`);

    // Run first sync
    const result1 = await syncYieldOpportunities();
    console.log(`[Test] First sync: ${result1.count} opportunities`);

    // Get count after first sync
    const { count: countAfter1 } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'defillama');

    console.log(`[Test] Opportunities after first sync: ${countAfter1}`);

    // Run second sync
    const result2 = await syncYieldOpportunities();
    console.log(`[Test] Second sync: ${result2.count} opportunities`);

    // Get count after second sync
    const { count: countAfter2 } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'defillama');

    console.log(`[Test] Opportunities after second sync: ${countAfter2}`);

    // Verify no duplicates were created
    // Count should be the same or slightly different (if DeFiLlama data changed)
    const difference = Math.abs((countAfter2 || 0) - (countAfter1 || 0));
    expect(difference).toBeLessThan(10); // Allow small variance for real-time data changes

    console.log('[Test] Deduplication verified: no significant duplicate creation');
  }, 120000); // 120 second timeout for two full syncs

  test('caching reduces API calls on subsequent fetches', async () => {
    console.log('[Test] Testing response caching...');

    // First fetch (should hit API)
    const startTime1 = Date.now();
    const pools1 = await fetchPools();
    const duration1 = Date.now() - startTime1;

    console.log(`[Test] First fetch: ${pools1.length} pools in ${duration1}ms`);

    // Second fetch (should use cache)
    const startTime2 = Date.now();
    const pools2 = await fetchPools();
    const duration2 = Date.now() - startTime2;

    console.log(`[Test] Second fetch: ${pools2.length} pools in ${duration2}ms`);

    // Verify same data returned
    expect(pools1.length).toBe(pools2.length);

    // Verify second fetch was fast (cached)
    // Note: Both may be cached if previous tests ran, so we just verify it's fast
    expect(duration2).toBeLessThanOrEqual(100); // Cached response should be <= 100ms

    console.log('[Test] Caching verified: fetch was fast (cached)');
  }, 60000);

  test('sync handles API errors gracefully', async () => {
    console.log('[Test] Testing error handling...');

    // Temporarily override API URL to trigger error
    const originalUrl = process.env.DEFILLAMA_API_URL;
    process.env.DEFILLAMA_API_URL = 'https://invalid-url-that-does-not-exist.com';

    try {
      const result = await syncYieldOpportunities();

      // Verify error is handled gracefully
      expect(result.count).toBe(0);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);

      console.log('[Test] Error handled gracefully:', result.errors);
    } finally {
      // Restore original URL
      if (originalUrl) {
        process.env.DEFILLAMA_API_URL = originalUrl;
      } else {
        delete process.env.DEFILLAMA_API_URL;
      }
    }
  }, 30000);

  test('filtered pools have diverse chains and protocols', async () => {
    console.log('[Test] Testing data diversity...');

    const pools = await fetchPools();
    const filtered = filterPools(pools);

    // Collect unique chains and protocols
    const uniqueChains = new Set(filtered.map(p => p.chain));
    const uniqueProjects = new Set(filtered.map(p => p.project));

    console.log(`[Test] Unique chains: ${uniqueChains.size}`);
    console.log(`[Test] Unique projects: ${uniqueProjects.size}`);
    console.log('[Test] Chains:', Array.from(uniqueChains).slice(0, 10));
    console.log('[Test] Projects:', Array.from(uniqueProjects).slice(0, 10));

    // Verify diversity
    expect(uniqueChains.size).toBeGreaterThan(1);
    expect(uniqueProjects.size).toBeGreaterThan(5);

    // Verify we have supported chains
    const supportedChains = ['Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon'];
    const hasSupportedChain = supportedChains.some(chain => uniqueChains.has(chain));
    expect(hasSupportedChain).toBe(true);

    console.log('[Test] Data diversity verified');
  }, 30000);

  test('APY and TVL values are realistic', async () => {
    console.log('[Test] Testing data quality...');

    const pools = await fetchPools();
    const filtered = filterPools(pools);

    // Calculate statistics
    const apys = filtered.map(p => p.apy);
    const tvls = filtered.map(p => p.tvlUsd);

    const avgApy = apys.reduce((a, b) => a + b, 0) / apys.length;
    const avgTvl = tvls.reduce((a, b) => a + b, 0) / tvls.length;
    const maxApy = Math.max(...apys);
    const minApy = Math.min(...apys);
    const maxTvl = Math.max(...tvls);
    const minTvl = Math.min(...tvls);

    console.log('[Test] APY statistics:', {
      avg: avgApy.toFixed(2),
      min: minApy.toFixed(2),
      max: maxApy.toFixed(2),
    });

    console.log('[Test] TVL statistics:', {
      avg: (avgTvl / 1_000_000).toFixed(2) + 'M',
      min: (minTvl / 1_000_000).toFixed(2) + 'M',
      max: (maxTvl / 1_000_000).toFixed(2) + 'M',
    });

    // Verify realistic ranges
    expect(avgApy).toBeGreaterThan(0);
    expect(avgApy).toBeLessThan(1000); // Reasonable APY range
    expect(minApy).toBeGreaterThan(0); // Filter ensures > 0
    expect(minTvl).toBeGreaterThan(100000); // Filter ensures > $100k

    console.log('[Test] Data quality verified');
  }, 30000);
});
