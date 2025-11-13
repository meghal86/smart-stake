/**
 * Tests for analytics wallet correlation
 * 
 * Verifies that hashed wallet_id is included in telemetry payloads
 * for analytics correlation across events.
 * 
 * Requirements: 18.4
 */

import {
  trackFeedView,
  trackFilterChange,
  trackCardImpression,
  trackCardClick,
  trackSave,
  trackReport,
  trackCTAClick,
  trackScrollDepth,
} from '@/lib/analytics/tracker';
import * as analyticsClient from '@/lib/analytics/client';
import * as hashModule from '@/lib/analytics/hash';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/analytics/client');
vi.mock('@/lib/analytics/hash');

const mockTrack = analyticsClient.analytics.track as ReturnType<typeof vi.fn>;
const mockHashWalletAddress = hashModule.hashWalletAddress as ReturnType<typeof vi.fn>;

describe('Analytics Wallet Correlation', () => {
  const mockWallet = '0x1234567890abcdef1234567890abcdef12345678';
  const mockWalletHash = 'hash_0x1234567890abcdef1234567890abcdef12345678';

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: return hash for wallet, undefined for no wallet
    mockHashWalletAddress.mockImplementation((address?: string) => 
      Promise.resolve(address ? `hash_${address}` : undefined)
    );
    mockTrack.mockResolvedValue();
  });

  describe('trackFeedView', () => {
    it('should include wallet_id_hash in properties when wallet is connected', async () => {
      await trackFeedView({
        tab: 'All',
        hasWallet: true,
        filterCount: 2,
        walletAddress: mockWallet,
      });

      expect(mockHashWalletAddress).toHaveBeenCalledWith(mockWallet);
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'feed_view',
          user_id_hash: mockWalletHash,
          properties: expect.objectContaining({
            wallet_id_hash: mockWalletHash,
          }),
        })
      );
    });

    it('should not include wallet_id_hash when wallet is not connected', async () => {
      await trackFeedView({
        tab: 'All',
        hasWallet: false,
        filterCount: 0,
      });

      // When no wallet is provided, hash should be undefined
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'feed_view',
          user_id_hash: undefined,
          properties: expect.objectContaining({
            wallet_id_hash: undefined,
          }),
        })
      );
    });
  });

  describe('trackFilterChange', () => {
    it('should include wallet_id_hash in properties', async () => {
      await trackFilterChange({
        filterType: 'type',
        filterValue: ['airdrop', 'quest'],
        activeFilters: { type: ['airdrop', 'quest'] },
        walletAddress: mockWallet,
      });

      expect(mockHashWalletAddress).toHaveBeenCalledWith(mockWallet);
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'filter_change',
          user_id_hash: mockWalletHash,
          properties: expect.objectContaining({
            wallet_id_hash: mockWalletHash,
          }),
        })
      );
    });
  });

  describe('trackCardImpression', () => {
    it('should include wallet_id_hash in properties', async () => {
      // Mock Math.random to ensure sampling passes
      vi.spyOn(Math, 'random').mockReturnValue(0.0001);

      await trackCardImpression({
        opportunityId: 'opp-1',
        opportunityType: 'airdrop',
        trustLevel: 'green',
        position: 0,
        isSponsored: false,
        isFeatured: true,
        walletAddress: mockWallet,
      });

      expect(mockHashWalletAddress).toHaveBeenCalledWith(mockWallet);
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'card_impression',
          user_id_hash: mockWalletHash,
          properties: expect.objectContaining({
            wallet_id_hash: mockWalletHash,
          }),
        })
      );

      vi.spyOn(Math, 'random').mockRestore();
    });
  });

  describe('trackCardClick', () => {
    it('should include wallet_id_hash in properties', async () => {
      await trackCardClick({
        opportunityId: 'opp-1',
        opportunityType: 'airdrop',
        trustLevel: 'green',
        position: 0,
        isSponsored: false,
        isFeatured: true,
        walletAddress: mockWallet,
      });

      expect(mockHashWalletAddress).toHaveBeenCalledWith(mockWallet);
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'card_click',
          user_id_hash: mockWalletHash,
          properties: expect.objectContaining({
            wallet_id_hash: mockWalletHash,
          }),
        })
      );
    });
  });

  describe('trackSave', () => {
    it('should include wallet_id_hash in properties', async () => {
      await trackSave({
        opportunityId: 'opp-1',
        opportunityType: 'airdrop',
        action: 'save',
        walletAddress: mockWallet,
      });

      expect(mockHashWalletAddress).toHaveBeenCalledWith(mockWallet);
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'save',
          user_id_hash: mockWalletHash,
          properties: expect.objectContaining({
            wallet_id_hash: mockWalletHash,
          }),
        })
      );
    });
  });

  describe('trackReport', () => {
    it('should include wallet_id_hash in properties', async () => {
      await trackReport({
        opportunityId: 'opp-1',
        reportCategory: 'phishing',
        walletAddress: mockWallet,
      });

      expect(mockHashWalletAddress).toHaveBeenCalledWith(mockWallet);
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'report',
          user_id_hash: mockWalletHash,
          properties: expect.objectContaining({
            wallet_id_hash: mockWalletHash,
          }),
        })
      );
    });
  });

  describe('trackCTAClick', () => {
    it('should include wallet_id_hash in properties', async () => {
      await trackCTAClick({
        opportunityId: 'opp-1',
        opportunityType: 'airdrop',
        ctaAction: 'claim',
        trustLevel: 'green',
        walletAddress: mockWallet,
      });

      expect(mockHashWalletAddress).toHaveBeenCalledWith(mockWallet);
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'cta_click',
          user_id_hash: mockWalletHash,
          properties: expect.objectContaining({
            wallet_id_hash: mockWalletHash,
          }),
        })
      );
    });
  });

  describe('trackScrollDepth', () => {
    it('should include wallet_id_hash in properties', async () => {
      await trackScrollDepth({
        depthPercent: 50,
        pageHeight: 2000,
        viewportHeight: 800,
        walletAddress: mockWallet,
      });

      expect(mockHashWalletAddress).toHaveBeenCalledWith(mockWallet);
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'scroll_depth',
          user_id_hash: mockWalletHash,
          properties: expect.objectContaining({
            wallet_id_hash: mockWalletHash,
          }),
        })
      );
    });
  });

  describe('Wallet correlation consistency', () => {
    it('should use the same hash for the same wallet across different events', async () => {
      const events = [
        () => trackFeedView({ tab: 'All', hasWallet: true, filterCount: 0, walletAddress: mockWallet }),
        () => trackCardClick({
          opportunityId: 'opp-1',
          opportunityType: 'airdrop',
          trustLevel: 'green',
          position: 0,
          isSponsored: false,
          isFeatured: false,
          walletAddress: mockWallet,
        }),
        () => trackSave({
          opportunityId: 'opp-1',
          opportunityType: 'airdrop',
          action: 'save',
          walletAddress: mockWallet,
        }),
      ];

      for (const trackEvent of events) {
        await trackEvent();
      }

      // All events should have called hashWalletAddress with the same wallet
      expect(mockHashWalletAddress).toHaveBeenCalledTimes(events.length);
      mockHashWalletAddress.mock.calls.forEach(call => {
        expect(call[0]).toBe(mockWallet);
      });

      // All events should have the same wallet_id_hash
      mockTrack.mock.calls.forEach(call => {
        const event = call[0];
        expect(event.user_id_hash).toBe(mockWalletHash);
        expect(event.properties.wallet_id_hash).toBe(mockWalletHash);
      });
    });

    it('should handle wallet changes correctly', async () => {
      const wallet1 = '0x1111111111111111111111111111111111111111';
      const wallet2 = '0x2222222222222222222222222222222222222222';
      const hash1 = 'hash_wallet1';
      const hash2 = 'hash_wallet2';

      mockHashWalletAddress
        .mockResolvedValueOnce(hash1)
        .mockResolvedValueOnce(hash2);

      await trackFeedView({
        tab: 'All',
        hasWallet: true,
        filterCount: 0,
        walletAddress: wallet1,
      });

      await trackFeedView({
        tab: 'All',
        hasWallet: true,
        filterCount: 0,
        walletAddress: wallet2,
      });

      expect(mockHashWalletAddress).toHaveBeenNthCalledWith(1, wallet1);
      expect(mockHashWalletAddress).toHaveBeenNthCalledWith(2, wallet2);

      expect(mockTrack).toHaveBeenNthCalledWith(1, expect.objectContaining({
        user_id_hash: hash1,
        properties: expect.objectContaining({
          wallet_id_hash: hash1,
        }),
      }));

      expect(mockTrack).toHaveBeenNthCalledWith(2, expect.objectContaining({
        user_id_hash: hash2,
        properties: expect.objectContaining({
          wallet_id_hash: hash2,
        }),
      }));
    });
  });
});
