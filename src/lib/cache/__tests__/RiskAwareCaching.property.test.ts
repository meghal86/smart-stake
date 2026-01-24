/**
 * Property-Based Tests for Risk-Aware Caching
 * 
 * Feature: unified-portfolio, Property 25: Risk-Aware Caching
 * Validates: Requirements 10.5
 * 
 * Tests that cache TTL calculation follows severity-based ranges and
 * caching behavior is consistent across all risk levels.
 */

import { describe, test, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { 
  calculateCacheTTL, 
  RiskAwareCacheService, 
  type Severity 
} from '../RiskAwareCacheService'

// ============================================================================
// GENERATORS
// ============================================================================

const severityGenerator = fc.constantFrom('critical', 'high', 'medium', 'low') as fc.Arbitrary<Severity>

const cacheDataGenerator = fc.record({
  id: fc.uuid(),
  value: fc.float({ min: 0, max: 1000000 }),
  timestamp: fc.integer({ min: Date.now() - 86400000, max: Date.now() }).map(ts => new Date(ts).toISOString()),
  metadata: fc.record({
    source: fc.constantFrom('portfolio', 'guardian', 'hunter', 'harvest'),
    confidence: fc.float({ min: 0.5, max: 1.0 })
  })
})

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Feature: unified-portfolio, Property 25: Risk-Aware Caching', () => {
  let cacheService: RiskAwareCacheService

  beforeEach(() => {
    cacheService = new RiskAwareCacheService()
  })

  test('cache TTL calculation respects severity-based ranges', () => {
    fc.assert(
      fc.property(
        severityGenerator,
        (severity) => {
          const ttl = calculateCacheTTL(severity)
          
          // Property: TTL should be within expected ranges for each severity
          switch (severity) {
            case 'critical':
              // 3-10 seconds = 3000-10000ms
              expect(ttl).toBeGreaterThanOrEqual(3000)
              expect(ttl).toBeLessThanOrEqual(10000)
              break
            case 'high':
              // 10-30 seconds = 10000-30000ms
              expect(ttl).toBeGreaterThanOrEqual(10000)
              expect(ttl).toBeLessThanOrEqual(30000)
              break
            case 'medium':
              // 30-60 seconds = 30000-60000ms
              expect(ttl).toBeGreaterThanOrEqual(30000)
              expect(ttl).toBeLessThanOrEqual(60000)
              break
            case 'low':
              // 60-120 seconds = 60000-120000ms
              expect(ttl).toBeGreaterThanOrEqual(60000)
              expect(ttl).toBeLessThanOrEqual(120000)
              break
          }
          
          // Property: TTL should always be a positive integer
          expect(ttl).toBeGreaterThan(0)
          expect(Number.isInteger(ttl)).toBe(true)
        }
      ),
      { numRuns: 1000 } // High iteration count for TTL range validation
    )
  })

  test('cache TTL ordering follows severity hierarchy', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // No input needed, testing deterministic relationships
        () => {
          // Generate multiple TTLs for each severity
          const criticalTTLs = Array.from({ length: 10 }, () => calculateCacheTTL('critical'))
          const highTTLs = Array.from({ length: 10 }, () => calculateCacheTTL('high'))
          const mediumTTLs = Array.from({ length: 10 }, () => calculateCacheTTL('medium'))
          const lowTTLs = Array.from({ length: 10 }, () => calculateCacheTTL('low'))
          
          // Property: Critical TTLs should always be less than high TTLs
          const maxCritical = Math.max(...criticalTTLs)
          const minHigh = Math.min(...highTTLs)
          expect(maxCritical).toBeLessThanOrEqual(minHigh)
          
          // Property: High TTLs should always be less than medium TTLs
          const maxHigh = Math.max(...highTTLs)
          const minMedium = Math.min(...mediumTTLs)
          expect(maxHigh).toBeLessThanOrEqual(minMedium)
          
          // Property: Medium TTLs should always be less than low TTLs
          const maxMedium = Math.max(...mediumTTLs)
          const minLow = Math.min(...lowTTLs)
          expect(maxMedium).toBeLessThanOrEqual(minLow)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('cache operations maintain data integrity', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        cacheDataGenerator,
        severityGenerator,
        (key, data, severity) => {
          // Property: Set then get should return the same data
          cacheService.set(key, data, severity)
          const retrieved = cacheService.get(key)
          
          expect(retrieved).toEqual(data)
          
          // Property: Cache should respect TTL expiration
          // We can't easily test time-based expiration in property tests,
          // but we can verify the data structure is correct
          expect(retrieved).toBeDefined()
          expect(typeof retrieved).toBe('object')
        }
      ),
      { numRuns: 100 }
    )
  })

  test('cache invalidation patterns work correctly', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(
          fc.string({ minLength: 5, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          cacheDataGenerator,
          severityGenerator
        ), { minLength: 1, maxLength: 10 }),
        fc.constantFrom('portfolio', 'guardian', 'hunter', 'harvest', 'user_.*', 'cache_.*'),
        (cacheEntries, invalidationPattern) => {
          // Set up cache entries
          cacheEntries.forEach(([key, data, severity]) => {
            cacheService.set(key, data, severity)
          })
          
          // Count entries before invalidation
          const initialStats = cacheService.getStats()
          const initialCount = initialStats.totalEntries
          
          // Invalidate with pattern
          const invalidatedCount = cacheService.invalidate(invalidationPattern)
          
          // Property: Invalidated count should be non-negative
          expect(invalidatedCount).toBeGreaterThanOrEqual(0)
          
          // Property: Invalidated count should not exceed initial count
          expect(invalidatedCount).toBeLessThanOrEqual(initialCount)
          
          // Property: Remaining entries should equal initial minus invalidated
          const finalStats = cacheService.getStats()
          expect(finalStats.totalEntries).toBe(initialCount - invalidatedCount)
        }
      ),
      { numRuns: 50 }
    )
  })

  test('cache statistics are accurate', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(
          fc.string({ minLength: 1, maxLength: 30 }),
          cacheDataGenerator,
          severityGenerator
        ), { minLength: 0, maxLength: 20 }),
        (cacheEntries) => {
          // Clear cache first
          cacheService.clear()
          
          // Add entries with unique keys to avoid overwrites
          const severityCounts: Record<Severity, number> = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
          }
          
          const uniqueEntries = cacheEntries.filter((entry, index, arr) => 
            arr.findIndex(e => e[0] === entry[0]) === index
          )
          
          uniqueEntries.forEach(([key, data, severity]) => {
            cacheService.set(key, data, severity)
            severityCounts[severity]++
          })
          
          const stats = cacheService.getStats()
          
          // Property: Total entries should match what we added
          expect(stats.totalEntries).toBe(uniqueEntries.length)
          
          // Property: Severity counts should match
          expect(stats.entriesBySeverity.critical).toBe(severityCounts.critical)
          expect(stats.entriesBySeverity.high).toBe(severityCounts.high)
          expect(stats.entriesBySeverity.medium).toBe(severityCounts.medium)
          expect(stats.entriesBySeverity.low).toBe(severityCounts.low)
          
          // Property: Memory usage should be non-negative
          expect(stats.memoryUsage).toBeGreaterThanOrEqual(0)
          
          // Property: Sum of severity counts should equal total
          const severitySum = Object.values(stats.entriesBySeverity).reduce((a, b) => a + b, 0)
          expect(severitySum).toBe(stats.totalEntries)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('cache warming prevents duplicate loading', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
        cacheDataGenerator,
        severityGenerator,
        async (key, expectedData, severity) => {
          let loadCallCount = 0
          
          const dataLoader = async () => {
            loadCallCount++
            // Simulate async loading delay
            await new Promise(resolve => setTimeout(resolve, 10))
            return expectedData
          }
          
          // Warm cache multiple times concurrently
          const warmPromises = Array.from({ length: 3 }, () => 
            cacheService.warmCache(key, dataLoader, severity)
          )
          
          const results = await Promise.all(warmPromises)
          
          // Property: All results should be identical
          results.forEach(result => {
            expect(result).toEqual(expectedData)
          })
          
          // Property: Data loader should be called only once due to warming queue
          expect(loadCallCount).toBe(1)
          
          // Property: Data should be cached after warming
          const cached = cacheService.get(key)
          expect(cached).toEqual(expectedData)
        }
      ),
      { numRuns: 10 } // Lower count due to async nature
    )
  })

  test('critical cache invalidation targets correct patterns', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 42, maxLength: 42 }).map(s => 
          `0x${s.slice(2).replace(/[^0-9a-fA-F]/g, '0')}`
        ), // Generate wallet address
        cacheDataGenerator,
        (walletAddress, data) => {
          // Set up cache entries with wallet-specific keys
          const criticalKeys = [
            `portfolio_snapshot_${walletAddress}`,
            `approval_risks_${walletAddress}`,
            `recommended_actions_${walletAddress}`,
            `guardian_scan_${walletAddress}`,
          ]
          
          const nonCriticalKeys = [
            `other_data_${walletAddress}`,
            `portfolio_snapshot_other_wallet`,
            `general_cache_key`
          ]
          
          // Add all entries to cache
          const allKeys = criticalKeys.concat(nonCriticalKeys)
          allKeys.forEach(key => {
            cacheService.set(key, data, 'medium')
          })
          
          const initialCount = cacheService.getStats().totalEntries
          
          // Invalidate critical caches for this wallet
          const invalidatedCount = cacheService.invalidateCritical(walletAddress)
          
          // Property: Critical keys should be invalidated
          criticalKeys.forEach(key => {
            expect(cacheService.get(key)).toBeNull()
          })
          
          // Property: Non-critical keys should remain (except those that match wallet address)
          const remainingKeys = nonCriticalKeys.filter(key => !key.includes(walletAddress))
          remainingKeys.forEach(key => {
            expect(cacheService.get(key)).toEqual(data)
          })
          
          // Property: Invalidated count should be reasonable
          expect(invalidatedCount).toBeGreaterThanOrEqual(criticalKeys.length)
          expect(invalidatedCount).toBeLessThanOrEqual(initialCount)
        }
      ),
      { numRuns: 50 }
    )
  })
})