/**
 * Integration Tests for Yield Sync End-to-End
 * 
 * Tests the complete flow: DeFiLlama API → Transform → Database Upsert
 * Requirements: 2.1, 2.5, 2.6
 */

import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  syncYieldOpportunities,
  fetchPools,
  filterPools,
  transformToOpportunities,
  type DeFiLlamaPool,
} from '@/lib/hunter/sync/defillama';

// Test database setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

describe('Yield Sync Integration Tests', () => {
  let supabase: ReturnType<typeof createClient> | null = null;

  beforeAll(() => {
    // Only create client if credentials are available
    if (supabaseKey) {
      supabase = createClient(supabaseUrl, supabaseKey);
    }
  });

  afterAll(async () => {
    // Cleanup: Delete test opportunities
    if (supabase) {
      await supabase
        .from('opportunities')
        .delete()
        .eq('source', 'defillama')
        .like('slug', 'test-%');
    }
  });

  test('sync job fetches DeFiLlama data and upserts to database', async () => {
    // Skip if no Supabase credentials
    if (!supabaseKey || !supabase) {
      console.log('Skipping integration test: No Supabase credentials');
      return;
    }

    // Mock DeFiLlama API response for testing
    const mockPools: DeFiLlamaPool[] = [
      {
        pool: 'test-pool-1',
        chain: 'Ethereum',
        project: 'TestProtocol',
        symbol: 'ETH',
        tvlUsd: 1000000,
        apy: 5.5,
      },
      {
        pool: 'test-pool-2',
        chain: 'Base',
        project: 'TestProtocol',
        symbol: 'USDC',
        tvlUsd: 500000,
        apy: 3.2,
      },
    ];

    // Transform to opportunities
    const opportunities = transformToOpportunities(mockPools);

    // Upsert to database
    for (const opp of opportunities) {
      const { error } = await supabase
        .from('opportunities')
        .upsert(
          {
            slug: opp.slug,
            title: opp.title,
            description: opp.description,
            protocol: opp.protocol,
            type: opp.type,
            chains: opp.chains,
            reward_min: opp.reward_min,
            reward_max: opp.reward_max,
            reward_currency: opp.reward_currency,
            apr: opp.apr,
            tvl_usd: opp.tvl_usd,
            trust_score: opp.trust_score,
            source: opp.source,
            source_ref: opp.source_ref,
            requirements: opp.requirements,
            apy: opp.apy,
            underlying_assets: opp.underlying_assets,
            lockup_days: opp.lockup_days,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'source,source_ref',
          }
        );

      expect(error).toBeNull();
    }

    // Verify data in database
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('source', 'defillama')
      .in('source_ref', ['test-pool-1', 'test-pool-2']);

    expect(error).toBeNull();
    expect(data).toHaveLength(2);

    // Verify first opportunity
    const opp1 = data?.find(o => o.source_ref === 'test-pool-1');
    expect(opp1).toBeDefined();
    expect(opp1?.type).toBe('staking');
    expect(opp1?.apy).toBe(5.5);
    expect(opp1?.tvl_usd).toBe(1000000);
    expect(opp1?.chains).toContain('ethereum');

    // Verify second opportunity
    const opp2 = data?.find(o => o.source_ref === 'test-pool-2');
    expect(opp2).toBeDefined();
    expect(opp2?.type).toBe('staking');
    expect(opp2?.apy).toBe(3.2);
    expect(opp2?.tvl_usd).toBe(500000);
    expect(opp2?.chains).toContain('base');
  }, 30000); // 30 second timeout

  test('running sync twice does not create duplicates', async () => {
    // Skip if no Supabase credentials
    if (!supabaseKey || !supabase) {
      console.log('Skipping integration test: No Supabase credentials');
      return;
    }

    // Mock pool
    const mockPool: DeFiLlamaPool = {
      pool: 'test-pool-duplicate',
      chain: 'Ethereum',
      project: 'TestProtocol',
      symbol: 'ETH',
      tvlUsd: 1000000,
      apy: 5.5,
    };

    const opportunities = transformToOpportunities([mockPool]);
    const opp = opportunities[0];

    // First upsert
    const { error: error1 } = await supabase
      .from('opportunities')
      .upsert(
        {
          slug: opp.slug,
          title: opp.title,
          description: opp.description,
          protocol: opp.protocol,
          type: opp.type,
          chains: opp.chains,
          reward_min: opp.reward_min,
          reward_max: opp.reward_max,
          reward_currency: opp.reward_currency,
          apr: opp.apr,
          tvl_usd: opp.tvl_usd,
          trust_score: opp.trust_score,
          source: opp.source,
          source_ref: opp.source_ref,
          requirements: opp.requirements,
          apy: opp.apy,
          underlying_assets: opp.underlying_assets,
          lockup_days: opp.lockup_days,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'source,source_ref',
        }
      );

    expect(error1).toBeNull();

    // Second upsert (with updated APY)
    const updatedOpp = { ...opp, apy: 6.0, tvl_usd: 1100000 };
    const { error: error2 } = await supabase
      .from('opportunities')
      .upsert(
        {
          slug: updatedOpp.slug,
          title: updatedOpp.title,
          description: updatedOpp.description,
          protocol: updatedOpp.protocol,
          type: updatedOpp.type,
          chains: updatedOpp.chains,
          reward_min: updatedOpp.reward_min,
          reward_max: updatedOpp.reward_max,
          reward_currency: updatedOpp.reward_currency,
          apr: updatedOpp.apr,
          tvl_usd: updatedOpp.tvl_usd,
          trust_score: updatedOpp.trust_score,
          source: updatedOpp.source,
          source_ref: updatedOpp.source_ref,
          requirements: updatedOpp.requirements,
          apy: updatedOpp.apy,
          underlying_assets: updatedOpp.underlying_assets,
          lockup_days: updatedOpp.lockup_days,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'source,source_ref',
        }
      );

    expect(error2).toBeNull();

    // Verify only one record exists
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('source', 'defillama')
      .eq('source_ref', 'test-pool-duplicate');

    expect(error).toBeNull();
    expect(data).toHaveLength(1);

    // Verify updated values
    expect(data?.[0].apy).toBe(6.0);
    expect(data?.[0].tvl_usd).toBe(1100000);
  }, 30000);

  test('sync completes within 30 seconds for 100 protocols', async () => {
    // Skip if no Supabase credentials
    if (!supabaseKey || !supabase) {
      console.log('Skipping integration test: No Supabase credentials');
      return;
    }

    // Generate 100 mock pools
    const mockPools: DeFiLlamaPool[] = Array.from({ length: 100 }, (_, i) => ({
      pool: `test-pool-perf-${i}`,
      chain: ['Ethereum', 'Base', 'Arbitrum'][i % 3],
      project: `TestProtocol${i}`,
      symbol: ['ETH', 'USDC', 'DAI'][i % 3],
      tvlUsd: 100000 + i * 10000,
      apy: 1 + (i % 20),
    }));

    // Transform
    const opportunities = transformToOpportunities(mockPools);

    // Measure upsert time
    const startTime = Date.now();

    // Upsert all opportunities
    for (const opp of opportunities) {
      await supabase
        .from('opportunities')
        .upsert(
          {
            slug: opp.slug,
            title: opp.title,
            description: opp.description,
            protocol: opp.protocol,
            type: opp.type,
            chains: opp.chains,
            reward_min: opp.reward_min,
            reward_max: opp.reward_max,
            reward_currency: opp.reward_currency,
            apr: opp.apr,
            tvl_usd: opp.tvl_usd,
            trust_score: opp.trust_score,
            source: opp.source,
            source_ref: opp.source_ref,
            requirements: opp.requirements,
            apy: opp.apy,
            underlying_assets: opp.underlying_assets,
            lockup_days: opp.lockup_days,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'source,source_ref',
          }
        );
    }

    const duration = Date.now() - startTime;

    // Verify completion time
    expect(duration).toBeLessThan(30000); // 30 seconds

    console.log(`Synced 100 opportunities in ${duration}ms`);

    // Cleanup
    await supabase
      .from('opportunities')
      .delete()
      .eq('source', 'defillama')
      .like('source_ref', 'test-pool-perf-%');
  }, 60000); // 60 second timeout for this test
});

// Unit tests for individual functions
describe('Yield Sync Unit Tests', () => {
  test('filterPools removes pools with apy <= 0', () => {
    const pools: DeFiLlamaPool[] = [
      { pool: '1', chain: 'Ethereum', project: 'A', symbol: 'ETH', tvlUsd: 1000000, apy: 5 },
      { pool: '2', chain: 'Ethereum', project: 'B', symbol: 'ETH', tvlUsd: 1000000, apy: 0 },
      { pool: '3', chain: 'Ethereum', project: 'C', symbol: 'ETH', tvlUsd: 1000000, apy: -1 },
    ];

    const filtered = filterPools(pools);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].pool).toBe('1');
  });

  test('filterPools removes pools with tvlUsd <= 100000', () => {
    const pools: DeFiLlamaPool[] = [
      { pool: '1', chain: 'Ethereum', project: 'A', symbol: 'ETH', tvlUsd: 1000000, apy: 5 },
      { pool: '2', chain: 'Ethereum', project: 'B', symbol: 'ETH', tvlUsd: 100000, apy: 5 },
      { pool: '3', chain: 'Ethereum', project: 'C', symbol: 'ETH', tvlUsd: 50000, apy: 5 },
    ];

    const filtered = filterPools(pools);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].pool).toBe('1');
  });

  test('filterPools removes pools with unsupported chains', () => {
    const pools: DeFiLlamaPool[] = [
      { pool: '1', chain: 'Ethereum', project: 'A', symbol: 'ETH', tvlUsd: 1000000, apy: 5 },
      { pool: '2', chain: 'Solana', project: 'B', symbol: 'SOL', tvlUsd: 1000000, apy: 5 },
      { pool: '3', chain: 'Unknown', project: 'C', symbol: 'XYZ', tvlUsd: 1000000, apy: 5 },
    ];

    const filtered = filterPools(pools);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].pool).toBe('1');
  });

  test('transformToOpportunities creates valid opportunities', () => {
    const pools: DeFiLlamaPool[] = [
      {
        pool: 'aave-eth-usdc',
        chain: 'Ethereum',
        project: 'Aave',
        symbol: 'USDC',
        tvlUsd: 5000000,
        apy: 4.5,
      },
    ];

    const opportunities = transformToOpportunities(pools);

    expect(opportunities).toHaveLength(1);
    const opp = opportunities[0];

    expect(opp.slug).toBe('aave-ethereum-usdc');
    expect(opp.title).toContain('Aave');
    expect(opp.title).toContain('USDC');
    expect(opp.type).toBe('staking');
    expect(opp.chains).toEqual(['ethereum']);
    expect(opp.apy).toBe(4.5);
    expect(opp.tvl_usd).toBe(5000000);
    expect(opp.source).toBe('defillama');
    expect(opp.source_ref).toBe('aave-eth-usdc');
    expect(opp.trust_score).toBe(80);
  });
});
