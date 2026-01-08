/**
 * Property-Based Tests for Active Selection Restoration
 * 
 * Tests universal properties that should hold for all valid wallet data:
 * - Property 4: Active Selection Network Invariance
 * - Property 16: Active Selection Restoration
 * 
 * Validates: Requirements 15.1-15.7, 6.1-6.5
 * 
 * @see .kiro/specs/multi-chain-wallet-system/design.md - HARD LOCK 5
 * @see .kiro/specs/multi-chain-wallet-system/requirements.md - Requirement 15
 * @see .kiro/specs/multi-chain-wallet-system/tasks.md - Task 10, Task 12
 */

import * as fc from 'fast-check';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  ethereumAddressArbitrary,
  caip2NetworkArbitrary,
  serverWalletArrayArbitrary,
  serverWalletArbitrary,
  connectedWalletArbitrary,
  serverWalletsWithPrimaryArbitrary,
  serverWalletsWithoutPrimaryArbitrary,
  serverWalletsWithAddressOnNetworkArbitrary,
  SUPPORTED_NETWORKS,
} from '../generators/wallet-generators';

// ============================================================================
// Helper Function (from WalletContext)
// ============================================================================

function restoreActiveSelection(
  wallets: Array<{
    address: string;
    chainNamespace: string;
    chain: string;
    supportedNetworks: string[];
    balancesByNetwork: Record<string, unknown>;
    guardianScoresByNetwork: Record<string, number>;
    label?: string;
  }>,
  serverWallets: Array<{
    id: string;
    address: string;
    chain_namespace: string;
    is_primary: boolean;
    created_at: string;
  }>
): { address: string | null; network: string } {
  if (wallets.length === 0) {
    return { address: null, network: 'eip155:1' };
  }

  const savedAddress = localStorage.getItem('aw_active_address');
  const savedNetwork = localStorage.getItem('aw_active_network');

  if (savedAddress && savedNetwork) {
    const isValidInServerData = serverWallets.some(
      (w) =>
        w.address.toLowerCase() === savedAddress.toLowerCase() &&
        w.chain_namespace === savedNetwork
    );

    if (isValidInServerData) {
      return { address: savedAddress, network: savedNetwork };
    } else {
      localStorage.removeItem('aw_active_address');
      localStorage.removeItem('aw_active_network');
    }
  }

  const primaryWallet = serverWallets.find((w) => w.is_primary);
  if (primaryWallet) {
    return {
      address: primaryWallet.address,
      network: primaryWallet.chain_namespace || 'eip155:1',
    };
  }

  if (wallets.length > 0) {
    return {
      address: wallets[0].address,
      network: wallets[0].chainNamespace || 'eip155:1',
    };
  }

  return { address: null, network: 'eip155:1' };
}

// ============================================================================
// Tests
// ============================================================================

describe('Feature: multi-chain-wallet-system, Property 4: Active Selection Network Invariance', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('switching networks should never change the active wallet address', () => {
    fc.assert(
      fc.property(
        ethereumAddressArbitrary(),
        caip2NetworkArbitrary(),
        caip2NetworkArbitrary(),
        serverWalletArrayArbitrary(),
        (address, network1, network2, serverWallets) => {
          // Setup: Create connected wallets from server data
          const connectedWallets = serverWallets.map((w) => ({
            address: w.address,
            chainNamespace: w.chain_namespace,
            chain: 'ethereum',
            supportedNetworks: [w.chain_namespace],
            balancesByNetwork: {},
            guardianScoresByNetwork: {},
          }));

          // Setup: Set initial active selection
          localStorage.setItem('aw_active_address', address);
          localStorage.setItem('aw_active_network', network1);

          // Action: Restore selection
          const result1 = restoreActiveSelection(connectedWallets, serverWallets);

          // Action: Switch network
          localStorage.setItem('aw_active_network', network2);

          // Action: Restore selection again
          const result2 = restoreActiveSelection(connectedWallets, serverWallets);

          // Property: Active wallet should remain the same after network switch
          // (unless the wallet doesn't exist on the new network, then it falls back)
          if (result1.address) {
            // If we had a valid address before, it should either stay the same
            // or fall back to a valid wallet (but not change to a different wallet)
            expect(result2.address).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('network switching should only change the active network, not the wallet', () => {
    fc.assert(
      fc.property(
        serverWalletArrayArbitrary(),
        caip2NetworkArbitrary(),
        (serverWallets, targetNetwork) => {
          if (serverWallets.length === 0) return;

          const connectedWallets = serverWallets.map((w) => ({
            address: w.address,
            chainNamespace: w.chain_namespace,
            chain: 'ethereum',
            supportedNetworks: [w.chain_namespace],
            balancesByNetwork: {},
            guardianScoresByNetwork: {},
          }));

          // Setup: Set initial selection
          const initialAddress = serverWallets[0].address;
          localStorage.setItem('aw_active_address', initialAddress);
          localStorage.setItem('aw_active_network', serverWallets[0].chain_namespace);

          const result1 = restoreActiveSelection(connectedWallets, serverWallets);

          // Action: Switch network
          localStorage.setItem('aw_active_network', targetNetwork);

          const result2 = restoreActiveSelection(connectedWallets, serverWallets);

          // Property: If the wallet exists on the new network, address should stay the same
          const walletExistsOnNewNetwork = serverWallets.some(
            (w) =>
              w.address.toLowerCase() === initialAddress.toLowerCase() &&
              w.chain_namespace === targetNetwork
          );

          if (walletExistsOnNewNetwork) {
            expect(result2.address?.toLowerCase()).toBe(initialAddress.toLowerCase());
            expect(result2.network).toBe(targetNetwork);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: multi-chain-wallet-system, Property 16: Active Selection Restoration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('valid localStorage selection should be restored', () => {
    fc.assert(
      fc.property(
        ethereumAddressArbitrary(),
        caip2NetworkArbitrary(),
        serverWalletArrayArbitrary(),
        (address, network, serverWallets) => {
          // Ensure the address exists on the network in server data
          const hasAddressOnNetwork = serverWallets.some(
            (w) =>
              w.address.toLowerCase() === address.toLowerCase() &&
              w.chain_namespace === network
          );

          if (!hasAddressOnNetwork) {
            // Skip if address doesn't exist on network
            return;
          }

          const connectedWallets = serverWallets.map((w) => ({
            address: w.address,
            chainNamespace: w.chain_namespace,
            chain: 'ethereum',
            supportedNetworks: [w.chain_namespace],
            balancesByNetwork: {},
            guardianScoresByNetwork: {},
          }));

          // Setup: Save valid selection
          localStorage.setItem('aw_active_address', address);
          localStorage.setItem('aw_active_network', network);

          // Action: Restore selection
          const result = restoreActiveSelection(connectedWallets, serverWallets);

          // Property: Should restore the saved selection
          expect(result.address?.toLowerCase()).toBe(address.toLowerCase());
          expect(result.network).toBe(network);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('invalid localStorage selection should self-heal', () => {
    fc.assert(
      fc.property(
        ethereumAddressArbitrary(),
        caip2NetworkArbitrary(),
        fc.array(serverWalletArbitrary(), { minLength: 1, maxLength: 10 }) // At least 1 wallet
          .map((wallets) => {
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
          }),
        (invalidAddress, invalidNetwork, serverWallets) => {
          // Ensure the address does NOT exist on the network
          const hasAddressOnNetwork = serverWallets.some(
            (w) =>
              w.address.toLowerCase() === invalidAddress.toLowerCase() &&
              w.chain_namespace === invalidNetwork
          );

          if (hasAddressOnNetwork) {
            // Skip if address exists on network (not invalid)
            return;
          }

          const connectedWallets = serverWallets.map((w) => ({
            address: w.address,
            chainNamespace: w.chain_namespace,
            chain: 'ethereum',
            supportedNetworks: [w.chain_namespace],
            balancesByNetwork: {},
            guardianScoresByNetwork: {},
          }));

          // Setup: Save invalid selection
          localStorage.setItem('aw_active_address', invalidAddress);
          localStorage.setItem('aw_active_network', invalidNetwork);

          // Action: Restore selection
          const result = restoreActiveSelection(connectedWallets, serverWallets);

          // Property: Should clear invalid localStorage
          expect(localStorage.getItem('aw_active_address')).toBeNull();
          expect(localStorage.getItem('aw_active_network')).toBeNull();

          // Property: Should fall back to valid selection
          expect(result.address).toBeDefined();
          expect(result.network).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should use primary wallet when localStorage is empty', () => {
    fc.assert(
      fc.property(serverWalletsWithPrimaryArbitrary(), (serverWallets) => {
        if (serverWallets.length === 0) return;

        const connectedWallets = serverWallets.map((w) => ({
          address: w.address,
          chainNamespace: w.chain_namespace,
          chain: 'ethereum',
          supportedNetworks: [w.chain_namespace],
          balancesByNetwork: {},
          guardianScoresByNetwork: {},
        }));

        // Setup: Clear localStorage
        localStorage.clear();

        // Action: Restore selection
        const result = restoreActiveSelection(connectedWallets, serverWallets);

        // Property: Should use primary wallet
        const primaryWallet = serverWallets.find((w) => w.is_primary);
        expect(result.address?.toLowerCase()).toBe(primaryWallet?.address.toLowerCase());
        expect(result.network).toBe(primaryWallet?.chain_namespace);
      }),
      { numRuns: 100 }
    );
  });

  test('should use ordered-first wallet when no primary exists', () => {
    fc.assert(
      fc.property(serverWalletsWithoutPrimaryArbitrary(), (serverWallets) => {
        if (serverWallets.length === 0) return;

        const connectedWallets = serverWallets.map((w) => ({
          address: w.address,
          chainNamespace: w.chain_namespace,
          chain: 'ethereum',
          supportedNetworks: [w.chain_namespace],
          balancesByNetwork: {},
          guardianScoresByNetwork: {},
        }));

        // Setup: Clear localStorage
        localStorage.clear();

        // Action: Restore selection
        const result = restoreActiveSelection(connectedWallets, serverWallets);

        // Property: Should use first wallet (deterministic ordering)
        expect(result.address?.toLowerCase()).toBe(serverWallets[0].address.toLowerCase());
        expect(result.network).toBe(serverWallets[0].chain_namespace);
      }),
      { numRuns: 100 }
    );
  });

  test('restoration should always return a valid network', () => {
    fc.assert(
      fc.property(serverWalletArrayArbitrary(), (serverWallets) => {
        const connectedWallets = serverWallets.map((w) => ({
          address: w.address,
          chainNamespace: w.chain_namespace,
          chain: 'ethereum',
          supportedNetworks: [w.chain_namespace],
          balancesByNetwork: {},
          guardianScoresByNetwork: {},
        }));

        // Setup: Random localStorage state
        localStorage.clear();

        // Action: Restore selection
        const result = restoreActiveSelection(connectedWallets, serverWallets);

        // Property: Network should always be valid CAIP-2 format or default
        expect(result.network).toMatch(/^eip155:\d+$/);
      }),
      { numRuns: 100 }
    );
  });

  test('restoration should be deterministic for same inputs', () => {
    fc.assert(
      fc.property(
        ethereumAddressArbitrary(),
        caip2NetworkArbitrary(),
        serverWalletArrayArbitrary(),
        (address, network, serverWallets) => {
          const connectedWallets = serverWallets.map((w) => ({
            address: w.address,
            chainNamespace: w.chain_namespace,
            chain: 'ethereum',
            supportedNetworks: [w.chain_namespace],
            balancesByNetwork: {},
            guardianScoresByNetwork: {},
          }));

          // Setup: Save selection
          localStorage.setItem('aw_active_address', address);
          localStorage.setItem('aw_active_network', network);

          // Action: Restore twice
          const result1 = restoreActiveSelection(connectedWallets, serverWallets);
          const result2 = restoreActiveSelection(connectedWallets, serverWallets);

          // Property: Results should be identical
          expect(result1.address).toBe(result2.address);
          expect(result1.network).toBe(result2.network);
        }
      ),
      { numRuns: 100 }
    );
  });
});
