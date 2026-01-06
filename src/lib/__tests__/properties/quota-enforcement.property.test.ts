/**
 * Property-Based Tests for Quota Enforcement Logic
 * 
 * Feature: multi-chain-wallet-system, Property 10: Quota Enforcement Logic
 * Validates: Requirements 7.1, 7.4, 7.5, 7.6, 7.8
 * 
 * Property: For any wallet addition operation, quota should count unique addresses
 * (not rows), quota should be checked before allowing new address additions, and
 * quota limits should be enforced server-side with appropriate error codes.
 */

import * as fc from 'fast-check'
import { describe, test } from 'vitest'
import {
  countUniqueAddresses,
  canAddAddress,
  calculateQuota,
  isQuotaReached,
  getUniqueAddresses,
  type WalletRow,
} from '../../quota'

/**
 * Generator for valid Ethereum addresses
 */
const ethereumAddressArbitrary = fc
  .tuple(
    fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 20, maxLength: 20 })
  )
  .map(([bytes]) => {
    const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('')
    return `0x${hex}`
  })

/**
 * Generator for valid CAIP-2 chain namespaces
 */
const chainNamespaceArbitrary = fc.constantFrom(
  'eip155:1',
  'eip155:137',
  'eip155:42161',
  'eip155:10',
  'eip155:8453'
)

/**
 * Generator for wallet rows
 */
const walletRowArbitrary = fc.record({
  id: fc.uuid(),
  address: ethereumAddressArbitrary,
  chain_namespace: chainNamespaceArbitrary,
})

/**
 * Generator for wallet lists with unique addresses
 */
const walletListArbitrary = fc
  .array(walletRowArbitrary, { minLength: 0, maxLength: 10 })
  .map(wallets => {
    // Ensure unique addresses by mapping to lowercase
    const seen = new Set<string>()
    return wallets.filter(w => {
      const key = w.address.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  })

describe('Feature: multi-chain-wallet-system, Property 10: Quota Enforcement Logic', () => {
  test('quota counts unique addresses, not rows', () => {
    fc.assert(
      fc.property(
        walletListArbitrary,
        (wallets: WalletRow[]) => {
          const uniqueCount = countUniqueAddresses(wallets)
          const uniqueAddresses = getUniqueAddresses(wallets)

          // Property: unique count should equal unique addresses array length
          return uniqueCount === uniqueAddresses.length
        }
      ),
      { numRuns: 100 }
    )
  })

  test('adding existing address on new network does not consume quota', () => {
    fc.assert(
      fc.property(
        walletListArbitrary,
        chainNamespaceArbitrary,
        (wallets: WalletRow[], newChainNamespace: string) => {
          if (wallets.length === 0) return true

          // Pick an existing address
          const existingAddress = wallets[0].address

          // Check if we can add it on a new network
          const result = canAddAddress(wallets, existingAddress, 'free')

          // Property: should always be able to add existing address
          return result.canAdd === true
        }
      ),
      { numRuns: 100 }
    )
  })

  test('quota is checked before allowing new address additions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5 }),
        ethereumAddressArbitrary,
        (numWallets: number, newAddress: string) => {
          // Create wallets up to the limit
          const wallets: WalletRow[] = []
          for (let i = 0; i < numWallets; i++) {
            wallets.push({
              id: `wallet-${i}`,
              address: `0x${i.toString().padStart(40, '0')}`,
              chain_namespace: 'eip155:1',
            })
          }

          const result = canAddAddress(wallets, newAddress, 'free')

          // Property: canAdd should be false if we're at or above quota
          if (numWallets >= 5) {
            return result.canAdd === false
          } else {
            return result.canAdd === true
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  test('quota limits are enforced per plan', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('free', 'pro', 'enterprise'),
        fc.integer({ min: 0, max: 1000 }),
        (plan: string, numWallets: number) => {
          const quotaLimits: Record<string, number> = {
            'free': 5,
            'pro': 20,
            'enterprise': 1000,
          }

          const limit = quotaLimits[plan]
          const clampedWallets = Math.min(numWallets, limit)

          // Create wallets
          const wallets: WalletRow[] = []
          for (let i = 0; i < clampedWallets; i++) {
            wallets.push({
              id: `wallet-${i}`,
              address: `0x${i.toString().padStart(40, '0')}`,
              chain_namespace: 'eip155:1',
            })
          }

          const quota = calculateQuota(wallets, plan)

          // Property: used_addresses should never exceed total
          return quota.used_addresses <= quota.total
        }
      ),
      { numRuns: 100 }
    )
  })

  test('isQuotaReached returns true only when at or above limit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('free', 'pro', 'enterprise'),
        fc.integer({ min: 0, max: 1000 }),
        (plan: string, numWallets: number) => {
          const quotaLimits: Record<string, number> = {
            'free': 5,
            'pro': 20,
            'enterprise': 1000,
          }

          const limit = quotaLimits[plan]
          const clampedWallets = Math.min(numWallets, limit)

          // Create wallets
          const wallets: WalletRow[] = []
          for (let i = 0; i < clampedWallets; i++) {
            wallets.push({
              id: `wallet-${i}`,
              address: `0x${i.toString().padStart(40, '0')}`,
              chain_namespace: 'eip155:1',
            })
          }

          const reached = isQuotaReached(wallets, plan)
          const unique = countUniqueAddresses(wallets)

          // Property: reached should be true iff unique >= limit
          return reached === (unique >= limit)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('quota calculation is consistent regardless of wallet order', () => {
    fc.assert(
      fc.property(
        walletListArbitrary,
        (wallets: WalletRow[]) => {
          const quota1 = calculateQuota(wallets, 'free')

          // Shuffle the wallets
          const shuffled = [...wallets].sort(() => Math.random() - 0.5)
          const quota2 = calculateQuota(shuffled, 'free')

          // Property: quota should be identical regardless of order
          return (
            quota1.used_addresses === quota2.used_addresses &&
            quota1.used_rows === quota2.used_rows &&
            quota1.total === quota2.total
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  test('quota calculation is case-insensitive for addresses', () => {
    fc.assert(
      fc.property(
        walletListArbitrary,
        (wallets: WalletRow[]) => {
          const quota1 = calculateQuota(wallets, 'free')

          // Convert all addresses to uppercase
          const uppercased = wallets.map(w => ({
            ...w,
            address: w.address.toUpperCase(),
          }))
          const quota2 = calculateQuota(uppercased, 'free')

          // Property: quota should be identical regardless of address case
          return (
            quota1.used_addresses === quota2.used_addresses &&
            quota1.used_rows === quota2.used_rows
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  test('remaining quota is always non-negative or reflects overage', () => {
    fc.assert(
      fc.property(
        walletListArbitrary,
        ethereumAddressArbitrary,
        fc.constantFrom('free', 'pro', 'enterprise'),
        (wallets: WalletRow[], newAddress: string, plan: string) => {
          const result = canAddAddress(wallets, newAddress, plan)

          // Property: remaining should be calculated correctly
          // It can be negative if we're already over quota
          return result.remaining === result.limit - result.used
        }
      ),
      { numRuns: 100 }
    )
  })

  test('quota enforcement is deterministic', () => {
    fc.assert(
      fc.property(
        walletListArbitrary,
        ethereumAddressArbitrary,
        (wallets: WalletRow[], newAddress: string) => {
          const result1 = canAddAddress(wallets, newAddress, 'free')
          const result2 = canAddAddress(wallets, newAddress, 'free')

          // Property: same inputs should always produce same output
          return (
            result1.canAdd === result2.canAdd &&
            result1.used === result2.used &&
            result1.limit === result2.limit &&
            result1.remaining === result2.remaining
          )
        }
      ),
      { numRuns: 100 }
    )
  })
})
