/**
 * Unit Tests for Primary Wallet Management
 * 
 * Tests the primary wallet selection and reassignment logic
 * to ensure address-level primary semantics are maintained.
 * 
 * @see src/lib/primary-wallet.ts
 * @see .kiro/specs/multi-chain-wallet-system/requirements.md - Requirement 8
 */

import { describe, test, expect } from 'vitest'
import {
  findBestPrimaryRepresentative,
  findBestPrimaryReassignmentCandidate,
  hasExactlyOnePrimary,
  getUniqueAddresses,
  getWalletsForAddress,
  verifyAddressLevelPrimarySemantics,
  type WalletRow,
} from '../primary-wallet'

describe('Primary Wallet Management', () => {
  describe('findBestPrimaryRepresentative', () => {
    test('returns null for empty wallet list', () => {
      const result = findBestPrimaryRepresentative([])
      expect(result).toBeNull()
    })

    test('prefers activeNetwork when provided', () => {
      const wallets: WalletRow[] = [
        {
          id: 'wallet-1',
          address: '0xabc',
          chain_namespace: 'eip155:1',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: false,
        },
        {
          id: 'wallet-2',
          address: '0xabc',
          chain_namespace: 'eip155:137',
          created_at: '2025-01-02T00:00:00Z',
          is_primary: false,
        },
      ]

      const result = findBestPrimaryRepresentative(wallets, 'eip155:137')
      expect(result).toBe('wallet-2')
    })

    test('falls back to eip155:1 when activeNetwork not found', () => {
      const wallets: WalletRow[] = [
        {
          id: 'wallet-1',
          address: '0xabc',
          chain_namespace: 'eip155:1',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: false,
        },
        {
          id: 'wallet-2',
          address: '0xabc',
          chain_namespace: 'eip155:137',
          created_at: '2025-01-02T00:00:00Z',
          is_primary: false,
        },
      ]

      const result = findBestPrimaryRepresentative(wallets, 'eip155:42161')
      expect(result).toBe('wallet-1')
    })

    test('selects oldest wallet when no activeNetwork or eip155:1', () => {
      const wallets: WalletRow[] = [
        {
          id: 'wallet-1',
          address: '0xabc',
          chain_namespace: 'eip155:137',
          created_at: '2025-01-02T00:00:00Z',
          is_primary: false,
        },
        {
          id: 'wallet-2',
          address: '0xabc',
          chain_namespace: 'eip155:42161',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: false,
        },
      ]

      const result = findBestPrimaryRepresentative(wallets)
      expect(result).toBe('wallet-2')
    })

    test('uses smallest id as tiebreaker for same created_at', () => {
      const wallets: WalletRow[] = [
        {
          id: 'wallet-b',
          address: '0xabc',
          chain_namespace: 'eip155:137',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: false,
        },
        {
          id: 'wallet-a',
          address: '0xabc',
          chain_namespace: 'eip155:42161',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: false,
        },
      ]

      const result = findBestPrimaryRepresentative(wallets)
      expect(result).toBe('wallet-a')
    })

    test('handles single wallet', () => {
      const wallets: WalletRow[] = [
        {
          id: 'wallet-1',
          address: '0xabc',
          chain_namespace: 'eip155:1',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: false,
        },
      ]

      const result = findBestPrimaryRepresentative(wallets)
      expect(result).toBe('wallet-1')
    })
  })

  describe('findBestPrimaryReassignmentCandidate', () => {
    test('returns null for empty wallet list', () => {
      const result = findBestPrimaryReassignmentCandidate([])
      expect(result).toBeNull()
    })

    test('prefers eip155:1 (Ethereum mainnet)', () => {
      const wallets: WalletRow[] = [
        {
          id: 'wallet-1',
          address: '0xabc',
          chain_namespace: 'eip155:137',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: false,
        },
        {
          id: 'wallet-2',
          address: '0xdef',
          chain_namespace: 'eip155:1',
          created_at: '2025-01-02T00:00:00Z',
          is_primary: false,
        },
      ]

      const result = findBestPrimaryReassignmentCandidate(wallets)
      expect(result).toBe('wallet-2')
    })

    test('selects oldest wallet when no eip155:1', () => {
      const wallets: WalletRow[] = [
        {
          id: 'wallet-1',
          address: '0xabc',
          chain_namespace: 'eip155:137',
          created_at: '2025-01-02T00:00:00Z',
          is_primary: false,
        },
        {
          id: 'wallet-2',
          address: '0xdef',
          chain_namespace: 'eip155:42161',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: false,
        },
      ]

      const result = findBestPrimaryReassignmentCandidate(wallets)
      expect(result).toBe('wallet-2')
    })

    test('uses smallest id as tiebreaker for same created_at', () => {
      const wallets: WalletRow[] = [
        {
          id: 'wallet-b',
          address: '0xabc',
          chain_namespace: 'eip155:137',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: false,
        },
        {
          id: 'wallet-a',
          address: '0xdef',
          chain_namespace: 'eip155:42161',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: false,
        },
      ]

      const result = findBestPrimaryReassignmentCandidate(wallets)
      expect(result).toBe('wallet-a')
    })
  })

  describe('hasExactlyOnePrimary', () => {
    test('returns false for empty list', () => {
      const result = hasExactlyOnePrimary([])
      expect(result).toBe(false)
    })

    test('returns true when exactly one primary', () => {
      const wallets: WalletRow[] = [
        {
          id: 'wallet-1',
          address: '0xabc',
          chain_namespace: 'eip155:1',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: true,
        },
        {
          id: 'wallet-2',
          address: '0xabc',
          chain_namespace: 'eip155:137',
          created_at: '2025-01-02T00:00:00Z',
          is_primary: false,
        },
      ]

      const result = hasExactlyOnePrimary(wallets)
      expect(result).toBe(true)
    })

    test('returns false when no primary', () => {
      const wallets: WalletRow[] = [
        {
          id: 'wallet-1',
          address: '0xabc',
          chain_namespace: 'eip155:1',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: false,
        },
        {
          id: 'wallet-2',
          address: '0xabc',
          chain_namespace: 'eip155:137',
          created_at: '2025-01-02T00:00:00Z',
          is_primary: false,
        },
      ]

      const result = hasExactlyOnePrimary(wallets)
      expect(result).toBe(false)
    })

    test('returns false when multiple primaries', () => {
      const wallets: WalletRow[] = [
        {
          id: 'wallet-1',
          address: '0xabc',
          chain_namespace: 'eip155:1',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: true,
        },
        {
          id: 'wallet-2',
          address: '0xabc',
          chain_namespace: 'eip155:137',
          created_at: '2025-01-02T00:00:00Z',
          is_primary: true,
        },
      ]

      const result = hasExactlyOnePrimary(wallets)
      expect(result).toBe(false)
    })
  })

  describe('getUniqueAddresses', () => {
    test('returns empty array for empty list', () => {
      const result = getUniqueAddresses([])
      expect(result).toEqual([])
    })

    test('returns unique addresses (case-insensitive)', () => {
      const wallets: WalletRow[] = [
        {
          id: 'wallet-1',
          address: '0xABC',
          chain_namespace: 'eip155:1',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: true,
        },
        {
          id: 'wallet-2',
          address: '0xabc',
          chain_namespace: 'eip155:137',
          created_at: '2025-01-02T00:00:00Z',
          is_primary: false,
        },
        {
          id: 'wallet-3',
          address: '0xDEF',
          chain_namespace: 'eip155:1',
          created_at: '2025-01-03T00:00:00Z',
          is_primary: false,
        },
      ]

      const result = getUniqueAddresses(wallets)
      expect(result).toHaveLength(2)
      expect(result).toContain('0xabc')
      expect(result).toContain('0xdef')
    })
  })

  describe('getWalletsForAddress', () => {
    test('returns empty array when no wallets match', () => {
      const wallets: WalletRow[] = [
        {
          id: 'wallet-1',
          address: '0xabc',
          chain_namespace: 'eip155:1',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: true,
        },
      ]

      const result = getWalletsForAddress(wallets, '0xdef')
      expect(result).toEqual([])
    })

    test('returns all wallets for address (case-insensitive)', () => {
      const wallets: WalletRow[] = [
        {
          id: 'wallet-1',
          address: '0xABC',
          chain_namespace: 'eip155:1',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: true,
        },
        {
          id: 'wallet-2',
          address: '0xabc',
          chain_namespace: 'eip155:137',
          created_at: '2025-01-02T00:00:00Z',
          is_primary: false,
        },
        {
          id: 'wallet-3',
          address: '0xdef',
          chain_namespace: 'eip155:1',
          created_at: '2025-01-03T00:00:00Z',
          is_primary: false,
        },
      ]

      const result = getWalletsForAddress(wallets, '0xABC')
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('wallet-1')
      expect(result[1].id).toBe('wallet-2')
    })
  })

  describe('verifyAddressLevelPrimarySemantics', () => {
    test('returns true for valid semantics', () => {
      const wallets: WalletRow[] = [
        {
          id: 'wallet-1',
          address: '0xabc',
          chain_namespace: 'eip155:1',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: true,
        },
        {
          id: 'wallet-2',
          address: '0xabc',
          chain_namespace: 'eip155:137',
          created_at: '2025-01-02T00:00:00Z',
          is_primary: false,
        },
        {
          id: 'wallet-3',
          address: '0xdef',
          chain_namespace: 'eip155:1',
          created_at: '2025-01-03T00:00:00Z',
          is_primary: true,
        },
      ]

      const result = verifyAddressLevelPrimarySemantics(wallets)
      expect(result).toBe(true)
    })

    test('returns false when address has multiple primaries', () => {
      const wallets: WalletRow[] = [
        {
          id: 'wallet-1',
          address: '0xabc',
          chain_namespace: 'eip155:1',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: true,
        },
        {
          id: 'wallet-2',
          address: '0xabc',
          chain_namespace: 'eip155:137',
          created_at: '2025-01-02T00:00:00Z',
          is_primary: true,
        },
      ]

      const result = verifyAddressLevelPrimarySemantics(wallets)
      expect(result).toBe(false)
    })

    test('returns true when address has no primary', () => {
      const wallets: WalletRow[] = [
        {
          id: 'wallet-1',
          address: '0xabc',
          chain_namespace: 'eip155:1',
          created_at: '2025-01-01T00:00:00Z',
          is_primary: false,
        },
        {
          id: 'wallet-2',
          address: '0xabc',
          chain_namespace: 'eip155:137',
          created_at: '2025-01-02T00:00:00Z',
          is_primary: false,
        },
      ]

      const result = verifyAddressLevelPrimarySemantics(wallets)
      expect(result).toBe(true)
    })

    test('returns true for empty list', () => {
      const result = verifyAddressLevelPrimarySemantics([])
      expect(result).toBe(true)
    })
  })
})
