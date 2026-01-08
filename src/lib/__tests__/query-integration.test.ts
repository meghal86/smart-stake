/**
 * Query Integration Tests
 * 
 * Tests for React Query integration and standardized query keys
 * 
 * Feature: multi-chain-wallet-system
 * Task: 11 - React Query Integration
 * Validates: Module Integration Contract
 */

import { describe, test, expect } from 'vitest';
import {
  walletKeys,
  guardianKeys,
  hunterKeys,
  harvestproKeys,
  portfolioKeys,
  priceKeys,
  getWalletDependentQueryKeys,
  getNetworkDependentQueryKeys,
  getWalletAddressDependentQueryKeys,
} from '@/lib/query-keys';

describe('Query Keys - Standardized React Query Keys', () => {
  describe('walletKeys', () => {
    test('registry key is consistent', () => {
      const key1 = walletKeys.registry();
      const key2 = walletKeys.registry();
      expect(key1).toEqual(key2);
      expect(key1).toEqual(['wallets', 'registry']);
    });

    test('byId key includes wallet ID', () => {
      const key = walletKeys.byId('wallet-123');
      expect(key).toEqual(['wallets', 'byId', 'wallet-123']);
    });

    test('byAddress key includes address', () => {
      const key = walletKeys.byAddress('0x1234567890abcdef');
      expect(key).toEqual(['wallets', 'byAddress', '0x1234567890abcdef']);
    });
  });

  describe('guardianKeys', () => {
    test('scan key includes wallet and network', () => {
      const key = guardianKeys.scan('0xabc', 'eip155:1');
      expect(key).toEqual(['guardian', 'scan', '0xabc', 'eip155:1']);
    });

    test('scan key with null wallet', () => {
      const key = guardianKeys.scan(null, 'eip155:1');
      expect(key).toEqual(['guardian', 'scan', null, 'eip155:1']);
    });

    test('scores key includes wallet and network', () => {
      const key = guardianKeys.scores('0xabc', 'eip155:137');
      expect(key).toEqual(['guardian', 'scores', '0xabc', 'eip155:137']);
    });

    test('summary key includes wallet', () => {
      const key = guardianKeys.summary('0xabc');
      expect(key).toEqual(['guardian', 'summary', '0xabc']);
    });
  });

  describe('hunterKeys', () => {
    test('feed key includes wallet and network', () => {
      const key = hunterKeys.feed('0xabc', 'eip155:1');
      expect(key).toEqual(['hunter', 'feed', '0xabc', 'eip155:1']);
    });

    test('opportunities key includes wallet and network', () => {
      const key = hunterKeys.opportunities('0xabc', 'eip155:137');
      expect(key).toEqual(['hunter', 'opportunities', '0xabc', 'eip155:137']);
    });

    test('alerts key includes wallet', () => {
      const key = hunterKeys.alerts('0xabc');
      expect(key).toEqual(['hunter', 'alerts', '0xabc']);
    });
  });

  describe('harvestproKeys', () => {
    test('opportunities key includes wallet and network', () => {
      const key = harvestproKeys.opportunities('0xabc', 'eip155:1');
      expect(key).toEqual(['harvestpro', 'opportunities', '0xabc', 'eip155:1']);
    });

    test('sessions key includes wallet', () => {
      const key = harvestproKeys.sessions('0xabc');
      expect(key).toEqual(['harvestpro', 'sessions', '0xabc']);
    });

    test('session key includes session ID', () => {
      const key = harvestproKeys.session('session-123');
      expect(key).toEqual(['harvestpro', 'session', 'session-123']);
    });
  });

  describe('portfolioKeys', () => {
    test('balances key includes wallet and network', () => {
      const key = portfolioKeys.balances('0xabc', 'eip155:1');
      expect(key).toEqual(['portfolio', 'balances', '0xabc', 'eip155:1']);
    });

    test('summary key includes wallet', () => {
      const key = portfolioKeys.summary('0xabc');
      expect(key).toEqual(['portfolio', 'summary', '0xabc']);
    });

    test('nfts key includes wallet and network', () => {
      const key = portfolioKeys.nfts('0xabc', 'eip155:137');
      expect(key).toEqual(['portfolio', 'nfts', '0xabc', 'eip155:137']);
    });
  });

  describe('priceKeys', () => {
    test('token key includes token ID', () => {
      const key = priceKeys.token('ethereum');
      expect(key).toEqual(['prices', 'token', 'ethereum']);
    });

    test('tokens key includes sorted token IDs', () => {
      const key = priceKeys.tokens(['bitcoin', 'ethereum', 'cardano']);
      expect(key).toEqual(['prices', 'tokens', 'bitcoin', 'cardano', 'ethereum']);
    });

    test('tokens key sorts IDs consistently', () => {
      const key1 = priceKeys.tokens(['ethereum', 'bitcoin']);
      const key2 = priceKeys.tokens(['bitcoin', 'ethereum']);
      expect(key1).toEqual(key2);
    });
  });

  describe('getWalletDependentQueryKeys', () => {
    test('returns all wallet-dependent query keys', () => {
      const keys = getWalletDependentQueryKeys('0xabc', 'eip155:1');
      
      // Should include wallet registry
      expect(keys).toContainEqual(['wallets', 'registry']);
      
      // Should include Guardian keys
      expect(keys).toContainEqual(['guardian', 'scan', '0xabc', 'eip155:1']);
      expect(keys).toContainEqual(['guardian', 'scores', '0xabc', 'eip155:1']);
      expect(keys).toContainEqual(['guardian', 'summary', '0xabc']);
      
      // Should include Hunter keys
      expect(keys).toContainEqual(['hunter', 'feed', '0xabc', 'eip155:1']);
      expect(keys).toContainEqual(['hunter', 'opportunities', '0xabc', 'eip155:1']);
      expect(keys).toContainEqual(['hunter', 'alerts', '0xabc']);
      
      // Should include HarvestPro keys
      expect(keys).toContainEqual(['harvestpro', 'opportunities', '0xabc', 'eip155:1']);
      expect(keys).toContainEqual(['harvestpro', 'sessions', '0xabc']);
      
      // Should include Portfolio keys
      expect(keys).toContainEqual(['portfolio', 'balances', '0xabc', 'eip155:1']);
      expect(keys).toContainEqual(['portfolio', 'summary', '0xabc']);
      expect(keys).toContainEqual(['portfolio', 'nfts', '0xabc', 'eip155:1']);
    });

    test('returns correct number of keys', () => {
      const keys = getWalletDependentQueryKeys('0xabc', 'eip155:1');
      expect(keys.length).toBe(12);
    });
  });

  describe('getNetworkDependentQueryKeys', () => {
    test('returns all network-dependent query keys', () => {
      const keys = getNetworkDependentQueryKeys('0xabc', 'eip155:1');
      
      // Should include network-specific keys
      expect(keys).toContainEqual(['guardian', 'scan', '0xabc', 'eip155:1']);
      expect(keys).toContainEqual(['guardian', 'scores', '0xabc', 'eip155:1']);
      expect(keys).toContainEqual(['hunter', 'feed', '0xabc', 'eip155:1']);
      expect(keys).toContainEqual(['hunter', 'opportunities', '0xabc', 'eip155:1']);
      expect(keys).toContainEqual(['harvestpro', 'opportunities', '0xabc', 'eip155:1']);
      expect(keys).toContainEqual(['portfolio', 'balances', '0xabc', 'eip155:1']);
      expect(keys).toContainEqual(['portfolio', 'nfts', '0xabc', 'eip155:1']);
    });

    test('returns correct number of keys', () => {
      const keys = getNetworkDependentQueryKeys('0xabc', 'eip155:1');
      expect(keys.length).toBe(7);
    });

    test('changes when network changes', () => {
      const keys1 = getNetworkDependentQueryKeys('0xabc', 'eip155:1');
      const keys2 = getNetworkDependentQueryKeys('0xabc', 'eip155:137');
      
      // Keys should be different because network is different
      expect(keys1).not.toEqual(keys2);
      
      // But should have same structure
      expect(keys1.length).toBe(keys2.length);
    });
  });

  describe('getWalletAddressDependentQueryKeys', () => {
    test('returns all wallet address-dependent query keys', () => {
      const keys = getWalletAddressDependentQueryKeys('0xabc');
      
      // Should include wallet registry
      expect(keys).toContainEqual(['wallets', 'registry']);
      expect(keys).toContainEqual(['wallets', 'byAddress', '0xabc']);
      
      // Should include wallet-specific keys
      expect(keys).toContainEqual(['guardian', 'summary', '0xabc']);
      expect(keys).toContainEqual(['hunter', 'alerts', '0xabc']);
      expect(keys).toContainEqual(['harvestpro', 'sessions', '0xabc']);
      expect(keys).toContainEqual(['portfolio', 'summary', '0xabc']);
    });

    test('returns correct number of keys', () => {
      const keys = getWalletAddressDependentQueryKeys('0xabc');
      expect(keys.length).toBe(6);
    });
  });

  describe('Query Key Consistency', () => {
    test('same inputs produce same keys', () => {
      const key1 = guardianKeys.scan('0xabc', 'eip155:1');
      const key2 = guardianKeys.scan('0xabc', 'eip155:1');
      expect(key1).toEqual(key2);
    });

    test('different wallets produce different keys', () => {
      const key1 = guardianKeys.scan('0xabc', 'eip155:1');
      const key2 = guardianKeys.scan('0xdef', 'eip155:1');
      expect(key1).not.toEqual(key2);
    });

    test('different networks produce different keys', () => {
      const key1 = guardianKeys.scan('0xabc', 'eip155:1');
      const key2 = guardianKeys.scan('0xabc', 'eip155:137');
      expect(key1).not.toEqual(key2);
    });

    test('null wallet produces different key than address', () => {
      const key1 = guardianKeys.scan(null, 'eip155:1');
      const key2 = guardianKeys.scan('0xabc', 'eip155:1');
      expect(key1).not.toEqual(key2);
    });
  });
});
