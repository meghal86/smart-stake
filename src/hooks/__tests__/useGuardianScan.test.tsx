import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useGuardianScan } from '../useGuardianScan';

const { requestGuardianScanMock, walletContextState } = vi.hoisted(() => ({
  requestGuardianScanMock: vi.fn(),
  walletContextState: {
    activeWallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    activeNetwork: 'eip155:1',
    isAuthenticated: true,
  },
}));

vi.mock('@/services/guardianService', () => ({
  requestGuardianScan: requestGuardianScanMock,
}));

vi.mock('@/contexts/WalletContext', () => ({
  useWallet: () => walletContextState,
}));

describe('useGuardianScan', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    requestGuardianScanMock.mockResolvedValue({
      trustScorePercent: 88,
      trustScoreRaw: 0.88,
      riskScore: 2,
      riskLevel: 'Low',
      statusLabel: 'Trusted',
      statusTone: 'trusted',
      flags: [],
      scannedAt: '2026-03-05T12:00:00.000Z',
      dataSource: 'live',
    });

    walletContextState.activeWallet = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    walletContextState.activeNetwork = 'eip155:1';
    walletContextState.isAuthenticated = true;
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('uses the explicitly provided wallet when scope is explicit', async () => {
    renderHook(
      () =>
        useGuardianScan({
          walletAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          network: 'ethereum',
          scope: 'explicit',
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(requestGuardianScanMock).toHaveBeenCalledWith({
        walletAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        network: 'ethereum',
      });
    });
  });

  it('uses WalletContext values when scope is auto', async () => {
    renderHook(() => useGuardianScan(), { wrapper });

    await waitFor(() => {
      expect(requestGuardianScanMock).toHaveBeenCalledWith({
        walletAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        network: 'eip155:1',
      });
    });
  });
});
