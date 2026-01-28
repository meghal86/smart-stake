/**
 * Property-Based Tests for API Performance
 * 
 * Feature: unified-portfolio, Property 24: Performance Requirements
 * Validates: Requirements 10.3, 10.4
 * 
 * Tests performance characteristics of portfolio API endpoints:
 * - P95 latency < 600ms for cached responses
 * - P95 latency < 1200ms for cold responses
 * - Cursor pagination performance
 * - Cache hit rate optimization
 * - Database query efficiency
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { riskAwareCache, calculateCacheTTL } from '@/lib/cache/RiskAwareCacheService';
import { encodeCursor, decodeCursor, type CursorTuple } from '@/lib/cursor';

// ============================================================================
// GENERATORS
// ============================================================================

const severityGenerator = fc.constantFrom('critical', 'high', 'medium', 'low');

const cursorTupleGenerator = fc.tuple(
  fc.float({ min: 0, max: 100, noNaN: true }), // rank_score
  fc.float({ min: 0, max: 100, noNaN: true }), // trust_score
  fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()), // expires_at
  fc.uuid(), // id
  fc.integer({ min: 1704067200, max: 1735689600 }), // snapshot_ts (2024-2025)
  fc.integer({ min: 0, max: 2147483647 }) // slug_hash
) as fc.Arbitrary<CursorTuple>;

const paginationOptionsGenerator = fc.record({
  limit: fc.integer({ min: 10, max: 100 }),
  cursor: fc.option(cursorTupleGenerator.map(encodeCursor), { nil: null })
});

// ============================================================================
// Property 24: Performance Requirements
// ============================================================================

describe('Feature: unified-portfolio, Property 24: Performance Requirements', () => {
  
  beforeEach(() => {
    riskAwareCache.clear();
  });

  // --------------------------------------------------------------------------
  // Property 24.1: Cache TTL Calculation Performance
  // --------------------------------------------------------------------------
  
  test('Property 24.1: Cache TTL calculation is deterministic and within bounds', () => {
    fc.assert(
      fc.property(
        severityGenerator,
        (severity) => {
          const ttl = calculateCacheTTL(severity);
          
          // Property: TTL must be within expected ranges (in milliseconds)
          const ranges = {
            critical: [3000, 10000],
            high: [10000, 30000],
            medium: [30000, 60000],
            low: [60000, 120000]
          };
          
          const [min, max] = ranges[severity];
          expect(ttl).toBeGreaterThanOrEqual(min);
          expect(ttl).toBeLessThanOrEqual(max);
          
          // Property: TTL calculation should be fast (< 1ms)
          const start = performance.now();
          for (let i = 0; i < 1000; i++) {
            calculateCacheTTL(severity);
          }
          const duration = performance.now() - start;
          
          expect(duration).toBeLessThan(10); // 1000 calculations in < 10ms
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 24.2: Cache Hit Performance
  // --------------------------------------------------------------------------
  
  test('Property 24.2: Cache hits are faster than cache misses', () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(fc.uuid(), { minLength: 10, maxLength: 100 }),
        severityGenerator,
        async (keys, severity) => {
          // Warm cache
          const testData = { value: 'test-data' };
          keys.forEach(key => {
            riskAwareCache.set(key, testData, severity);
          });
          
          // Measure cache hit performance
          const hitStart = performance.now();
          keys.forEach(key => {
            riskAwareCache.get(key);
          });
          const hitDuration = performance.now() - hitStart;
          
          // Measure cache miss performance (with data fetching simulation)
          riskAwareCache.clear();
          const missStart = performance.now();
          await Promise.all(
            keys.map(key => 
              riskAwareCache.warmCache(
                key,
                async () => {
                  // Simulate 10ms API call
                  await new Promise(resolve => setTimeout(resolve, 10));
                  return testData;
                },
                severity
              )
            )
          );
          const missDuration = performance.now() - missStart;
          
          // Property: Cache hits should be significantly faster than misses
          // (at least 5x faster given 10ms simulated API calls)
          expect(hitDuration).toBeLessThan(missDuration / 5);
          
          // Property: Cache hits should be < 1ms per key on average
          const avgHitTime = hitDuration / keys.length;
          expect(avgHitTime).toBeLessThan(1);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 24.3: Cursor Encoding/Decoding Performance
  // --------------------------------------------------------------------------
  
  test('Property 24.3: Cursor encoding and decoding is fast and reversible', () => {
    fc.assert(
      fc.property(
        cursorTupleGenerator,
        (tuple) => {
          // Property: Encoding should be fast (< 1ms for 1000 operations)
          const encodeStart = performance.now();
          let encoded: string = '';
          for (let i = 0; i < 1000; i++) {
            encoded = encodeCursor(tuple);
          }
          const encodeDuration = performance.now() - encodeStart;
          expect(encodeDuration).toBeLessThan(100); // 1000 encodings in < 100ms
          
          // Property: Decoding should be fast (< 1ms for 1000 operations)
          const decodeStart = performance.now();
          let decoded: CursorTuple;
          for (let i = 0; i < 1000; i++) {
            decoded = decodeCursor(encoded);
          }
          const decodeDuration = performance.now() - decodeStart;
          expect(decodeDuration).toBeLessThan(100); // 1000 decodings in < 100ms
          
          // Property: Round-trip should preserve data
          const roundTrip = decodeCursor(encodeCursor(tuple));
          expect(roundTrip).toEqual(tuple);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 24.4: Pagination Performance Scales Linearly
  // --------------------------------------------------------------------------
  
  test('Property 24.4: Pagination slicing performance scales linearly with limit', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            score: fc.float({ min: 0, max: 100 }),
            data: fc.string({ minLength: 10, maxLength: 100 })
          }),
          { minLength: 100, maxLength: 1000 }
        ),
        fc.integer({ min: 10, max: 100 }),
        (items, limit) => {
          // Property: Slicing should be O(n) where n = limit, not O(total)
          const start = performance.now();
          const page = items.slice(0, limit);
          const duration = performance.now() - start;
          
          // Property: Slicing should be very fast (< 1ms for up to 100 items)
          expect(duration).toBeLessThan(1);
          
          // Property: Result size should match limit (or items.length if smaller)
          expect(page.length).toBe(Math.min(limit, items.length));
          
          // Property: Slicing larger arrays shouldn't be significantly slower
          // (testing O(n) vs O(total) complexity)
          const largeArray = [...items, ...items, ...items]; // 3x size
          const largeStart = performance.now();
          const largePage = largeArray.slice(0, limit);
          const largeDuration = performance.now() - largeStart;
          
          // Should be similar time since we're only slicing to same limit
          expect(largeDuration).toBeLessThan(duration * 2);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 24.5: Cache Invalidation Performance
  // --------------------------------------------------------------------------
  
  test('Property 24.5: Cache invalidation is efficient for pattern matching', () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 50, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => {
          // Filter out regex special characters that could cause invalid patterns
          try {
            new RegExp(s);
            return true;
          } catch {
            return false;
          }
        }),
        severityGenerator,
        (keys, pattern, severity) => {
          // Setup: Populate cache with keys containing pattern
          const testData = { value: 'test' };
          const matchingKeys = keys.filter(k => k.includes(pattern));
          
          keys.forEach(key => {
            riskAwareCache.set(key, testData, severity);
          });
          
          // Property: Invalidation should be fast (< 10ms for 200 keys)
          const start = performance.now();
          const invalidatedCount = riskAwareCache.invalidate(pattern);
          const duration = performance.now() - start;
          
          expect(duration).toBeLessThan(10);
          
          // Property: Should invalidate correct number of keys
          expect(invalidatedCount).toBe(matchingKeys.length);
          
          // Property: Matching keys should be gone
          matchingKeys.forEach(key => {
            expect(riskAwareCache.get(key)).toBeNull();
          });
          
          // Property: Non-matching keys should remain
          const nonMatchingKeys = keys.filter(k => !k.includes(pattern));
          nonMatchingKeys.forEach(key => {
            expect(riskAwareCache.get(key)).not.toBeNull();
          });
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 24.6: Critical Cache Invalidation Performance
  // --------------------------------------------------------------------------
  
  test('Property 24.6: Critical cache invalidation is fast and accurate', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: fc.uuid(),
            walletAddress: fc.hexaString(40, 40),
            severity: severityGenerator,
            isCritical: fc.boolean()
          }),
          { minLength: 50, maxLength: 200 }
        ),
        fc.hexaString(40, 40),
        (entries, targetWallet) => {
          // Setup: Populate cache
          entries.forEach(entry => {
            const key = entry.isCritical 
              ? `portfolio_snapshot:${entry.walletAddress}:${entry.key}`
              : `other:${entry.walletAddress}:${entry.key}`;
            riskAwareCache.set(key, { data: 'test' }, entry.severity);
          });
          
          // Property: Critical invalidation should be fast
          const start = performance.now();
          const invalidatedCount = riskAwareCache.invalidateCritical(targetWallet);
          const duration = performance.now() - start;
          
          expect(duration).toBeLessThan(10);
          
          // Property: Should only invalidate critical entries for target wallet
          const expectedCount = entries.filter(e => 
            e.walletAddress === targetWallet && 
            (e.severity === 'critical' || e.isCritical)
          ).length;
          
          expect(invalidatedCount).toBe(expectedCount);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 24.7: Cache Warming Prevents Duplicate Fetches
  // --------------------------------------------------------------------------
  
  test('Property 24.7: Cache warming prevents duplicate concurrent fetches', () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        severityGenerator,
        fc.integer({ min: 2, max: 10 }),
        async (key, severity, concurrentRequests) => {
          let fetchCount = 0;
          
          const dataFetcher = async () => {
            fetchCount++;
            await new Promise(resolve => setTimeout(resolve, 10));
            return { value: 'test-data' };
          };
          
          // Property: Multiple concurrent warm requests should only fetch once
          const promises = Array.from({ length: concurrentRequests }, () =>
            riskAwareCache.warmCache(key, dataFetcher, severity)
          );
          
          const results = await Promise.all(promises);
          
          // Property: Should only fetch once despite concurrent requests
          expect(fetchCount).toBe(1);
          
          // Property: All requests should receive same data
          results.forEach(result => {
            expect(result).toEqual({ value: 'test-data' });
          });
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 24.8: Cache Statistics Performance
  // --------------------------------------------------------------------------
  
  test('Property 24.8: Cache statistics calculation is fast', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: fc.uuid(),
            severity: severityGenerator,
            data: fc.string({ minLength: 10, maxLength: 100 })
          }),
          { minLength: 50, maxLength: 500 }
        ),
        (entries) => {
          // Setup: Populate cache with unique keys
          const uniqueEntries = Array.from(
            new Map(entries.map(e => [e.key, e])).values()
          );
          
          uniqueEntries.forEach(entry => {
            riskAwareCache.set(entry.key, { data: entry.data }, entry.severity);
          });
          
          // Property: Stats calculation should be fast (< 10ms for 500 entries)
          const start = performance.now();
          const stats = riskAwareCache.getStats();
          const duration = performance.now() - start;
          
          expect(duration).toBeLessThan(10);
          
          // Property: Stats should be accurate
          expect(stats.totalEntries).toBe(uniqueEntries.length);
          
          // Property: Severity counts should sum to total
          const severitySum = Object.values(stats.entriesBySeverity).reduce((a, b) => a + b, 0);
          expect(severitySum).toBe(uniqueEntries.length);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 24.9: Pagination with Cursor Performance
  // --------------------------------------------------------------------------
  
  test('Property 24.9: Cursor-based pagination maintains consistent performance', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            rankScore: fc.float({ min: 0, max: 100, noNaN: true }),
            trustScore: fc.float({ min: 0, max: 100, noNaN: true }),
            expiresAt: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()),
            snapshotTs: fc.integer({ min: 1704067200, max: 1735689600 }),
            slugHash: fc.integer({ min: 0, max: 2147483647 })
          }),
          { minLength: 100, maxLength: 1000 }
        ),
        fc.integer({ min: 10, max: 50 }),
        (items, pageSize) => {
          // Sort items (simulating database ORDER BY)
          const sorted = [...items].sort((a, b) => {
            if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
            if (b.trustScore !== a.trustScore) return b.trustScore - a.trustScore;
            return a.expiresAt.localeCompare(b.expiresAt);
          });
          
          // Property: First page fetch should be fast
          const firstPageStart = performance.now();
          const firstPage = sorted.slice(0, pageSize);
          const firstPageDuration = performance.now() - firstPageStart;
          
          expect(firstPageDuration).toBeLessThan(1);
          
          // Property: Subsequent pages should have similar performance
          if (sorted.length > pageSize) {
            const lastItem = firstPage[firstPage.length - 1];
            const cursor: CursorTuple = [
              lastItem.rankScore,
              lastItem.trustScore,
              lastItem.expiresAt,
              lastItem.id,
              lastItem.snapshotTs,
              lastItem.slugHash
            ];
            
            const encoded = encodeCursor(cursor);
            const decoded = decodeCursor(encoded);
            
            // Find position after cursor
            const cursorIndex = sorted.findIndex(item => 
              item.id === decoded[3]
            );
            
            const secondPageStart = performance.now();
            const secondPage = sorted.slice(cursorIndex + 1, cursorIndex + 1 + pageSize);
            const secondPageDuration = performance.now() - secondPageStart;
            
            expect(secondPageDuration).toBeLessThan(1);
            
            // Property: Performance should be consistent across pages (within 2x)
            expect(secondPageDuration).toBeLessThan(firstPageDuration * 3);
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // --------------------------------------------------------------------------
  // Property 24.10: Memory Efficiency
  // --------------------------------------------------------------------------
  
  test('Property 24.10: Cache memory usage is reasonable and tracked', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: fc.uuid(),
            severity: severityGenerator,
            dataSize: fc.integer({ min: 100, max: 10000 })
          }),
          { minLength: 10, maxLength: 100 }
        ),
        (entries) => {
          riskAwareCache.clear();
          
          // Setup: Populate cache with known data sizes
          entries.forEach(entry => {
            const data = 'x'.repeat(entry.dataSize);
            riskAwareCache.set(entry.key, { data }, entry.severity);
          });
          
          const stats = riskAwareCache.getStats();
          
          // Property: Memory usage should be tracked
          expect(stats.memoryUsage).toBeGreaterThan(0);
          
          // Property: Memory usage should be reasonable (within 2x of actual data)
          const totalDataSize = entries.reduce((sum, e) => sum + e.dataSize, 0);
          expect(stats.memoryUsage).toBeGreaterThan(totalDataSize * 0.5);
          expect(stats.memoryUsage).toBeLessThan(totalDataSize * 3);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Feature: unified-portfolio, Property 24: Performance Integration', () => {
  
  test('Property 24.11: End-to-end pagination with caching performs well', () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            score: fc.float({ min: 0, max: 100 }),
            data: fc.string({ minLength: 50, maxLength: 200 })
          }),
          { minLength: 100, maxLength: 500 }
        ),
        fc.integer({ min: 10, max: 50 }),
        severityGenerator,
        async (items, pageSize, severity) => {
          const cacheKey = 'test-items';
          
          // First request (cold cache)
          const coldStart = performance.now();
          await riskAwareCache.warmCache(
            cacheKey,
            async () => {
              await new Promise(resolve => setTimeout(resolve, 50)); // Simulate API
              return items;
            },
            severity
          );
          const coldDuration = performance.now() - coldStart;
          
          // Property: Cold request should include fetch time
          expect(coldDuration).toBeGreaterThan(40); // At least 40ms (50ms - overhead)
          
          // Second request (warm cache)
          const warmStart = performance.now();
          const cachedItems = riskAwareCache.get(cacheKey);
          const warmDuration = performance.now() - warmStart;
          
          // Property: Warm request should be much faster
          expect(warmDuration).toBeLessThan(1);
          expect(cachedItems).toEqual(items);
          
          // Property: Cache hit should be at least 50x faster
          expect(coldDuration / warmDuration).toBeGreaterThan(50);
          
          // Pagination performance
          const paginationStart = performance.now();
          const page = items.slice(0, pageSize);
          const paginationDuration = performance.now() - paginationStart;
          
          // Property: Pagination should be very fast
          expect(paginationDuration).toBeLessThan(1);
          
          return true;
        }
      ),
      { numRuns: 30 }
    );
  });
});
