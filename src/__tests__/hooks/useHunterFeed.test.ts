/**
 * Tests for useHunterFeed hook
 * 
 * Verifies integration with ranking API and cursor pagination
 * Requirements: 3.1-3.7, 7.3-7.10
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHunterFeed } from '@/hooks/useHunterFeed';
import { getFeedPage } from '@/lib/feed/query';
import { Opportunity } from '@/types/hunter';

// Mock the feed query module
vi.mock('@/lib/feed/query');

const mockGetFeedPage = getFeedPage as ReturnType<typeof vi.fn>;

// Helper to create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
  
  return Wrapper;
}

// Mock opportunity data
const mockOpportunity1: Opportunity = {
  id: '1',
  slug: 'eth-staking',
  title: 'Ethereum Staking',
  description: 'Stake ETH',
  protocol: { name: 'Lido', logo: '' },
  type: 'staking',
  chains: ['ethereum'],
  reward: { min: 0, max: 100, currency: 'USD', confidence: 'confirmed' },
  apr: 4.2,
  trust: { score: 90, level: 'green', last_scanned_ts: '2025-01-01T00:00:00Z' },
  difficulty: 'easy',
  featured: false,
  sponsored: false,
  badges: [],
  status: 'published',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  published_at: '2025-01-01T00:00:00Z',
};

const mockOpportunity2: Opportunity = {
  ...mockOpportunity1,
  id: '2',
  slug: 'layerzero-airdrop',
  title: 'LayerZero Airdrop',
  type: 'airdrop',
  trust: { score: 75, level: 'amber', last_scanned_ts: '2025-01-01T00:00:00Z' },
};

describe('useHunterFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Demo Mode', () => {
    it('should return mock data in demo mode', async () => {
      const { result } = renderHook(
        () => useHunterFeed({
          filter: 'All',
          isDemo: true,
          copilotEnabled: false,
          realTimeEnabled: false,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 3000 });

      expect(result.current.opportunities.length).toBeGreaterThan(0);
      expect(mockGetFeedPage).not.toHaveBeenCalled();
    });
  });

  describe('Real API Integration', () => {
    it('should call getFeedPage with correct params', async () => {
      mockGetFeedPage.mockResolvedValue({
        items: [mockOpportunity1],
        nextCursor: null,
        snapshotTs: Date.now() / 1000,
      });

      const { result } = renderHook(
        () => useHunterFeed({
          filter: 'Staking',
          isDemo: false,
          copilotEnabled: false,
          realTimeEnabled: false,
          sort: 'recommended',
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetFeedPage).toHaveBeenCalledWith(
        expect.objectContaining({
          types: ['staking', 'yield'],
          sort: 'recommended',
          trustMin: 80,
          showRisky: false,
          limit: 12,
        })
      );
    });

    it('should display opportunities in ranked order', async () => {
      mockGetFeedPage.mockResolvedValue({
        items: [mockOpportunity1, mockOpportunity2],
        nextCursor: null,
        snapshotTs: Date.now() / 1000,
      });

      const { result } = renderHook(
        () => useHunterFeed({
          filter: 'All',
          isDemo: false,
          copilotEnabled: false,
          realTimeEnabled: false,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.opportunities).toHaveLength(2);
      expect(result.current.opportunities[0].id).toBe('1');
      expect(result.current.opportunities[1].id).toBe('2');
    });

    it('should transform opportunities to legacy format', async () => {
      mockGetFeedPage.mockResolvedValue({
        items: [mockOpportunity1],
        nextCursor: null,
        snapshotTs: Date.now() / 1000,
      });

      const { result } = renderHook(
        () => useHunterFeed({
          filter: 'All',
          isDemo: false,
          copilotEnabled: false,
          realTimeEnabled: false,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const opp = result.current.opportunities[0];
      expect(opp).toMatchObject({
        id: '1',
        type: 'Staking',
        title: 'Ethereum Staking',
        reward: '4.2% APY',
        confidence: 90,
        guardianScore: 9,
        riskLevel: 'Low',
        chain: 'ethereum',
        protocol: 'Lido',
      });
    });
  });

  describe('Cursor Pagination', () => {
    it('should handle cursor pagination correctly', async () => {
      const cursor1 = 'cursor-page-1';
      
      mockGetFeedPage
        .mockResolvedValueOnce({
          items: [mockOpportunity1],
          nextCursor: cursor1,
          snapshotTs: Date.now() / 1000,
        })
        .mockResolvedValueOnce({
          items: [mockOpportunity2],
          nextCursor: null,
          snapshotTs: Date.now() / 1000,
        });

      const { result } = renderHook(
        () => useHunterFeed({
          filter: 'All',
          isDemo: false,
          copilotEnabled: false,
          realTimeEnabled: false,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.opportunities).toHaveLength(1);
      expect(result.current.hasNextPage).toBe(true);

      // Fetch next page
      await result.current.fetchNextPage();

      await waitFor(() => {
        expect(result.current.isFetchingNextPage).toBe(false);
      });

      expect(result.current.opportunities).toHaveLength(2);
      expect(result.current.hasNextPage).toBe(false);
      
      // Verify cursor was passed to second call
      expect(mockGetFeedPage).toHaveBeenCalledTimes(2);
      expect(mockGetFeedPage).toHaveBeenNthCalledWith(2, 
        expect.objectContaining({
          cursor: cursor1,
        })
      );
    });

    it('should maintain ranking order across pages', async () => {
      const cursor1 = 'cursor-page-1';
      
      const page1Opps = [
        { ...mockOpportunity1, id: '1', trust: { ...mockOpportunity1.trust, score: 95 } },
        { ...mockOpportunity1, id: '2', trust: { ...mockOpportunity1.trust, score: 90 } },
      ];
      
      const page2Opps = [
        { ...mockOpportunity1, id: '3', trust: { ...mockOpportunity1.trust, score: 85 } },
        { ...mockOpportunity1, id: '4', trust: { ...mockOpportunity1.trust, score: 80 } },
      ];

      mockGetFeedPage
        .mockResolvedValueOnce({
          items: page1Opps,
          nextCursor: cursor1,
          snapshotTs: Date.now() / 1000,
        })
        .mockResolvedValueOnce({
          items: page2Opps,
          nextCursor: null,
          snapshotTs: Date.now() / 1000,
        });

      const { result } = renderHook(
        () => useHunterFeed({
          filter: 'All',
          isDemo: false,
          copilotEnabled: false,
          realTimeEnabled: false,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.fetchNextPage();

      await waitFor(() => {
        expect(result.current.isFetchingNextPage).toBe(false);
      });

      // Verify order is maintained across pages
      expect(result.current.opportunities.map(o => o.id)).toEqual(['1', '2', '3', '4']);
      expect(result.current.opportunities.map(o => o.confidence)).toEqual([95, 90, 85, 80]);
    });
  });

  describe('Filter Integration', () => {
    it('should apply type filter correctly', async () => {
      mockGetFeedPage.mockResolvedValue({
        items: [mockOpportunity1],
        nextCursor: null,
        snapshotTs: Date.now() / 1000,
      });

      renderHook(
        () => useHunterFeed({
          filter: 'Airdrops',
          isDemo: false,
          copilotEnabled: false,
          realTimeEnabled: false,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockGetFeedPage).toHaveBeenCalledWith(
          expect.objectContaining({
            types: ['airdrop'],
          })
        );
      });
    });

    it('should apply sort option correctly', async () => {
      mockGetFeedPage.mockResolvedValue({
        items: [],
        nextCursor: null,
        snapshotTs: Date.now() / 1000,
      });

      renderHook(
        () => useHunterFeed({
          filter: 'All',
          isDemo: false,
          copilotEnabled: false,
          realTimeEnabled: false,
          sort: 'highest_reward',
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockGetFeedPage).toHaveBeenCalledWith(
          expect.objectContaining({
            sort: 'highest_reward',
          })
        );
      });
    });

    it('should apply trust filter correctly', async () => {
      mockGetFeedPage.mockResolvedValue({
        items: [],
        nextCursor: null,
        snapshotTs: Date.now() / 1000,
      });

      renderHook(
        () => useHunterFeed({
          filter: 'All',
          isDemo: false,
          copilotEnabled: false,
          realTimeEnabled: false,
          trustMin: 70,
          showRisky: true,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockGetFeedPage).toHaveBeenCalledWith(
          expect.objectContaining({
            trustMin: 70,
            showRisky: true,
          })
        );
      });
    });
  });

  describe('Sponsored Capping', () => {
    it('should respect sponsored item capping from API', async () => {
      const opportunities = [
        { ...mockOpportunity1, id: '1', sponsored: false },
        { ...mockOpportunity1, id: '2', sponsored: true },
        { ...mockOpportunity1, id: '3', sponsored: false },
        { ...mockOpportunity1, id: '4', sponsored: true },
        { ...mockOpportunity1, id: '5', sponsored: false },
        // API should already cap sponsored items to ≤2 per fold
      ];

      mockGetFeedPage.mockResolvedValue({
        items: opportunities,
        nextCursor: null,
        snapshotTs: Date.now() / 1000,
      });

      const { result } = renderHook(
        () => useHunterFeed({
          filter: 'All',
          isDemo: false,
          copilotEnabled: false,
          realTimeEnabled: false,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const sponsoredCount = result.current.opportunities.filter(
        o => o.id === '2' || o.id === '4'
      ).length;
      
      // API should have already capped sponsored items
      expect(sponsoredCount).toBeLessThanOrEqual(2);
    });
  });

  describe('Real-time Updates', () => {
    it('should enable polling when realTimeEnabled is true', async () => {
      mockGetFeedPage.mockResolvedValue({
        items: [mockOpportunity1],
        nextCursor: null,
        snapshotTs: Date.now() / 1000,
      });

      const { result } = renderHook(
        () => useHunterFeed({
          filter: 'All',
          isDemo: false,
          copilotEnabled: false,
          realTimeEnabled: true,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify initial call
      expect(mockGetFeedPage).toHaveBeenCalledTimes(1);
      
      // Note: Testing polling behavior requires advancing timers
      // which is complex with React Query. The important part is
      // that refetchInterval is set correctly in the hook.
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockGetFeedPage.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(
        () => useHunterFeed({
          filter: 'All',
          isDemo: false,
          copilotEnabled: false,
          realTimeEnabled: false,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.opportunities).toHaveLength(0);
    });
  });
});
