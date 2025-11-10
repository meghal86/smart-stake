/**
 * Integration tests for Guardian Hunter Screen Integration
 * 
 * These tests verify the integration works with realistic data patterns
 * and edge cases that might occur in production.
 * 
 * Requirements: 2.1-2.8, 2.9
 * Task: 10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getGuardianSummary,
  listStaleOpportunities,
  queueRescan,
  invalidateGuardianCache,
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

describe('Guardian Hunter Integration - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Real-world batch fetching scenarios', () => {
    it('should handle a typical feed page with 12 opportunities', async () => {
      // Simulate a typical feed page with 12 opportunities
      const opportunityIds = Array.from({ length: 12 }, (_, i) => `opp-${i + 1}`);

      // Simulate 8 cache hits, 4 cache misses (typical 67% hit rate)
      const cacheMap = new Map();
      for (let i = 1; i <= 8; i++) {
        cacheMap.set(`guardian:scan:opp-${i}`, {
          opportunityId: `opp-${i}`,
          score: 80 + i,
          level: 'green',
          lastScannedTs: new Date().toISOString(),
          topIssues: [],
        });
      }
      for (let i = 9; i <= 12; i++) {
        cacheMap.set(`guardian:scan:opp-${i}`, null);
      }

      vi.mocked(redisCache.cacheMGet).mockResolvedValue(cacheMap);

      // Mock database response for cache misses
      const dbScans = [
        {
          opportunity_id: 'opp-9',
          score: 75,
          level: 'amber',
          issues: [{ type: 'Mixer Interaction' }],
          scanned_at: new Date().toISOString(),
        },
        {
          opportunity_id: 'opp-10',
          score: 55,
          level: 'red',
          issues: [
            { type: 'Sanctions' },
            { type: 'Scam' },
            { type: 'High Risk' },
          ],
          scanned_at: new Date().toISOString(),
        },
        {
          opportunity_id: 'opp-11',
          score: 90,
          level: 'green',
          issues: [],
          scanned_at: new Date().toISOString(),
        },
        {
          opportunity_id: 'opp-12',
          score: 68,
          level: 'amber',
          issues: [{ type: 'Suspicious Contract' }],
          scanned_at: new Date().toISOString(),
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

      vi.mocked(redisCache.cacheMSet).mockResolvedValue(4);

      const result = await getGuardianSummary(opportunityIds);

      // Should return all 12 opportunities
      expect(result.size).toBe(12);

      // Verify cache hits
      for (let i = 1; i <= 8; i++) {
        expect(result.has(`opp-${i}`)).toBe(true);
        expect(result.get(`opp-${i}`)?.level).toBe('green');
      }

      // Verify database fetches
      expect(result.get('opp-9')?.level).toBe('amber');
      expect(result.get('opp-10')?.level).toBe('red');
      expect(result.get('opp-10')?.topIssues).toEqual([
        'Sanctions',
        'Scam',
        'High Risk',
      ]);
      expect(result.get('opp-11')?.level).toBe('green');
      expect(result.get('opp-12')?.level).toBe('amber');

      // Verify only missing IDs were fetched from DB
      expect(mockIn).toHaveBeenCalledWith('opportunity_id', [
        'opp-9',
        'opp-10',
        'opp-11',
        'opp-12',
      ]);

      // Verify cache was updated
      expect(redisCache.cacheMSet).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.arrayContaining(['guardian:scan:opp-9']),
          expect.arrayContaining(['guardian:scan:opp-10']),
          expect.arrayContaining(['guardian:scan:opp-11']),
          expect.arrayContaining(['guardian:scan:opp-12']),
        ])
      );
    });

    it('should handle trust level distribution (green/amber/red)', async () => {
      const opportunityIds = ['green-1', 'amber-1', 'red-1'];

      vi.mocked(redisCache.cacheMGet).mockResolvedValue(new Map());

      const dbScans = [
        {
          opportunity_id: 'green-1',
          score: 85,
          level: 'green',
          issues: [],
          scanned_at: new Date().toISOString(),
        },
        {
          opportunity_id: 'amber-1',
          score: 65,
          level: 'amber',
          issues: [{ type: 'Mixer Interaction' }],
          scanned_at: new Date().toISOString(),
        },
        {
          opportunity_id: 'red-1',
          score: 45,
          level: 'red',
          issues: [
            { type: 'Sanctions' },
            { type: 'Scam' },
          ],
          scanned_at: new Date().toISOString(),
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

      vi.mocked(redisCache.cacheMSet).mockResolvedValue(3);

      const result = await getGuardianSummary(opportunityIds);

      expect(result.size).toBe(3);

      // Verify trust levels
      expect(result.get('green-1')?.level).toBe('green');
      expect(result.get('green-1')?.score).toBe(85);

      expect(result.get('amber-1')?.level).toBe('amber');
      expect(result.get('amber-1')?.score).toBe(65);

      expect(result.get('red-1')?.level).toBe('red');
      expect(result.get('red-1')?.score).toBe(45);
    });

    it('should handle opportunities with no Guardian scans', async () => {
      const opportunityIds = ['new-opp-1', 'new-opp-2'];

      vi.mocked(redisCache.cacheMGet).mockResolvedValue(new Map());

      // No scans found in database
      const mockSelect = vi.fn().mockReturnThis();
      const mockIn = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        in: mockIn,
        order: mockOrder,
      } as any);

      const result = await getGuardianSummary(opportunityIds);

      // Should return empty map for opportunities without scans
      expect(result.size).toBe(0);
    });
  });

  describe('Staleness detection scenarios', () => {
    it('should identify opportunities needing daily rescan', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const mockOpportunities = [
        {
          id: 'daily-stale',
          slug: 'daily-stale-opportunity',
          status: 'published',
          expires_at: null,
          guardian_scans: [{ scanned_at: yesterday.toISOString() }],
        },
        {
          id: 'very-stale',
          slug: 'very-stale-opportunity',
          status: 'published',
          expires_at: null,
          guardian_scans: [{ scanned_at: lastWeek.toISOString() }],
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

      expect(result.length).toBe(2);
      expect(result[0].hoursSinceLastScan).toBeGreaterThanOrEqual(24);
      expect(result[1].hoursSinceLastScan).toBeGreaterThanOrEqual(24);
    });

    it('should handle mixed fresh and stale opportunities', async () => {
      const now = new Date();
      const fresh = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12h ago
      const stale = new Date(now.getTime() - 30 * 60 * 60 * 1000); // 30h ago

      const mockOpportunities = [
        {
          id: 'fresh-1',
          slug: 'fresh-opportunity',
          status: 'published',
          expires_at: null,
          guardian_scans: [{ scanned_at: fresh.toISOString() }],
        },
        {
          id: 'stale-1',
          slug: 'stale-opportunity',
          status: 'published',
          expires_at: null,
          guardian_scans: [{ scanned_at: stale.toISOString() }],
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

      // Should only return stale opportunity
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('stale-1');
    });
  });

  describe('Rescan queue workflow', () => {
    it('should queue multiple opportunities for rescan', async () => {
      vi.mocked(redisCache.cacheSet).mockResolvedValue(true);

      const opportunityIds = ['opp-1', 'opp-2', 'opp-3'];
      const results = await Promise.all(
        opportunityIds.map(id => queueRescan(id))
      );

      expect(results).toEqual([true, true, true]);
      expect(redisCache.cacheSet).toHaveBeenCalledTimes(3);
    });

    it('should handle rescan workflow: detect stale → queue → invalidate', async () => {
      // Step 1: Detect stale opportunities
      const now = new Date();
      const staleDate = new Date(now.getTime() - 25 * 60 * 60 * 1000);

      const mockOpportunities = [
        {
          id: 'stale-1',
          slug: 'stale-opportunity',
          status: 'published',
          expires_at: null,
          guardian_scans: [{ scanned_at: staleDate.toISOString() }],
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

      const staleOpps = await listStaleOpportunities({ olderThanHours: 24 });
      expect(staleOpps.length).toBe(1);

      // Step 2: Queue for rescan
      vi.mocked(redisCache.cacheSet).mockResolvedValue(true);
      const queueResult = await queueRescan(staleOpps[0].id);
      expect(queueResult).toBe(true);

      // Step 3: Invalidate cache after rescan
      vi.mocked(redisCache.cacheDel).mockResolvedValue(1);
      const invalidateResult = await invalidateGuardianCache([staleOpps[0].id]);
      expect(invalidateResult).toBe(1);
    });
  });

  describe('Cache invalidation scenarios', () => {
    it('should invalidate cache when trust score changes category', async () => {
      // Simulate trust score changing from green to amber
      const opportunityIds = ['opp-1', 'opp-2'];

      vi.mocked(redisCache.cacheDel).mockResolvedValue(2);

      const result = await invalidateGuardianCache(opportunityIds);

      expect(result).toBe(2);
      expect(redisCache.cacheDel).toHaveBeenCalledWith([
        'guardian:scan:opp-1',
        'guardian:scan:opp-2',
      ]);
    });

    it('should handle bulk cache invalidation after batch rescan', async () => {
      // Simulate rescanning 50 opportunities
      const opportunityIds = Array.from({ length: 50 }, (_, i) => `opp-${i + 1}`);

      vi.mocked(redisCache.cacheDel).mockResolvedValue(50);

      const result = await invalidateGuardianCache(opportunityIds);

      expect(result).toBe(50);
    });
  });

  describe('Edge cases and error recovery', () => {
    it('should handle opportunities with multiple scans (take latest)', async () => {
      const opportunityIds = ['opp-1'];

      vi.mocked(redisCache.cacheMGet).mockResolvedValue(new Map());

      // Multiple scans for same opportunity (should take latest)
      const dbScans = [
        {
          opportunity_id: 'opp-1',
          score: 70,
          level: 'amber',
          issues: [],
          scanned_at: '2025-01-01T10:00:00Z',
        },
        {
          opportunity_id: 'opp-1',
          score: 85,
          level: 'green',
          issues: [],
          scanned_at: '2025-01-01T12:00:00Z', // Latest
        },
        {
          opportunity_id: 'opp-1',
          score: 60,
          level: 'amber',
          issues: [],
          scanned_at: '2025-01-01T08:00:00Z',
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
      
      // Should use the latest scan
      expect(summary?.score).toBe(85);
      expect(summary?.level).toBe('green');
      expect(summary?.lastScannedTs).toBe('2025-01-01T12:00:00Z');
    });

    it('should handle empty issues array gracefully', async () => {
      const opportunityIds = ['opp-1'];

      vi.mocked(redisCache.cacheMGet).mockResolvedValue(new Map());

      const dbScans = [
        {
          opportunity_id: 'opp-1',
          score: 95,
          level: 'green',
          issues: [], // No issues
          scanned_at: new Date().toISOString(),
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
      expect(result.get('opp-1')?.topIssues).toEqual([]);
    });

    it('should handle malformed issues data', async () => {
      const opportunityIds = ['opp-1'];

      vi.mocked(redisCache.cacheMGet).mockResolvedValue(new Map());

      const dbScans = [
        {
          opportunity_id: 'opp-1',
          score: 65,
          level: 'amber',
          issues: 'not-an-array', // Malformed data
          scanned_at: new Date().toISOString(),
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
      // Should handle gracefully with empty issues
      expect(result.get('opp-1')?.topIssues).toEqual([]);
    });
  });
});
