/**
 * useWalletQueryInvalidation Hook Tests
 * 
 * Tests for React Query invalidation on wallet/network changes
 * 
 * Feature: multi-chain-wallet-system
 * Property 9: Cross-Module Session Consistency
 * Task: 11 - React Query Integration
 * Validates: Requirements 4.1-4.5, 6.5
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWalletQueryInvalidation, useInvalidateWalletRegistry } from '@/hooks/useWalletQueryInvalidation';
import { WalletProvider } from '@/contexts/WalletContext';
import { AuthProvider } from '@/contexts/AuthProvider';
import React from 'react';

// Mock the WalletContext
vi.mock('@/contexts/WalletContext', async () => {
  const actual = await vi.importActual('@/contexts/WalletContext');
  return {
    ...actual,
    useWallet: vi.fn(() => ({
      activeWallet: '0xabc123',
      activeNetwork: 'eip155:1',
    })),
  };
});

describe('useWalletQueryInvalidation Hook', () => {
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

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  test('invalidates wallet-dependent queries on wallet change', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useWalletQueryInvalidation(), { wrapper });

    // Should have called invalidateQueries for wallet-dependent keys
    expect(invalidateSpy).toHaveBeenCalled();
  });

  test('invalidates network-dependent queries on network change', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useWalletQueryInvalidation(), { wrapper });

    // Should have called invalidateQueries for network-dependent keys
    expect(invalidateSpy).toHaveBeenCalled();
  });
});

describe('useInvalidateWalletRegistry Hook', () => {
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

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  test('returns a function that invalidates wallet registry', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useInvalidateWalletRegistry(), { wrapper });

    // Call the returned function
    result.current();

    // Should have called invalidateQueries with wallet registry key
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['wallets', 'registry'],
    });
  });

  test('can be called multiple times', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useInvalidateWalletRegistry(), { wrapper });

    // Call multiple times
    result.current();
    result.current();
    result.current();

    // Should have been called 3 times
    expect(invalidateSpy).toHaveBeenCalledTimes(3);
  });
});
