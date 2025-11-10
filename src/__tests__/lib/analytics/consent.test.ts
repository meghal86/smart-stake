/**
 * Tests for consent management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getConsent,
  setConsent,
  clearConsent,
  isAnalyticsAllowed,
  hasExplicitDenial,
  shouldShowConsentBanner,
} from '@/lib/analytics/consent';

describe('Analytics Consent Management', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset DNT
    Object.defineProperty(navigator, 'doNotTrack', {
      writable: true,
      value: '0',
    });
  });

  describe('getConsent', () => {
    it('should return null when no consent stored', () => {
      expect(getConsent()).toBeNull();
    });

    it('should return stored consent', () => {
      const consent = {
        analytics: true,
        marketing: false,
        functional: true,
      };

      setConsent(consent);
      expect(getConsent()).toEqual(consent);
    });

    it('should return null for invalid version', () => {
      localStorage.setItem(
        'alphawhale_consent',
        JSON.stringify({
          version: '0.9',
          timestamp: new Date().toISOString(),
          state: { analytics: true, marketing: false, functional: true },
        })
      );

      expect(getConsent()).toBeNull();
    });

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('alphawhale_consent', 'invalid json');
      expect(getConsent()).toBeNull();
    });
  });

  describe('setConsent', () => {
    it('should store consent with version and timestamp', () => {
      const consent = {
        analytics: true,
        marketing: false,
        functional: true,
      };

      setConsent(consent);

      const stored = localStorage.getItem('alphawhale_consent');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.version).toBe('1.0');
      expect(parsed.timestamp).toBeTruthy();
      expect(parsed.state).toEqual(consent);
    });

    it('should overwrite existing consent', () => {
      setConsent({ analytics: true, marketing: false, functional: true });
      setConsent({ analytics: false, marketing: false, functional: false });

      const consent = getConsent();
      expect(consent?.analytics).toBe(false);
    });
  });

  describe('clearConsent', () => {
    it('should remove consent from storage', () => {
      setConsent({ analytics: true, marketing: false, functional: true });
      expect(getConsent()).toBeTruthy();

      clearConsent();
      expect(getConsent()).toBeNull();
    });
  });

  describe('isAnalyticsAllowed', () => {
    it('should return false when DNT is enabled', () => {
      Object.defineProperty(navigator, 'doNotTrack', {
        writable: true,
        value: '1',
      });

      setConsent({ analytics: true, marketing: false, functional: true });
      expect(isAnalyticsAllowed()).toBe(false);
    });

    it('should return false when no consent given', () => {
      expect(isAnalyticsAllowed()).toBe(false);
    });

    it('should return false when analytics consent is false', () => {
      setConsent({ analytics: false, marketing: false, functional: true });
      expect(isAnalyticsAllowed()).toBe(false);
    });

    it('should return true when analytics consent is true and DNT is off', () => {
      setConsent({ analytics: true, marketing: false, functional: true });
      expect(isAnalyticsAllowed()).toBe(true);
    });
  });

  describe('hasExplicitDenial', () => {
    it('should return false when no consent stored', () => {
      expect(hasExplicitDenial()).toBe(false);
    });

    it('should return true when analytics explicitly denied', () => {
      setConsent({ analytics: false, marketing: false, functional: false });
      expect(hasExplicitDenial()).toBe(true);
    });

    it('should return false when analytics allowed', () => {
      setConsent({ analytics: true, marketing: false, functional: true });
      expect(hasExplicitDenial()).toBe(false);
    });
  });

  describe('shouldShowConsentBanner', () => {
    it('should return true when no consent stored', () => {
      expect(shouldShowConsentBanner()).toBe(true);
    });

    it('should return false when consent already given', () => {
      setConsent({ analytics: true, marketing: false, functional: true });
      expect(shouldShowConsentBanner()).toBe(false);
    });

    it('should return false when consent explicitly denied', () => {
      setConsent({ analytics: false, marketing: false, functional: false });
      expect(shouldShowConsentBanner()).toBe(false);
    });
  });
});
