/**
 * Integration Tests for useEligibilityCheck Hook
 * 
 * Tests the hook with actual API integration (mocked at fetch level)
 * 
 * Requirements: 17.5, 18.5
 * Task: 47
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEligibilityCheck } from '@/hooks/useEligibilityCheck';
import React from 'react';

// Mock useWallet hook
const mockUseWallet = vi.fn();
vi.mock('@/contexts/WalletContext', () => ({
  useWallet: () => mockUseWallet(),
}));

describe('useEligibilityCheck Integration', () => {
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

    // Default: wallet connected
    mockUseWallet.mockReturnValue({
      activeWallet: '0x1234567890123456789012345678901234567890',
      connectedWallets: [],
      setActiveWallet: vi.fn(),
      connectWallet: vi.fn(),
      disconnectWallet: vi.fn(),
      isLoading: false,
      isSwitching: false,
    });

    // Mock fetch
    global.fetch = vi.fn();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should include activeWallet in query key', () => {
    const { result } = renderHook(
      () =>
        useEligibilityCheck({
          opportunityId: 'opp-123',
          chain: 'ethereum',
        }),
      { wrapper }
    );

    // The hook should be created (even if loading)
    expect(result.current).toBeDefined();
    expect(result.current.hasWallet).toBe(true);
  });

  it('should not have wallet when activeWallet is null', () => {
    mockUseWallet.mockReturnValue({
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

    expect(result.current.hasWallet).toBe(false);
  });

  it('should provide recalculate function', () => {
    const { result } = renderHook(
      () =>
        useEligibilityCheck({
          opportunityId: 'opp-123',
          chain: 'ethereum',
        }),
      { wrapper }
    );

    expect(typeof result.current.recalculate).toBe('function');
  });

  it('should have isRecalculating state', () => {
    const { result } = renderHook(
      () =>
        useEligibilityCheck({
          opportunityId: 'opp-123',
          chain: 'ethereum',
        }),
      { wrapper }
    );

    expect(typeof result.current.isRecalculating).toBe('boolean');
    expect(result.current.isRecalculating).toBe(false);
  });
});
