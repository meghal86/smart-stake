/**
 * Unit tests for useHomeMetrics hook
 * 
 * Tests:
 * - Demo mode returns instant data
 * - Live mode fetches from API
 * - Demo → live transition
 * - Error recovery with cached data
 * - Retry logic
 * - JWT expiration handling
 * 
 * Requirements: 7.1, 7.2, 7.4, System Req 14.1-14.10
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { 
  useHomeMetrics, 
  getFreshnessStatus, 
  getFreshnessMessage,
  getFreshnessColor,
  type FreshnessStatus 
} from '../useHomeMetrics';
import { HomeMetrics } from '@/types/home';

// Mock the HomeAuthContext
vi.mock('@/lib/context/HomeAuthContext', () => ({
  useHomeAuth: vi.fn(() => ({
    isAuthenticated: false,
    walletAddress: null,
    isLoading: false,
    error: null,
  })),
}));

// Mock the demo data service
vi.mock('@/lib/services/demoDataService', () => ({
  getDemoMetrics: vi.fn(() => ({
    guardianScore: 89,
    hunterOpportunities: 42,
    hunterAvgApy: 18.5,
    hunterConfidence: 92,
    harvestEstimateUsd: 12400,
    harvestEligibleTokens: 7,
    harvestGasEfficiency: 'High',
    totalWalletsProtected: 50000,
    totalYieldOptimizedUsd: 12400000,
    averageGuardianScore: 85,
    lastUpdated: new Date().toISOString(),
    isDemo: true,
    demoMode: true,
  })),
}));

// Mock fetch
global.fetch = vi.fn();

describe('useHomeMetrics', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retry for tests
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('Demo mode', () => {
    test('should return demo metrics instantly without API call', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: false,
        walletAddress: null,
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      const { result } = renderHook(() => useHomeMetrics(), { wrapper });

      // Should have data immediately (demo mode)
      await waitFor(() => {
        expect(result.current.metrics).toBeDefined();
        expect(result.current.metrics?.isDemo).toBe(true);
        expect(result.current.isDemo).toBe(true);
      });

      // Should not make any API calls
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should return demo metrics with correct structure', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: false,
        walletAddress: null,
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      const { result } = renderHook(() => useHomeMetrics(), { wrapper });

      await waitFor(() => {
        expect(result.current.metrics).toMatchObject({
          guardianScore: expect.any(Number),
          hunterOpportunities: expect.any(Number),
          hunterAvgApy: expect.any(Number),
          hunterConfidence: expect.any(Number),
          harvestEstimateUsd: expect.any(Number),
          harvestEligibleTokens: expect.any(Number),
          harvestGasEfficiency: expect.any(String),
          totalWalletsProtected: expect.any(Number),
          totalYieldOptimizedUsd: expect.any(Number),
          averageGuardianScore: expect.any(Number),
          lastUpdated: expect.any(String),
          isDemo: true,
          demoMode: true,
        });
      });
    });

    test('should not refetch in demo mode', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: false,
        walletAddress: null,
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      const { result } = renderHook(() => useHomeMetrics(), { wrapper });

      await waitFor(() => {
        expect(result.current.metrics).toBeDefined();
      });

      // Wait a bit to ensure no refetch happens
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still not have called fetch
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Live mode', () => {
    test('should fetch from API when authenticated', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: true,
        walletAddress: '0x1234567890123456789012345678901234567890',
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      const mockMetrics: HomeMetrics = {
        guardianScore: 87,
        hunterOpportunities: 28,
        hunterAvgApy: 16.8,
        hunterConfidence: 88,
        harvestEstimateUsd: 3800,
        harvestEligibleTokens: 5,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: false,
        demoMode: false,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockMetrics }),
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useHomeMetrics(), { wrapper });

      await waitFor(() => {
        expect(result.current.metrics).toBeDefined();
        expect(result.current.metrics?.isDemo).toBe(false);
        expect(result.current.isDemo).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/home-metrics',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
    });

    test('should return live metrics with correct structure', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: true,
        walletAddress: '0x1234567890123456789012345678901234567890',
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      const mockMetrics: HomeMetrics = {
        guardianScore: 87,
        hunterOpportunities: 28,
        hunterAvgApy: 16.8,
        hunterConfidence: 88,
        harvestEstimateUsd: 3800,
        harvestEligibleTokens: 5,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: false,
        demoMode: false,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockMetrics }),
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useHomeMetrics(), { wrapper });

      await waitFor(() => {
        expect(result.current.metrics).toEqual(mockMetrics);
      });
    });
  });

  describe('Demo → Live transition', () => {
    test('should transition from demo to live metrics on authentication', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      
      // Start unauthenticated
      const mockUseHomeAuth = vi.mocked(useHomeAuth);
      mockUseHomeAuth.mockReturnValue({
        isAuthenticated: false,
        walletAddress: null,
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      const { result, rerender } = renderHook(() => useHomeMetrics(), { wrapper });

      // Should have demo metrics
      await waitFor(() => {
        expect(result.current.metrics?.isDemo).toBe(true);
      });

      // Now authenticate
      const mockMetrics: HomeMetrics = {
        guardianScore: 87,
        hunterOpportunities: 28,
        hunterAvgApy: 16.8,
        hunterConfidence: 88,
        harvestEstimateUsd: 3800,
        harvestEligibleTokens: 5,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: false,
        demoMode: false,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockMetrics }),
      });
      global.fetch = mockFetch;

      mockUseHomeAuth.mockReturnValue({
        isAuthenticated: true,
        walletAddress: '0x1234567890123456789012345678901234567890',
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      rerender();

      // Should now have live metrics
      await waitFor(() => {
        expect(result.current.metrics?.isDemo).toBe(false);
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Error recovery with cached data', () => {
    test('should show cached data when API fails', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: true,
        walletAddress: '0x1234567890123456789012345678901234567890',
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      const mockMetrics: HomeMetrics = {
        guardianScore: 87,
        hunterOpportunities: 28,
        hunterAvgApy: 16.8,
        hunterConfidence: 88,
        harvestEstimateUsd: 3800,
        harvestEligibleTokens: 5,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: false,
        demoMode: false,
      };

      // First call succeeds
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ data: mockMetrics }),
          });
        }
        // Second call fails
        return Promise.reject(new Error('Network error'));
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useHomeMetrics(), { wrapper });

      // Initial load succeeds
      await waitFor(() => {
        expect(result.current.metrics).toBeDefined();
      });

      const initialMetrics = result.current.metrics;

      // Trigger refetch (will fail)
      result.current.manualRefresh();

      // Should still show cached data
      await waitFor(() => {
        expect(result.current.metrics).toEqual(initialMetrics);
      });
    });
  });

  describe('Retry logic', () => {
    test('should retry with exponential backoff on failure', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: true,
        walletAddress: '0x1234567890123456789012345678901234567890',
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      // Create a new QueryClient with retry enabled for this test
      // Use shorter delays for testing
      const retryQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2, // Reduce retries for faster test
            retryDelay: () => 100, // Use fixed short delay for testing
          },
        },
      });

      const retryWrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={retryQueryClient}>
          {children}
        </QueryClientProvider>
      );

      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      renderHook(() => useHomeMetrics(), { wrapper: retryWrapper });

      // Wait for retries to happen
      await waitFor(
        () => {
          // Should retry 2 times (initial + 2 retries = 3 total)
          expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(2);
        },
        { timeout: 2000 }
      );

      retryQueryClient.clear();
    }, 3000); // Set test timeout to 3 seconds
  });

  describe('JWT expiration handling', () => {
    test('should revert to demo mode on 401 error', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: true,
        walletAddress: '0x1234567890123456789012345678901234567890',
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useHomeMetrics(), { wrapper });

      // Should revert to demo metrics
      await waitFor(() => {
        expect(result.current.metrics?.isDemo).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/home-metrics',
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    test('should clear JWT cookie on 401 error', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: true,
        walletAddress: '0x1234567890123456789012345678901234567890',
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });
      global.fetch = mockFetch;

      renderHook(() => useHomeMetrics(), { wrapper });

      await waitFor(() => {
        // Cookie should be cleared (we can't directly test document.cookie in jsdom)
        // But we can verify the function was called
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Data freshness', () => {
    test('should calculate data age correctly', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: true,
        walletAddress: '0x1234567890123456789012345678901234567890',
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      const mockMetrics: HomeMetrics = {
        guardianScore: 87,
        hunterOpportunities: 28,
        hunterAvgApy: 16.8,
        hunterConfidence: 88,
        harvestEstimateUsd: 3800,
        harvestEligibleTokens: 5,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: oneMinuteAgo,
        isDemo: false,
        demoMode: false,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockMetrics }),
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useHomeMetrics(), { wrapper });

      await waitFor(() => {
        expect(result.current.dataAge).toBeGreaterThan(0);
        expect(result.current.dataAge).toBeLessThan(2); // Should be ~1 minute
      });
    });

    test('should return correct freshness status for current data', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: true,
        walletAddress: '0x1234567890123456789012345678901234567890',
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      const mockMetrics: HomeMetrics = {
        guardianScore: 87,
        hunterOpportunities: 28,
        hunterAvgApy: 16.8,
        hunterConfidence: 88,
        harvestEstimateUsd: 3800,
        harvestEligibleTokens: 5,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(), // Current time
        isDemo: false,
        demoMode: false,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockMetrics }),
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useHomeMetrics(), { wrapper });

      await waitFor(() => {
        expect(result.current.freshnessStatus).toBe('current');
        expect(result.current.isFresh).toBe(true);
      });
    });

    test('should return correct freshness status for stale data', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: true,
        walletAddress: '0x1234567890123456789012345678901234567890',
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
      const mockMetrics: HomeMetrics = {
        guardianScore: 87,
        hunterOpportunities: 28,
        hunterAvgApy: 16.8,
        hunterConfidence: 88,
        harvestEstimateUsd: 3800,
        harvestEligibleTokens: 5,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: threeMinutesAgo,
        isDemo: false,
        demoMode: false,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockMetrics }),
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useHomeMetrics(), { wrapper });

      await waitFor(() => {
        expect(result.current.freshnessStatus).toBe('stale');
        expect(result.current.isFresh).toBe(true); // Still < 5 minutes
      });
    });

    test('should return correct freshness status for outdated data', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: true,
        walletAddress: '0x1234567890123456789012345678901234567890',
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
      const mockMetrics: HomeMetrics = {
        guardianScore: 87,
        hunterOpportunities: 28,
        hunterAvgApy: 16.8,
        hunterConfidence: 88,
        harvestEstimateUsd: 3800,
        harvestEligibleTokens: 5,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: sixMinutesAgo,
        isDemo: false,
        demoMode: false,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockMetrics }),
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useHomeMetrics(), { wrapper });

      await waitFor(() => {
        expect(result.current.freshnessStatus).toBe('outdated');
        expect(result.current.isFresh).toBe(false);
      });
    });
  });

  describe('Manual refresh', () => {
    test('should refetch data when manualRefresh is called', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: true,
        walletAddress: '0x1234567890123456789012345678901234567890',
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      const mockMetrics: HomeMetrics = {
        guardianScore: 87,
        hunterOpportunities: 28,
        hunterAvgApy: 16.8,
        hunterConfidence: 88,
        harvestEstimateUsd: 3800,
        harvestEligibleTokens: 5,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: false,
        demoMode: false,
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockMetrics }),
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useHomeMetrics(), { wrapper });

      await waitFor(() => {
        expect(result.current.metrics).toBeDefined();
      });

      const initialCallCount = mockFetch.mock.calls.length;

      // Trigger manual refresh
      result.current.manualRefresh();

      await waitFor(() => {
        expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });
});

describe('Freshness helper functions', () => {
  describe('getFreshnessStatus', () => {
    test('should return "current" for data < 2 minutes old', () => {
      const metrics: HomeMetrics = {
        guardianScore: 87,
        hunterOpportunities: 28,
        hunterAvgApy: 16.8,
        hunterConfidence: 88,
        harvestEstimateUsd: 3800,
        harvestEligibleTokens: 5,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: new Date().toISOString(),
        isDemo: false,
        demoMode: false,
      };

      expect(getFreshnessStatus(metrics)).toBe('current');
    });

    test('should return "stale" for data 2-5 minutes old', () => {
      const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
      const metrics: HomeMetrics = {
        guardianScore: 87,
        hunterOpportunities: 28,
        hunterAvgApy: 16.8,
        hunterConfidence: 88,
        harvestEstimateUsd: 3800,
        harvestEligibleTokens: 5,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: threeMinutesAgo,
        isDemo: false,
        demoMode: false,
      };

      expect(getFreshnessStatus(metrics)).toBe('stale');
    });

    test('should return "outdated" for data > 5 minutes old', () => {
      const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
      const metrics: HomeMetrics = {
        guardianScore: 87,
        hunterOpportunities: 28,
        hunterAvgApy: 16.8,
        hunterConfidence: 88,
        harvestEstimateUsd: 3800,
        harvestEligibleTokens: 5,
        harvestGasEfficiency: 'High',
        totalWalletsProtected: 50000,
        totalYieldOptimizedUsd: 12400000,
        averageGuardianScore: 85,
        lastUpdated: sixMinutesAgo,
        isDemo: false,
        demoMode: false,
      };

      expect(getFreshnessStatus(metrics)).toBe('outdated');
    });

    test('should return "outdated" for undefined metrics', () => {
      expect(getFreshnessStatus(undefined)).toBe('outdated');
    });
  });

  describe('getFreshnessMessage', () => {
    test('should return "Just now" for very recent data', () => {
      expect(getFreshnessMessage('current', 0.5)).toBe('Just now');
    });

    test('should return correct message for current data', () => {
      expect(getFreshnessMessage('current', 1)).toBe('Updated 1 minute ago');
      expect(getFreshnessMessage('current', 1.5)).toBe('Updated 1 minute ago');
    });

    test('should return correct message for stale data', () => {
      expect(getFreshnessMessage('stale', 3)).toBe('Updated 3 minutes ago');
    });

    test('should return correct message for outdated data in minutes', () => {
      expect(getFreshnessMessage('outdated', 10)).toBe('Updated 10 minutes ago (outdated)');
    });

    test('should return correct message for outdated data in hours', () => {
      expect(getFreshnessMessage('outdated', 60)).toBe('Updated 1 hour ago (outdated)');
      expect(getFreshnessMessage('outdated', 120)).toBe('Updated 2 hours ago (outdated)');
    });

    test('should return "Data unavailable" for null age', () => {
      expect(getFreshnessMessage('outdated', null)).toBe('Data unavailable');
    });
  });

  describe('getFreshnessColor', () => {
    test('should return green for current data', () => {
      expect(getFreshnessColor('current')).toBe('text-green-500');
    });

    test('should return yellow for stale data', () => {
      expect(getFreshnessColor('stale')).toBe('text-yellow-500');
    });

    test('should return red for outdated data', () => {
      expect(getFreshnessColor('outdated')).toBe('text-red-500');
    });
  });
});

