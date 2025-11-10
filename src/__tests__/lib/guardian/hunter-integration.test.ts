/**
 * Tests for Guardian Hunter Screen Integration
 * 
 * Requirements: 2.1-2.8, 2.9
 * Task: 10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getGuardianSummary,
  getGuardianSummarySingle,
  listStaleOpportunities,
  queueRescan,
  invalidateGuardianCache,
  needsRescan,
  type GuardianSummary,
  type StaleOpportunity,
} from '@/lib/guardian/hunter-integration';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/redis/cache', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  cacheMGet: vi.fn(),
  cacheMSet: vi.fn(),
  cacheDel: vi.fn(),
}));

vi.mock('@/lib/redis/keys', () => ({
  RedisKeys: {
    guardianScan: (id: string) => `guardian:scan:${id}`,
  },
  RedisTTL: {
    guardianScan: 3600,
  },
}));

import { supabase } from '@/integrations/supabase/client';
import * as redisCache from '@/lib/redis/cache';

describe('Guardian Hunter Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getGuardianSummary', () => {
    it('should return empty map for empty input', async () => {
      const result = await getGuardianSummary([]);
      expect(result.size).toBe(0);
    });

    it('should return cached data when available', async () => {
      const opportunityIds = ['opp-1', 'opp-2'];
      const cachedSummaries: GuardianSummary[] = [
        {
          opportunityId: 'opp-1',
          score: 85,
          level: 'green',
          lastScannedTs: '2025-01-01T12:00:00Z',
          topIssues: [],
        },
        {
          opportunityId: 'opp-2',
          score: 65,
          level: 'amber',
          lastScannedTs: '2025-01-01T11:00:00Z',
          topIssues: ['Mixer Interaction'],
        },
      ];

      const cacheMap = new Map([
        ['guardian:scan:opp-1', cachedSummaries[0]],
        ['guardian:scan:opp-2', cachedSummaries[1]],
      ]);

      vi.mocked(redisCache.cacheMGet).mockResolvedValue(cacheMap);

      const result = await getGuardianSummary(opportunityIds);

      expect(result.size).toBe(2);
      expect(result.get('opp-1')).toEqual(cachedSummaries[0]);
      expect(result.get('opp-2')).toEqual(cachedSummaries[1]);
      expect(redisCache.cacheMGet).toHaveBeenCalledWith([
        'guardian:scan:opp-1',
        'guardian:scan:opp-2',
      ]);
    });

    it('should fetch from database when cache misses', async () => {
      const opportunityIds = ['opp-1', 'opp-2'];
      
      // Mock cache miss
      vi.mocked(redisCache.cacheMGet).mockResolvedValue(new Map());

      // Mock database response
      const dbScans = [
        {
          opportunity_id: 'opp-1',
          score: 85,
          level: 'green',
          issues: [],
          scanned_at: '2025-01-01T12:00:00Z',
        },
        {
          opportunity_id: 'opp-2',
          score: 65,
          level: 'amber',
          issues: [{ type: 'Mixer Interaction' }],
          scanned_at: '2025-01-01T11:00:00Z',
        },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockIn = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: dbScans, error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        in: mockIn,
        order: mockOrder,
      } as any);

      vi.mocked(redisCache.cacheMSet).mockResolvedValue(2);

      const result = await getGuardianSummary(opportunityIds);

      expect(result.size).toBe(2);
      expect(result.get('opp-1')).toMatchObject({
        opportunityId: 'opp-1',
        score: 85,
        level: 'green',
      });
      expect(result.get('opp-2')).toMatchObject({
        opportunityId: 'opp-2',
        score: 65,
        level: 'amber',
        topIssues: ['Mixer Interaction'],
      });

      expect(supabase.from).toHaveBeenCalledWith('guardian_scans');
      expect(mockSelect).toHaveBeenCalled();
      expect(mockIn).toHaveBeenCalledWith('opportunity_id', opportunityIds);
      expect(redisCache.cacheMSet).toHaveBeenCalled();
    });

    it('should handle partial cache hits', async () => {
      const opportunityIds = ['opp-1', 'opp-2', 'opp-3'];
      
      // Mock partial cache hit (opp-1 cached, opp-2 and opp-3 missing)
      const cachedSummary: GuardianSummary = {
        opportunityId: 'opp-1',
        score: 85,
        level: 'green',
        lastScannedTs: '2025-01-01T12:00:00Z',
        topIssues: [],
      };

      const cacheMap = new Map([
        ['guardian:scan:opp-1', cachedSummary],
        ['guardian:scan:opp-2', null],
        ['guardian:scan:opp-3', null],
      ]);

      vi.mocked(redisCache.cacheMGet).mockResolvedValue(cacheMap);

      // Mock database response for missing items
      const dbScans = [
        {
          opportunity_id: 'opp-2',
          score: 65,
          level: 'amber',
          issues: [],
          scanned_at: '2025-01-01T11:00:00Z',
        },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockIn = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: dbScans, error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        in: mockIn,
        order: mockOrder,
      } as any);

      vi.mocked(redisCache.cacheMSet).mockResolvedValue(1);

      const result = await getGuardianSummary(opportunityIds);

      expect(result.size).toBe(2); // opp-1 from cache, opp-2 from DB, opp-3 not found
      expect(result.get('opp-1')).toEqual(cachedSummary);
      expect(result.get('opp-2')).toMatchObject({
        opportunityId: 'opp-2',
        score: 65,
        level: 'amber',
      });
      expect(result.has('opp-3')).toBe(false);

      // Should only fetch missing IDs from database
      expect(mockIn).toHaveBeenCalledWith('opportunity_id', ['opp-2', 'opp-3']);
    });

    it('should handle database errors gracefully', async () => {
      const opportunityIds = ['opp-1'];
      
      vi.mocked(redisCache.cacheMGet).mockResolvedValue(new Map());

      const mockSelect = vi.fn().mockReturnThis();
      const mockIn = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        in: mockIn,
        order: mockOrder,
      } as any);

      const result = await getGuardianSummary(opportunityIds);

      expect(result.size).toBe(0);
    });

    it('should extract top 3 issues from scan', async () => {
      const opportunityIds = ['opp-1'];
      
      vi.mocked(redisCache.cacheMGet).mockResolvedValue(new Map());

      const dbScans = [
        {
          opportunity_id: 'opp-1',
          score: 55,
          level: 'red',
          issues: [
            { type: 'Sanctions' },
            { type: 'Mixer Interaction' },
            { type: 'Suspicious Contract' },
            { type: 'High Risk' },
            { type: 'Scam' },
          ],
          scanned_at: '2025-01-01T12:00:00Z',
        },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockIn = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: dbScans, error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        in: mockIn,
        order: mockOrder,
      } as any);

      vi.mocked(redisCache.cacheMSet).mockResolvedValue(1);

      const result = await getGuardianSummary(opportunityIds);

      expect(result.size).toBe(1);
      const summary = result.get('opp-1');
      expect(summary?.topIssues).toEqual([
        'Sanctions',
        'Mixer Interaction',
        'Suspicious Contract',
      ]);
      expect(summary?.topIssues.length).toBe(3);
    });
  });

  describe('getGuardianSummarySingle', () => {
    it('should return summary for single opportunity', async () => {
      const opportunityId = 'opp-1';
      const cachedSummary: GuardianSummary = {
        opportunityId: 'opp-1',
        score: 85,
        level: 'green',
        lastScannedTs: '2025-01-01T12:00:00Z',
        topIssues: [],
      };

      const cacheMap = new Map([['guardian:scan:opp-1', cachedSummary]]);
      vi.mocked(redisCache.cacheMGet).mockResolvedValue(cacheMap);

      const result = await getGuardianSummarySingle(opportunityId);

      expect(result).toEqual(cachedSummary);
    });

    it('should return null when not found', async () => {
      const opportunityId = 'opp-1';
      
      vi.mocked(redisCache.cacheMGet).mockResolvedValue(new Map());

      const mockSelect = vi.fn().mockReturnThis();
      const mockIn = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        in: mockIn,
        order: mockOrder,
      } as any);

      const result = await getGuardianSummarySingle(opportunityId);

      expect(result).toBeNull();
    });
  });

  describe('listStaleOpportunities', () => {
    it('should find opportunities with scans older than threshold', async () => {
      const now = new Date();
      const staleDate = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago

      const mockOpportunities = [
        {
          id: 'opp-1',
          slug: 'stale-opportunity',
          status: 'published',
          expires_at: null,
          guardian_scans: [
            { scanned_at: staleDate.toISOString() },
          ],
        },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOr = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({
        data: mockOpportunities,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        or: mockOr,
        order: mockOrder,
        limit: mockLimit,
      } as any);

      const result = await listStaleOpportunities({ olderThanHours: 24 });

      expect(result.length).toBe(1);
      expect(result[0]).toMatchObject({
        id: 'opp-1',
        slug: 'stale-opportunity',
      });
      expect(result[0].hoursSinceLastScan).toBeGreaterThanOrEqual(24);
    });

    it('should filter out fresh scans', async () => {
      const now = new Date();
      const freshDate = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago

      const mockOpportunities = [
        {
          id: 'opp-1',
          slug: 'fresh-opportunity',
          status: 'published',
          expires_at: null,
          guardian_scans: [
            { scanned_at: freshDate.toISOString() },
          ],
        },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOr = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({
        data: mockOpportunities,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        or: mockOr,
        order: mockOrder,
        limit: mockLimit,
      } as any);

      const result = await listStaleOpportunities({ olderThanHours: 24 });

      expect(result.length).toBe(0);
    });

    it('should handle custom threshold', async () => {
      const now = new Date();
      const staleDate = new Date(now.getTime() - 49 * 60 * 60 * 1000); // 49 hours ago

      const mockOpportunities = [
        {
          id: 'opp-1',
          slug: 'very-stale-opportunity',
          status: 'published',
          expires_at: null,
          guardian_scans: [
            { scanned_at: staleDate.toISOString() },
          ],
        },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOr = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({
        data: mockOpportunities,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        or: mockOr,
        order: mockOrder,
        limit: mockLimit,
      } as any);

      const result = await listStaleOpportunities({ olderThanHours: 48 });

      expect(result.length).toBe(1);
      expect(result[0].hoursSinceLastScan).toBeGreaterThanOrEqual(48);
    });

    it('should handle database errors', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOr = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        or: mockOr,
        order: mockOrder,
        limit: mockLimit,
      } as any);

      const result = await listStaleOpportunities();

      expect(result).toEqual([]);
    });
  });

  describe('queueRescan', () => {
    it('should queue opportunity for rescan', async () => {
      vi.mocked(redisCache.cacheSet).mockResolvedValue(true);

      const result = await queueRescan('opp-1');

      expect(result).toBe(true);
      expect(redisCache.cacheSet).toHaveBeenCalledWith(
        'guardian:rescan:queue:opp-1',
        expect.objectContaining({
          opportunityId: 'opp-1',
          status: 'pending',
        }),
        { ttl: 48 * 60 * 60 }
      );
    });

    it('should handle cache set failure', async () => {
      vi.mocked(redisCache.cacheSet).mockResolvedValue(false);

      const result = await queueRescan('opp-1');

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(redisCache.cacheSet).mockRejectedValue(new Error('Redis error'));

      const result = await queueRescan('opp-1');

      expect(result).toBe(false);
    });
  });

  describe('invalidateGuardianCache', () => {
    it('should invalidate cache for multiple opportunities', async () => {
      vi.mocked(redisCache.cacheDel).mockResolvedValue(3);

      const result = await invalidateGuardianCache(['opp-1', 'opp-2', 'opp-3']);

      expect(result).toBe(3);
      expect(redisCache.cacheDel).toHaveBeenCalledWith([
        'guardian:scan:opp-1',
        'guardian:scan:opp-2',
        'guardian:scan:opp-3',
      ]);
    });

    it('should return 0 for empty input', async () => {
      const result = await invalidateGuardianCache([]);

      expect(result).toBe(0);
      expect(redisCache.cacheDel).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(redisCache.cacheDel).mockRejectedValue(new Error('Redis error'));

      const result = await invalidateGuardianCache(['opp-1']);

      expect(result).toBe(0);
    });
  });

  describe('needsRescan', () => {
    it('should return true for stale scans', async () => {
      const staleDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const cachedSummary: GuardianSummary = {
        opportunityId: 'opp-1',
        score: 85,
        level: 'green',
        lastScannedTs: staleDate.toISOString(),
        topIssues: [],
      };

      const cacheMap = new Map([['guardian:scan:opp-1', cachedSummary]]);
      vi.mocked(redisCache.cacheMGet).mockResolvedValue(cacheMap);

      const result = await needsRescan('opp-1', 24);

      expect(result).toBe(true);
    });

    it('should return false for fresh scans', async () => {
      const freshDate = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago
      const cachedSummary: GuardianSummary = {
        opportunityId: 'opp-1',
        score: 85,
        level: 'green',
        lastScannedTs: freshDate.toISOString(),
        topIssues: [],
      };

      const cacheMap = new Map([['guardian:scan:opp-1', cachedSummary]]);
      vi.mocked(redisCache.cacheMGet).mockResolvedValue(cacheMap);

      const result = await needsRescan('opp-1', 24);

      expect(result).toBe(false);
    });

    it('should return true when no scan found', async () => {
      vi.mocked(redisCache.cacheMGet).mockResolvedValue(new Map());

      const mockSelect = vi.fn().mockReturnThis();
      const mockIn = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        in: mockIn,
        order: mockOrder,
      } as any);

      const result = await needsRescan('opp-1');

      expect(result).toBe(true);
    });
  });
});
