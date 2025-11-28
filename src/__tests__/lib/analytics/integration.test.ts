/**
 * Integration tests for analytics system
 * 
 * Tests the complete flow from tracking to ensuring no plain wallet addresses
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock PostHog - must be before imports
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn((key, config) => {
      if (config.loaded) {
        config.loaded({});
      }
    }),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    opt_out_capturing: vi.fn(),
    opt_in_capturing: vi.fn(),
  },
}));

import { analytics } from '@/lib/analytics/client';
import {
  trackFeedView,
  trackCardClick,
  trackSave,
  trackCTAClick,
} from '@/lib/analytics/tracker';
import { setConsent, isAnalyticsAllowed } from '@/lib/analytics/consent';
import { isPlainWalletAddress } from '@/lib/analytics/hash';
import posthog from 'posthog-js';

describe('Analytics Integration Tests', () => {
  const TEST_WALLET = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Complete tracking flow', () => {
    it('should track events end-to-end with consent', async () => {
      // 1. Set consent
      setConsent({
        analytics: true,
        marketing: false,
        functional: true,
      });

      expect(isAnalyticsAllowed()).toBe(true);

      // 2. Initialize analytics
      analytics.initialize({
        enabled: true,
        apiKey: 'test_key',
        debug: true,
      });

      expect(posthog.init).toHaveBeenCalled();

      // 3. Track various events
      await trackFeedView({
        tab: 'airdrops',
        hasWallet: true,
        filterCount: 2,
        walletAddress: TEST_WALLET,
      });

      await trackCardClick({
        opportunityId: 'opp_123',
        opportunityType: 'airdrop',
        trustLevel: 'green',
        position: 0,
        isSponsored: false,
        isFeatured: true,
        walletAddress: TEST_WALLET,
      });

      await trackSave({
        opportunityId: 'opp_123',
        opportunityType: 'airdrop',
        action: 'save',
        walletAddress: TEST_WALLET,
      });

      // 4. Verify events were tracked
      expect(posthog.capture).toHaveBeenCalledTimes(3);

      // 5. Verify no plain wallet addresses in any call
      const allCalls = (posthog.capture as any).mock.calls;
      
      allCalls.forEach((call) => {
        const [eventName, properties] = call;
        
        // Check all property values recursively
        const checkProperties = (obj: unknown) => {
          for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
              expect(
                isPlainWalletAddress(value),
                `Plain wallet address found in property "${key}": ${value}`
              ).toBe(false);
            } else if (typeof value === 'object' && value !== null) {
              checkProperties(value);
            }
          }
        };

        checkProperties(properties);
      });
    });

    it('should not track when consent is denied', async () => {
      // Set consent to false
      setConsent({
        analytics: false,
        marketing: false,
        functional: false,
      });

      expect(isAnalyticsAllowed()).toBe(false);

      // Try to initialize
      analytics.initialize({
        enabled: true,
        apiKey: 'test_key',
      });

      // Should not initialize
      expect(posthog.init).not.toHaveBeenCalled();

      // Try to track
      await trackFeedView({
        tab: 'all',
        hasWallet: false,
        filterCount: 0,
      });

      // Should not track
      expect(posthog.capture).not.toHaveBeenCalled();
    });

    it('should not track when DNT is enabled', async () => {
      // Enable DNT
      Object.defineProperty(navigator, 'doNotTrack', {
        writable: true,
        value: '1',
      });

      // Set consent to true (but DNT should override)
      setConsent({
        analytics: true,
        marketing: false,
        functional: true,
      });

      expect(isAnalyticsAllowed()).toBe(false);

      // Try to initialize
      analytics.initialize({
        enabled: true,
        apiKey: 'test_key',
      });

      // Should not initialize
      expect(posthog.init).not.toHaveBeenCalled();
    });
  });

  describe('Wallet address hashing', () => {
    it('should hash wallet addresses consistently within session', async () => {
      setConsent({ analytics: true, marketing: false, functional: true });
      analytics.initialize({ enabled: true, apiKey: 'test_key' });

      // Track two events with same wallet
      await trackCardClick({
        opportunityId: 'opp_1',
        opportunityType: 'airdrop',
        trustLevel: 'green',
        position: 0,
        isSponsored: false,
        isFeatured: false,
        walletAddress: TEST_WALLET,
      });

      await trackCardClick({
        opportunityId: 'opp_2',
        opportunityType: 'quest',
        trustLevel: 'green',
        position: 1,
        isSponsored: false,
        isFeatured: false,
        walletAddress: TEST_WALLET,
      });

      const call1 = (posthog.capture as any).mock.calls[0][1];
      const call2 = (posthog.capture as any).mock.calls[1][1];

      // Should have same user_id_hash
      expect(call1.user_id_hash).toBe(call2.user_id_hash);
      
      // Should not be the plain wallet
      expect(call1.user_id_hash).not.toBe(TEST_WALLET);
    });

    it('should produce different hashes in different sessions', async () => {
      setConsent({ analytics: true, marketing: false, functional: true });
      analytics.initialize({ enabled: true, apiKey: 'test_key' });

      // Track event
      await trackCardClick({
        opportunityId: 'opp_1',
        opportunityType: 'airdrop',
        trustLevel: 'green',
        position: 0,
        isSponsored: false,
        isFeatured: false,
        walletAddress: TEST_WALLET,
      });

      const hash1 = (posthog.capture as any).mock.calls[0][1].user_id_hash;

      // Clear session (simulate new session)
      sessionStorage.clear();
      vi.clearAllMocks();

      // Track another event
      await trackCardClick({
        opportunityId: 'opp_2',
        opportunityType: 'airdrop',
        trustLevel: 'green',
        position: 0,
        isSponsored: false,
        isFeatured: false,
        walletAddress: TEST_WALLET,
      });

      const hash2 = (posthog.capture as any).mock.calls[0][1].user_id_hash;

      // Hashes should be different
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Session ID consistency', () => {
    it('should use same session ID across all events in a session', async () => {
      setConsent({ analytics: true, marketing: false, functional: true });
      analytics.initialize({ enabled: true, apiKey: 'test_key' });

      // Track multiple events
      await trackFeedView({
        tab: 'all',
        hasWallet: true,
        filterCount: 0,
        walletAddress: TEST_WALLET,
      });

      await trackCardClick({
        opportunityId: 'opp_1',
        opportunityType: 'airdrop',
        trustLevel: 'green',
        position: 0,
        isSponsored: false,
        isFeatured: false,
        walletAddress: TEST_WALLET,
      });

      await trackSave({
        opportunityId: 'opp_1',
        opportunityType: 'airdrop',
        action: 'save',
        walletAddress: TEST_WALLET,
      });

      // All should have same session_id
      const sessionIds = (posthog.capture as any).mock.calls.map((call: unknown) => call[1].session_id);
      expect(new Set(sessionIds).size).toBe(1);
    });
  });

  describe('Sampling', () => {
    it('should apply 0.1% sampling to card impressions', async () => {
      setConsent({ analytics: true, marketing: false, functional: true });
      analytics.initialize({ enabled: true, apiKey: 'test_key' });

      // Mock Math.random to control sampling
      const originalRandom = Math.random;
      let callCount = 0;

      // First call passes (0.0001 < 0.001)
      // Second call fails (0.999 > 0.001)
      Math.random = () => {
        callCount++;
        return callCount === 1 ? 0.0001 : 0.999;
      };

      const { trackCardImpression } = await import('@/lib/analytics/tracker');

      // First impression should track
      await trackCardImpression({
        opportunityId: 'opp_1',
        opportunityType: 'airdrop',
        trustLevel: 'green',
        position: 0,
        isSponsored: false,
        isFeatured: false,
      });

      expect(posthog.capture).toHaveBeenCalledTimes(1);

      // Second impression should not track
      await trackCardImpression({
        opportunityId: 'opp_2',
        opportunityType: 'airdrop',
        trustLevel: 'green',
        position: 1,
        isSponsored: false,
        isFeatured: false,
      });

      expect(posthog.capture).toHaveBeenCalledTimes(1); // Still 1

      Math.random = originalRandom;
    });
  });
});
