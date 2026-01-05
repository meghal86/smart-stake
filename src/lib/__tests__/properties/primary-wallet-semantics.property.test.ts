/**
 * Property-Based Tests for Primary Wallet Semantics
 * 
 * Feature: multi-chain-wallet-system
 * Property 11: Primary Wallet Semantics
 * 
 * Validates: Requirements 8.3, 8.4, 8.5, 8.6
 * 
 * Property: For any primary wallet operation, primary should be set at address level
 * with one representative row marked is_primary=true, primary selection should follow
 * network preference order, and primary reassignment should be atomic with deletion.
 * 
 * @vitest-environment node
 */

import * as fc from 'fast-check'
import { describe, test, expect } from 'vitest'
import {
  findBestPrimaryCandidate,
  getPrimaryWallet,
  isPrimaryWallet,
  type Wallet,
} from '../../primary-wallet'

/**
 * Generator for valid wallet objects
 */
const walletGenerator = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  address: fc.hexaString({ minLength: 40, maxLength: 40 }).map(h => '0x' + h),
  chain_namespace: fc.constantFrom('eip155:1', 'eip155:137', 'eip155:42161', 'eip155:10', 'eip155:8453'),
  is_primary: fc.boolean(),
  created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
  updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
})

/**
 * Generator for wallet arrays with at least one wallet
 */
const nonEmptyWalletArrayGenerator = fc.array(walletGenerator, { minLength: 1, maxLength: 10 })

/**
 * Generator for wallet arrays with multiple wallets for same address
 */
const multiNetworkWalletGenerator = fc.tuple(
  fc.uuid(),
  fc.hexaString({ minLength: 40, maxLength: 40 }).map(h => '0x' + h),
  fc.uuid(),
  fc.array(
    fc.constantFrom('eip155:1', 'eip155:137', 'eip155:42161', 'eip155:10', 'eip155:8453'),
    { minLength: 2, maxLength: 5 }
  )
).map(([userId, address, createdAtBase, networks]) => {
  const baseDate = new Date('2025-01-01')
  return networks.map((ns, idx) => ({
    id: fc.sample(fc.uuid(), 1)[0],
    user_id: userId,
    address,
    chain_namespace: ns,
    is_primary: false,
    created_at: new Date(baseDate.getTime() + idx * 1000).toISOString(),
    updated_at: new Date(baseDate.getTime() + idx * 1000).toISOString(),
  }))
})

describe('Feature: multi-chain-wallet-system, Property 11: Primary Wallet Semantics', () => {
  test('primary wallet selection always returns valid candidate or null', () => {
    fc.assert(
      fc.property(nonEmptyWalletArrayGenerator, (wallets) => {
        const candidate = findBestPrimaryCandidate(wallets)

        // Either returns null (empty list) or a valid wallet ID from the list
        if (candidate !== null) {
          const walletIds = wallets.map(w => w.id)
          expect(walletIds).toContain(candidate)
        }
      }),
      { numRuns: 100 }
    )
  })

  test('primary wallet selection prefers eip155:1 when available', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          nonEmptyWalletArrayGenerator,
          fc.boolean()
        ),
        ([wallets, includeEthereum]) => {
          let testWallets = wallets
          
          if (includeEthereum) {
            // Add an Ethereum mainnet wallet
            testWallets = [
              ...wallets,
              {
                id: fc.sample(fc.uuid(), 1)[0],
                user_id: wallets[0].user_id,
                address: wallets[0].address,
                chain_namespace: 'eip155:1',
                is_primary: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]
          }

          const candidate = findBestPrimaryCandidate(testWallets)

          if (includeEthereum && candidate) {
            // Should prefer eip155:1
            const selectedWallet = testWallets.find(w => w.id === candidate)
            expect(selectedWallet?.chain_namespace).toBe('eip155:1')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  test('primary wallet selection falls back to oldest created_at when no eip155:1', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            user_id: fc.uuid(),
            address: fc.hexaString({ minLength: 40, maxLength: 40 }).map(h => '0x' + h),
            chain_namespace: fc.constantFrom('eip155:137', 'eip155:42161', 'eip155:10', 'eip155:8453'),
            is_primary: fc.boolean(),
            created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
            updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
          }),
          { minLength: 1, maxLength: 10 }
        )
      ),
      (wallets) => {
        const candidate = findBestPrimaryCandidate(wallets)

        if (candidate && wallets.length > 0) {
          const selectedWallet = wallets.find(w => w.id === candidate)
          const oldestWallet = wallets.reduce((oldest, current) => {
            const currentDate = new Date(current.created_at).getTime()
            const oldestDate = new Date(oldest.created_at).getTime()
            
            if (currentDate < oldestDate) {
              return current
            } else if (currentDate === oldestDate && current.id < oldest.id) {
              return current
            }
            return oldest
          })

          // Should select the oldest wallet
          expect(selectedWallet?.id).toBe(oldestWallet.id)
        }
      },
      { numRuns: 100 }
    )
  })

  test('getPrimaryWallet returns wallet marked as primary or null', () => {
    fc.assert(
      fc.property(nonEmptyWalletArrayGenerator, (wallets) => {
        const primary = getPrimaryWallet(wallets)

        if (primary) {
          // If primary exists, it should be marked as primary
          expect(primary.is_primary).toBe(true)
          // And should be in the wallet list
          expect(wallets).toContainEqual(primary)
        } else {
          // If no primary returned, no wallet should be marked as primary
          const hasPrimary = wallets.some(w => w.is_primary === true)
          expect(hasPrimary).toBe(false)
        }
      }),
      { numRuns: 100 }
    )
  })

  test('isPrimaryWallet correctly identifies primary wallets', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          user_id: fc.uuid(),
          address: fc.hexaString({ minLength: 40, maxLength: 40 }).map(h => '0x' + h),
          chain_namespace: fc.constantFrom('eip155:1', 'eip155:137'),
          is_primary: fc.boolean(),
          created_at: fc.date().map(d => d.toISOString()),
          updated_at: fc.date().map(d => d.toISOString()),
        })
      ),
      (wallet) => {
        const result = isPrimaryWallet(wallet)
        expect(result).toBe(wallet.is_primary === true)
      },
      { numRuns: 100 }
    )
  })

  test('only one wallet in list can be primary', () => {
    fc.assert(
      fc.property(nonEmptyWalletArrayGenerator, (wallets) => {
        const primaryWallets = wallets.filter(w => w.is_primary === true)
        
        // At most one wallet should be marked as primary
        expect(primaryWallets.length).toBeLessThanOrEqual(1)
      }),
      { numRuns: 100 }
    )
  })

  test('primary candidate selection is deterministic', () => {
    fc.assert(
      fc.property(nonEmptyWalletArrayGenerator, (wallets) => {
        const candidate1 = findBestPrimaryCandidate(wallets)
        const candidate2 = findBestPrimaryCandidate(wallets)

        // Same input should always produce same output
        expect(candidate1).toBe(candidate2)
      }),
      { numRuns: 100 }
    )
  })

  test('empty wallet list returns null candidate', () => {
    const result = findBestPrimaryCandidate([])
    expect(result).toBeNull()
  })

  test('single wallet is selected as primary candidate', () => {
    fc.assert(
      fc.property(walletGenerator, (wallet) => {
        const candidate = findBestPrimaryCandidate([wallet])
        expect(candidate).toBe(wallet.id)
      }),
      { numRuns: 100 }
    )
  })

  test('primary selection respects network preference order', () => {
    // Create wallets with different networks
    const wallets: Wallet[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        user_id: 'user-123',
        address: '0x1234567890123456789012345678901234567890',
        chain_namespace: 'eip155:137', // Polygon
        is_primary: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        user_id: 'user-123',
        address: '0x1234567890123456789012345678901234567890',
        chain_namespace: 'eip155:1', // Ethereum (preferred)
        is_primary: false,
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        user_id: 'user-123',
        address: '0x1234567890123456789012345678901234567890',
        chain_namespace: 'eip155:42161', // Arbitrum
        is_primary: false,
        created_at: '2025-01-03T00:00:00Z',
        updated_at: '2025-01-03T00:00:00Z',
      },
    ]

    const candidate = findBestPrimaryCandidate(wallets)
    
    // Should prefer eip155:1 even though it's not the oldest
    expect(candidate).toBe('550e8400-e29b-41d4-a716-446655440002')
  })
})
