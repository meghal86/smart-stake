/**
 * Unit tests for primary wallet management utilities
 */

import { describe, test, expect } from 'vitest'
import {
  isValidWalletId,
  findBestPrimaryCandidate,
  getPrimaryWallet,
  isPrimaryWallet,
  type Wallet,
} from '../primary-wallet'

describe('Primary Wallet Utilities', () => {
  describe('isValidWalletId', () => {
    test('returns true for valid UUID', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000'
      expect(isValidWalletId(validUUID)).toBe(true)
    })

    test('returns true for valid UUID with uppercase', () => {
      const validUUID = '550E8400-E29B-41D4-A716-446655440000'
      expect(isValidWalletId(validUUID)).toBe(true)
    })

    test('returns false for invalid UUID format', () => {
      expect(isValidWalletId('not-a-uuid')).toBe(false)
      expect(isValidWalletId('550e8400-e29b-41d4-a716')).toBe(false)
      expect(isValidWalletId('')).toBe(false)
    })

    test('returns false for UUID with invalid characters', () => {
      expect(isValidWalletId('550e8400-e29b-41d4-a716-44665544000g')).toBe(false)
    })
  })

  describe('findBestPrimaryCandidate', () => {
    const mockWallet = (
      id: string,
      chainNamespace: string,
      createdAt: string
    ): Wallet => ({
      id,
      user_id: 'user-123',
      address: '0x' + id.substring(0, 40),
      chain_namespace: chainNamespace,
      is_primary: false,
      created_at: createdAt,
      updated_at: createdAt,
    })

    test('returns null for empty wallet list', () => {
      expect(findBestPrimaryCandidate([])).toBeNull()
    })

    test('prefers eip155:1 (Ethereum mainnet)', () => {
      const wallets = [
        mockWallet('wallet-1', 'eip155:137', '2025-01-01T00:00:00Z'),
        mockWallet('wallet-2', 'eip155:1', '2025-01-02T00:00:00Z'),
        mockWallet('wallet-3', 'eip155:42161', '2025-01-03T00:00:00Z'),
      ]

      expect(findBestPrimaryCandidate(wallets)).toBe('wallet-2')
    })

    test('falls back to oldest created_at when no eip155:1', () => {
      const wallets = [
        mockWallet('wallet-1', 'eip155:137', '2025-01-03T00:00:00Z'),
        mockWallet('wallet-2', 'eip155:42161', '2025-01-01T00:00:00Z'),
        mockWallet('wallet-3', 'eip155:10', '2025-01-02T00:00:00Z'),
      ]

      expect(findBestPrimaryCandidate(wallets)).toBe('wallet-2')
    })

    test('uses smallest id as tiebreaker for same created_at', () => {
      const wallets = [
        mockWallet('wallet-c', 'eip155:137', '2025-01-01T00:00:00Z'),
        mockWallet('wallet-a', 'eip155:42161', '2025-01-01T00:00:00Z'),
        mockWallet('wallet-b', 'eip155:10', '2025-01-01T00:00:00Z'),
      ]

      expect(findBestPrimaryCandidate(wallets)).toBe('wallet-a')
    })

    test('returns single wallet when only one exists', () => {
      const wallets = [mockWallet('wallet-1', 'eip155:137', '2025-01-01T00:00:00Z')]

      expect(findBestPrimaryCandidate(wallets)).toBe('wallet-1')
    })
  })

  describe('getPrimaryWallet', () => {
    const mockWallet = (id: string, isPrimary: boolean): Wallet => ({
      id,
      user_id: 'user-123',
      address: '0x' + id.substring(0, 40),
      chain_namespace: 'eip155:1',
      is_primary: isPrimary,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    })

    test('returns primary wallet when one exists', () => {
      const wallets = [
        mockWallet('wallet-1', false),
        mockWallet('wallet-2', true),
        mockWallet('wallet-3', false),
      ]

      const primary = getPrimaryWallet(wallets)
      expect(primary).not.toBeNull()
      expect(primary?.id).toBe('wallet-2')
    })

    test('returns null when no primary wallet exists', () => {
      const wallets = [
        mockWallet('wallet-1', false),
        mockWallet('wallet-2', false),
        mockWallet('wallet-3', false),
      ]

      expect(getPrimaryWallet(wallets)).toBeNull()
    })

    test('returns null for empty wallet list', () => {
      expect(getPrimaryWallet([])).toBeNull()
    })

    test('returns first primary wallet if multiple exist (edge case)', () => {
      const wallets = [
        mockWallet('wallet-1', true),
        mockWallet('wallet-2', true),
        mockWallet('wallet-3', false),
      ]

      const primary = getPrimaryWallet(wallets)
      expect(primary?.id).toBe('wallet-1')
    })
  })

  describe('isPrimaryWallet', () => {
    const mockWallet = (isPrimary: boolean): Wallet => ({
      id: 'wallet-1',
      user_id: 'user-123',
      address: '0x1234567890123456789012345678901234567890',
      chain_namespace: 'eip155:1',
      is_primary: isPrimary,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    })

    test('returns true when wallet is primary', () => {
      const wallet = mockWallet(true)
      expect(isPrimaryWallet(wallet)).toBe(true)
    })

    test('returns false when wallet is not primary', () => {
      const wallet = mockWallet(false)
      expect(isPrimaryWallet(wallet)).toBe(false)
    })
  })
})
