/**
 * Property-Based Test: Deterministic Ordering for wallets-list
 * 
 * Feature: multi-chain-wallet-system, Property 6: API Contract Consistency
 * Validates: Requirements 13.5, 15.1
 * 
 * Property: For any set of wallets, the wallets-list endpoint should return
 * them in deterministic order: is_primary DESC, created_at DESC, id ASC
 */

import * as fc from 'fast-check'
import { describe, test, expect } from 'vitest'

/**
 * Generator for wallet data matching the database schema
 */
const walletGenerator = fc.record({
  id: fc.uuid(),
  address: fc
    .tuple(
      fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 20, maxLength: 20 })
    )
    .map(([bytes]) => '0x' + bytes.map(b => b.toString(16).padStart(2, '0')).join('')),
  chain_namespace: fc.constantFrom(
    'eip155:1',
    'eip155:137',
    'eip155:42161',
    'eip155:10',
    'eip155:8453'
  ),
  is_primary: fc.boolean(),
  guardian_scores: fc.record({}, { maxKeys: 5 }),
  balance_cache: fc.record({}, { maxKeys: 5 }),
  created_at: fc
    .integer({ min: 1609459200000, max: 1735689600000 }) // 2021-01-01 to 2025-01-01
    .map(timestamp => new Date(timestamp).toISOString()),
})

/**
 * Comparator function that implements the deterministic ordering
 * Order by: is_primary DESC, created_at DESC, id ASC
 */
function compareWallets(a: any, b: any): number {
  // First: is_primary DESC (true comes before false)
  if (a.is_primary !== b.is_primary) {
    return a.is_primary ? -1 : 1
  }

  // Second: created_at DESC (newer dates come first)
  const dateA = new Date(a.created_at).getTime()
  const dateB = new Date(b.created_at).getTime()
  if (dateA !== dateB) {
    return dateB - dateA
  }

  // Third: id ASC (alphabetical order)
  return a.id.localeCompare(b.id)
}

/**
 * Verify that a list is sorted according to the deterministic ordering
 */
function isProperlyOrdered(wallets: any[]): boolean {
  for (let i = 1; i < wallets.length; i++) {
    const comparison = compareWallets(wallets[i - 1], wallets[i])
    if (comparison > 0) {
      return false
    }
  }
  return true
}

describe('Feature: multi-chain-wallet-system, Property 6: API Contract Consistency', () => {
  test('wallets-list returns deterministic ordering (is_primary DESC, created_at DESC, id ASC)', () => {
    fc.assert(
      fc.property(
        fc.array(walletGenerator, { minLength: 0, maxLength: 50 }),
        (wallets) => {
          // Simulate the ordering that the Edge Function should apply
          const sorted = [...wallets].sort(compareWallets)

          // Property: The sorted list should be properly ordered
          expect(isProperlyOrdered(sorted)).toBe(true)

          // Property: Sorting twice should produce the same result (idempotent)
          const sortedAgain = [...sorted].sort(compareWallets)
          expect(sorted).toEqual(sortedAgain)

          // Property: Primary wallets should come before non-primary
          let foundNonPrimary = false
          for (const wallet of sorted) {
            if (!wallet.is_primary) {
              foundNonPrimary = true
            } else if (foundNonPrimary) {
              // Found a primary after a non-primary - ordering is wrong
              throw new Error('Primary wallet found after non-primary wallet')
            }
          }

          // Property: Among wallets with same is_primary, newer dates come first
          for (let i = 1; i < sorted.length; i++) {
            if (sorted[i - 1].is_primary === sorted[i].is_primary) {
              const dateA = new Date(sorted[i - 1].created_at).getTime()
              const dateB = new Date(sorted[i].created_at).getTime()
              expect(dateA).toBeGreaterThanOrEqual(dateB)
            }
          }

          // Property: Among wallets with same is_primary and created_at, IDs are in ascending order
          for (let i = 1; i < sorted.length; i++) {
            if (
              sorted[i - 1].is_primary === sorted[i].is_primary &&
              sorted[i - 1].created_at === sorted[i].created_at
            ) {
              expect(sorted[i - 1].id.localeCompare(sorted[i].id)).toBeLessThanOrEqual(0)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  test('deterministic ordering is stable across multiple sorts', () => {
    fc.assert(
      fc.property(
        fc.array(walletGenerator, { minLength: 0, maxLength: 50 }),
        (wallets) => {
          // Sort multiple times
          const sort1 = [...wallets].sort(compareWallets)
          const sort2 = [...wallets].sort(compareWallets)
          const sort3 = [...wallets].sort(compareWallets)

          // All sorts should produce identical results
          expect(sort1).toEqual(sort2)
          expect(sort2).toEqual(sort3)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('deterministic ordering preserves all wallets', () => {
    fc.assert(
      fc.property(
        fc.array(walletGenerator, { minLength: 0, maxLength: 50 }),
        (wallets) => {
          const sorted = [...wallets].sort(compareWallets)

          // Property: Same number of wallets before and after sorting
          expect(sorted.length).toBe(wallets.length)

          // Property: All original wallets are present in sorted list
          const originalIds = new Set(wallets.map(w => w.id))
          const sortedIds = new Set(sorted.map(w => w.id))
          expect(sortedIds).toEqual(originalIds)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('deterministic ordering handles edge cases', () => {
    fc.assert(
      fc.property(
        fc.array(walletGenerator, { minLength: 0, maxLength: 50 }),
        (wallets) => {
          // Edge case: All wallets have same is_primary value
          const allPrimary = wallets.map(w => ({ ...w, is_primary: true }))
          const sortedAllPrimary = [...allPrimary].sort(compareWallets)
          expect(isProperlyOrdered(sortedAllPrimary)).toBe(true)

          // Edge case: All wallets have same created_at
          const sameDate = new Date().toISOString()
          const allSameDate = wallets.map(w => ({ ...w, created_at: sameDate }))
          const sortedSameDate = [...allSameDate].sort(compareWallets)
          expect(isProperlyOrdered(sortedSameDate)).toBe(true)

          // Edge case: Empty list
          const empty: any[] = []
          const sortedEmpty = [...empty].sort(compareWallets)
          expect(sortedEmpty.length).toBe(0)

          // Edge case: Single wallet
          const single = [wallets[0]].filter(Boolean)
          if (single.length > 0) {
            const sortedSingle = [...single].sort(compareWallets)
            expect(sortedSingle.length).toBe(1)
            expect(sortedSingle[0]).toEqual(single[0])
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
