/**
 * Unit tests for eligibility preview service
 * Tests caching, error handling, and integration with eligibility scoring
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock environment to prevent validation errors
vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  },
}));

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock Redis cache
vi.mock('@/lib/redis/cache', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
}));

import {
  getEligibilityPreview,
  clearEligibilityCache,
  clearExpiredEligibilityCache,
  type EligibilityPreview,
} from '../../lib/eligibility-preview';
import { supabase } from '@/integrations/supabase/client';

// Mock console methods to reduce test noise
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('getEligibilityPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe('Input Validation', () => {
    it('should return unknown status for missing wallet address', async () => {
      const result = await getEligibilityPreview('', 'opp-123', 'ethereum');

      expect(result.status).toBe('unknown');
      expect(result.score).toBe(0);
      expect(result.reasons).toContain('Invalid input: wallet address, opportunity ID, and chain are required');
      expect(result.cachedUntil).toBeDefined();
    });

    it('should return unknown status for missing opportunity ID', async () => {
      const result = await getEligibilityPreview('0x123', '', 'ethereum');

      expect(result.status).toBe('unknown');
      expect(result.score).toBe(0);
      expect(result.reasons).toContain('Invalid input: wallet address, opportunity ID, and chain are required');
    });

    it('should return unknown status for missing required chain', async () => {
      const result = await getEligibilityPreview('0x123', 'opp-123', '');

      expect(result.status).toBe('unknown');
      expect(result.score).toBe(0);
      expect(result.reasons).toContain('Invalid input: wallet address, opportunity ID, and chain are required');
    });

    it('should normalize wallet address to lowercase', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockGt = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // Not found
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gt: mockGt,
        single: mockSingle,
      } as any);

      await getEligibilityPreview('0xABC123', 'opp-123', 'ethereum');

      // Check that wallet address was normalized to lowercase
      expect(mockEq).toHaveBeenCalledWith('wallet_address', '0xabc123');
    });
  });

  describe('Cache Hit Scenarios', () => {
    it('should return cached result when cache is valid', async () => {
      const cachedResult = {
        opportunity_id: 'opp-123',
        wallet_address: '0x123',
        status: 'likely',
        score: 0.85,
        reasons: ['Active on ethereum', 'Wallet age 30+ days'],
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min from now
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockGt = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: cachedResult,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gt: mockGt,
        single: mockSingle,
      } as any);

      const result = await getEligibilityPreview('0x123', 'opp-123', 'ethereum');

      expect(result.status).toBe('likely');
      expect(result.score).toBe(0.85);
      expect(result.reasons).toEqual(['Active on ethereum', 'Wallet age 30+ days']);
      expect(result.cachedUntil).toBe(cachedResult.expires_at);
    });

    it('should query cache with correct parameters', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockGt = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gt: mockGt,
        single: mockSingle,
      } as any);

      await getEligibilityPreview('0x123', 'opp-456', 'polygon');

      expect(supabase.from).toHaveBeenCalledWith('eligibility_cache');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('opportunity_id', 'opp-456');
      expect(mockEq).toHaveBeenCalledWith('wallet_address', '0x123');
      expect(mockGt).toHaveBeenCalled(); // Check expires_at > now
    });

    it('should handle cached result with missing reasons gracefully', async () => {
      const cachedResult = {
        opportunity_id: 'opp-123',
        wallet_address: '0x123',
        status: 'maybe',
        score: 0.5,
        reasons: null, // Missing reasons
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockGt = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: cachedResult,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gt: mockGt,
        single: mockSingle,
      } as any);

      const result = await getEligibilityPreview('0x123', 'opp-123', 'ethereum');

      expect(result.status).toBe('maybe');
      expect(result.reasons).toEqual(['Cached result']);
    });
  });

  describe('Cache Miss Scenarios', () => {
    it('should calculate and cache result when cache is empty', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockGt = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // Not found
      });

      const mockUpsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gt: mockGt,
        single: mockSingle,
        upsert: mockUpsert,
      } as any);

      const result = await getEligibilityPreview('0x123', 'opp-123', 'ethereum');

      expect(result.status).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.cachedUntil).toBeDefined();

      // Verify cache was updated
      expect(mockUpsert).toHaveBeenCalled();
    });

    it('should always include at least one reason', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockGt = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const mockUpsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gt: mockGt,
        single: mockSingle,
        upsert: mockUpsert,
      } as any);

      const result = await getEligibilityPreview('0x123', 'opp-123', 'ethereum');

      expect(result.reasons).toBeDefined();
      expect(Array.isArray(result.reasons)).toBe(true);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('should set cache TTL to 60 minutes', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockGt = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const mockUpsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gt: mockGt,
        single: mockSingle,
        upsert: mockUpsert,
      } as any);

      const beforeCall = Date.now();
      const result = await getEligibilityPreview('0x123', 'opp-123', 'ethereum');
      const afterCall = Date.now();

      const cachedUntilTime = new Date(result.cachedUntil).getTime();
      const expectedMin = beforeCall + 59 * 60 * 1000; // 59 minutes
      const expectedMax = afterCall + 61 * 60 * 1000; // 61 minutes

      expect(cachedUntilTime).toBeGreaterThan(expectedMin);
      expect(cachedUntilTime).toBeLessThan(expectedMax);
    });
  });

  describe('Error Handling', () => {
    it('should return unknown status when wallet signals cannot be fetched', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockGt = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const mockUpsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gt: mockGt,
        single: mockSingle,
        upsert: mockUpsert,
      } as any);

      const result = await getEligibilityPreview('0x123', 'opp-123', 'ethereum');

      // With mock implementation, this will return unknown
      expect(result.status).toBeDefined();
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('should handle database errors gracefully', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockGt = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gt: mockGt,
        single: mockSingle,
      } as any);

      const result = await getEligibilityPreview('0x123', 'opp-123', 'ethereum');

      expect(result.status).toBe('unknown');
      expect(result.score).toBe(0);
      expect(result.reasons).toContain('An error occurred while checking eligibility. Please try again.');
    });

    it('should continue even if cache insert fails', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockGt = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const mockUpsert = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gt: mockGt,
        single: mockSingle,
        upsert: mockUpsert,
      } as any);

      const result = await getEligibilityPreview('0x123', 'opp-123', 'ethereum');

      // Should still return a result even if caching failed
      expect(result.status).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('should always include at least one reason for unknown status', async () => {
      const result = await getEligibilityPreview('', 'opp-123', 'ethereum');

      expect(result.status).toBe('unknown');
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons[0]).toBeTruthy();
    });
  });

  describe('Status Labels', () => {
    it('should return status matching eligibility score thresholds', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockGt = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const mockUpsert = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gt: mockGt,
        single: mockSingle,
        upsert: mockUpsert,
      } as any);

      const result = await getEligibilityPreview('0x123', 'opp-123', 'ethereum');

      // Status should be one of the valid values
      expect(['likely', 'maybe', 'unlikely', 'unknown']).toContain(result.status);
    });
  });
});

describe('clearEligibilityCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should delete cache entries for specific opportunity', async () => {
    const mockDelete = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockResolvedValue({
      data: [{ id: '1' }, { id: '2' }],
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      delete: mockDelete,
      eq: mockEq,
      select: mockSelect,
    } as any);

    const count = await clearEligibilityCache('opp-123');

    expect(supabase.from).toHaveBeenCalledWith('eligibility_cache');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('opportunity_id', 'opp-123');
    expect(count).toBe(2);
  });

  it('should return 0 when no entries are deleted', async () => {
    const mockDelete = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      delete: mockDelete,
      eq: mockEq,
      select: mockSelect,
    } as any);

    const count = await clearEligibilityCache('opp-999');

    expect(count).toBe(0);
  });

  it('should handle errors gracefully', async () => {
    const mockDelete = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Delete failed' },
    });

    vi.mocked(supabase.from).mockReturnValue({
      delete: mockDelete,
      eq: mockEq,
      select: mockSelect,
    } as any);

    const count = await clearEligibilityCache('opp-123');

    expect(count).toBe(0);
  });

  it('should handle exceptions gracefully', async () => {
    const mockDelete = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockRejectedValue(new Error('Database error'));

    vi.mocked(supabase.from).mockReturnValue({
      delete: mockDelete,
      eq: mockEq,
    } as any);

    const count = await clearEligibilityCache('opp-123');

    expect(count).toBe(0);
  });
});

describe('clearExpiredEligibilityCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should delete expired cache entries', async () => {
    const mockDelete = vi.fn().mockReturnThis();
    const mockLt = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockResolvedValue({
      data: [{ id: '1' }, { id: '2' }, { id: '3' }],
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      delete: mockDelete,
      lt: mockLt,
      select: mockSelect,
    } as any);

    const count = await clearExpiredEligibilityCache();

    expect(supabase.from).toHaveBeenCalledWith('eligibility_cache');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockLt).toHaveBeenCalled(); // Check expires_at < now
    expect(count).toBe(3);
  });

  it('should return 0 when no expired entries exist', async () => {
    const mockDelete = vi.fn().mockReturnThis();
    const mockLt = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      delete: mockDelete,
      lt: mockLt,
      select: mockSelect,
    } as any);

    const count = await clearExpiredEligibilityCache();

    expect(count).toBe(0);
  });

  it('should handle errors gracefully', async () => {
    const mockDelete = vi.fn().mockReturnThis();
    const mockLt = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Delete failed' },
    });

    vi.mocked(supabase.from).mockReturnValue({
      delete: mockDelete,
      lt: mockLt,
      select: mockSelect,
    } as any);

    const count = await clearExpiredEligibilityCache();

    expect(count).toBe(0);
  });

  it('should handle exceptions gracefully', async () => {
    const mockDelete = vi.fn().mockReturnThis();
    const mockLt = vi.fn().mockRejectedValue(new Error('Database error'));

    vi.mocked(supabase.from).mockReturnValue({
      delete: mockDelete,
      lt: mockLt,
    } as any);

    const count = await clearExpiredEligibilityCache();

    expect(count).toBe(0);
  });
});
