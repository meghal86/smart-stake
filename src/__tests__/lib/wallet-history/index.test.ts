/**
 * Tests for Wallet History Service
 * 
 * Requirements: 17.4, 18.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getWalletHistory, invalidateWalletHistoryCache } from '@/lib/wallet-history';
import { createServiceClient } from '@/integrations/supabase/service';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis/cache';

// Mock dependencies
vi.mock('@/integrations/supabase/service');
vi.mock('@/lib/redis/cache');

describe('Wallet History Service', () => {
  const mockWalletAddress = '0x1234567890abcdef';
  const mockUserId = 'user-uuid-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getWalletHistory', () => {
    it('should return cached wallet history if available', async () => {
      const cachedHistory = {
        walletAddress: mockWalletAddress,
        chains: ['ethereum', 'base'],
        completedTypes: ['airdrop'],
        savedTypes: ['yield'],
        preferredChains: ['ethereum'],
        completedCount: 5,
        savedCount: 3,
        cachedAt: Date.now(),
      };

      vi.mocked(cacheGet).mockResolvedValue({ data: cachedHistory, hit: true });

      const result = await getWalletHistory(mockWalletAddress, mockUserId);

      expect(result).toEqual(cachedHistory);
      expect(cacheGet).toHaveBeenCalledWith(`wallet:history:${mockWalletAddress}`);
    });

    it('should fetch from database if cache miss', async () => {
      vi.mocked(cacheGet).mockResolvedValue({ data: null, hit: false });

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
      };

      // Mock completed opportunities query
      mockSupabase.from.mockImplementationOnce(() => ({
        ...mockSupabase,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              opportunity_id: 'opp-1',
              opportunities: {
                type: 'airdrop',
                chains: ['ethereum', 'base'],
              },
            },
          ],
          error: null,
        }),
      }));

      // Mock saved opportunities query
      mockSupabase.from.mockImplementationOnce(() => ({
        ...mockSupabase,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              opportunity_id: 'opp-2',
              opportunities: {
                type: 'yield',
                chains: ['arbitrum'],
              },
            },
          ],
          error: null,
        }),
      }));

      // Mock user preferences query
      mockSupabase.from.mockImplementationOnce(() => ({
        ...mockSupabase,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            preferred_chains: ['ethereum', 'base'],
          },
          error: null,
        }),
      }));

      vi.mocked(createServiceClient).mockReturnValue(mockSupabase as any);

      const result = await getWalletHistory(mockWalletAddress, mockUserId);

      expect(result.walletAddress).toBe(mockWalletAddress);
      expect(result.chains).toContain('ethereum');
      expect(result.chains).toContain('base');
      expect(result.chains).toContain('arbitrum');
      expect(result.completedTypes).toContain('airdrop');
      expect(result.savedTypes).toContain('yield');
      expect(result.preferredChains).toEqual(['ethereum', 'base']);
      expect(result.completedCount).toBe(1);
      expect(result.savedCount).toBe(1);

      // Should cache the result
      expect(cacheSet).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(cacheGet).mockResolvedValue({ data: null, hit: false });

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
      };

      // Mock error responses
      mockSupabase.from.mockImplementation(() => ({
        ...mockSupabase,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }));

      vi.mocked(createServiceClient).mockReturnValue(mockSupabase as any);

      const result = await getWalletHistory(mockWalletAddress, mockUserId);

      // Should return empty history on error
      expect(result.walletAddress).toBe(mockWalletAddress);
      expect(result.chains).toEqual([]);
      expect(result.completedTypes).toEqual([]);
      expect(result.savedTypes).toEqual([]);
      expect(result.completedCount).toBe(0);
      expect(result.savedCount).toBe(0);
    });

    it('should work without user ID', async () => {
      vi.mocked(cacheGet).mockResolvedValue({ data: null, hit: false });

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      };

      mockSupabase.from.mockImplementation(() => ({
        ...mockSupabase,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }));

      vi.mocked(createServiceClient).mockReturnValue(mockSupabase as any);

      const result = await getWalletHistory(mockWalletAddress);

      expect(result.walletAddress).toBe(mockWalletAddress);
      expect(result.preferredChains).toEqual([]);
    });
  });

  describe('invalidateWalletHistoryCache', () => {
    it('should delete cache key', async () => {
      await invalidateWalletHistoryCache(mockWalletAddress);

      expect(cacheDel).toHaveBeenCalledWith(`wallet:history:${mockWalletAddress}`);
    });

    it('should handle cache deletion errors gracefully', async () => {
      vi.mocked(cacheDel).mockRejectedValue(new Error('Redis error'));

      // Should not throw
      await expect(
        invalidateWalletHistoryCache(mockWalletAddress)
      ).resolves.not.toThrow();
    });
  });
});
