/**
 * Integration Tests for Personalized Ranking with getFeedPage
 * 
 * Tests the complete flow from wallet history fetch to personalized ranking
 * 
 * Requirements: 3.1-3.6, 17.4, 18.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFeedPage } from '@/lib/feed/query';
import { getWalletHistory } from '@/lib/wallet-history';
import { createServiceClient } from '@/integrations/supabase/service';

// Mock dependencies
vi.mock('@/integrations/supabase/service');
vi.mock('@/lib/wallet-history');
vi.mock('@/lib/redis/cache');

describe('Personalized Ranking Integration', () => {
  const mockWalletAddress = '0x1234567890abcdef';
  const mockUserId = 'user-uuid-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should apply personalized ranking when wallet provided', async () => {
    // Mock wallet history
    vi.mocked(getWalletHistory).mockResolvedValue({
      walletAddress: mockWalletAddress,
      chains: ['ethereum', 'base'],
      completedTypes: ['airdrop'],
      savedTypes: ['yield'],
      preferredChains: ['ethereum'],
      completedCount: 10,
      savedCount: 5,
      cachedAt: Date.now(),
    });

    // Mock database response
    const mockOpportunities = [
      {
        id: 'opp-1',
        slug: 'low-relevance-opp',
        title: 'Low Relevance',
        type: 'testnet',
        chains: ['solana'],
        trust_score: 70,
        trust_level: 'amber',
        rank_score: 0.6,
        updated_at: new Date().toISOString(),
        // ... other fields
      },
      {
        id: 'opp-2',
        slug: 'high-relevance-opp',
        title: 'High Relevance',
        type: 'airdrop',
        chains: ['ethereum'],
        trust_score: 85,
        trust_level: 'green',
        rank_score: 0.7,
        updated_at: new Date().toISOString(),
        // ... other fields
      },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: mockOpportunities,
        error: null,
        count: 2,
      }),
    };

    vi.mocked(createServiceClient).mockReturnValue(mockSupabase as any);

    // Fetch feed with wallet address
    const result = await getFeedPage({
      walletAddress: mockWalletAddress,
      userId: mockUserId,
      sort: 'recommended',
      limit: 12,
    });

    // Verify wallet history was fetched
    expect(getWalletHistory).toHaveBeenCalledWith(mockWalletAddress, mockUserId);

    // Verify opportunities were returned
    expect(result.items).toHaveLength(2);

    // High relevance opportunity should rank first after personalization
    // (airdrop + ethereum matches wallet history better than testnet + solana)
    expect(result.items[0].id).toBe('opp-2');
    expect(result.items[1].id).toBe('opp-1');
  });

  it('should fallback to default ranking if wallet history fetch fails', async () => {
    // Mock wallet history fetch failure
    vi.mocked(getWalletHistory).mockRejectedValue(new Error('HTTP 429: Rate limited'));

    const mockOpportunities = [
      {
        id: 'opp-1',
        slug: 'test-opp-1',
        title: 'Test 1',
        type: 'airdrop',
        chains: ['ethereum'],
        trust_score: 85,
        trust_level: 'green',
        rank_score: 0.8,
        updated_at: new Date().toISOString(),
      },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: mockOpportunities,
        error: null,
        count: 1,
      }),
    };

    vi.mocked(createServiceClient).mockReturnValue(mockSupabase as any);

    // Should not throw, should fallback gracefully
    const result = await getFeedPage({
      walletAddress: mockWalletAddress,
      userId: mockUserId,
      sort: 'recommended',
      limit: 12,
    });

    // Verify wallet history fetch was attempted
    expect(getWalletHistory).toHaveBeenCalled();

    // Should still return opportunities (using default ranking)
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('opp-1');
  });

  it('should not fetch wallet history if sort is not recommended', async () => {
    const mockOpportunities = [
      {
        id: 'opp-1',
        slug: 'test-opp-1',
        title: 'Test 1',
        type: 'airdrop',
        chains: ['ethereum'],
        trust_score: 85,
        trust_level: 'green',
        rank_score: 0.8,
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: mockOpportunities,
        error: null,
        count: 1,
      }),
    };

    vi.mocked(createServiceClient).mockReturnValue(mockSupabase as any);

    // Fetch with non-recommended sort
    await getFeedPage({
      walletAddress: mockWalletAddress,
      userId: mockUserId,
      sort: 'ends_soon',
      limit: 12,
    });

    // Should not fetch wallet history for non-recommended sorts
    expect(getWalletHistory).not.toHaveBeenCalled();
  });

  it('should not fetch wallet history if no wallet provided', async () => {
    const mockOpportunities = [
      {
        id: 'opp-1',
        slug: 'test-opp-1',
        title: 'Test 1',
        type: 'airdrop',
        chains: ['ethereum'],
        trust_score: 85,
        trust_level: 'green',
        rank_score: 0.8,
        updated_at: new Date().toISOString(),
      },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: mockOpportunities,
        error: null,
        count: 1,
      }),
    };

    vi.mocked(createServiceClient).mockReturnValue(mockSupabase as any);

    // Fetch without wallet
    await getFeedPage({
      sort: 'recommended',
      limit: 12,
    });

    // Should not fetch wallet history
    expect(getWalletHistory).not.toHaveBeenCalled();
  });

  it('should handle timeout errors gracefully', async () => {
    // Mock timeout error
    vi.mocked(getWalletHistory).mockRejectedValue(new Error('Request timeout'));

    const mockOpportunities = [
      {
        id: 'opp-1',
        slug: 'test-opp-1',
        title: 'Test 1',
        type: 'airdrop',
        chains: ['ethereum'],
        trust_score: 85,
        trust_level: 'green',
        rank_score: 0.8,
        updated_at: new Date().toISOString(),
      },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: mockOpportunities,
        error: null,
        count: 1,
      }),
    };

    vi.mocked(createServiceClient).mockReturnValue(mockSupabase as any);

    // Should not throw
    const result = await getFeedPage({
      walletAddress: mockWalletAddress,
      sort: 'recommended',
      limit: 12,
    });

    expect(result.items).toHaveLength(1);
  });
});
