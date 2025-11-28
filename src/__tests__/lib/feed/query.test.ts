/**
 * Feed Query Service Tests
 * 
 * Tests for getFeedPage() function with cursor pagination, filtering, and sponsored capping
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getFeedPage, countOpportunities } from '@/lib/feed/query';
import { createServiceClient } from '@/integrations/supabase/service';

// Mock Supabase client
vi.mock('@/integrations/supabase/service', () => ({
  createServiceClient: vi.fn(),
}));

// Mock cursor utilities
vi.mock('@/lib/cursor', async () => {
  const actual = await vi.importActual('@/lib/cursor');
  return {
    ...actual,
    createSnapshot: vi.fn(() => 1704067200), // Fixed timestamp for testing
  };
});

describe('Feed Query Service', () => {
  let mockSupabase: unknown;
  let mockQuery: unknown;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock query chain with proper chaining
    mockQuery = {};
    const methods = ['select', 'eq', 'lte', 'gte', 'in', 'overlaps', 'or', 'order', 'limit'];
    
    methods.forEach(method => {
      mockQuery[method] = vi.fn(() => mockQuery);
    });

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(() => mockQuery),
    };

    (createServiceClient as any).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getFeedPage', () => {
    it('should fetch opportunities with default parameters', async () => {
      const mockData = [
        {
          id: '1',
          slug: 'test-opp-1',
          title: 'Test Opportunity 1',
          protocol_name: 'Test Protocol',
          protocol_logo: 'https://example.com/logo.png',
          type: 'airdrop',
          chains: ['ethereum'],
          reward_min: 100,
          reward_max: 500,
          reward_currency: 'USD',
          reward_confidence: 'confirmed',
          trust_score: 85,
          trust_level: 'green',
          difficulty: 'easy',
          featured: false,
          sponsored: false,
          status: 'published',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          published_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockQuery.select.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const result = await getFeedPage({});

      expect(mockSupabase.from).toHaveBeenCalledWith('opportunities');
      expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'published');
      expect(mockQuery.gte).toHaveBeenCalledWith('trust_score', 60); // Default: hide red
      expect(mockQuery.gte).toHaveBeenCalledWith('trust_score', 80); // Default trustMin
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Test Opportunity 1');
      expect(result.snapshotTs).toBe(1704067200);
    });

    it('should apply type filter', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await getFeedPage({
        types: ['airdrop', 'quest'],
      });

      expect(mockQuery.in).toHaveBeenCalledWith('type', ['airdrop', 'quest']);
    });

    it('should apply chain filter', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await getFeedPage({
        chains: ['ethereum', 'base'],
      });

      expect(mockQuery.overlaps).toHaveBeenCalledWith('chains', ['ethereum', 'base']);
    });

    it('should apply difficulty filter', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await getFeedPage({
        difficulty: ['easy', 'medium'],
      });

      expect(mockQuery.in).toHaveBeenCalledWith('difficulty', ['easy', 'medium']);
    });

    it('should apply urgency filter', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await getFeedPage({
        urgency: ['ending_soon', 'new'],
      });

      expect(mockQuery.in).toHaveBeenCalledWith('urgency', ['ending_soon', 'new']);
    });

    it('should apply reward range filter', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await getFeedPage({
        rewardMin: 100,
        rewardMax: 1000,
      });

      expect(mockQuery.gte).toHaveBeenCalledWith('reward_min', 100);
      expect(mockQuery.lte).toHaveBeenCalledWith('reward_max', 1000);
    });

    it('should apply search filter', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await getFeedPage({
        search: 'DeFi',
      });

      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('title.ilike.%DeFi%')
      );
    });

    it('should apply trust minimum filter', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await getFeedPage({
        trustMin: 90,
      });

      expect(mockQuery.gte).toHaveBeenCalledWith('trust_score', 90);
    });

    it('should show risky items when showRisky is true', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await getFeedPage({
        showRisky: true,
        trustMin: 0,
      });

      // Should not filter out red trust items
      const gteCallsForTrust = mockQuery.gte.mock.calls.filter(
        (call: unknown) => call[0] === 'trust_score'
      );
      
      // Should only have one call for trustMin (0), not the default 60 filter
      expect(gteCallsForTrust).toHaveLength(1);
      expect(gteCallsForTrust[0][1]).toBe(0);
    });

    it('should apply recommended sort order', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await getFeedPage({
        sort: 'recommended',
      });

      expect(mockQuery.order).toHaveBeenCalledWith('trust_score', { ascending: false });
      expect(mockQuery.order).toHaveBeenCalledWith('expires_at', { ascending: true, nullsFirst: false });
      expect(mockQuery.order).toHaveBeenCalledWith('id', { ascending: true });
    });

    it('should apply ends_soon sort order', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await getFeedPage({
        sort: 'ends_soon',
      });

      expect(mockQuery.order).toHaveBeenCalledWith('expires_at', { ascending: true, nullsFirst: false });
      expect(mockQuery.order).toHaveBeenCalledWith('trust_score', { ascending: false });
      expect(mockQuery.order).toHaveBeenCalledWith('id', { ascending: true });
    });

    it('should apply highest_reward sort order', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await getFeedPage({
        sort: 'highest_reward',
      });

      expect(mockQuery.order).toHaveBeenCalledWith('reward_max', { ascending: false, nullsFirst: false });
      expect(mockQuery.order).toHaveBeenCalledWith('trust_score', { ascending: false });
      expect(mockQuery.order).toHaveBeenCalledWith('id', { ascending: true });
    });

    it('should apply newest sort order', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await getFeedPage({
        sort: 'newest',
      });

      expect(mockQuery.order).toHaveBeenCalledWith('published_at', { ascending: false, nullsFirst: false });
      expect(mockQuery.order).toHaveBeenCalledWith('trust_score', { ascending: false });
      expect(mockQuery.order).toHaveBeenCalledWith('id', { ascending: true });
    });

    it('should apply trust sort order', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      await getFeedPage({
        sort: 'trust',
      });

      expect(mockQuery.order).toHaveBeenCalledWith('trust_score', { ascending: false });
      expect(mockQuery.order).toHaveBeenCalledWith('expires_at', { ascending: true, nullsFirst: false });
      expect(mockQuery.order).toHaveBeenCalledWith('id', { ascending: true });
    });

    it('should apply sponsored capping (≤2 per fold)', async () => {
      const mockData = Array.from({ length: 15 }, (_, i) => ({
        id: `${i + 1}`,
        slug: `test-opp-${i + 1}`,
        title: `Test Opportunity ${i + 1}`,
        protocol_name: 'Test Protocol',
        type: 'airdrop',
        chains: ['ethereum'],
        reward_min: 100,
        reward_max: 500,
        reward_currency: 'USD',
        reward_confidence: 'confirmed',
        trust_score: 85,
        trust_level: 'green',
        difficulty: 'easy',
        featured: false,
        sponsored: i < 5, // First 5 are sponsored
        status: 'published',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        published_at: '2025-01-01T00:00:00Z',
      }));

      mockQuery.select.mockResolvedValue({
        data: mockData,
        error: null,
        count: 15,
      });

      const result = await getFeedPage({
        limit: 12,
      });

      // Count sponsored items in result
      const sponsoredCount = result.items.filter(item => item.sponsored).length;
      
      // Should have at most 2 sponsored items per fold
      expect(sponsoredCount).toBeLessThanOrEqual(2);
      expect(result.items.length).toBeLessThanOrEqual(12);
    });

    it('should generate next cursor when more items available', async () => {
      const mockData = Array.from({ length: 12 }, (_, i) => ({
        id: `${i + 1}`,
        slug: `test-opp-${i + 1}`,
        title: `Test Opportunity ${i + 1}`,
        protocol_name: 'Test Protocol',
        type: 'airdrop',
        chains: ['ethereum'],
        reward_min: 100,
        reward_max: 500,
        reward_currency: 'USD',
        reward_confidence: 'confirmed',
        trust_score: 85,
        trust_level: 'green',
        difficulty: 'easy',
        featured: false,
        sponsored: false,
        status: 'published',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        published_at: '2025-01-01T00:00:00Z',
      }));

      mockQuery.select.mockResolvedValue({
        data: mockData,
        error: null,
        count: 100, // More items available
      });

      const result = await getFeedPage({
        limit: 12,
      });

      expect(result.nextCursor).not.toBeNull();
      expect(typeof result.nextCursor).toBe('string');
    });

    it('should return null cursor when no more items', async () => {
      const mockData = Array.from({ length: 5 }, (_, i) => ({
        id: `${i + 1}`,
        slug: `test-opp-${i + 1}`,
        title: `Test Opportunity ${i + 1}`,
        protocol_name: 'Test Protocol',
        type: 'airdrop',
        chains: ['ethereum'],
        reward_min: 100,
        reward_max: 500,
        reward_currency: 'USD',
        reward_confidence: 'confirmed',
        trust_score: 85,
        trust_level: 'green',
        difficulty: 'easy',
        featured: false,
        sponsored: false,
        status: 'published',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        published_at: '2025-01-01T00:00:00Z',
      }));

      mockQuery.select.mockResolvedValue({
        data: mockData,
        error: null,
        count: 5,
      });

      const result = await getFeedPage({
        limit: 12,
      });

      expect(result.nextCursor).toBeNull();
      expect(result.items.length).toBe(5);
    });

    it('should handle database errors gracefully', async () => {
      mockQuery.select.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
        count: null,
      });

      await expect(getFeedPage({})).rejects.toThrow('Failed to fetch opportunities');
    });

    it('should handle empty results', async () => {
      mockQuery.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const result = await getFeedPage({});

      expect(result.items).toEqual([]);
      expect(result.nextCursor).toBeNull();
      expect(result.totalCount).toBe(0);
    });

    it('should transform database rows correctly', async () => {
      const mockData = [
        {
          id: '1',
          slug: 'test-opp-1',
          title: 'Test Opportunity',
          description: 'Test description',
          protocol_name: 'Test Protocol',
          protocol_logo: 'https://example.com/logo.png',
          type: 'airdrop',
          chains: ['ethereum', 'base'],
          reward_min: 100,
          reward_max: 500,
          reward_currency: 'USD',
          reward_confidence: 'confirmed',
          apr: 5.5,
          trust_score: 85,
          trust_level: 'green',
          urgency: 'new',
          difficulty: 'easy',
          featured: true,
          sponsored: false,
          time_left_sec: 86400,
          external_url: 'https://example.com',
          status: 'published',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          published_at: '2025-01-01T00:00:00Z',
          expires_at: '2025-12-31T23:59:59Z',
        },
      ];

      mockQuery.select.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const result = await getFeedPage({});

      expect(result.items[0]).toMatchObject({
        id: '1',
        slug: 'test-opp-1',
        title: 'Test Opportunity',
        description: 'Test description',
        protocol: {
          name: 'Test Protocol',
          logo: 'https://example.com/logo.png',
        },
        type: 'airdrop',
        chains: ['ethereum', 'base'],
        reward: {
          min: 100,
          max: 500,
          currency: 'USD',
          confidence: 'confirmed',
        },
        apr: 5.5,
        trust: {
          score: 85,
          level: 'green',
          last_scanned_ts: '2025-01-01T00:00:00Z',
          issues: [],
        },
        urgency: 'new',
        difficulty: 'easy',
        featured: true,
        sponsored: false,
        time_left_sec: 86400,
        external_url: 'https://example.com',
        badges: [{ type: 'featured', label: 'Featured' }],
        status: 'published',
      });
    });
  });

  describe('countOpportunities', () => {
    it('should count opportunities with filters', async () => {
      mockQuery.select.mockResolvedValue({
        data: null,
        error: null,
        count: 42,
      });

      const count = await countOpportunities({
        types: ['airdrop'],
        chains: ['ethereum'],
        trustMin: 80,
      });

      expect(count).toBe(42);
      expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    });

    it('should return 0 on error', async () => {
      mockQuery.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null,
      });

      const count = await countOpportunities({});

      expect(count).toBe(0);
    });

    it('should apply same filters as getFeedPage', async () => {
      mockQuery.select.mockResolvedValue({
        data: null,
        error: null,
        count: 10,
      });

      await countOpportunities({
        types: ['airdrop', 'quest'],
        chains: ['ethereum'],
        trustMin: 90,
        difficulty: ['easy'],
        urgency: ['new'],
        rewardMin: 100,
        rewardMax: 1000,
        search: 'DeFi',
      });

      expect(mockQuery.in).toHaveBeenCalledWith('type', ['airdrop', 'quest']);
      expect(mockQuery.overlaps).toHaveBeenCalledWith('chains', ['ethereum']);
      expect(mockQuery.gte).toHaveBeenCalledWith('trust_score', 90);
      expect(mockQuery.in).toHaveBeenCalledWith('difficulty', ['easy']);
      expect(mockQuery.in).toHaveBeenCalledWith('urgency', ['new']);
      expect(mockQuery.gte).toHaveBeenCalledWith('reward_min', 100);
      expect(mockQuery.lte).toHaveBeenCalledWith('reward_max', 1000);
      expect(mockQuery.or).toHaveBeenCalledWith(expect.stringContaining('DeFi'));
    });
  });
});
