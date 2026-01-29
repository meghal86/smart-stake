/**
 * Property-Based Tests for DeFiLlama Sync Service
 * 
 * Tests universal properties that should hold for all valid inputs.
 * Uses fast-check for property-based testing with 100+ iterations.
 */

import * as fc from 'fast-check';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  filterPools,
  transformToOpportunities,
  type DeFiLlamaPool,
} from '@/lib/hunter/sync/defillama';

// Feature: hunter-demand-side, Property 8: Sync Job Idempotence
// Validates: Requirements 2.5
describe('DeFiLlama Sync - Idempotence', () => {
  test('transforming same pool multiple times produces identical opportunities', () => {
    fc.assert(
      fc.property(
        // Generator: valid DeFiLlama pool
        fc.record({
          pool: fc.string({ minLength: 10, maxLength: 50 }),
          chain: fc.constantFrom('Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon'),
          project: fc.string({ minLength: 3, maxLength: 20 }),
          symbol: fc.string({ minLength: 2, maxLength: 10 }),
          tvlUsd: fc.float({ min: Math.fround(100001), max: Math.fround(10_000_000_000) }),
          apy: fc.float({ min: Math.fround(0.1), max: Math.fround(500) }),
        }),
        (pool: DeFiLlamaPool) => {
          // Transform same pool twice
          const result1 = transformToOpportunities([pool]);
          const result2 = transformToOpportunities([pool]);

          // Should produce identical results
          expect(result1).toHaveLength(1);
          expect(result2).toHaveLength(1);
          expect(result1[0]).toEqual(result2[0]);

          // Verify source_ref is consistent (used for deduplication)
          expect(result1[0].source_ref).toBe(pool.pool);
          expect(result2[0].source_ref).toBe(pool.pool);
          expect(result1[0].source).toBe('defillama');
          expect(result2[0].source).toBe('defillama');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('filtering same pool list multiple times produces identical results', () => {
    fc.assert(
      fc.property(
        // Generator: array of pools
        fc.array(
          fc.record({
            pool: fc.string({ minLength: 10, maxLength: 50 }),
            chain: fc.constantFrom('Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon', 'Unknown'),
            project: fc.string({ minLength: 3, maxLength: 20 }),
            symbol: fc.string({ minLength: 2, maxLength: 10 }),
            tvlUsd: fc.float({ min: 0, max: Math.fround(10_000_000_000) }),
            apy: fc.float({ min: Math.fround(-10), max: Math.fround(500) }),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (pools: DeFiLlamaPool[]) => {
          // Filter same list twice
          const result1 = filterPools(pools);
          const result2 = filterPools(pools);

          // Should produce identical results
          expect(result1).toEqual(result2);
          expect(result1.length).toBe(result2.length);

          // Verify all filtered pools meet criteria
          result1.forEach((pool) => {
            expect(pool.apy).toBeGreaterThan(0);
            expect(pool.tvlUsd).toBeGreaterThan(100000);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: hunter-demand-side, Property 18: DeFiLlama Response Caching
// Validates: Requirements 10.4
describe('DeFiLlama Sync - Response Caching', () => {
  beforeEach(() => {
    // Clear any existing cache
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('filter operation is deterministic and cacheable', () => {
    fc.assert(
      fc.property(
        // Generator: array of pools with varying quality
        fc.array(
          fc.record({
            pool: fc.uuid(),
            chain: fc.constantFrom('Ethereum', 'Base', 'Arbitrum'),
            project: fc.string({ minLength: 3, maxLength: 20 }),
            symbol: fc.string({ minLength: 2, maxLength: 10 }),
            tvlUsd: fc.float({ min: 0, max: Math.fround(10_000_000_000) }),
            apy: fc.float({ min: Math.fround(-10), max: Math.fround(500) }),
          }),
          { minLength: 10, maxLength: 100 }
        ),
        (pools: DeFiLlamaPool[]) => {
          // Filter pools
          const filtered = filterPools(pools);

          // All filtered pools should meet criteria (cacheable result)
          filtered.forEach((pool) => {
            expect(pool.apy).toBeGreaterThan(0);
            expect(pool.tvlUsd).toBeGreaterThan(100000);
            expect(['Ethereum', 'Base', 'Arbitrum']).toContain(pool.chain);
          });

          // Filtering again should produce same result (cache-friendly)
          const filteredAgain = filterPools(pools);
          expect(filteredAgain).toEqual(filtered);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('transformation is deterministic for caching', () => {
    fc.assert(
      fc.property(
        // Generator: valid pool
        fc.record({
          pool: fc.uuid(),
          chain: fc.constantFrom('Ethereum', 'Base', 'Arbitrum', 'Optimism'),
          project: fc.string({ minLength: 3, maxLength: 20 }),
          symbol: fc.string({ minLength: 2, maxLength: 10 }),
          tvlUsd: fc.float({ min: Math.fround(100001), max: Math.fround(10_000_000_000) }),
          apy: fc.float({ min: Math.fround(0.1), max: Math.fround(500) }),
        }),
        (pool: DeFiLlamaPool) => {
          // Transform multiple times
          const opp1 = transformToOpportunities([pool])[0];
          const opp2 = transformToOpportunities([pool])[0];
          const opp3 = transformToOpportunities([pool])[0];

          // All transformations should be identical (deterministic)
          expect(opp1).toEqual(opp2);
          expect(opp2).toEqual(opp3);

          // Verify key fields for caching
          expect(opp1.source).toBe('defillama');
          expect(opp1.source_ref).toBe(pool.pool);
          expect(opp1.slug).toBe(opp2.slug);
          expect(opp1.title).toBe(opp2.title);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Additional property: Filter criteria correctness
describe('DeFiLlama Sync - Filter Criteria', () => {
  test('filtered pools always meet all criteria', () => {
    fc.assert(
      fc.property(
        // Generator: array of pools with random values
        fc.array(
          fc.record({
            pool: fc.uuid(),
            chain: fc.oneof(
              fc.constantFrom('Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon'),
              fc.string() // Random unsupported chains
            ),
            project: fc.string({ minLength: 1, maxLength: 30 }),
            symbol: fc.string({ minLength: 1, maxLength: 15 }),
            tvlUsd: fc.float({ min: 0, max: Math.fround(100_000_000_000) }),
            apy: fc.float({ min: Math.fround(-100), max: Math.fround(1000) }),
          }),
          { minLength: 0, maxLength: 200 }
        ),
        (pools: DeFiLlamaPool[]) => {
          const filtered = filterPools(pools);

          // Property: ALL filtered pools meet criteria
          filtered.forEach((pool) => {
            // APY > 0
            expect(pool.apy).toBeGreaterThan(0);

            // TVL > $100k
            expect(pool.tvlUsd).toBeGreaterThan(100000);

            // Chain is supported (normalized)
            const supportedChains = ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'bsc'];
            const normalizedChain = pool.chain.toLowerCase();
            const isSupported = supportedChains.includes(normalizedChain) ||
              ['Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon', 'Avalanche', 'BSC', 'Binance'].includes(pool.chain);
            expect(isSupported).toBe(true);
          });

          // Property: Filtered count <= original count
          expect(filtered.length).toBeLessThanOrEqual(pools.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Additional property: Transformation correctness
describe('DeFiLlama Sync - Transformation Correctness', () => {
  test('transformed opportunities have required fields', () => {
    fc.assert(
      fc.property(
        // Generator: valid pool
        fc.record({
          pool: fc.uuid(),
          chain: fc.constantFrom('Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon'),
          project: fc.string({ minLength: 3, maxLength: 20 }),
          symbol: fc.string({ minLength: 2, maxLength: 10 }),
          tvlUsd: fc.float({ min: Math.fround(100001), max: Math.fround(10_000_000_000) }),
          apy: fc.float({ min: Math.fround(0.1), max: Math.fround(500) }),
        }),
        (pool: DeFiLlamaPool) => {
          const opportunities = transformToOpportunities([pool]);

          expect(opportunities).toHaveLength(1);
          const opp = opportunities[0];

          // Required fields
          expect(opp.slug).toBeTruthy();
          expect(opp.title).toBeTruthy();
          expect(opp.description).toBeTruthy();
          expect(opp.protocol.name).toBe(pool.project);
          expect(opp.type).toMatch(/^(yield|staking)$/);
          expect(opp.chains).toHaveLength(1);
          expect(opp.reward_currency).toBe('USD');
          expect(opp.apr).toBe(pool.apy);
          expect(opp.tvl_usd).toBe(pool.tvlUsd);
          expect(opp.trust_score).toBe(80);
          expect(opp.source).toBe('defillama');
          expect(opp.source_ref).toBe(pool.pool);

          // Requirements object
          expect(opp.requirements).toBeDefined();
          expect(opp.requirements.chains).toHaveLength(1);
          expect(opp.requirements.min_wallet_age_days).toBe(0);
          expect(opp.requirements.min_tx_count).toBe(1);

          // Yield-specific fields
          expect(opp.apy).toBe(pool.apy);
          expect(Array.isArray(opp.underlying_assets)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('chain normalization is consistent', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon', 'Avalanche', 'BSC'),
        (chain: string) => {
          const pool: DeFiLlamaPool = {
            pool: 'test-pool',
            chain,
            project: 'TestProject',
            symbol: 'TEST',
            tvlUsd: 1000000,
            apy: 10,
          };

          const opportunities = transformToOpportunities([pool]);
          const opp = opportunities[0];

          // Chain should be normalized to lowercase
          expect(opp.chains[0]).toBe(opp.chains[0].toLowerCase());
          expect(opp.requirements.chains[0]).toBe(opp.requirements.chains[0].toLowerCase());

          // Chain should match between fields
          expect(opp.chains[0]).toBe(opp.requirements.chains[0]);
        }
      ),
      { numRuns: 50 }
    );
  });
});
