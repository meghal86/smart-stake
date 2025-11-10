/**
 * Tests for analytics tracker
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
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
import { analytics } from '@/lib/analytics/client';

// Mock the analytics client
vi.mock('@/lib/analytics/client', () => ({
  analytics: {
    track: vi.fn(),
  },
}));

describe('Analytics Tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  describe('trackFeedView', () => {
    it('should track feed view event', async () => {
      await trackFeedView({
        tab: 'airdrops',
        hasWallet: true,
        filterCount: 3,
      });

      expect(analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'feed_view',
          properties: {
            tab: 'airdrops',
            has_wallet: true,
            filter_count: 3,
          },
        })
      );
    });

    it('should include hashed wallet address when provided', async () => {
      await trackFeedView({
        tab: 'all',
        hasWallet: true,
        filterCount: 0,
        walletAddress: '0x1234567890123456789012345678901234567890',
      });

      const call = (analytics.track as any).mock.calls[0][0];
      expect(call.user_id_hash).toBeTruthy();
      expect(call.user_id_hash).not.toBe('0x1234567890123456789012345678901234567890');
    });

    it('should include session_id', async () => {
      await trackFeedView({
        tab: 'all',
        hasWallet: false,
        filterCount: 0,
      });

      const call = (analytics.track as any).mock.calls[0][0];
      expect(call.session_id).toBeTruthy();
      expect(call.session_id).toMatch(/^session_/);
    });
  });

  describe('trackFilterChange', () => {
    it('should track filter change event', async () => {
      await trackFilterChange({
        filterType: 'chains',
        filterValue: ['ethereum', 'base'],
        activeFilters: { chains: ['ethereum', 'base'], trust_min: 80 },
      });

      expect(analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'filter_change',
          properties: {
            filter_type: 'chains',
            filter_value: ['ethereum', 'base'],
            active_filters: { chains: ['ethereum', 'base'], trust_min: 80 },
          },
        })
      );
    });
  });

  describe('trackCardImpression', () => {
    it('should track card impression with 0.1% sampling', async () => {
      // Mock Math.random to always pass sampling
      const originalRandom = Math.random;
      Math.random = () => 0.0001; // Less than 0.001 (0.1%)

      await trackCardImpression({
        opportunityId: 'opp_123',
        opportunityType: 'airdrop',
        trustLevel: 'green',
        position: 0,
        isSponsored: false,
        isFeatured: true,
      });

      expect(analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'card_impression',
          properties: {
            opportunity_id: 'opp_123',
            opportunity_type: 'airdrop',
            trust_level: 'green',
            position: 0,
            is_sponsored: false,
            is_featured: true,
          },
        })
      );

      Math.random = originalRandom;
    });

    it('should not track when sampling fails', async () => {
      // Mock Math.random to always fail sampling
      const originalRandom = Math.random;
      Math.random = () => 0.999; // Greater than 0.001 (0.1%)

      await trackCardImpression({
        opportunityId: 'opp_123',
        opportunityType: 'airdrop',
        trustLevel: 'green',
        position: 0,
        isSponsored: false,
        isFeatured: true,
      });

      expect(analytics.track).not.toHaveBeenCalled();

      Math.random = originalRandom;
    });
  });

  describe('trackCardClick', () => {
    it('should track card click with 100% sampling', async () => {
      await trackCardClick({
        opportunityId: 'opp_123',
        opportunityType: 'airdrop',
        trustLevel: 'green',
        position: 0,
        isSponsored: false,
        isFeatured: true,
      });

      expect(analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'card_click',
          properties: {
            opportunity_id: 'opp_123',
            opportunity_type: 'airdrop',
            trust_level: 'green',
            position: 0,
            is_sponsored: false,
            is_featured: true,
          },
        })
      );
    });
  });

  describe('trackSave', () => {
    it('should track save action', async () => {
      await trackSave({
        opportunityId: 'opp_123',
        opportunityType: 'airdrop',
        action: 'save',
      });

      expect(analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'save',
          properties: {
            opportunity_id: 'opp_123',
            opportunity_type: 'airdrop',
            action: 'save',
          },
        })
      );
    });

    it('should track unsave action', async () => {
      await trackSave({
        opportunityId: 'opp_123',
        opportunityType: 'airdrop',
        action: 'unsave',
      });

      expect(analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'save',
          properties: {
            opportunity_id: 'opp_123',
            opportunity_type: 'airdrop',
            action: 'unsave',
          },
        })
      );
    });
  });

  describe('trackReport', () => {
    it('should track report event', async () => {
      await trackReport({
        opportunityId: 'opp_123',
        reportCategory: 'phishing',
      });

      expect(analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'report',
          properties: {
            opportunity_id: 'opp_123',
            report_category: 'phishing',
          },
        })
      );
    });
  });

  describe('trackCTAClick', () => {
    it('should track CTA click event', async () => {
      await trackCTAClick({
        opportunityId: 'opp_123',
        opportunityType: 'airdrop',
        ctaAction: 'claim',
        trustLevel: 'green',
      });

      expect(analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'cta_click',
          properties: {
            opportunity_id: 'opp_123',
            opportunity_type: 'airdrop',
            cta_action: 'claim',
            trust_level: 'green',
          },
        })
      );
    });
  });

  describe('trackScrollDepth', () => {
    it('should track scroll depth event', async () => {
      await trackScrollDepth({
        depthPercent: 50,
        pageHeight: 3000,
        viewportHeight: 800,
      });

      expect(analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'scroll_depth',
          properties: {
            depth_percent: 50,
            page_height: 3000,
            viewport_height: 800,
          },
        })
      );
    });
  });

  describe('Session ID consistency', () => {
    it('should use same session ID across multiple events', async () => {
      await trackFeedView({
        tab: 'all',
        hasWallet: false,
        filterCount: 0,
      });

      await trackCardClick({
        opportunityId: 'opp_123',
        opportunityType: 'airdrop',
        trustLevel: 'green',
        position: 0,
        isSponsored: false,
        isFeatured: false,
      });

      const call1 = (analytics.track as any).mock.calls[0][0];
      const call2 = (analytics.track as any).mock.calls[1][0];

      expect(call1.session_id).toBe(call2.session_id);
    });
  });
});
