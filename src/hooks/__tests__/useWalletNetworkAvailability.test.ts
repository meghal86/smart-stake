/**
 * useWalletNetworkAvailability Hook Tests
 * 
 * Tests the hook that detects if the active wallet is available on the active network.
 * 
 * Validates: Requirements 6.2, 6.3, 15.7
 */

import { renderHook } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useWalletNetworkAvailability } from '../useWalletNetworkAvailability';
import { useWallet } from '@/contexts/WalletContext';

// Mock the WalletContext
vi.mock('@/contexts/WalletContext', () => ({
  useWallet: vi.fn(),
}));

describe('useWalletNetworkAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns isAvailable=false when no active wallet', () => {
    vi.mocked(useWallet).mockReturnValue({
      connectedWallets: [],
      activeWallet: null,
      activeNetwork: 'eip155:1',
      setActiveWallet: vi.fn(),
      setActiveNetwork: vi.fn(),
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      getSupportedNetworks: vi.fn(),
      getWalletByNetwork: vi.fn(),
      isLoading: false,
      isSwitching: false,
      isNetworkSwitching: false,
      isAuthenticated: true,
      hydrateFromServer: vi.fn(),
    });

    const { result } = renderHook(() => useWalletNetworkAvailability());

    expect(result.current.isAvailable).toBe(false);
    expect(result.current.activeWallet).toBeNull();
    expect(result.current.isMissing).toBe(false);
  });

  test('returns isAvailable=true when wallet is on active network', () => {
    vi.mocked(useWallet).mockReturnValue({
      connectedWallets: [
        {
          address: '0x1234567890123456789012345678901234567890',
          chainNamespace: 'eip155:1',
          chain: 'ethereum',
          supportedNetworks: ['eip155:1', 'eip155:137'],
          balancesByNetwork: {},
          guardianScoresByNetwork: {},
        },
      ],
      activeWallet: '0x1234567890123456789012345678901234567890',
      activeNetwork: 'eip155:1',
      setActiveWallet: vi.fn(),
      setActiveNetwork: vi.fn(),
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      getSupportedNetworks: vi.fn(),
      getWalletByNetwork: vi.fn(),
      isLoading: false,
      isSwitching: false,
      isNetworkSwitching: false,
      isAuthenticated: true,
      hydrateFromServer: vi.fn(),
    });

    const { result } = renderHook(() => useWalletNetworkAvailability());

    expect(result.current.isAvailable).toBe(true);
    expect(result.current.isMissing).toBe(false);
  });

  test('returns isMissing=true when wallet is not on active network', () => {
    vi.mocked(useWallet).mockReturnValue({
      connectedWallets: [
        {
          address: '0x1234567890123456789012345678901234567890',
          chainNamespace: 'eip155:1',
          chain: 'ethereum',
          supportedNetworks: ['eip155:1'], // Only on Ethereum
          balancesByNetwork: {},
          guardianScoresByNetwork: {},
        },
      ],
      activeWallet: '0x1234567890123456789012345678901234567890',
      activeNetwork: 'eip155:137', // Switched to Polygon
      setActiveWallet: vi.fn(),
      setActiveNetwork: vi.fn(),
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      getSupportedNetworks: vi.fn(),
      getWalletByNetwork: vi.fn(),
      isLoading: false,
      isSwitching: false,
      isNetworkSwitching: false,
      isAuthenticated: true,
      hydrateFromServer: vi.fn(),
    });

    const { result } = renderHook(() => useWalletNetworkAvailability());

    expect(result.current.isAvailable).toBe(false);
    expect(result.current.isMissing).toBe(true);
  });

  test('handles case-insensitive address matching', () => {
    vi.mocked(useWallet).mockReturnValue({
      connectedWallets: [
        {
          address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
          chainNamespace: 'eip155:1',
          chain: 'ethereum',
          supportedNetworks: ['eip155:1'],
          balancesByNetwork: {},
          guardianScoresByNetwork: {},
        },
      ],
      activeWallet: '0xabcdef1234567890abcdef1234567890abcdef12', // lowercase
      activeNetwork: 'eip155:1',
      setActiveWallet: vi.fn(),
      setActiveNetwork: vi.fn(),
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      getSupportedNetworks: vi.fn(),
      getWalletByNetwork: vi.fn(),
      isLoading: false,
      isSwitching: false,
      isNetworkSwitching: false,
      isAuthenticated: true,
      hydrateFromServer: vi.fn(),
    });

    const { result } = renderHook(() => useWalletNetworkAvailability());

    expect(result.current.isAvailable).toBe(true);
  });

  test('returns correct network name', () => {
    vi.mocked(useWallet).mockReturnValue({
      connectedWallets: [
        {
          address: '0x1234567890123456789012345678901234567890',
          chainNamespace: 'eip155:1',
          chain: 'ethereum',
          supportedNetworks: ['eip155:1'],
          balancesByNetwork: {},
          guardianScoresByNetwork: {},
        },
      ],
      activeWallet: '0x1234567890123456789012345678901234567890',
      activeNetwork: 'eip155:137',
      setActiveWallet: vi.fn(),
      setActiveNetwork: vi.fn(),
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      getSupportedNetworks: vi.fn(),
      getWalletByNetwork: vi.fn(),
      isLoading: false,
      isSwitching: false,
      isNetworkSwitching: false,
      isAuthenticated: true,
      hydrateFromServer: vi.fn(),
    });

    const { result } = renderHook(() => useWalletNetworkAvailability());

    expect(result.current.networkName).toBe('Polygon Mainnet');
  });

  test('returns isMissing=false when wallet not found in connected wallets', () => {
    vi.mocked(useWallet).mockReturnValue({
      connectedWallets: [
        {
          address: '0x1111111111111111111111111111111111111111',
          chainNamespace: 'eip155:1',
          chain: 'ethereum',
          supportedNetworks: ['eip155:1'],
          balancesByNetwork: {},
          guardianScoresByNetwork: {},
        },
      ],
      activeWallet: '0x2222222222222222222222222222222222222222', // Different wallet
      activeNetwork: 'eip155:1',
      setActiveWallet: vi.fn(),
      setActiveNetwork: vi.fn(),
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      getSupportedNetworks: vi.fn(),
      getWalletByNetwork: vi.fn(),
      isLoading: false,
      isSwitching: false,
      isNetworkSwitching: false,
      isAuthenticated: true,
      hydrateFromServer: vi.fn(),
    });

    const { result } = renderHook(() => useWalletNetworkAvailability());

    expect(result.current.isAvailable).toBe(false);
    expect(result.current.isMissing).toBe(false);
  });

  test('handles multiple supported networks correctly', () => {
    vi.mocked(useWallet).mockReturnValue({
      connectedWallets: [
        {
          address: '0x1234567890123456789012345678901234567890',
          chainNamespace: 'eip155:1',
          chain: 'ethereum',
          supportedNetworks: ['eip155:1', 'eip155:137', 'eip155:42161'],
          balancesByNetwork: {},
          guardianScoresByNetwork: {},
        },
      ],
      activeWallet: '0x1234567890123456789012345678901234567890',
      activeNetwork: 'eip155:42161', // Arbitrum
      setActiveWallet: vi.fn(),
      setActiveNetwork: vi.fn(),
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      getSupportedNetworks: vi.fn(),
      getWalletByNetwork: vi.fn(),
      isLoading: false,
      isSwitching: false,
      isNetworkSwitching: false,
      isAuthenticated: true,
      hydrateFromServer: vi.fn(),
    });

    const { result } = renderHook(() => useWalletNetworkAvailability());

    expect(result.current.isAvailable).toBe(true);
    expect(result.current.isMissing).toBe(false);
  });
});
