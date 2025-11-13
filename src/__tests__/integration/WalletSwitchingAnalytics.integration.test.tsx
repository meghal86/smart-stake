/**
 * Integration Tests for Wallet Switching Analytics
 * 
 * Verifies that wallet switching analytics are properly integrated
 * with WalletContext and track events correctly.
 * 
 * Requirements: 10.1-10.14, Task 57
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletProvider, useWallet } from '@/contexts/WalletContext';
import * as tracker from '@/lib/analytics/tracker';

// Mock analytics tracker
vi.mock('@/lib/analytics/tracker', () => ({
  trackWalletConnected: vi.fn().mockResolvedValue(undefined),
  trackWalletSwitched: vi.fn().mockResolvedValue(undefined),
  trackWalletDisconnected: vi.fn().mockResolvedValue(undefined),
  trackFeedPersonalized: vi.fn().mockResolvedValue(undefined),
}));

// Mock name resolution
vi.mock('@/lib/name-resolution', () => ({
  resolveName: vi.fn().mockResolvedValue(null),
}));

// Mock wallet labels hook
vi.mock('@/hooks/useWalletLabels', () => ({
  useWalletLabels: () => ({
    labels: {},
    getLabel: () => undefined,
    setLabel: vi.fn(),
    removeLabel: vi.fn(),
    isLoading: false,
  }),
}));

// Mock window.ethereum
const mockEthereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
};

describe('Wallet Switching Analytics Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock window.ethereum
    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: true,
      configurable: true,
    });

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    // Mock sessionStorage
    const sessionStorageMock = {
      getItem: vi.fn(() => 'test_session_id'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
      configurable: true,
    });

    // Mock performance.now for timing metrics
    vi.spyOn(performance, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>{children}</WalletProvider>
    </QueryClientProvider>
  );

  describe('Wallet Connection Analytics', () => {
    it('should track wallet connection when connecting first wallet', async () => {
      mockEthereum.request.mockResolvedValueOnce(['0x1234567890abcdef']);
      mockEthereum.request.mockResolvedValueOnce('0x1');

      const { result } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await result.current.connectWallet();
      });

      await waitFor(() => {
        expect(tracker.trackWalletConnected).toHaveBeenCalledWith(
          expect.objectContaining({
            walletAddress: '0x1234567890abcdef',
            walletCount: 1,
            isFirstWallet: true,
            chain: 'ethereum',
          })
        );
      });
    });

    it('should track wallet connection when connecting second wallet', async () => {
      // First wallet
      mockEthereum.request.mockResolvedValueOnce(['0x1111111111111111']);
      mockEthereum.request.mockResolvedValueOnce('0x1');

      const { result } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await result.current.connectWallet();
      });

      // Second wallet
      mockEthereum.request.mockResolvedValueOnce(['0x2222222222222222']);
      mockEthereum.request.mockResolvedValueOnce('0x89');

      await act(async () => {
        await result.current.connectWallet();
      });

      await waitFor(() => {
        expect(tracker.trackWalletConnected).toHaveBeenCalledTimes(2);
        expect(tracker.trackWalletConnected).toHaveBeenLastCalledWith(
          expect.objectContaining({
            walletAddress: '0x2222222222222222',
            walletCount: 2,
            isFirstWallet: false,
            chain: 'polygon',
          })
        );
      });
    });
  });

  describe('Wallet Switching Analytics', () => {
    it('should track wallet switch with duration metric', async () => {
      // Connect two wallets
      mockEthereum.request.mockResolvedValueOnce(['0x1111111111111111']);
      mockEthereum.request.mockResolvedValueOnce('0x1');

      const { result } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await result.current.connectWallet();
      });

      mockEthereum.request.mockResolvedValueOnce(['0x2222222222222222']);
      mockEthereum.request.mockResolvedValueOnce('0x1');

      await act(async () => {
        await result.current.connectWallet();
      });

      // Clear previous calls
      vi.clearAllMocks();

      // Mock performance.now to simulate time passing
      let callCount = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 1000 : 1150; // 150ms duration
      });

      // Switch wallet
      await act(async () => {
        result.current.setActiveWallet('0x1111111111111111');
      });

      await waitFor(() => {
        expect(tracker.trackWalletSwitched).toHaveBeenCalledWith(
          expect.objectContaining({
            fromWalletAddress: '0x2222222222222222',
            toWalletAddress: '0x1111111111111111',
            walletCount: 2,
            switchDurationMs: expect.any(Number),
          })
        );
      });
    });

    it('should track first wallet selection', async () => {
      mockEthereum.request.mockResolvedValueOnce(['0x1234567890abcdef']);
      mockEthereum.request.mockResolvedValueOnce('0x1');

      const { result } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await result.current.connectWallet();
      });

      // The first wallet connection automatically sets it as active
      // So we should see a wallet_switched event with no fromWallet
      await waitFor(() => {
        expect(tracker.trackWalletSwitched).toHaveBeenCalled();
      });
    });
  });

  describe('Wallet Disconnection Analytics', () => {
    it('should track wallet disconnection', async () => {
      mockEthereum.request.mockResolvedValueOnce(['0x1234567890abcdef']);
      mockEthereum.request.mockResolvedValueOnce('0x1');

      const { result } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await result.current.connectWallet();
      });

      vi.clearAllMocks();

      await act(async () => {
        await result.current.disconnectWallet('0x1234567890abcdef');
      });

      await waitFor(() => {
        expect(tracker.trackWalletDisconnected).toHaveBeenCalledWith(
          expect.objectContaining({
            walletAddress: '0x1234567890abcdef',
            walletCount: 0,
            hadActiveWallet: true,
          })
        );
      });
    });

    it('should track disconnection of non-active wallet', async () => {
      // Connect two wallets
      mockEthereum.request.mockResolvedValueOnce(['0x1111111111111111']);
      mockEthereum.request.mockResolvedValueOnce('0x1');

      const { result } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await result.current.connectWallet();
      });

      mockEthereum.request.mockResolvedValueOnce(['0x2222222222222222']);
      mockEthereum.request.mockResolvedValueOnce('0x1');

      await act(async () => {
        await result.current.connectWallet();
      });

      vi.clearAllMocks();

      // Disconnect non-active wallet
      await act(async () => {
        await result.current.disconnectWallet('0x1111111111111111');
      });

      await waitFor(() => {
        expect(tracker.trackWalletDisconnected).toHaveBeenCalledWith(
          expect.objectContaining({
            walletAddress: '0x1111111111111111',
            walletCount: 1,
            hadActiveWallet: false,
          })
        );
      });
    });
  });

  describe('Timing Metrics', () => {
    it('should capture wallet switch duration', async () => {
      // Connect two wallets
      mockEthereum.request.mockResolvedValueOnce(['0x1111111111111111']);
      mockEthereum.request.mockResolvedValueOnce('0x1');

      const { result } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await result.current.connectWallet();
      });

      mockEthereum.request.mockResolvedValueOnce(['0x2222222222222222']);
      mockEthereum.request.mockResolvedValueOnce('0x1');

      await act(async () => {
        await result.current.connectWallet();
      });

      vi.clearAllMocks();

      // Mock performance.now to simulate time passing
      let callCount = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 1000 : 1250; // 250ms duration
      });

      await act(async () => {
        result.current.setActiveWallet('0x1111111111111111');
      });

      await waitFor(() => {
        const call = (tracker.trackWalletSwitched as any).mock.calls[0][0];
        expect(call.switchDurationMs).toBeGreaterThanOrEqual(0);
        expect(typeof call.switchDurationMs).toBe('number');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle analytics errors gracefully during connection', async () => {
      (tracker.trackWalletConnected as any).mockRejectedValueOnce(
        new Error('Analytics error')
      );

      mockEthereum.request.mockResolvedValueOnce(['0x1234567890abcdef']);
      mockEthereum.request.mockResolvedValueOnce('0x1');

      const { result } = renderHook(() => useWallet(), { wrapper });

      // Should not throw error
      await act(async () => {
        await expect(result.current.connectWallet()).resolves.not.toThrow();
      });
    });

    it('should handle analytics errors gracefully during switching', async () => {
      mockEthereum.request.mockResolvedValueOnce(['0x1111111111111111']);
      mockEthereum.request.mockResolvedValueOnce('0x1');

      const { result } = renderHook(() => useWallet(), { wrapper });

      await act(async () => {
        await result.current.connectWallet();
      });

      mockEthereum.request.mockResolvedValueOnce(['0x2222222222222222']);
      mockEthereum.request.mockResolvedValueOnce('0x1');

      await act(async () => {
        await result.current.connectWallet();
      });

      (tracker.trackWalletSwitched as any).mockRejectedValueOnce(
        new Error('Analytics error')
      );

      // Should not throw error
      await act(async () => {
        expect(() => result.current.setActiveWallet('0x1111111111111111')).not.toThrow();
      });
    });
  });
});
