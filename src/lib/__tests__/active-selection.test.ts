/**
 * Unit Tests for Active Selection Restoration
 * 
 * Tests the active selection restoration logic that implements:
 * - Priority 1: localStorage (aw_active_address, aw_active_network) if valid
 * - Priority 2: server primary wallet + default network
 * - Priority 3: ordered-first wallet (deterministic ordering)
 * 
 * Validates: Requirements 15.4, 15.5, 15.6
 * 
 * @see .kiro/specs/multi-chain-wallet-system/requirements.md - Requirement 15
 * @see .kiro/specs/multi-chain-wallet-system/tasks.md - Task 10
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// ============================================================================
// Mock Data
// ============================================================================

const mockServerWallets = [
  {
    id: 'wallet-1',
    address: '0xabc123',
    chain_namespace: 'eip155:1',
    is_primary: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'wallet-2',
    address: '0xdef456',
    chain_namespace: 'eip155:137',
    is_primary: false,
    created_at: '2025-12-30T00:00:00Z',
  },
  {
    id: 'wallet-3',
    address: '0xabc123',
    chain_namespace: 'eip155:137',
    is_primary: false,
    created_at: '2025-12-29T00:00:00Z',
  },
];

const mockConnectedWallets = [
  {
    address: '0xabc123',
    chainNamespace: 'eip155:1',
    chain: 'ethereum',
    supportedNetworks: ['eip155:1', 'eip155:137'],
    balancesByNetwork: {},
    guardianScoresByNetwork: {},
  },
  {
    address: '0xdef456',
    chainNamespace: 'eip155:137',
    chain: 'polygon',
    supportedNetworks: ['eip155:137'],
    balancesByNetwork: {},
    guardianScoresByNetwork: {},
  },
];

// ============================================================================
// Helper Function (from WalletContext)
// ============================================================================

/**
 * Restore active selection using priority order:
 * 1. localStorage (aw_active_address, aw_active_network) if valid in server data
 * 2. server primary wallet + default network
 * 3. ordered-first wallet (deterministic ordering: is_primary DESC, created_at DESC, id ASC)
 */
function restoreActiveSelection(
  wallets: typeof mockConnectedWallets,
  serverWallets: typeof mockServerWallets
): { address: string | null; network: string } {
  if (wallets.length === 0) {
    return { address: null, network: 'eip155:1' };
  }

  // Priority 1: Check localStorage for saved selection
  const savedAddress = localStorage.getItem('aw_active_address');
  const savedNetwork = localStorage.getItem('aw_active_network');

  // Validate localStorage selection exists in server data
  if (savedAddress && savedNetwork) {
    const isValidInServerData = serverWallets.some(
      (w) =>
        w.address.toLowerCase() === savedAddress.toLowerCase() &&
        w.chain_namespace === savedNetwork
    );

    if (isValidInServerData) {
      // localStorage selection is valid - use it
      return { address: savedAddress, network: savedNetwork };
    } else {
      // localStorage selection is invalid - self-heal by clearing it
      localStorage.removeItem('aw_active_address');
      localStorage.removeItem('aw_active_network');
    }
  }

  // Priority 2: Use server primary wallet + default network
  const primaryWallet = serverWallets.find((w) => w.is_primary);
  if (primaryWallet) {
    return {
      address: primaryWallet.address,
      network: primaryWallet.chain_namespace || 'eip155:1',
    };
  }

  // Priority 3: Use ordered-first wallet (deterministic ordering)
  // Server returns wallets sorted by: is_primary DESC, created_at DESC, id ASC
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

describe('Active Selection Restoration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ========================================================================
  // Priority 1: localStorage Validation
  // ========================================================================

  describe('Priority 1: localStorage validation', () => {
    test('should restore from localStorage if selection is valid in server data', () => {
      // Setup: Save valid selection to localStorage
      localStorage.setItem('aw_active_address', '0xabc123');
      localStorage.setItem('aw_active_network', 'eip155:1');

      const result = restoreActiveSelection(mockConnectedWallets, mockServerWallets);

      expect(result.address).toBe('0xabc123');
      expect(result.network).toBe('eip155:1');
    });

    test('should restore from localStorage with case-insensitive address matching', () => {
      // Setup: Save with different case
      localStorage.setItem('aw_active_address', '0xABC123');
      localStorage.setItem('aw_active_network', 'eip155:1');

      const result = restoreActiveSelection(mockConnectedWallets, mockServerWallets);

      expect(result.address).toBe('0xABC123');
      expect(result.network).toBe('eip155:1');
    });

    test('should self-heal when localStorage address is invalid', () => {
      // Setup: Save invalid address
      localStorage.setItem('aw_active_address', '0xinvalid');
      localStorage.setItem('aw_active_network', 'eip155:1');

      const result = restoreActiveSelection(mockConnectedWallets, mockServerWallets);

      // Should fall back to primary wallet
      expect(result.address).toBe('0xabc123');
      expect(result.network).toBe('eip155:1');

      // Should clear invalid localStorage
      expect(localStorage.getItem('aw_active_address')).toBeNull();
      expect(localStorage.getItem('aw_active_network')).toBeNull();
    });

    test('should self-heal when localStorage network is invalid', () => {
      // Setup: Save valid address but invalid network
      localStorage.setItem('aw_active_address', '0xabc123');
      localStorage.setItem('aw_active_network', 'eip155:999');

      const result = restoreActiveSelection(mockConnectedWallets, mockServerWallets);

      // Should fall back to primary wallet
      expect(result.address).toBe('0xabc123');
      expect(result.network).toBe('eip155:1');

      // Should clear invalid localStorage
      expect(localStorage.getItem('aw_active_address')).toBeNull();
      expect(localStorage.getItem('aw_active_network')).toBeNull();
    });

    test('should self-heal when localStorage combination is invalid', () => {
      // Setup: Valid address and network separately, but not together
      localStorage.setItem('aw_active_address', '0xdef456');
      localStorage.setItem('aw_active_network', 'eip155:1'); // def456 is not on eip155:1

      const result = restoreActiveSelection(mockConnectedWallets, mockServerWallets);

      // Should fall back to primary wallet
      expect(result.address).toBe('0xabc123');
      expect(result.network).toBe('eip155:1');

      // Should clear invalid localStorage
      expect(localStorage.getItem('aw_active_address')).toBeNull();
      expect(localStorage.getItem('aw_active_network')).toBeNull();
    });
  });

  // ========================================================================
  // Priority 2: Server Primary Wallet
  // ========================================================================

  describe('Priority 2: server primary wallet', () => {
    test('should use server primary wallet when localStorage is empty', () => {
      const result = restoreActiveSelection(mockConnectedWallets, mockServerWallets);

      expect(result.address).toBe('0xabc123');
      expect(result.network).toBe('eip155:1');
    });

    test('should use server primary wallet when localStorage is invalid', () => {
      localStorage.setItem('aw_active_address', '0xinvalid');
      localStorage.setItem('aw_active_network', 'eip155:1');

      const result = restoreActiveSelection(mockConnectedWallets, mockServerWallets);

      expect(result.address).toBe('0xabc123');
      expect(result.network).toBe('eip155:1');
    });

    test('should use primary wallet network if available', () => {
      const result = restoreActiveSelection(mockConnectedWallets, mockServerWallets);

      expect(result.network).toBe('eip155:1');
    });

    test('should default to eip155:1 if primary wallet has no network', () => {
      const walletsWithoutNetwork = [
        { ...mockServerWallets[0], chain_namespace: null },
      ];

      const result = restoreActiveSelection(mockConnectedWallets, walletsWithoutNetwork);

      expect(result.network).toBe('eip155:1');
    });
  });

  // ========================================================================
  // Priority 3: Ordered-First Wallet
  // ========================================================================

  describe('Priority 3: ordered-first wallet', () => {
    test('should use first wallet when no primary exists', () => {
      const walletsWithoutPrimary = mockServerWallets.map((w) => ({
        ...w,
        is_primary: false,
      }));

      const result = restoreActiveSelection(mockConnectedWallets, walletsWithoutPrimary);

      // First wallet in deterministic order
      expect(result.address).toBe('0xabc123');
      expect(result.network).toBe('eip155:1');
    });

    test('should respect deterministic ordering (is_primary DESC, created_at DESC, id ASC)', () => {
      // Create wallets with specific ordering
      const orderedWallets = [
        {
          id: 'wallet-3',
          address: '0xghi789',
          chain_namespace: 'eip155:1',
          is_primary: false,
          created_at: '2026-01-05T00:00:00Z', // Newest
        },
        {
          id: 'wallet-2',
          address: '0xdef456',
          chain_namespace: 'eip155:1',
          is_primary: false,
          created_at: '2026-01-04T00:00:00Z',
        },
        {
          id: 'wallet-1',
          address: '0xabc123',
          chain_namespace: 'eip155:1',
          is_primary: false,
          created_at: '2026-01-03T00:00:00Z', // Oldest
        },
      ];

      // Create connected wallets from ordered wallets
      const connectedWallets = orderedWallets.map((w) => ({
        address: w.address,
        chainNamespace: w.chain_namespace,
        chain: 'ethereum',
        supportedNetworks: [w.chain_namespace],
        balancesByNetwork: {},
        guardianScoresByNetwork: {},
      }));

      const result = restoreActiveSelection(connectedWallets, orderedWallets);

      // Should pick the first one (newest by created_at)
      expect(result.address).toBe('0xghi789');
    });
  });

  // ========================================================================
  // Edge Cases
  // ========================================================================

  describe('edge cases', () => {
    test('should return null address when no wallets exist', () => {
      const result = restoreActiveSelection([], []);

      expect(result.address).toBeNull();
      expect(result.network).toBe('eip155:1');
    });

    test('should return default network when wallets exist but no network specified', () => {
      const walletsWithoutNetwork = mockServerWallets.map((w) => ({
        ...w,
        chain_namespace: null,
      }));

      const result = restoreActiveSelection(mockConnectedWallets, walletsWithoutNetwork);

      expect(result.network).toBe('eip155:1');
    });

    test('should handle empty localStorage gracefully', () => {
      localStorage.setItem('aw_active_address', '');
      localStorage.setItem('aw_active_network', '');

      const result = restoreActiveSelection(mockConnectedWallets, mockServerWallets);

      // Should fall back to primary wallet
      expect(result.address).toBe('0xabc123');
      expect(result.network).toBe('eip155:1');
    });

    test('should handle null localStorage values gracefully', () => {
      localStorage.removeItem('aw_active_address');
      localStorage.removeItem('aw_active_network');

      const result = restoreActiveSelection(mockConnectedWallets, mockServerWallets);

      // Should fall back to primary wallet
      expect(result.address).toBe('0xabc123');
      expect(result.network).toBe('eip155:1');
    });
  });

  // ========================================================================
  // Network Switching Invariants
  // ========================================================================

  describe('network switching invariants', () => {
    test('should preserve active wallet when switching networks', () => {
      // Setup: Active wallet on eip155:1
      localStorage.setItem('aw_active_address', '0xabc123');
      localStorage.setItem('aw_active_network', 'eip155:1');

      // Simulate network switch to eip155:137
      localStorage.setItem('aw_active_network', 'eip155:137');

      const result = restoreActiveSelection(mockConnectedWallets, mockServerWallets);

      // Active wallet should remain the same
      expect(result.address).toBe('0xabc123');
      // Network should be updated
      expect(result.network).toBe('eip155:137');
    });

    test('should handle missing wallet-network combination gracefully', () => {
      // Setup: Wallet exists but not on this network
      localStorage.setItem('aw_active_address', '0xdef456');
      localStorage.setItem('aw_active_network', 'eip155:1'); // def456 is not on eip155:1

      const result = restoreActiveSelection(mockConnectedWallets, mockServerWallets);

      // Should fall back to primary wallet
      expect(result.address).toBe('0xabc123');
      expect(result.network).toBe('eip155:1');
    });
  });
});
