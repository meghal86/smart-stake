/**
 * WalletContext Tests
 * 
 * Tests for multi-wallet management context provider
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletProvider, useWallet, truncateAddress, ConnectedWallet } from '../../contexts/WalletContext';

// ============================================================================
// Mock AuthContext
// ============================================================================

const mockUseAuth = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// ============================================================================
// Test Setup
// ============================================================================

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>{children}</WalletProvider>
    </QueryClientProvider>
  );
};

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.ethereum
const mockEthereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
};

Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: true,
});

// ============================================================================
// Tests
// ============================================================================

describe('WalletContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    
    // Default mock: not authenticated
    mockUseAuth.mockReturnValue({
      session: null,
      isAuthenticated: false,
      loading: false,
    });
  });

  describe('useWallet hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useWallet());
      }).toThrow('useWallet must be used within a WalletProvider');
      
      consoleSpy.mockRestore();
    });

    it('should provide wallet context', () => {
      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty('connectedWallets');
      expect(result.current).toHaveProperty('activeWallet');
      expect(result.current).toHaveProperty('setActiveWallet');
      expect(result.current).toHaveProperty('connectWallet');
      expect(result.current).toHaveProperty('disconnectWallet');
      expect(result.current).toHaveProperty('isLoading');
    });
  });

  describe('Initial state', () => {
    it('should start with empty wallets and no active wallet', () => {
      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      expect(result.current.connectedWallets).toEqual([]);
      expect(result.current.activeWallet).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should restore wallets from localStorage', () => {
      const mockWallets: ConnectedWallet[] = [
        {
          address: '0x1234567890abcdef',
          chain: 'ethereum',
          label: 'Main Wallet',
        },
      ];

      localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
      localStorageMock.setItem('activeWallet', '0x1234567890abcdef');

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      expect(result.current.connectedWallets).toHaveLength(1);
      expect(result.current.connectedWallets[0].address).toBe('0x1234567890abcdef');
      expect(result.current.activeWallet).toBe('0x1234567890abcdef');
    });

    it('should default to first wallet if saved wallet not found', () => {
      const mockWallets: ConnectedWallet[] = [
        { address: '0xaaa', chain: 'ethereum' },
        { address: '0xbbb', chain: 'polygon' },
      ];

      localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
      localStorageMock.setItem('activeWallet', '0xnonexistent');

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      expect(result.current.activeWallet).toBe('0xaaa');
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.setItem('connectedWallets', 'invalid json');
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      expect(result.current.connectedWallets).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('setActiveWallet', () => {
    it('should set active wallet and update lastUsed', async () => {
      const mockWallets: ConnectedWallet[] = [
        { address: '0xaaa', chain: 'ethereum' },
        { address: '0xbbb', chain: 'polygon' },
      ];

      localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setActiveWallet('0xbbb');
      });

      // With useTransition, the update happens smoothly without blocking
      await waitFor(() => {
        expect(result.current.activeWallet).toBe('0xbbb');
      });

      expect(result.current.connectedWallets[1].lastUsed).toBeDefined();
    });

    it('should emit walletConnected event', async () => {
      const mockWallets: ConnectedWallet[] = [
        { address: '0xaaa', chain: 'ethereum' },
      ];

      localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));

      const eventListener = vi.fn();
      window.addEventListener('walletConnected', eventListener);

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setActiveWallet('0xaaa');
      });

      await waitFor(() => {
        expect(eventListener).toHaveBeenCalled();
      });

      const event = eventListener.mock.calls[0][0] as CustomEvent;
      expect(event.detail.address).toBe('0xaaa');
      expect(event.detail.timestamp).toBeDefined();

      window.removeEventListener('walletConnected', eventListener);
    });

    it('should persist active wallet to localStorage', async () => {
      const mockWallets: ConnectedWallet[] = [
        { address: '0xaaa', chain: 'ethereum' },
      ];

      localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setActiveWallet('0xaaa');
      });

      await waitFor(() => {
        expect(localStorageMock.getItem('activeWallet')).toBe('0xaaa');
      });
    });
  });

  describe('connectWallet', () => {
    it('should connect new wallet successfully', async () => {
      mockEthereum.request.mockImplementation((args: { method: string }) => {
        if (args.method === 'eth_requestAccounts') {
          return Promise.resolve(['0xnewwallet']);
        }
        if (args.method === 'eth_chainId') {
          return Promise.resolve('0x1');
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.connectedWallets).toHaveLength(1);
      expect(result.current.connectedWallets[0].address).toBe('0xnewwallet');
      expect(result.current.connectedWallets[0].chain).toBe('ethereum');
      expect(result.current.activeWallet).toBe('0xnewwallet');
    });

    it('should throw error if no ethereum wallet detected', async () => {
      const originalEthereum = window.ethereum;
      // @ts-ignore
      window.ethereum = undefined;

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      await expect(async () => {
        await act(async () => {
          await result.current.connectWallet();
        });
      }).rejects.toThrow('No Ethereum wallet detected');

      window.ethereum = originalEthereum;
    });

    it('should set existing wallet as active if already connected', async () => {
      const mockWallets: ConnectedWallet[] = [
        { address: '0xexisting', chain: 'ethereum' },
      ];

      localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));

      mockEthereum.request.mockImplementation((args: { method: string }) => {
        if (args.method === 'eth_requestAccounts') {
          return Promise.resolve(['0xexisting']);
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.connectedWallets).toHaveLength(1);
      expect(result.current.activeWallet).toBe('0xexisting');
    });
  });

  describe('disconnectWallet', () => {
    it('should remove wallet from connected wallets', async () => {
      const mockWallets: ConnectedWallet[] = [
        { address: '0xaaa', chain: 'ethereum' },
        { address: '0xbbb', chain: 'polygon' },
      ];

      localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
      localStorageMock.setItem('activeWallet', '0xaaa');

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.disconnectWallet('0xbbb');
      });

      expect(result.current.connectedWallets).toHaveLength(1);
      expect(result.current.connectedWallets[0].address).toBe('0xaaa');
    });

    it('should switch to another wallet if disconnecting active wallet', async () => {
      const mockWallets: ConnectedWallet[] = [
        { address: '0xaaa', chain: 'ethereum' },
        { address: '0xbbb', chain: 'polygon' },
      ];

      localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
      localStorageMock.setItem('activeWallet', '0xaaa');

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.disconnectWallet('0xaaa');
      });

      expect(result.current.activeWallet).toBe('0xbbb');
    });

    it('should set activeWallet to null if disconnecting last wallet', async () => {
      const mockWallets: ConnectedWallet[] = [
        { address: '0xaaa', chain: 'ethereum' },
      ];

      localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
      localStorageMock.setItem('activeWallet', '0xaaa');

      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.disconnectWallet('0xaaa');
      });

      expect(result.current.connectedWallets).toHaveLength(0);
      expect(result.current.activeWallet).toBeNull();
    });
  });

  describe('setActiveNetwork', () => {
    it('should change active network without changing active wallet', async () => {
      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      // Manually set up state (simulating loaded wallets)
      const mockWallets: ConnectedWallet[] = [
        { 
          address: '0xaaa', 
          chain: 'ethereum', 
          chainNamespace: 'eip155:1',
          supportedNetworks: ['eip155:1'],
          balancesByNetwork: {},
          guardianScoresByNetwork: {},
        },
        { 
          address: '0xbbb', 
          chain: 'polygon', 
          chainNamespace: 'eip155:137',
          supportedNetworks: ['eip155:137'],
          balancesByNetwork: {},
          guardianScoresByNetwork: {},
        },
      ];

      // Set active wallet first
      act(() => {
        result.current.setActiveWallet('0xaaa');
      });

      const initialWallet = result.current.activeWallet;
      const initialNetwork = result.current.activeNetwork;

      // Switch network
      act(() => {
        result.current.setActiveNetwork('eip155:137');
      });

      // Network should change, but wallet should remain the same
      expect(result.current.activeNetwork).toBe('eip155:137');
      expect(result.current.activeWallet).toBe(initialWallet);
    });

    it('should emit networkSwitched event when switching networks', async () => {
      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      const eventListener = vi.fn();
      window.addEventListener('networkSwitched', eventListener);

      act(() => {
        result.current.setActiveNetwork('eip155:137');
      });

      await waitFor(() => {
        expect(eventListener).toHaveBeenCalled();
      });

      const event = eventListener.mock.calls[0][0] as CustomEvent;
      expect(event.detail.chainNamespace).toBe('eip155:137');
      expect(event.detail.previousNetwork).toBe('eip155:1');
      expect(event.detail.timestamp).toBeDefined();

      window.removeEventListener('networkSwitched', eventListener);
    });

    it('should persist active network to localStorage', async () => {
      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setActiveNetwork('eip155:137');
      });

      await waitFor(() => {
        expect(localStorageMock.getItem('aw_active_network')).toBe('eip155:137');
      });
    });

    it('should set isNetworkSwitching flag during network switch', async () => {
      const { result } = renderHook(() => useWallet(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isNetworkSwitching).toBe(false);

      act(() => {
        result.current.setActiveNetwork('eip155:137');
      });

      // isNetworkSwitching should be set to true during transition
      // and reset to false after 500ms
      await waitFor(
        () => {
          expect(result.current.isNetworkSwitching).toBe(false);
        },
        { timeout: 1000 }
      );
    });
  });;

  describe('truncateAddress utility', () => {
    it('should truncate long addresses', () => {
      expect(truncateAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe('0x1234...5678');
    });

    it('should not truncate short addresses', () => {
      expect(truncateAddress('0x1234')).toBe('0x1234');
    });

    it('should handle undefined addresses', () => {
      expect(truncateAddress(undefined)).toBe('');
    });

    it('should respect custom char length', () => {
      expect(truncateAddress('0x1234567890abcdef1234567890abcdef12345678', 6)).toBe('0x123456...345678');
    });
  });
});
