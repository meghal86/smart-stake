/**
 * Unit Tests for Quota Management
 * 
 * Tests the quota calculation and enforcement logic that counts unique
 * addresses (case-insensitive) per user.
 */

import { describe, test, expect } from 'vitest'
import {
  countUniqueAddresses,
  getQuotaLimit,
  canAddAddress,
  calculateQuota,
  isQuotaReached,
  getUniqueAddresses,
  getNetworksForAddress,
  addressExistsOnNetwork,
  type WalletRow,
} from '../quota'

describe('Quota Management', () => {
  describe('countUniqueAddresses', () => {
    test('counts unique addresses case-insensitively', () => {
      const wallets: WalletRow[] = [
        { id: '1', address: '0xabc123', chain_namespace: 'eip155:1' },
        { id: '2', address: '0xABC123', chain_namespace: 'eip155:137' }, // Same address, different case
        { id: '3', address: '0xdef456', chain_namespace: 'eip155:1' },
      ]

      expect(countUniqueAddresses(wallets)).toBe(2)
    })

    test('returns 0 for empty wallet list', () => {
      expect(countUniqueAddresses([])).toBe(0)
    })

    test('returns 1 for single wallet', () => {
      const wallets: WalletRow[] = [
        { id: '1', address: '0xabc123', chain_namespace: 'eip155:1' },
      ]

      expect(countUniqueAddresses(wallets)).toBe(1)
    })

    test('counts multiple networks for same address as 1 unique address', () => {
      const wallets: WalletRow[] = [
        { id: '1', address: '0xabc123', chain_namespace: 'eip155:1' },
        { id: '2', address: '0xabc123', chain_namespace: 'eip155:137' },
        { id: '3', address: '0xabc123', chain_namespace: 'eip155:42161' },
      ]

      expect(countUniqueAddresses(wallets)).toBe(1)
    })
  })

  describe('getQuotaLimit', () => {
    test('returns correct limit for free plan', () => {
      expect(getQuotaLimit('free')).toBe(5)
    })

    test('returns correct limit for pro plan', () => {
      expect(getQuotaLimit('pro')).toBe(20)
    })

    test('returns correct limit for enterprise plan', () => {
      expect(getQuotaLimit('enterprise')).toBe(1000)
    })

    test('returns free plan limit for unknown plan', () => {
      expect(getQuotaLimit('unknown')).toBe(5)
    })
  })

  describe('canAddAddress', () => {
    test('allows adding new address when under quota', () => {
      const wallets: WalletRow[] = [
        { id: '1', address: '0xabc123', chain_namespace: 'eip155:1' },
      ]

      const result = canAddAddress(wallets, '0xdef456', 'free')

      expect(result.canAdd).toBe(true)
      expect(result.used).toBe(1)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(4)
    })

    test('prevents adding new address when quota reached', () => {
      const wallets: WalletRow[] = [
        { id: '1', address: '0xabc123', chain_namespace: 'eip155:1' },
        { id: '2', address: '0xdef456', chain_namespace: 'eip155:1' },
        { id: '3', address: '0xghi789', chain_namespace: 'eip155:1' },
        { id: '4', address: '0xjkl012', chain_namespace: 'eip155:1' },
        { id: '5', address: '0xmno345', chain_namespace: 'eip155:1' },
      ]

      const result = canAddAddress(wallets, '0xpqr678', 'free')

      expect(result.canAdd).toBe(false)
      expect(result.used).toBe(5)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(0)
    })

    test('allows adding existing address on new network without quota check', () => {
      const wallets: WalletRow[] = [
        { id: '1', address: '0xabc123', chain_namespace: 'eip155:1' },
        { id: '2', address: '0xdef456', chain_namespace: 'eip155:1' },
        { id: '3', address: '0xghi789', chain_namespace: 'eip155:1' },
        { id: '4', address: '0xjkl012', chain_namespace: 'eip155:1' },
        { id: '5', address: '0xmno345', chain_namespace: 'eip155:1' },
      ]

      // Even though quota is reached, adding existing address should be allowed
      const result = canAddAddress(wallets, '0xabc123', 'free')

      expect(result.canAdd).toBe(true)
      expect(result.used).toBe(5)
      expect(result.limit).toBe(5)
    })

    test('handles case-insensitive address matching', () => {
      const wallets: WalletRow[] = [
        { id: '1', address: '0xABC123', chain_namespace: 'eip155:1' },
      ]

      // Try to add same address with different case
      const result = canAddAddress(wallets, '0xabc123', 'free')

      expect(result.canAdd).toBe(true) // Should allow because address already exists
    })
  })

  describe('calculateQuota', () => {
    test('calculates quota correctly', () => {
      const wallets: WalletRow[] = [
        { id: '1', address: '0xabc123', chain_namespace: 'eip155:1' },
        { id: '2', address: '0xabc123', chain_namespace: 'eip155:137' },
        { id: '3', address: '0xdef456', chain_namespace: 'eip155:1' },
      ]

      const quota = calculateQuota(wallets, 'free')

      expect(quota.used_addresses).toBe(2)
      expect(quota.used_rows).toBe(3)
      expect(quota.total).toBe(5)
      expect(quota.plan).toBe('free')
    })

    test('returns zero quota for empty wallet list', () => {
      const quota = calculateQuota([], 'free')

      expect(quota.used_addresses).toBe(0)
      expect(quota.used_rows).toBe(0)
      expect(quota.total).toBe(5)
      expect(quota.plan).toBe('free')
    })
  })

  describe('isQuotaReached', () => {
    test('returns false when under quota', () => {
      const wallets: WalletRow[] = [
        { id: '1', address: '0xabc123', chain_namespace: 'eip155:1' },
        { id: '2', address: '0xdef456', chain_namespace: 'eip155:1' },
      ]

      expect(isQuotaReached(wallets, 'free')).toBe(false)
    })

    test('returns true when quota reached', () => {
      const wallets: WalletRow[] = [
        { id: '1', address: '0xabc123', chain_namespace: 'eip155:1' },
        { id: '2', address: '0xdef456', chain_namespace: 'eip155:1' },
        { id: '3', address: '0xghi789', chain_namespace: 'eip155:1' },
        { id: '4', address: '0xjkl012', chain_namespace: 'eip155:1' },
        { id: '5', address: '0xmno345', chain_namespace: 'eip155:1' },
      ]

      expect(isQuotaReached(wallets, 'free')).toBe(true)
    })

    test('returns false for empty wallet list', () => {
      expect(isQuotaReached([], 'free')).toBe(false)
    })
  })

  describe('getUniqueAddresses', () => {
    test('returns unique addresses in lowercase', () => {
      const wallets: WalletRow[] = [
        { id: '1', address: '0xABC123', chain_namespace: 'eip155:1' },
        { id: '2', address: '0xabc123', chain_namespace: 'eip155:137' },
        { id: '3', address: '0xDEF456', chain_namespace: 'eip155:1' },
      ]

      const unique = getUniqueAddresses(wallets)

      expect(unique).toHaveLength(2)
      expect(unique).toContain('0xabc123')
      expect(unique).toContain('0xdef456')
    })

    test('returns empty array for empty wallet list', () => {
      expect(getUniqueAddresses([])).toEqual([])
    })
  })

  describe('getNetworksForAddress', () => {
    test('returns all networks for a given address', () => {
      const wallets: WalletRow[] = [
        { id: '1', address: '0xabc123', chain_namespace: 'eip155:1' },
        { id: '2', address: '0xabc123', chain_namespace: 'eip155:137' },
        { id: '3', address: '0xabc123', chain_namespace: 'eip155:42161' },
        { id: '4', address: '0xdef456', chain_namespace: 'eip155:1' },
      ]

      const networks = getNetworksForAddress(wallets, '0xabc123')

      expect(networks).toHaveLength(3)
      expect(networks).toContain('eip155:1')
      expect(networks).toContain('eip155:137')
      expect(networks).toContain('eip155:42161')
    })

    test('handles case-insensitive address matching', () => {
      const wallets: WalletRow[] = [
        { id: '1', address: '0xABC123', chain_namespace: 'eip155:1' },
        { id: '2', address: '0xabc123', chain_namespace: 'eip155:137' },
      ]

      const networks = getNetworksForAddress(wallets, '0xAbC123')

      expect(networks).toHaveLength(2)
    })

    test('returns empty array for non-existent address', () => {
      const wallets: WalletRow[] = [
        { id: '1', address: '0xabc123', chain_namespace: 'eip155:1' },
      ]

      const networks = getNetworksForAddress(wallets, '0xdef456')

      expect(networks).toEqual([])
    })
  })

  describe('addressExistsOnNetwork', () => {
    test('returns true when address exists on network', () => {
      const wallets: WalletRow[] = [
        { id: '1', address: '0xabc123', chain_namespace: 'eip155:1' },
        { id: '2', address: '0xabc123', chain_namespace: 'eip155:137' },
      ]

      expect(addressExistsOnNetwork(wallets, '0xabc123', 'eip155:1')).toBe(true)
      expect(addressExistsOnNetwork(wallets, '0xabc123', 'eip155:137')).toBe(true)
    })

    test('returns false when address does not exist on network', () => {
      const wallets: WalletRow[] = [
        { id: '1', address: '0xabc123', chain_namespace: 'eip155:1' },
      ]

      expect(addressExistsOnNetwork(wallets, '0xabc123', 'eip155:137')).toBe(false)
      expect(addressExistsOnNetwork(wallets, '0xdef456', 'eip155:1')).toBe(false)
    })

    test('handles case-insensitive address matching', () => {
      const wallets: WalletRow[] = [
        { id: '1', address: '0xABC123', chain_namespace: 'eip155:1' },
      ]

      expect(addressExistsOnNetwork(wallets, '0xabc123', 'eip155:1')).toBe(true)
      expect(addressExistsOnNetwork(wallets, '0xAbC123', 'eip155:1')).toBe(true)
    })
  })
})
