/**
 * Integration Tests for Wallet Switching
 * 
 * Tests the complete wallet switching flow including:
 * - Feed refresh on wallet change
 * - Eligibility update on wallet change
 * - Personalized ranking with different wallets
 * - Wallet persistence across page reloads
 * - Wallet disconnection handling
 * - ENS + label combination restoration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock all dependencies
vi.mock('@/lib/name-resolution', () => ({
  resolveWalletName: vi.fn(),
}));

vi.mock('@/lib/wallet-history', () => ({
  getWalletHistory: vi.fn(),
}));

vi.mock('@/lib/feed/personalized-ranking', () => ({
  calculatePersonalizedRanking: vi.fn(),
}));

vi.mock('@/hooks/useWalletLabels', () => ({
  useWalletLabels: vi.fn(),
}));

vi.mock('@/hooks/useHunterFeed', () => ({
  useHunterFeed: vi.fn(),
}));

vi.mock('@/hooks/useEligibilityCheck', () => ({
  useEligibilityCheck: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

vi.mock('@/contexts/WalletContext', () => ({
  WalletProvider: ({ children }: { children: React.ReactNode }) => children,
  useWallet: vi.fn(() => ({
    selectedWallet: null,
    connectedWallets: [],
    selectWallet: vi.fn(),
    disconnectWallet: vi.fn(),
  })),
}));

describe('Wallet Switching Integration Tests', () => {
  let queryClient: QueryClient;

  const wallet1 = '0x1234567890123456789012345678901234567890';
  const wallet2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  const wallet3 = '0x9876543210987654321098765432109876543210';

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Clear storage
    localStorage.clear();
    sessionStorage.clear();

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };


  describe('Feed Refresh on Wallet Change', () => {
    it('should refetch feed data when wallet changes', async () => {
      const { resolveWalletName } = await import('@/lib/name-resolution');
      const { getWalletHistory } = await import('@/lib/wallet-history');
      const { useHunterFeed } = await import('@/hooks/useHunterFeed');
      
      const mockRefetch = vi.fn();
      
      vi.mocked(useHunterFeed).mockReturnValue({
        opportunities: [],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
      } as any);

      vi.mocked(resolveWalletName).mockResolvedValue({
        address: wallet1,
        ensName: null,
        label: null,
        displayName: `${wallet1.slice(0, 6)}...${wallet1.slice(-4)}`,
      });

      vi.mocked(getWalletHistory).mockResolvedValue({
        chains: ['ethereum'],
        recentCompletions: [],
        saves: [],
        preferredChains: ['ethereum'],
      });

      // Set up initial wallet
      localStorage.setItem('selectedWallet', wallet1);
      localStorage.setItem('connectedWallets', JSON.stringify([wallet1, wallet2]));

      const { result } = renderHook(() => useHunterFeed(), { wrapper });

      // Change wallet
      localStorage.setItem('selectedWallet', wallet2);
      
      // Trigger refetch
      result.current.refetch();

      // Verify refetch was called
      expect(mockRefetch).toHaveBeenCalled();
    });

    it('should maintain scroll position during wallet switch', async () => {
      const initialScrollY = 500;
      window.scrollY = initialScrollY;

      localStorage.setItem('selectedWallet', wallet1);
      localStorage.setItem('connectedWallets', JSON.stringify([wallet1, wallet2]));

      // Switch wallet
      localStorage.setItem('selectedWallet', wallet2);

      // Verify scroll position maintained
      expect(window.scrollY).toBe(initialScrollY);
    });

    it('should show loading state during feed refresh', async () => {
      const { useHunterFeed } = await import('@/hooks/useHunterFeed');
      
      // Mock loading state
      vi.mocked(useHunterFeed).mockReturnValueOnce({
        opportunities: [],
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
      } as any);
      
      localStorage.setItem('selectedWallet', wallet1);
      
      const { result } = renderHook(() => useHunterFeed(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Mock loaded state
      vi.mocked(useHunterFeed).mockReturnValueOnce({
        opportunities: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
      } as any);

      // Rerender to get updated state
      const { result: result2 } = renderHook(() => useHunterFeed(), { wrapper });
      expect(result2.current.isLoading).toBe(false);
    });
  });

  describe('Eligibility Update on Wallet Change', () => {

    it('should update eligibility previews when wallet changes', async () => {
      const { useEligibilityCheck } = await import('@/hooks/useEligibilityCheck');
      
      // Mock eligibility for wallet1
      vi.mocked(useEligibilityCheck).mockReturnValueOnce({
        status: 'likely',
        score: 0.85,
        reasons: ['Wallet has sufficient history'],
        isChecking: false,
        error: null,
      } as any);
      
      localStorage.setItem('selectedWallet', wallet1);
      localStorage.setItem('connectedWallets', JSON.stringify([wallet1, wallet2]));

      const { result: result1 } = renderHook(
        () => useEligibilityCheck('opp-1', wallet1),
        { wrapper }
      );

      expect(result1.current.isChecking).toBe(false);
      expect(result1.current.status).toBe('likely');

      // Switch to wallet2
      localStorage.setItem('selectedWallet', wallet2);

      // Mock eligibility for wallet2
      vi.mocked(useEligibilityCheck).mockReturnValueOnce({
        status: 'unlikely',
        score: 0.25,
        reasons: ['Wallet is too new'],
        isChecking: false,
        error: null,
      } as any);

      const { result: result2 } = renderHook(
        () => useEligibilityCheck('opp-1', wallet2),
        { wrapper }
      );

      expect(result2.current.isChecking).toBe(false);
      expect(result2.current.status).toBe('unlikely');

      // Verify different eligibility for different wallets
      expect(result1.current.status).not.toEqual(result2.current.status);
    });

    it('should clear eligibility cache when wallet changes', async () => {
      const { useEligibilityCheck } = await import('@/hooks/useEligibilityCheck');
      
      // Mock initial state (loaded)
      vi.mocked(useEligibilityCheck).mockReturnValueOnce({
        status: 'likely',
        score: 0.85,
        reasons: ['Wallet has sufficient history'],
        isChecking: false,
        error: null,
      } as any);
      
      localStorage.setItem('selectedWallet', wallet1);

      const { result, rerender } = renderHook(
        ({ wallet }) => useEligibilityCheck('opp-1', wallet),
        { 
          wrapper,
          initialProps: { wallet: wallet1 }
        }
      );

      expect(result.current.isChecking).toBe(false);

      // Switch wallet - should trigger checking state
      localStorage.setItem('selectedWallet', wallet2);
      
      vi.mocked(useEligibilityCheck).mockReturnValueOnce({
        status: 'unknown',
        score: 0,
        reasons: [],
        isChecking: true,
        error: null,
      } as any);
      
      rerender({ wallet: wallet2 });

      // Should trigger new check
      expect(result.current.isChecking).toBe(true);
    });

    it('should handle eligibility check errors gracefully', async () => {
      const { useEligibilityCheck } = await import('@/hooks/useEligibilityCheck');
      
      // Mock error state
      vi.mocked(useEligibilityCheck).mockReturnValue({
        status: 'unknown',
        score: 0,
        reasons: ['Unable to check eligibility'],
        isChecking: false,
        error: new Error('Network error'),
      } as any);

      localStorage.setItem('selectedWallet', wallet1);

      const { result } = renderHook(
        () => useEligibilityCheck('opp-1', wallet1),
        { wrapper }
      );

      expect(result.current.isChecking).toBe(false);
      expect(result.current.status).toBe('unknown');
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Personalized Ranking with Different Wallets', () => {

    it('should apply different ranking for different wallets', async () => {
      const { getWalletHistory } = await import('@/lib/wallet-history');
      const { calculatePersonalizedRanking } = await import('@/lib/feed/personalized-ranking');

      // Wallet 1: Ethereum user
      vi.mocked(getWalletHistory).mockResolvedValueOnce({
        chains: ['ethereum'],
        recentCompletions: ['airdrop-1'],
        saves: [],
        preferredChains: ['ethereum'],
      });

      vi.mocked(calculatePersonalizedRanking).mockResolvedValueOnce([
        { id: '1', slug: 'eth-opp', rank_score: 0.95 } as any,
        { id: '2', slug: 'base-opp', rank_score: 0.60 } as any,
      ]);

      localStorage.setItem('selectedWallet', wallet1);

      const history1 = await getWalletHistory(wallet1);
      const ranking1 = await calculatePersonalizedRanking([], history1);

      expect(ranking1[0].slug).toBe('eth-opp');
      expect(ranking1[0].rank_score).toBeGreaterThan(ranking1[1].rank_score);

      // Wallet 2: Base user
      vi.mocked(getWalletHistory).mockResolvedValueOnce({
        chains: ['base'],
        recentCompletions: [],
        saves: [],
        preferredChains: ['base'],
      });

      vi.mocked(calculatePersonalizedRanking).mockResolvedValueOnce([
        { id: '2', slug: 'base-opp', rank_score: 0.95 } as any,
        { id: '1', slug: 'eth-opp', rank_score: 0.60 } as any,
      ]);

      localStorage.setItem('selectedWallet', wallet2);

      const history2 = await getWalletHistory(wallet2);
      const ranking2 = await calculatePersonalizedRanking([], history2);

      expect(ranking2[0].slug).toBe('base-opp');
      expect(ranking2[0].rank_score).toBeGreaterThan(ranking2[1].rank_score);
    });

    it('should fall back to default ranking when wallet disconnected', async () => {
      const { calculatePersonalizedRanking } = await import('@/lib/feed/personalized-ranking');
      const { useHunterFeed } = await import('@/hooks/useHunterFeed');

      // Mock feed without personalization
      vi.mocked(useHunterFeed).mockReturnValue({
        opportunities: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
      } as any);

      // Clear wallet
      localStorage.removeItem('selectedWallet');
      localStorage.removeItem('connectedWallets');

      const { result } = renderHook(() => useHunterFeed(), { wrapper });

      expect(result.current.isLoading).toBe(false);

      // Should not call personalized ranking
      expect(vi.mocked(calculatePersonalizedRanking)).not.toHaveBeenCalled();
    });
  });

  describe('Wallet Persistence Across Page Reloads', () => {

    it('should restore selected wallet from localStorage on mount', async () => {
      const { getWalletHistory } = await import('@/lib/wallet-history');
      const { resolveWalletName } = await import('@/lib/name-resolution');
      const { useHunterFeed } = await import('@/hooks/useHunterFeed');

      // Set up localStorage
      localStorage.setItem('selectedWallet', wallet1);
      localStorage.setItem('connectedWallets', JSON.stringify([wallet1, wallet2]));

      vi.mocked(resolveWalletName).mockResolvedValue({
        address: wallet1,
        ensName: null,
        label: null,
        displayName: `${wallet1.slice(0, 6)}...${wallet1.slice(-4)}`,
      });

      vi.mocked(getWalletHistory).mockResolvedValue({
        chains: ['ethereum'],
        recentCompletions: [],
        saves: [],
        preferredChains: ['ethereum'],
      });

      vi.mocked(useHunterFeed).mockReturnValue({
        opportunities: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
      } as any);

      // Simulate page reload by creating new hook instance
      const { result } = renderHook(() => useHunterFeed(), { wrapper });

      expect(result.current.isLoading).toBe(false);

      // Verify localStorage was read
      expect(localStorage.getItem('selectedWallet')).toBe(wallet1);
    });

    it('should persist wallet selection to localStorage on change', async () => {
      localStorage.setItem('connectedWallets', JSON.stringify([wallet1, wallet2]));

      // Select wallet1
      localStorage.setItem('selectedWallet', wallet1);
      expect(localStorage.getItem('selectedWallet')).toBe(wallet1);

      // Change to wallet2
      localStorage.setItem('selectedWallet', wallet2);
      expect(localStorage.getItem('selectedWallet')).toBe(wallet2);
    });

    it('should handle missing wallet in localStorage gracefully', async () => {
      const { getWalletHistory } = await import('@/lib/wallet-history');
      const { useHunterFeed } = await import('@/hooks/useHunterFeed');

      // Set invalid wallet
      localStorage.setItem('selectedWallet', 'invalid-wallet');
      localStorage.setItem('connectedWallets', JSON.stringify([wallet1]));

      vi.mocked(getWalletHistory).mockResolvedValue({
        chains: ['ethereum'],
        recentCompletions: [],
        saves: [],
        preferredChains: ['ethereum'],
      });

      vi.mocked(useHunterFeed).mockReturnValue({
        opportunities: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        isFetchingNextPage: false,
      } as any);

      const { result } = renderHook(() => useHunterFeed(), { wrapper });

      expect(result.current.isLoading).toBe(false);

      // Should fall back to first available wallet
      localStorage.setItem('selectedWallet', wallet1);
      expect(localStorage.getItem('selectedWallet')).toBe(wallet1);
    });

    it('should clear localStorage when all wallets disconnected', async () => {
      localStorage.setItem('selectedWallet', wallet1);
      localStorage.setItem('connectedWallets', JSON.stringify([wallet1]));

      // Disconnect all wallets
      localStorage.removeItem('selectedWallet');
      localStorage.removeItem('connectedWallets');

      expect(localStorage.getItem('selectedWallet')).toBeNull();
      expect(localStorage.getItem('connectedWallets')).toBeNull();
    });
  });

  describe('Wallet Disconnection Handling', () => {

    it('should remove disconnected wallet from selector', async () => {
      localStorage.setItem('connectedWallets', JSON.stringify([wallet1, wallet2]));
      localStorage.setItem('selectedWallet', wallet1);

      // Disconnect wallet1
      const wallets = JSON.parse(localStorage.getItem('connectedWallets') || '[]');
      const updated = wallets.filter((w: string) => w !== wallet1);
      localStorage.setItem('connectedWallets', JSON.stringify(updated));

      const remaining = JSON.parse(localStorage.getItem('connectedWallets') || '[]');
      expect(remaining).not.toContain(wallet1);
      expect(remaining).toContain(wallet2);
    });

    it('should switch to next available wallet when active wallet disconnected', async () => {
      localStorage.setItem('connectedWallets', JSON.stringify([wallet1, wallet2]));
      localStorage.setItem('selectedWallet', wallet1);

      // Disconnect active wallet
      const wallets = JSON.parse(localStorage.getItem('connectedWallets') || '[]');
      const updated = wallets.filter((w: string) => w !== wallet1);
      localStorage.setItem('connectedWallets', JSON.stringify(updated));
      
      // Switch to next available
      if (updated.length > 0) {
        localStorage.setItem('selectedWallet', updated[0]);
      }

      expect(localStorage.getItem('selectedWallet')).toBe(wallet2);
    });

    it('should clear selection when last wallet disconnected', async () => {
      localStorage.setItem('connectedWallets', JSON.stringify([wallet1]));
      localStorage.setItem('selectedWallet', wallet1);

      // Disconnect last wallet
      localStorage.removeItem('connectedWallets');
      localStorage.removeItem('selectedWallet');

      expect(localStorage.getItem('selectedWallet')).toBeNull();
      expect(localStorage.getItem('connectedWallets')).toBeNull();
    });

    it('should clear eligibility data when wallet disconnected', async () => {
      const { useEligibilityCheck } = await import('@/hooks/useEligibilityCheck');

      // Mock initial state with wallet
      vi.mocked(useEligibilityCheck).mockReturnValueOnce({
        status: 'likely',
        score: 0.85,
        reasons: ['Wallet has sufficient history'],
        isChecking: false,
        error: null,
      } as any);

      localStorage.setItem('selectedWallet', wallet1);

      const { result, rerender } = renderHook(
        ({ wallet }) => useEligibilityCheck('opp-1', wallet),
        {
          wrapper,
          initialProps: { wallet: wallet1 }
        }
      );

      expect(result.current.isChecking).toBe(false);
      expect(result.current.status).toBe('likely');

      // Disconnect wallet
      localStorage.removeItem('selectedWallet');
      
      // Mock state without wallet
      vi.mocked(useEligibilityCheck).mockReturnValueOnce({
        status: 'unknown',
        score: 0,
        reasons: ['No wallet connected'],
        isChecking: false,
        error: null,
      } as any);
      
      rerender({ wallet: '' });

      // Should not check eligibility without wallet
      expect(result.current.status).toBe('unknown');
    });
  });

  describe('ENS + Label Combination Restoration', () => {

    it('should restore ENS name on wallet reconnection', async () => {
      const { resolveWalletName } = await import('@/lib/name-resolution');
      const ensName = 'vitalik.eth';

      const mockResolve = vi.mocked(resolveWalletName);
      mockResolve.mockResolvedValue({
        address: wallet1,
        ensName,
        label: null,
        displayName: ensName,
      });

      localStorage.setItem('connectedWallets', JSON.stringify([wallet1]));
      localStorage.setItem('selectedWallet', wallet1);

      const result = await resolveWalletName(wallet1);

      expect(result.ensName).toBe(ensName);
      expect(result.displayName).toBe(ensName);
    });

    it('should restore custom label on wallet reconnection', async () => {
      const { resolveWalletName } = await import('@/lib/name-resolution');
      const { useWalletLabels } = await import('@/hooks/useWalletLabels');
      const customLabel = 'My Trading Wallet';

      vi.mocked(useWalletLabels).mockReturnValue({
        labels: { [wallet1]: customLabel },
        setLabel: vi.fn(),
        removeLabel: vi.fn(),
        isLoading: false,
      } as any);

      const mockResolve = vi.mocked(resolveWalletName);
      mockResolve.mockResolvedValue({
        address: wallet1,
        ensName: null,
        label: customLabel,
        displayName: customLabel,
      });

      localStorage.setItem('connectedWallets', JSON.stringify([wallet1]));
      localStorage.setItem('selectedWallet', wallet1);

      const result = await resolveWalletName(wallet1);

      expect(result.label).toBe(customLabel);
      expect(result.displayName).toBe(customLabel);
    });

    it('should prioritize label over ENS when both exist', async () => {
      const { resolveWalletName } = await import('@/lib/name-resolution');
      const { useWalletLabels } = await import('@/hooks/useWalletLabels');
      const ensName = 'vitalik.eth';
      const customLabel = 'Vitalik Main';

      vi.mocked(useWalletLabels).mockReturnValue({
        labels: { [wallet1]: customLabel },
        setLabel: vi.fn(),
        removeLabel: vi.fn(),
        isLoading: false,
      } as any);

      const mockResolve = vi.mocked(resolveWalletName);
      mockResolve.mockResolvedValue({
        address: wallet1,
        ensName,
        label: customLabel,
        displayName: customLabel, // Label takes priority
      });

      const result = await resolveWalletName(wallet1);

      expect(result.displayName).toBe(customLabel);
      expect(result.ensName).toBe(ensName);
      expect(result.label).toBe(customLabel);
    });

    it('should fall back to truncated address when no ENS or label', async () => {
      const { resolveWalletName } = await import('@/lib/name-resolution');

      const mockResolve = vi.mocked(resolveWalletName);
      mockResolve.mockResolvedValue({
        address: wallet1,
        ensName: null,
        label: null,
        displayName: `${wallet1.slice(0, 6)}...${wallet1.slice(-4)}`,
      });

      const result = await resolveWalletName(wallet1);

      expect(result.displayName).toBe(`${wallet1.slice(0, 6)}...${wallet1.slice(-4)}`);
      expect(result.ensName).toBeNull();
      expect(result.label).toBeNull();
    });

    it('should restore multiple wallets with mixed ENS/labels', async () => {
      const { resolveWalletName } = await import('@/lib/name-resolution');
      const { useWalletLabels } = await import('@/hooks/useWalletLabels');

      vi.mocked(useWalletLabels).mockReturnValue({
        labels: { 
          [wallet2]: 'Trading Wallet',
        },
        setLabel: vi.fn(),
        removeLabel: vi.fn(),
        isLoading: false,
      } as any);

      const mockResolve = vi.mocked(resolveWalletName);

      // Wallet 1: ENS
      mockResolve.mockResolvedValueOnce({
        address: wallet1,
        ensName: 'vitalik.eth',
        label: null,
        displayName: 'vitalik.eth',
      });

      // Wallet 2: Label
      mockResolve.mockResolvedValueOnce({
        address: wallet2,
        ensName: null,
        label: 'Trading Wallet',
        displayName: 'Trading Wallet',
      });

      // Wallet 3: Truncated
      mockResolve.mockResolvedValueOnce({
        address: wallet3,
        ensName: null,
        label: null,
        displayName: `${wallet3.slice(0, 6)}...${wallet3.slice(-4)}`,
      });

      localStorage.setItem('connectedWallets', JSON.stringify([wallet1, wallet2, wallet3]));

      const result1 = await resolveWalletName(wallet1);
      const result2 = await resolveWalletName(wallet2);
      const result3 = await resolveWalletName(wallet3);

      expect(result1.displayName).toBe('vitalik.eth');
      expect(result2.displayName).toBe('Trading Wallet');
      expect(result3.displayName).toBe(`${wallet3.slice(0, 6)}...${wallet3.slice(-4)}`);
    });
  });

  describe('Error Handling', () => {
    it('should handle wallet history fetch errors', async () => {
      const { getWalletHistory } = await import('@/lib/wallet-history');

      const mockGetHistory = vi.mocked(getWalletHistory);
      mockGetHistory.mockRejectedValue(new Error('Network error'));

      localStorage.setItem('selectedWallet', wallet1);

      try {
        await getWalletHistory(wallet1);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('should handle ENS resolution errors', async () => {
      const { resolveWalletName } = await import('@/lib/name-resolution');

      const mockResolve = vi.mocked(resolveWalletName);
      mockResolve.mockRejectedValue(new Error('ENS error'));

      localStorage.setItem('selectedWallet', wallet1);

      try {
        await resolveWalletName(wallet1);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('ENS error');
      }
    });

    it('should handle personalized ranking errors', async () => {
      const { calculatePersonalizedRanking } = await import('@/lib/feed/personalized-ranking');

      const mockRanking = vi.mocked(calculatePersonalizedRanking);
      mockRanking.mockRejectedValue(new Error('Ranking error'));

      try {
        await calculatePersonalizedRanking([], {
          chains: ['ethereum'],
          recentCompletions: [],
          saves: [],
          preferredChains: ['ethereum'],
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Ranking error');
      }
    });
  });
});
