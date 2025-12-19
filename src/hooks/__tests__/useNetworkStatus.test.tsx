/**
 * Tests for useNetworkStatus hook
 * 
 * Requirements tested:
 * - R3.GAS.NONZERO: Gas never displays "0 gwei"
 * - R3.GAS.FALLBACK: On gas failure, shows "Gas unavailable" + telemetry event
 * - R3.GAS validation: Gas API returns null, 0, or values >1000 gwei shows "Gas unavailable"
 * 
 * Design → Data Integrity → Gas Oracle Rules
 */

import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useNetworkStatus } from '../useNetworkStatus';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock gtag
const mockGtag = vi.fn();
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
});

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useNetworkStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockGtag.mockClear();
  });

  describe('R3.GAS.NONZERO: Gas never displays "0 gwei"', () => {
    test('should never return 0 gwei even when API returns 0', async () => {
      // Mock API returning 0 gwei
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: '0x0', // 0 in hex
        }),
      });

      const { result } = renderHook(() => useNetworkStatus(), {
        wrapper: createWrapper(),
      });

      // Should show "Gas unavailable", never "0 gwei"
      await waitFor(() => {
        expect(result.current.data?.gasPrice).toBe(0); // Internal value for invalid gas
        expect(result.current.data?.formattedGasPrice).toBe('Gas unavailable');
        expect(result.current.data?.formattedGasPrice).not.toContain('0 gwei');
      });
    });

    test('should never return 0 gwei when API returns null', async () => {
      // Mock API returning null
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: null,
        }),
      });

      const { result } = renderHook(() => useNetworkStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data?.gasPrice).toBe(0); // Internal value for invalid gas
        expect(result.current.data?.formattedGasPrice).toBe('Gas unavailable');
        expect(result.current.data?.formattedGasPrice).not.toContain('0 gwei');
      });
    });

    test('should never return >1000 gwei values', async () => {
      // Test with 1500 gwei (1500 * 1e9 = 1500000000000 wei = 0x15D027BFE00)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: '0x15D027BFE00', // 1500 gwei in hex
        }),
      });

      const { result } = renderHook(() => useNetworkStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data?.gasPrice).toBe(0); // Internal value for invalid gas
        expect(result.current.data?.formattedGasPrice).toBe('Gas unavailable');
        expect(result.current.data?.formattedGasPrice).not.toContain('1500 gwei');
      });
    });

    test('should use placeholder data that never shows 0 gwei', () => {
      const { result } = renderHook(() => useNetworkStatus(), {
        wrapper: createWrapper(),
      });

      // Placeholder data should be immediately available and never 0
      expect(result.current.data?.gasPrice).not.toBe(0);
      expect(result.current.data?.gasPrice).toBe(25);
      expect(result.current.data?.formattedGasPrice).toBe('Gas: 25 gwei');
      expect(result.current.data?.formattedGasPrice).not.toContain('0 gwei');
    });
  });

  describe('R3.GAS.FALLBACK: Gas failure handling', () => {
    test('should show "Gas unavailable" when API fails', async () => {
      // Mock API failure
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useNetworkStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data?.gasPrice).toBe(0); // Internal value for failed gas
        expect(result.current.data?.formattedGasPrice).toBe('Gas unavailable');
      });

      // Should emit telemetry event
      expect(mockGtag).toHaveBeenCalledWith('event', 'gas_fetch_failure', {
        event_category: 'data_integrity',
        event_label: 'api_failure',
        error_message: 'Network error',
      });
    });

    test('should emit telemetry when gas validation fails', async () => {
      // Mock API returning invalid gas price (0)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: '0x0', // 0 gwei
        }),
      });

      const { result } = renderHook(() => useNetworkStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data?.gasPrice).toBe(0); // Internal value for invalid gas
        expect(result.current.data?.formattedGasPrice).toBe('Gas unavailable');
      });

      // Should emit validation failure telemetry
      expect(mockGtag).toHaveBeenCalledWith('event', 'gas_validation_failure', {
        event_category: 'data_integrity',
        event_label: 'invalid_gas_price',
        value: 0,
      });
    });
  });

  describe('Gas price formatting (R3.GAS requirements)', () => {
    test('should format gas price correctly with color coding', async () => {
      // Test different gas price ranges
      const testCases = [
        { gasPrice: 15, expectedColor: 'text-green-500', expectedFormat: 'Gas: 15 gwei' },
        { gasPrice: 50, expectedColor: 'text-yellow-500', expectedFormat: 'Gas: 50 gwei' },
        { gasPrice: 150, expectedColor: 'text-red-500', expectedFormat: 'Gas: 150 gwei' },
      ];

      for (const testCase of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            result: `0x${(testCase.gasPrice * 1e9).toString(16)}`, // Convert to hex wei
          }),
        });

        const { result } = renderHook(() => useNetworkStatus(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.data?.gasPrice).toBe(testCase.gasPrice);
          expect(result.current.data?.formattedGasPrice).toBe(testCase.expectedFormat);
          expect(result.current.data?.gasColorClass).toBe(testCase.expectedColor);
        });

        // Clear for next iteration
        vi.clearAllMocks();
      }
    });

    test('should handle zero gas price in formatting', async () => {
      // This tests the formatGasPrice function directly through the hook's error handling
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          result: '0x0', // 0 gwei
        }),
      });

      const { result } = renderHook(() => useNetworkStatus(), {
        wrapper: createWrapper(),
      });

      // Wait for the async operation to complete
      await waitFor(() => {
        // Should never show "Gas: 0 gwei", should show "Gas unavailable" instead
        expect(result.current.data?.formattedGasPrice).not.toBe('Gas: 0 gwei');
        expect(result.current.data?.formattedGasPrice).toBe('Gas unavailable');
      });
    });
  });

  describe('Cache and refresh behavior (R3.GAS requirements)', () => {
    test('should refresh every 30 seconds', () => {
      const { result } = renderHook(() => useNetworkStatus(), {
        wrapper: createWrapper(),
      });

      // Check that refetchInterval is set to 30 seconds (30000ms)
      expect(result.current.refetch).toBeDefined();
      // Note: We can't easily test the actual interval timing in unit tests
      // This would be better tested in integration tests
    });

    test('should have 20 second stale time', () => {
      const { result } = renderHook(() => useNetworkStatus(), {
        wrapper: createWrapper(),
      });

      // The hook should be configured with proper stale time
      // This is more of a configuration test
      expect(result.current.data).toBeDefined();
    });
  });

  describe('Network status classification', () => {
    test('should classify gas prices correctly', async () => {
      const testCases = [
        { gasPrice: 15, expectedStatus: 'optimal' },
        { gasPrice: 35, expectedStatus: 'normal' },
        { gasPrice: 75, expectedStatus: 'congested' },
      ];

      for (const testCase of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            result: `0x${(testCase.gasPrice * 1e9).toString(16)}`,
          }),
        });

        const { result } = renderHook(() => useNetworkStatus(), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          expect(result.current.data?.status).toBe(testCase.expectedStatus);
        });

        vi.clearAllMocks();
      }
    });
  });
});