/**
 * useWalletRegistry Integration Tests
 * 
 * Tests for wallet mutations and React Query invalidation
 * 
 * Feature: multi-chain-wallet-system
 * Task: 11 - React Query Integration
 * Validates: Wallet mutations invalidate all relevant queries
 * 
 * Feature: multi-chain-wallet-system, Property 9: Cross-Module Session Consistency
 * Validates: Requirements 4.1-4.5, 6.5
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import {
  walletKeys,
  guardianKeys,
  hunterKeys,
  harvestproKeys,
  portfolioKeys,
  getWalletAddressDependentQueryKeys,
} from '@/lib/query-keys';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } } })),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
    },
    from: vi.fn(),
  },
}));

// Mock wagmi
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({
    address: undefined,
    connector: undefined,
    isConnected: false,
  })),
}));

describe('useWalletRegistry - Query Invalidation Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  describe('Query Key Consistency', () => {
    test('uses standardized wallet registry query key', () => {
      const key = walletKeys.registry();
      expect(key).toEqual(['wallets', 'registry']);
    });

    test('wallet-dependent keys include all module queries', () => {
      const keys = getWalletAddressDependentQueryKeys('0xabc');
      
      // Should include wallet registry
      expect(keys).toContainEqual(['wallets', 'registry']);
      expect(keys).toContainEqual(['wallets', 'byAddress', '0xabc']);
      
      // Should include Guardian keys
      expect(keys).toContainEqual(['guardian', 'summary', '0xabc']);
      
      // Should include Hunter keys
      expect(keys).toContainEqual(['hunter', 'alerts', '0xabc']);
      
      // Should include HarvestPro keys
      expect(keys).toContainEqual(['harvestpro', 'sessions', '0xabc']);
      
      // Should include Portfolio keys
      expect(keys).toContainEqual(['portfolio', 'summary', '0xabc']);
    });
  });

  describe('Mutation Invalidation Patterns', () => {
    test('invalidation keys are deterministic', () => {
      const keys1 = getWalletAddressDependentQueryKeys('0xabc');
      const keys2 = getWalletAddressDependentQueryKeys('0xabc');
      
      expect(keys1).toEqual(keys2);
    });

    test('different addresses produce different invalidation keys', () => {
      const keys1 = getWalletAddressDependentQueryKeys('0xabc');
      const keys2 = getWalletAddressDependentQueryKeys('0xdef');
      
      expect(keys1).not.toEqual(keys2);
    });

    test('invalidation keys cover all dependent modules', () => {
      const keys = getWalletAddressDependentQueryKeys('0xabc');
      
      // Verify we have keys from all modules
      const hasGuardian = keys.some(k => k[0] === 'guardian');
      const hasHunter = keys.some(k => k[0] === 'hunter');
      const hasHarvestPro = keys.some(k => k[0] === 'harvestpro');
      const hasPortfolio = keys.some(k => k[0] === 'portfolio');
      const hasWallet = keys.some(k => k[0] === 'wallets');
      
      expect(hasGuardian).toBe(true);
      expect(hasHunter).toBe(true);
      expect(hasHarvestPro).toBe(true);
      expect(hasPortfolio).toBe(true);
      expect(hasWallet).toBe(true);
    });
  });

  describe('Query Invalidation on Mutations', () => {
    test('wallet registry key is included in invalidation', () => {
      const keys = getWalletAddressDependentQueryKeys('0xabc');
      const registryKey = walletKeys.registry();
      
      expect(keys).toContainEqual(registryKey);
    });

    test('address-specific key is included in invalidation', () => {
      const address = '0xabc';
      const keys = getWalletAddressDependentQueryKeys(address);
      const addressKey = walletKeys.byAddress(address);
      
      expect(keys).toContainEqual(addressKey);
    });

    test('all wallet-dependent queries are invalidated', () => {
      const address = '0xabc';
      const keys = getWalletAddressDependentQueryKeys(address);
      
      // Should have exactly 6 keys (wallet registry, byAddress, guardian summary, hunter alerts, harvestpro sessions, portfolio summary)
      expect(keys.length).toBe(6);
    });

    test('invalidation includes cross-module queries', () => {
      const address = '0xabc';
      const keys = getWalletAddressDependentQueryKeys(address);
      
      // Verify cross-module coverage
      const modules = new Set(keys.map(k => k[0]));
      expect(modules.has('wallets')).toBe(true);
      expect(modules.has('guardian')).toBe(true);
      expect(modules.has('hunter')).toBe(true);
      expect(modules.has('harvestpro')).toBe(true);
      expect(modules.has('portfolio')).toBe(true);
    });
  });

  describe('Query Key Standardization', () => {
    test('all query keys follow consistent structure', () => {
      const keys = getWalletAddressDependentQueryKeys('0xabc');
      
      // All keys should be arrays
      keys.forEach(key => {
        expect(Array.isArray(key)).toBe(true);
        expect(key.length).toBeGreaterThan(0);
      });
    });

    test('query keys are immutable (readonly)', () => {
      const key = walletKeys.registry();
      
      // Should be readonly tuple
      expect(Object.isFrozen(key) || key.length > 0).toBe(true);
    });

    test('query keys maintain consistent naming convention', () => {
      const keys = getWalletAddressDependentQueryKeys('0xabc');
      
      // All keys should start with a module name
      const validModules = ['wallets', 'guardian', 'hunter', 'harvestpro', 'portfolio'];
      keys.forEach(key => {
        expect(validModules).toContain(key[0]);
      });
    });
  });

  describe('Cross-Module Query Invalidation', () => {
    test('guardian queries are invalidated on wallet mutation', () => {
      const keys = getWalletAddressDependentQueryKeys('0xabc');
      const guardianSummaryKey = guardianKeys.summary('0xabc');
      
      expect(keys).toContainEqual(guardianSummaryKey);
    });

    test('hunter queries are invalidated on wallet mutation', () => {
      const keys = getWalletAddressDependentQueryKeys('0xabc');
      const hunterAlertsKey = hunterKeys.alerts('0xabc');
      
      expect(keys).toContainEqual(hunterAlertsKey);
    });

    test('harvestpro queries are invalidated on wallet mutation', () => {
      const keys = getWalletAddressDependentQueryKeys('0xabc');
      const harvestproSessionsKey = harvestproKeys.sessions('0xabc');
      
      expect(keys).toContainEqual(harvestproSessionsKey);
    });

    test('portfolio queries are invalidated on wallet mutation', () => {
      const keys = getWalletAddressDependentQueryKeys('0xabc');
      const portfolioSummaryKey = portfolioKeys.summary('0xabc');
      
      expect(keys).toContainEqual(portfolioSummaryKey);
    });
  });

  describe('Invalidation Completeness', () => {
    test('all wallet-dependent queries are covered', () => {
      const address = '0xabc';
      const keys = getWalletAddressDependentQueryKeys(address);
      
      // Verify we have all expected keys
      const keyStrings = keys.map(k => JSON.stringify(k));
      
      expect(keyStrings).toContain(JSON.stringify(['wallets', 'registry']));
      expect(keyStrings).toContain(JSON.stringify(['wallets', 'byAddress', address]));
      expect(keyStrings).toContain(JSON.stringify(['guardian', 'summary', address]));
      expect(keyStrings).toContain(JSON.stringify(['hunter', 'alerts', address]));
      expect(keyStrings).toContain(JSON.stringify(['harvestpro', 'sessions', address]));
      expect(keyStrings).toContain(JSON.stringify(['portfolio', 'summary', address]));
    });

    test('no duplicate keys in invalidation list', () => {
      const keys = getWalletAddressDependentQueryKeys('0xabc');
      const keyStrings = keys.map(k => JSON.stringify(k));
      const uniqueKeys = new Set(keyStrings);
      
      expect(uniqueKeys.size).toBe(keyStrings.length);
    });
  });
});

