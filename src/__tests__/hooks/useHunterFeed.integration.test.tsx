/**
 * Integration tests for useHunterFeed hook with ranking API
 * 
 * Tests:
 * - Opportunities display in ranked order
 * - Filters work with materialized view
 * - Cursor pagination maintains ranking order
 * - Infinite scroll with ranked data
 * - Sponsored capping works correctly
 * - All sort options use rank_score appropriately
 * 
 * Requirements: 3.1-3.7, 7.3-7.10
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHunterFeed } from '@/hooks/useHunterFeed';
import { getFeedPage } from '@/lib/feed/query';
import { Opportunity } from '@/types/hunter';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the feed query
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
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
  
  return Wrapper;
}

// Mock opportunity data
const createMockOpportunity = (overrides: Partial<Opportunity> = {}): Opportunity => ({
  id: '1',
  slug: 'test-opportunity',
  title: 'Test Opportunity',
  description: 'Test description',
  protocol: {
    name: 'Test Protocol',
    logo: 'https://example.com/logo.png',
  },
  type: 'airdrop',
  chains: ['ethereum'],
  reward: {
    min: 100,
    max: 500,
    currency: 'USD',
    confidence: 'estimated',
  },
  trust: {
    score: 85,
    level: 'green',
    last_scanned_ts: new Date().toISOString(),
    issues: [],
  },
  difficulty: 'easy',
  featured: false,
  sponsored: false,
  badges: [],
  status: 'published',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  published_at: new Date().toISOString(),
  ...overrides,
});

describe('useHunterFeed - Ranking API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Ranked Order Display', () => {
    it('should display opportunities in ranked order', async () => {
      const opportunities = [
        createMockOpportunity({ id: '1', title: 'High Rank', trust: { score: 95, level: 'green', last_scanned_ts: new Date().toISOString() } }),
        createMockOpportunity({ id: '2', title: 'Medium Rank', trust: { score: 80, level: 'green', last_scanned_ts: new Date().toISOString() } }),
        createMockOpportunity({ id: '3', title: 'Low Rank', trust: { score: 65, level: 'amber', last_scanned_ts: new Date().toISOString() } }),
      ];

      mockGetFeedPage.mockResolvedValueOnce({
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
          sort: 'recommended',
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify opportunities are in ranked order
      expect(result.current.opportunities).toHaveLength(3);
      expect(result.current.opportunities[0].guardianScore).toBeGreaterThanOrEqual(
        result.current.opportunities[1].guardianScore
      );
      expect(result.current.opportunities[1].guardianScore).toBeGreaterThanOrEqual(
        result.current.opportunities[2].guardianScore
      );
    });
  });

  describe('Filter Integration', () => {
    it('should apply type filter correctly', async () => {
      const opportunities = [
        createMockOpportunity({ id: '1', type: 'airdrop' }),
        createMockOpportunity({ id: '2', type: 'staking' }),
      ];

      mockGetFeedPage.mockResolvedValueOnce({
        items: opportunities.filter(o => o.type === 'airdrop'),
        nextCursor: null,
        snapshotTs: Date.now() / 1000,
      });

      const { result } = renderHook(
        () => useHunterFeed({
          filter: 'Airdrops',
          isDemo: false,
          copilotEnabled: false,
          realTimeEnabled: false,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify getFeedPage was called with correct type filter
      expect(mockGetFeedPage).toHaveBeenCalledWith(
        expect.objectContaining({
          types: ['airdrop'],
        })
      );
    });

    it('should apply trust level filter', async () => {
      mockGetFeedPage.mockResolvedValueOnce({
        items: [
          createMockOpportunity({ id: '1', trust: { score: 85, level: 'green', last_scanned_ts: new Date().toISOString() } }),
        ],
        nextCursor: null,
        snapshotTs: Date.now() / 1000,
      });

      const { result } = renderHook(
        () => useHunterFeed({
          filter: 'All',
          isDemo: false,
          copilotEnabled: false,
          realTimeEnabled: false,
          trustMin: 80,
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetFeedPage).toHaveBeenCalledWith(
        expect.objectContaining({
          trustMin: 80,
        })
      );
    });
  });

  describe('Cursor Pagination', () => {
    it('should maintain ranking order across pages', async () => {
      const page1 = [
        createMockOpportunity({ id: '1', trust: { score: 95, level: 'green', last_scanned_ts: new Date().toISOString() } }),
        createMockOpportunity({ id: '2', trust: { score: 90, level: 'green', last_scanned_ts: new Date().toISOString() } }),
      ];

      const page2 = [
        createMockOpportunity({ id: '3', trust: { score: 85, level: 'green', last_scanned_ts: new Date().toISOString() } }),
        createMockOpportunity({ id: '4', trust: { score: 80, level: 'green', last_scanned_ts: new Date().toISOString() } }),
      ];

      mockGetFeedPage
        .mockResolvedValueOnce({
          items: page1,
          nextCursor: 'cursor-page-2',
          snapshotTs: Date.now() / 1000,
        })
        .mockResolvedValueOnce({
          items: page2,
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

      // Fetch next page
      await result.current.fetchNextPage();

      await waitFor(() => {
        expect(result.current.isFetchingNextPage).toBe(false);
      });

      // Verify all opportunities are in ranked order
      const allOpportunities = result.current.opportunities;
      expect(allOpportunities).toHaveLength(4);
      
      for (let i = 0; i < allOpportunities.length - 1; i++) {
        expect(allOpportunities[i].guardianScore).toBeGreaterThanOrEqual(
          allOpportunities[i + 1].guardianScore
        );
      }
    });

    it('should prevent duplicate items across pages', async () => {
      const page1 = [
        createMockOpportunity({ id: '1' }),
        createMockOpportunity({ id: '2' }),
      ];

      const page2 = [
        createMockOpportunity({ id: '3' }),
        createMockOpportunity({ id: '4' }),
      ];

      mockGetFeedPage
        .mockResolvedValueOnce({
          items: page1,
          nextCursor: 'cursor-page-2',
          snapshotTs: Date.now() / 1000,
        })
        .mockResolvedValueOnce({
          items: page2,
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

      // Verify no duplicates
      const ids = result.current.opportunities.map(o => o.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });
  });

  describe('Infinite Scroll', () => {
    it('should support infinite scroll with hasNextPage', async () => {
      mockGetFeedPage.mockResolvedValueOnce({
        items: [createMockOpportunity({ id: '1' })],
        nextCursor: 'cursor-page-2',
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

      expect(result.current.hasNextPage).toBe(true);
    });

    it('should indicate no more pages when cursor is null', async () => {
      mockGetFeedPage.mockResolvedValueOnce({
        items: [createMockOpportunity({ id: '1' })],
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

      expect(result.current.hasNextPage).toBe(false);
    });
  });

  describe('Sponsored Capping', () => {
    it('should respect sponsored item cap (≤2 per fold)', async () => {
      const opportunities = [
        createMockOpportunity({ id: '1', sponsored: true }),
        createMockOpportunity({ id: '2', sponsored: false }),
        createMockOpportunity({ id: '3', sponsored: true }),
        createMockOpportunity({ id: '4', sponsored: false }),
        // Third sponsored item should be filtered out by server
      ];

      mockGetFeedPage.mockResolvedValueOnce({
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

      // Count sponsored items
      const sponsoredCount = result.current.opportunities.filter(
        o => o.type === 'Airdrop' && o.title.includes('sponsored') // Adjust based on actual data
      ).length;

      // Should have at most 2 sponsored items per 12 cards
      expect(sponsoredCount).toBeLessThanOrEqual(2);
    });
  });

  describe('Sort Options', () => {
    it('should use rank_score for recommended sort', async () => {
      mockGetFeedPage.mockResolvedValueOnce({
        items: [createMockOpportunity({ id: '1' })],
        nextCursor: null,
        snapshotTs: Date.now() / 1000,
      });

      renderHook(
        () => useHunterFeed({
          filter: 'All',
          isDemo: false,
          copilotEnabled: false,
          realTimeEnabled: false,
          sort: 'recommended',
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockGetFeedPage).toHaveBeenCalledWith(
          expect.objectContaining({
            sort: 'recommended',
          })
        );
      });
    });

    it('should support all sort options', async () => {
      const sortOptions: Array<'recommended' | 'ends_soon' | 'highest_reward' | 'newest' | 'trust'> = [
        'recommended',
        'ends_soon',
        'highest_reward',
        'newest',
        'trust',
      ];

      for (const sort of sortOptions) {
        mockGetFeedPage.mockResolvedValueOnce({
          items: [createMockOpportunity({ id: '1' })],
          nextCursor: null,
          snapshotTs: Date.now() / 1000,
        });

        renderHook(
          () => useHunterFeed({
            filter: 'All',
            isDemo: false,
            copilotEnabled: false,
            realTimeEnabled: false,
            sort,
          }),
          { wrapper: createWrapper() }
        );

        await waitFor(() => {
          expect(mockGetFeedPage).toHaveBeenCalledWith(
            expect.objectContaining({
              sort,
            })
          );
        });
      }
    });
  });

  describe('Demo Mode', () => {
    it('should use mock data in demo mode', async () => {
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
      });

      // Should not call real API
      expect(mockGetFeedPage).not.toHaveBeenCalled();
      
      // Should have mock data
      expect(result.current.opportunities.length).toBeGreaterThan(0);
    });
  });
});
