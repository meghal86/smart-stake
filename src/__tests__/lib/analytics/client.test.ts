/**
 * Tests for analytics client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as consent from '@/lib/analytics/consent';

// Mock PostHog - must be before imports
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    opt_out_capturing: vi.fn(),
    opt_in_capturing: vi.fn(),
  },
}));

import { analytics } from '@/lib/analytics/client';
import posthog from 'posthog-js';

describe('Analytics Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('initialize', () => {
    it('should not initialize when disabled', () => {
      analytics.initialize({
        enabled: false,
        apiKey: 'test_key',
      });

      expect(posthog.init).not.toHaveBeenCalled();
    });

    it('should not initialize without API key', () => {
      analytics.initialize({
        enabled: true,
      });

      expect(posthog.init).not.toHaveBeenCalled();
    });

    it('should not initialize when analytics not allowed', () => {
      vi.spyOn(consent, 'isAnalyticsAllowed').mockReturnValue(false);

      analytics.initialize({
        enabled: true,
        apiKey: 'test_key',
      });

      expect(posthog.init).not.toHaveBeenCalled();
    });

    it('should initialize when enabled and consent given', () => {
      vi.spyOn(consent, 'isAnalyticsAllowed').mockReturnValue(true);

      analytics.initialize({
        enabled: true,
        apiKey: 'test_key',
        apiHost: 'https://test.posthog.com',
      });

      expect(posthog.init).toHaveBeenCalledWith(
        'test_key',
        expect.objectContaining({
          api_host: 'https://test.posthog.com',
          autocapture: false,
          respect_dnt: true,
        })
      );
    });
  });

  describe('track', () => {
    it('should not track when not initialized', async () => {
      await analytics.track({
        event: 'feed_view',
        timestamp: new Date().toISOString(),
        session_id: 'test_session',
        properties: {
          tab: 'all',
          has_wallet: false,
          filter_count: 0,
        },
      } as any);

      expect(posthog.capture).not.toHaveBeenCalled();
    });

    it('should sanitize properties before tracking', async () => {
      vi.spyOn(consent, 'isAnalyticsAllowed').mockReturnValue(true);

      // Initialize first
      analytics.initialize({
        enabled: true,
        apiKey: 'test_key',
      });

      await analytics.track({
        event: 'card_click',
        timestamp: new Date().toISOString(),
        session_id: 'test_session',
        properties: {
          opportunity_id: 'opp_123',
          wallet: '0x1234567890123456789012345678901234567890', // Should be redacted
        },
      } as any);

      expect(posthog.capture).toHaveBeenCalledWith(
        'card_click',
        expect.objectContaining({
          opportunity_id: 'opp_123',
          wallet: '[REDACTED]',
        })
      );
    });
  });

  describe('identify', () => {
    it('should hash wallet address before identifying', async () => {
      vi.spyOn(consent, 'isAnalyticsAllowed').mockReturnValue(true);

      analytics.initialize({
        enabled: true,
        apiKey: 'test_key',
      });

      await analytics.identify('0x1234567890123456789012345678901234567890');

      expect(posthog.identify).toHaveBeenCalled();
      const identifyArg = (posthog.identify as any).mock.calls[0][0];
      expect(identifyArg).not.toBe('0x1234567890123456789012345678901234567890');
      expect(identifyArg.length).toBe(64); // SHA-256 hash
    });
  });

  describe('reset', () => {
    it('should reset user identity', () => {
      vi.spyOn(consent, 'isAnalyticsAllowed').mockReturnValue(true);

      analytics.initialize({
        enabled: true,
        apiKey: 'test_key',
      });

      analytics.reset();

      expect(posthog.reset).toHaveBeenCalled();
    });
  });

  describe('optOut', () => {
    it('should opt out of capturing', () => {
      vi.spyOn(consent, 'isAnalyticsAllowed').mockReturnValue(true);

      analytics.initialize({
        enabled: true,
        apiKey: 'test_key',
      });

      analytics.optOut();

      expect(posthog.opt_out_capturing).toHaveBeenCalled();
    });
  });

  describe('optIn', () => {
    it('should opt in to capturing', () => {
      vi.spyOn(consent, 'isAnalyticsAllowed').mockReturnValue(true);

      analytics.initialize({
        enabled: true,
        apiKey: 'test_key',
      });

      analytics.optIn();

      expect(posthog.opt_in_capturing).toHaveBeenCalled();
    });
  });
});
