/**
 * Property-Based Tests for Primary Wallet Semantics
 * 
 * Feature: multi-chain-wallet-system, Property 11: Primary Wallet Semantics
 * Validates: Requirements 8.1-8.7
 * 
 * Tests that primary wallet semantics are maintained across all operations:
 * - Primary is set at address level (one representative row marked)
 * - Primary selection follows network preference order
 * - Primary reassignment is atomic with deletion
 * - Only one primary wallet per user enforced
 * 
 * @see src/lib/primary-wallet.ts
 * @see .kiro/specs/multi-chain-wallet-system/design.md - Property 11
 */

import * as fc from 'fast-check'
import { describe, test, expect } from 'vitest'
import {
  findBestPrimaryRepresentative,
  findBestPrimaryReassignmentCandidate,
  hasExactlyOnePrimary,
  verifyAddressLevelPrimarySemantics,
  type WalletRow,
} from '../../primary-wallet'

// Generators for wallet data
const chainNamespaceGenerator = fc.constantFrom(
  'eip155:1',
  'eip155:137',
  'eip155:42161',
  'eip155:10',
  'eip155:8453'
)

const addressGenerator = fc.hexaString({ minLength: 40, maxLength: 40 }).map(h => '0x' + h)

const walletRowGenerator = (overrides?: Partial<WalletRow>) =>
  fc.record({
    id: fc.uuid(),
    address: addressGenerator,
    chain_namespace: chainNamespaceGenerator,
    created_at: fc.date().map(d => d.toISOString()),
    is_primary: fc.boolean(),
    ...overrides,
  })

const walletListGenerator = fc.array(walletRowGenerator(), { minLength: 1, maxLength: 10 })

describe('Feature: multi-chain-wallet-system, Property 11: Primary Wallet Semantics', () => {
  test('for any wallet list, address-level primary semantics are valid', () => {
    fc.assert(
      fc.property(walletListGenerator, (wallets) => {
        // Property: Address-level semantics should always be valid
        // (each address has at most one primary)
        const isValid = verifyAddressLevelPrimarySemantics(wallets)
        expect(isValid).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  test('for any wallet list, best primary representative is always found or null', () => {
    fc.assert(
      fc.property(walletListGenerator, (wallets) => {
        // Property: findBestPrimaryRepresentative should always return a valid result
        const representative = findBestPrimaryRepresentative(wallets)

        if (wallets.length > 0) {
          // If wallets exist, should find a representative
          expect(representative).not.toBeNull()
          // Representative should be one of the wallet IDs
          expect(wallets.map(w => w.id)).toContain(representative)
        } else {
          // If no wallets, should return null
          expect(representative).toBeNull()
        }
      }),
      { numRuns: 100 }
    )
  })

  test('for any wallet list, best primary representative prefers activeNetwork', () => {
    fc.assert(
      fc.property(
        walletListGenerator,
        chainNamespaceGenerator,
        (wallets, activeNetwork) => {
          const representative = findBestPrimaryRepresentative(wallets, activeNetwork)

          if (representative) {
            const selectedWallet = wallets.find(w => w.id === representative)
            expect(selectedWallet).toBeDefined()

            // If activeNetwork wallet exists, it should be selected
            const activeNetworkWallet = wallets.find(w => w.chain_namespace === activeNetwork)
            if (activeNetworkWallet) {
              expect(representative).toBe(activeNetworkWallet.id)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  test('for any wallet list, best primary representative falls back to eip155:1', () => {
    fc.assert(
      fc.property(
        fc.array(walletRowGenerator(), { minLength: 1, maxLength: 10 }),
        (wallets) => {
          // Filter to wallets that don't have activeNetwork
          const activeNetwork = 'eip155:99999' // Non-existent network
          const representative = findBestPrimaryRepresentative(wallets, activeNetwork)

          if (representative) {
            const selectedWallet = wallets.find(w => w.id === representative)
            expect(selectedWallet).toBeDefined()

            // If eip155:1 exists, it should be selected
            const ethereumWallet = wallets.find(w => w.chain_namespace === 'eip155:1')
            if (ethereumWallet) {
              expect(representative).toBe(ethereumWallet.id)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  test('for any wallet list, best reassignment candidate is always found or null', () => {
    fc.assert(
      fc.property(walletListGenerator, (wallets) => {
        // Property: findBestPrimaryReassignmentCandidate should always return a valid result
        const candidate = findBestPrimaryReassignmentCandidate(wallets)

        if (wallets.length > 0) {
          // If wallets exist, should find a candidate
          expect(candidate).not.toBeNull()
          // Candidate should be one of the wallet IDs
          expect(wallets.map(w => w.id)).toContain(candidate)
        } else {
          // If no wallets, should return null
          expect(candidate).toBeNull()
        }
      }),
      { numRuns: 100 }
    )
  })

  test('for any wallet list, reassignment candidate prefers eip155:1', () => {
    fc.assert(
      fc.property(walletListGenerator, (wallets) => {
        const candidate = findBestPrimaryReassignmentCandidate(wallets)

        if (candidate) {
          const selectedWallet = wallets.find(w => w.id === candidate)
          expect(selectedWallet).toBeDefined()

          // If eip155:1 exists, it should be selected
          const ethereumWallet = wallets.find(w => w.chain_namespace === 'eip155:1')
          if (ethereumWallet) {
            expect(candidate).toBe(ethereumWallet.id)
          }
        }
      }),
      { numRuns: 100 }
    )
  })

  test('for any wallet list with exactly one primary, hasExactlyOnePrimary returns true', () => {
    fc.assert(
      fc.property(
        fc.array(walletRowGenerator({ is_primary: false }), { minLength: 0, maxLength: 9 }),
        fc.integer({ min: 0, max: 9 }),
        (nonPrimaryWallets, insertIndex) => {
          // Create a list with exactly one primary
          const primaryWallet = walletRowGenerator({ is_primary: true }).generate(fc.random.createRandom())
          const wallets = [
            ...nonPrimaryWallets.slice(0, insertIndex),
            primaryWallet,
            ...nonPrimaryWallets.slice(insertIndex),
          ]

          const result = hasExactlyOnePrimary(wallets)
          expect(result).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('for any wallet list with zero or multiple primaries, hasExactlyOnePrimary returns false', () => {
    fc.assert(
      fc.property(
        fc.array(walletRowGenerator(), { minLength: 1, maxLength: 10 }),
        (wallets) => {
          // Ensure we have either 0 or 2+ primaries
          const primaryCount = wallets.filter(w => w.is_primary).length

          if (primaryCount === 1) {
            // Skip this case - we want 0 or 2+
            return true
          }

          const result = hasExactlyOnePrimary(wallets)
          expect(result).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('for any wallet list, each address has at most one primary', () => {
    fc.assert(
      fc.property(walletListGenerator, (wallets) => {
        // Group wallets by address (case-insensitive)
        const addressGroups = new Map<string, WalletRow[]>()

        for (const wallet of wallets) {
          const lowerAddress = wallet.address.toLowerCase()
          if (!addressGroups.has(lowerAddress)) {
            addressGroups.set(lowerAddress, [])
          }
          addressGroups.get(lowerAddress)!.push(wallet)
        }

        // Property: Each address should have at most one primary
        for (const [address, addressWallets] of addressGroups) {
          const primaryCount = addressWallets.filter(w => w.is_primary).length
          expect(primaryCount).toBeLessThanOrEqual(1)
        }
      }),
      { numRuns: 100 }
    )
  })

  test('for any wallet list, representative selection is deterministic', () => {
    fc.assert(
      fc.property(walletListGenerator, chainNamespaceGenerator, (wallets, activeNetwork) => {
        // Property: Same input should always produce same output
        const result1 = findBestPrimaryRepresentative(wallets, activeNetwork)
        const result2 = findBestPrimaryRepresentative(wallets, activeNetwork)

        expect(result1).toBe(result2)
      }),
      { numRuns: 100 }
    )
  })

  test('for any wallet list, reassignment candidate selection is deterministic', () => {
    fc.assert(
      fc.property(walletListGenerator, (wallets) => {
        // Property: Same input should always produce same output
        const result1 = findBestPrimaryReassignmentCandidate(wallets)
        const result2 = findBestPrimaryReassignmentCandidate(wallets)

        expect(result1).toBe(result2)
      }),
      { numRuns: 100 }
    )
  })

  test('for any wallet list, representative is always from the input list', () => {
    fc.assert(
      fc.property(walletListGenerator, (wallets) => {
        const representative = findBestPrimaryRepresentative(wallets)

        if (representative) {
          // Property: Representative must be one of the wallet IDs
          const walletIds = wallets.map(w => w.id)
          expect(walletIds).toContain(representative)
        }
      }),
      { numRuns: 100 }
    )
  })

  test('for any wallet list, reassignment candidate is always from the input list', () => {
    fc.assert(
      fc.property(walletListGenerator, (wallets) => {
        const candidate = findBestPrimaryReassignmentCandidate(wallets)

        if (candidate) {
          // Property: Candidate must be one of the wallet IDs
          const walletIds = wallets.map(w => w.id)
          expect(walletIds).toContain(candidate)
        }
      }),
      { numRuns: 100 }
    )
  })
})
