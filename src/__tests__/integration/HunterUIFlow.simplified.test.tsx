/**
 * Simplified Integration Tests: Hunter Screen UI Flow
 * 
 * Tests the complete UI flow focusing on component integration:
 * - Filter state management
 * - Search functionality
 * - Card actions
 * - Pagination logic
 * - Responsive behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useHunterFeed } from '@/hooks/useHunterFeed';
import { useSavedOpportunities } from '@/hooks/useSavedOpportunities';
import type { FilterState } from '@/types/hunter';

// Mock fetch globally
global.fetch = vi.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const mockOpportunitiesResponse = {
  items: [
    {
      id: '1',
      slug: 'test-opp-1',
      title: 'Test Opportunity 1',
      type: 'airdrop',
      chains: ['ethereum'],
      trust: { score: 85, level: 'green' },
    },
    {
      id: '2',
      slug: 'test-opp-2',
      title: 'Test Opportunity 2',
      type: 'quest',
      chains: ['base'],
      trust: { score: 75, level: 'amber' },
    },
  ],
  cursor: 'next-page-cursor',
  ts: new Date().toISOString(),
};

describe('Hunter Screen UI Flow - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockOpportunitiesResponse,
    });
  });

  describe('Filter Flow Integration', () => {
    it('should apply type filter and update query', async () => {
      const { result } = renderHook(() => useHunterFeed(), {
        wrapper: createWrapper(),
      });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.opportunities).toBeDefined();
      });

      // Apply type filter
      act(() => {
        result.current.setFilters({ types: ['airdrop'] });
      });

      // Verify filter was applied
      expect(result.current.filters.types).toEqual(['airdrop']);

      // Verify fetch was called with filter params
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('type=airdrop'),
          expect.any(Object)
        );
      });
    });

    it('should apply chain filter and update query', async () => {
      const { result } = renderHook(() => useHunterFeed(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.opportunities).toBeDefined();
      });

      // Apply chain filter
      act(() => {
        result.current.setFilters({ chains: ['ethereum'] });
      });

      expect(result.current.filters.chains).toEqual(['ethereum']);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('chains=ethereum'),
          expect.any(Object)
        );
      });
    });

    it('should apply trust level filter', async () => {
      const { result } = renderHook(() => useHunterFeed(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.opportunities).toBeDefined();
      });

      // Apply trust filter
      act(() => {
        result.current.setFilters({ trustMin: 80 });
      });

      expect(result.current.filters.trustMin).toBe(80);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('trust_min=80'),
          expect.any(Object)
        );
      });
    });

    it('should combine multiple filters', async () => {
      const { result } = renderHook(() => useHunterFeed(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.opportunities).toBeDefined();
      });

      // Apply multiple filters
      act(() => {
        result.current.setFilters({
          types: ['airdrop'],
          chains: ['ethereum'],
          trustMin: 80,
        });
      });

      expect(result.current.filters).toMatchObject({
        types: ['airdrop'],
        chains: ['ethereum'],
        trustMin: 80,
      });

      await waitFor(() => {
        const lastCall = (global.fetch as any).mock.calls[
          (global.fetch as any).mock.calls.length - 1
        ];
        const url = lastCall[0];
        expect(url).toContain('type=airdrop');
        expect(url).toContain('chains=ethereum');
        expect(url).toContain('trust_min=80');
      });
    });

    it('should reset filters', async () => {
      const { result } = renderHook(() => useHunterFeed(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.opportunities).toBeDefined();
      });

      // Apply filters
      act(() => {
        result.current.setFilters({
          types: ['airdrop'],
          chains: ['ethereum'],
        });
      });

      // Reset filters
      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters.types).toEqual([]);
      expect(result.current.filters.chains).toEqual([]);
    });
  });

  describe('Search Integration', () => {
    it('should update search query', async () => {
      const { result } = renderHook(() => useHunterFeed(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.opportunities).toBeDefined();
      });

      // Set search query
      act(() => {
        result.current.setFilters({ search: 'Uniswap' });
      });

      expect(result.current.filters.search).toBe('Uniswap');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('q=Uniswap'),
          expect.any(Object)
        );
      });
    });

    it('should clear search', async () => {
      const { result } = renderHook(() => useHunterFeed(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.opportunities).toBeDefined();
      });

      // Set search
      act(() => {
        result.current.setFilters({ search: 'Uniswap' });
      });

      // Clear search
      act(() => {
        result.current.setFilters({ search: '' });
      });

      expect(result.current.filters.search).toBe('');
    });
  });

  describe('Pagination Integration', () => {
    it('should load next page with cursor', async () => {
      const { result } = renderHook(() => useHunterFeed(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.opportunities).toBeDefined();
      });

      // Load next page
      act(() => {
        result.current.fetchNextPage();
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('cursor=next-page-cursor'),
          expect.any(Object)
        );
      });
    });

    it('should not load more when no cursor', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockOpportunitiesResponse,
          cursor: null,
        }),
      });

      const { result } = renderHook(() => useHunterFeed(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.opportunities).toBeDefined();
      });

      const initialCallCount = (global.fetch as any).mock.calls.length;

      // Try to load next page
      act(() => {
        result.current.fetchNextPage();
      });

      // Should not make additional call
      expect((global.fetch as any).mock.calls.length).toBe(initialCallCount);
    });

    it('should handle pagination with filters', async () => {
      const { result } = renderHook(() => useHunterFeed(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.opportunities).toBeDefined();
      });

      // Apply filter
      act(() => {
        result.current.setFilters({ types: ['airdrop'] });
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('type=airdrop'),
          expect.any(Object)
        );
      });

      // Load next page
      act(() => {
        result.current.fetchNextPage();
      });

      await waitFor(() => {
        const lastCall = (global.fetch as any).mock.calls[
          (global.fetch as any).mock.calls.length - 1
        ];
        const url = lastCall[0];
        expect(url).toContain('type=airdrop');
        expect(url).toContain('cursor=next-page-cursor');
      });
    });
  });

  describe('Save/Share/Report Actions', () => {
    it('should save an opportunity', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useSavedOpportunities(), {
        wrapper: createWrapper(),
      });

      // Save opportunity
      act(() => {
        result.current.saveOpportunity('test-opp-1');
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/hunter/save'),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    it('should handle save error', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: { code: 'INTERNAL', message: 'Failed' } }),
      });

      const { result } = renderHook(() => useSavedOpportunities(), {
        wrapper: createWrapper(),
      });

      // Try to save
      act(() => {
        result.current.saveOpportunity('test-opp-1');
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should unsave an opportunity', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useSavedOpportunities(), {
        wrapper: createWrapper(),
      });

      // Unsave opportunity
      act(() => {
        result.current.unsaveOpportunity('test-opp-1');
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/hunter/save'),
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: { code: 'INTERNAL', message: 'Server error' } }),
      });

      const { result } = renderHook(() => useHunterFeed(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should handle rate limiting', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '60' }),
        json: async () => ({
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            retry_after_sec: 60,
          },
        }),
      });

      const { result } = renderHook(() => useHunterFeed(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useHunterFeed(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('State Management', () => {
    it('should maintain filter state across refetches', async () => {
      const { result } = renderHook(() => useHunterFeed(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.opportunities).toBeDefined();
      });

      // Apply filters
      act(() => {
        result.current.setFilters({
          types: ['airdrop'],
          chains: ['ethereum'],
        });
      });

      // Refetch
      act(() => {
        result.current.refetch();
      });

      // Filters should persist
      expect(result.current.filters.types).toEqual(['airdrop']);
      expect(result.current.filters.chains).toEqual(['ethereum']);
    });

    it('should reset pagination when filters change', async () => {
      const { result } = renderHook(() => useHunterFeed(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.opportunities).toBeDefined();
      });

      // Load next page
      act(() => {
        result.current.fetchNextPage();
      });

      // Change filter
      act(() => {
        result.current.setFilters({ types: ['airdrop'] });
      });

      // Should reset to first page
      await waitFor(() => {
        const lastCall = (global.fetch as any).mock.calls[
          (global.fetch as any).mock.calls.length - 1
        ];
        const url = lastCall[0];
        expect(url).not.toContain('cursor=');
      });
    });
  });
});
