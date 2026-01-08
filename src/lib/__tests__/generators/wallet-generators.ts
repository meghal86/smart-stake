/**
 * Wallet Data Generators for Property-Based Testing
 * 
 * Provides fast-check generators for creating valid wallet data
 * for property-based testing of the multi-chain wallet system.
 * 
 * @see .kiro/specs/multi-chain-wallet-system/tasks.md - Task 12
 */

import * as fc from 'fast-check';

// ============================================================================
// Supported Networks
// ============================================================================

export const SUPPORTED_NETWORKS = [
  'eip155:1',      // Ethereum
  'eip155:137',    // Polygon
  'eip155:42161',  // Arbitrum
  'eip155:10',     // Optimism
  'eip155:8453',   // Base
];

// ============================================================================
// Address Generators
// ============================================================================

/**
 * Generate valid Ethereum addresses (0x + 40 hex characters)
 */
export const ethereumAddressArbitrary = (): fc.Arbitrary<string> => {
  return fc
    .tuple(
      fc.integer({ min: 0, max: 0xffffffff }),
      fc.integer({ min: 0, max: 0xffffffff }),
      fc.integer({ min: 0, max: 0xffffffff }),
      fc.integer({ min: 0, max: 0xffffffff }),
      fc.integer({ min: 0, max: 0xffffffff })
    )
    .map(([a, b, c, d, e]) => {
      const hex = [a, b, c, d, e]
        .map((n) => n.toString(16).padStart(8, '0'))
        .join('');
      return `0x${hex}`;
    });
};

/**
 * Generate lowercase Ethereum addresses
 */
export const ethereumAddressLowercaseArbitrary = (): fc.Arbitrary<string> => {
  return ethereumAddressArbitrary().map((addr) => addr.toLowerCase());
};

// ============================================================================
// Network Generators
// ============================================================================

/**
 * Generate valid CAIP-2 network identifiers
 */
export const caip2NetworkArbitrary = (): fc.Arbitrary<string> => {
  return fc.constantFrom(...SUPPORTED_NETWORKS);
};

/**
 * Generate valid chain IDs (1-999999)
 */
export const chainIdArbitrary = (): fc.Arbitrary<number> => {
  return fc.integer({ min: 1, max: 999999 });
};

// ============================================================================
// Wallet Data Generators
// ============================================================================

/**
 * Generate server wallet data (as returned by wallets-list Edge Function)
 */
export const serverWalletArbitrary = (): fc.Arbitrary<{
  id: string;
  address: string;
  chain_namespace: string;
  is_primary: boolean;
  created_at: string;
  label?: string;
  guardian_scores?: Record<string, number>;
  balance_cache?: Record<string, unknown>;
}> => {
  return fc.record({
    id: fc.uuid(),
    address: ethereumAddressArbitrary(),
    chain_namespace: caip2NetworkArbitrary(),
    is_primary: fc.boolean(),
    created_at: fc
      .integer({ min: 1609459200000, max: Date.now() }) // 2021-01-01 to now
      .map((ms) => new Date(ms).toISOString()),
    label: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
    guardian_scores: fc.option(
      fc.record({
        'eip155:1': fc.float({ min: 0, max: 100 }),
      })
    ),
    balance_cache: fc.option(fc.record({})),
  });
};

/**
 * Generate connected wallet data (as used in WalletContext)
 */
export const connectedWalletArbitrary = (): fc.Arbitrary<{
  address: string;
  chainNamespace: string;
  chain: string;
  supportedNetworks: string[];
  balancesByNetwork: Record<string, unknown>;
  guardianScoresByNetwork: Record<string, number>;
  label?: string;
}> => {
  return fc.record({
    address: ethereumAddressArbitrary(),
    chainNamespace: caip2NetworkArbitrary(),
    chain: fc.constantFrom('ethereum', 'polygon', 'arbitrum', 'optimism', 'base'),
    supportedNetworks: fc
      .array(caip2NetworkArbitrary(), { minLength: 1, maxLength: 5, uniqueBy: (x) => x })
      .map((networks) => [...new Set(networks)]), // Ensure uniqueness
    balancesByNetwork: fc.record({}),
    guardianScoresByNetwork: fc.record({}),
    label: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  });
};

/**
 * Generate arrays of server wallets with deterministic ordering
 * Ordering: is_primary DESC, created_at DESC, id ASC
 */
export const serverWalletArrayArbitrary = (): fc.Arbitrary<
  Array<{
    id: string;
    address: string;
    chain_namespace: string;
    is_primary: boolean;
    created_at: string;
  }>
> => {
  return fc
    .array(serverWalletArbitrary(), { minLength: 0, maxLength: 10 })
    .map((wallets) => {
      // Sort by: is_primary DESC, created_at DESC, id ASC
      return wallets.sort((a, b) => {
        // Primary first
        if (a.is_primary !== b.is_primary) {
          return a.is_primary ? -1 : 1;
        }
        // Then by created_at (newest first)
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        if (dateA !== dateB) {
          return dateB - dateA;
        }
        // Then by id (ascending)
        return a.id.localeCompare(b.id);
      });
    });
};

/**
 * Generate localStorage state (address + network pair)
 */
export const localStorageStateArbitrary = (): fc.Arbitrary<{
  address: string | null;
  network: string | null;
}> => {
  return fc.record({
    address: fc.option(ethereumAddressArbitrary()),
    network: fc.option(caip2NetworkArbitrary()),
  });
};

// ============================================================================
// Constraint Generators
// ============================================================================

/**
 * Generate server wallets where a specific address exists on a specific network
 */
export const serverWalletsWithAddressOnNetworkArbitrary = (
  targetAddress: string,
  targetNetwork: string
): fc.Arbitrary<
  Array<{
    id: string;
    address: string;
    chain_namespace: string;
    is_primary: boolean;
    created_at: string;
  }>
> => {
  return fc
    .array(serverWalletArbitrary(), { minLength: 0, maxLength: 10 })
    .map((wallets) => {
      // Ensure target address exists on target network
      const hasTarget = wallets.some(
        (w) =>
          w.address.toLowerCase() === targetAddress.toLowerCase() &&
          w.chain_namespace === targetNetwork
      );

      if (!hasTarget) {
        wallets.push({
          id: fc.sample(fc.uuid(), 1)[0],
          address: targetAddress,
          chain_namespace: targetNetwork,
          is_primary: false,
          created_at: new Date().toISOString(),
        });
      }

      // Sort by: is_primary DESC, created_at DESC, id ASC
      return wallets.sort((a, b) => {
        if (a.is_primary !== b.is_primary) {
          return a.is_primary ? -1 : 1;
        }
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        if (dateA !== dateB) {
          return dateB - dateA;
        }
        return a.id.localeCompare(b.id);
      });
    });
};

/**
 * Generate server wallets with exactly one primary wallet
 */
export const serverWalletsWithPrimaryArbitrary = (): fc.Arbitrary<
  Array<{
    id: string;
    address: string;
    chain_namespace: string;
    is_primary: boolean;
    created_at: string;
  }>
> => {
  return fc
    .array(serverWalletArbitrary(), { minLength: 1, maxLength: 10 })
    .map((wallets) => {
      // Ensure exactly one primary
      const primaryIndex = fc.sample(fc.integer({ min: 0, max: wallets.length - 1 }), 1)[0];

      return wallets.map((w, i) => ({
        ...w,
        is_primary: i === primaryIndex,
      }));
    });
};

/**
 * Generate server wallets with no primary wallet
 */
export const serverWalletsWithoutPrimaryArbitrary = (): fc.Arbitrary<
  Array<{
    id: string;
    address: string;
    chain_namespace: string;
    is_primary: boolean;
    created_at: string;
  }>
> => {
  return fc
    .array(serverWalletArbitrary(), { minLength: 0, maxLength: 10 })
    .map((wallets) => wallets.map((w) => ({ ...w, is_primary: false })));
};
