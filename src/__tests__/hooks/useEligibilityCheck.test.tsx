/**
 * Tests for useEligibilityCheck Hook
 * 
 * Tests:
 * - Active wallet integration
 * - Automatic refresh on wallet change
 * - Manual recalculation with throttling
 * - Loading states
 * - Error handling
 * - Caching per wallet + opportunity pair
 * 
 * Requirements: 17.5, 18.5
 * Task: 47
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEligibilityCheck } from '@/hooks/useEligibilityCheck';
import { WalletProvider } from '@/contexts/WalletContext';
import React from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Mock WalletContext
vi.mock('@/contexts/WalletContext', async () => {
  const actual = await vi.importActual('@/contexts/WalletContext');
  return {
    ...actual,
    useWallet: vi.fn(),
  };
});

const { useWallet } = await import('@/contexts/WalletContext');

describe('useEligibilityCheck', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default mock: wallet connected
    (useWallet as any).mockReturnValue({
      activeWallet: '0x1234567890123456789012345678901234567890',
      connectedWallets: [],
      setActiveWallet: vi.fn(),
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      isLoading: false,
      isSwitching: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>{children}</WalletProvider>
    </QueryClientProvider>
  );

  describe('Basic Functionality', () => {
    it('should fetch eligibility when wallet is connected', async () => {
      const mockResponse = {
        status: 'likely',
        score: 0.85,
        reasons: ['Wallet has activity on required chain', 'Wallet age > 30 days'],
        cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      const { result } = renderHook(
        () =>
          useEligibilityCheck({
            opportunityId: 'opp-123',
            chain: 'ethereum',
          }),
        { wrapper }
      );

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.eligibility).toBeUndefined();

      // Wait for data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.eligibility).toEqual(mockResponse);
      expect(result.current.hasWallet).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should return unknown status when no wallet is connected', async () => {
      useWallet.mockReturnValue({
        activeWallet: null,
        connectedWallets: [],
        setActiveWallet: vi.fn(),
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        isLoading: false,
        isSwitching: false,
      });

      const { result } = renderHook(
        () =>
          useEligibilityCheck({
            opportunityId: 'opp-123',
            chain: 'ethereum',
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.eligibility?.status).toBe('unknown');
      expect(result.current.eligibility?.reasons).toContain('Connect a wallet to check eligibility');
      expect(result.current.hasWallet).toBe(false);
    });
  });

  describe('Wallet Change Integration', () => {
    it('should refetch eligibility when active wallet changes', async () => {
      const wallet1 = '0x1111111111111111111111111111111111111111';
      const wallet2 = '0x2222222222222222222222222222222222222222';

      const mockResponse1 = {
        status: 'likely',
        score: 0.85,
        reasons: ['Wallet 1 eligible'],
        cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      const mockResponse2 = {
        status: 'unlikely',
        score: 0.25,
        reasons: ['Wallet 2 not eligible'],
        cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      // Initial wallet
      useWallet.mockReturnValue({
        activeWallet: wallet1,
        connectedWallets: [],
        setActiveWallet: vi.fn(),
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        isLoading: false,
        isSwitching: false,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse1,
        headers: new Headers(),
      });

      const { result, rerender } = renderHook(
        () =>
          useEligibilityCheck({
            opportunityId: 'opp-123',
            chain: 'ethereum',
          }),
        { wrapper }
      );

      // Wait for initial data
      await waitFor(() => {
        expect(result.current.eligibility).toEqual(mockResponse1);
      });

      // Change wallet
      useWallet.mockReturnValue({
        activeWallet: wallet2,
        connectedWallets: [],
        setActiveWallet: vi.fn(),
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        isLoading: false,
        isSwitching: false,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse2,
        headers: new Headers(),
      });

      // Rerender to trigger wallet change
      rerender();

      // Wait for new data
      await waitFor(() => {
        expect(result.current.eligibility).toEqual(mockResponse2);
      });

      // Verify fetch was called with new wallet
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`wallet=${wallet2}`)
      );
    });
  });

  describe('Manual Recalculation', () => {
    it('should recalculate eligibility when recalculate is called', async () => {
      const mockResponse1 = {
        status: 'maybe',
        score: 0.55,
        reasons: ['Initial check'],
        cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      const mockResponse2 = {
        status: 'likely',
        score: 0.85,
        reasons: ['Updated check'],
        cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse1,
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse2,
          headers: new Headers(),
        });

      const { result } = renderHook(
        () =>
          useEligibilityCheck({
            opportunityId: 'opp-123',
            chain: 'ethereum',
          }),
        { wrapper }
      );

      // Wait for initial data
      await waitFor(() => {
        expect(result.current.eligibility).toEqual(mockResponse1);
      });

      // Recalculate
      act(() => {
        result.current.recalculate();
      });

      // Should show recalculating state
      expect(result.current.isRecalculating).toBe(true);

      // Wait for recalculation to complete
      await waitFor(() => {
        expect(result.current.eligibility).toEqual(mockResponse2);
      });

      // Advance timers to clear recalculating state
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isRecalculating).toBe(false);
    });

    it('should throttle recalculate calls to 1 per 5 seconds', async () => {
      const mockResponse = {
        status: 'likely',
        score: 0.85,
        reasons: ['Test'],
        cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      const { result } = renderHook(
        () =>
          useEligibilityCheck({
            opportunityId: 'opp-123',
            chain: 'ethereum',
          }),
        { wrapper }
      );

      // Wait for initial data
      await waitFor(() => {
        expect(result.current.eligibility).toBeDefined();
      });

      const initialFetchCount = (global.fetch as any).mock.calls.length;

      // Call recalculate multiple times rapidly
      act(() => {
        result.current.recalculate();
        result.current.recalculate();
        result.current.recalculate();
      });

      // Wait for any pending updates
      await waitFor(() => {
        expect(result.current.isRecalculating).toBe(true);
      });

      // Should only trigger one additional fetch (throttled)
      expect((global.fetch as any).mock.calls.length).toBe(initialFetchCount + 1);

      // Advance time by 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Now another recalculate should work
      act(() => {
        result.current.recalculate();
      });

      await waitFor(() => {
        expect((global.fetch as any).mock.calls.length).toBe(initialFetchCount + 2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: {
            code: 'INTERNAL',
            message: 'Internal server error',
          },
        }),
        headers: new Headers(),
      });

      const { result } = renderHook(
        () =>
          useEligibilityCheck({
            opportunityId: 'opp-123',
            chain: 'ethereum',
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.message).toContain('Failed to check eligibility');
    });

    it('should handle rate limiting errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({
          'Retry-After': '60',
        }),
        json: async () => ({
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            retry_after_sec: 60,
          },
        }),
      });

      const { result } = renderHook(
        () =>
          useEligibilityCheck({
            opportunityId: 'opp-123',
            chain: 'ethereum',
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.message).toContain('Rate limited');
    });
  });

  describe('Caching', () => {
    it('should cache results per wallet + opportunity pair', async () => {
      const mockResponse = {
        status: 'likely',
        score: 0.85,
        reasons: ['Cached result'],
        cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      // First render
      const { result: result1 } = renderHook(
        () =>
          useEligibilityCheck({
            opportunityId: 'opp-123',
            chain: 'ethereum',
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result1.current.eligibility).toBeDefined();
      });

      const firstFetchCount = (global.fetch as any).mock.calls.length;

      // Second render with same params - should use cache
      const { result: result2 } = renderHook(
        () =>
          useEligibilityCheck({
            opportunityId: 'opp-123',
            chain: 'ethereum',
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result2.current.eligibility).toBeDefined();
      });

      // Should not trigger additional fetch (using cache)
      expect((global.fetch as any).mock.calls.length).toBe(firstFetchCount);
    });
  });

  describe('Enabled Prop', () => {
    it('should not fetch when enabled is false', async () => {
      const { result } = renderHook(
        () =>
          useEligibilityCheck({
            opportunityId: 'opp-123',
            chain: 'ethereum',
            enabled: false,
          }),
        { wrapper }
      );

      // Wait a bit
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should not have fetched
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.eligibility).toBeUndefined();
    });
  });
});
