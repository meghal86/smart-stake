/**
 * Cookie Consent Management
 * 
 * Manages user consent for analytics tracking.
 * Requirements: 10.13, 10.14
 */

import type { ConsentState } from './types';

const CONSENT_KEY = 'alphawhale_consent';
const CONSENT_VERSION = '1.0';

export interface StoredConsent {
  version: string;
  timestamp: string;
  state: ConsentState;
}

/**
 * Get current consent state from localStorage
 */
export function getConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;

    const parsed: StoredConsent = JSON.parse(stored);
    
    // Check version compatibility
    if (parsed.version !== CONSENT_VERSION) {
      return null;
    }

    return parsed.state;
  } catch (error) {
    console.error('Failed to parse consent state:', error);
    return null;
  }
}

/**
 * Set consent state
 */
export function setConsent(state: ConsentState): void {
  if (typeof window === 'undefined') return;

  const stored: StoredConsent = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    state,
  };

  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(stored));
  } catch (error) {
    console.error('Failed to store consent state:', error);
  }
}

/**
 * Clear consent state
 */
export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CONSENT_KEY);
}

/**
 * Check if analytics is allowed based on consent and DNT
 */
export function isAnalyticsAllowed(): boolean {
  // Check Do Not Track header
  if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') {
    return false;
  }

  // Check consent
  const consent = getConsent();
  if (!consent) {
    // Default to false if no consent given
    return false;
  }

  return consent.analytics === true;
}

/**
 * Check if user has explicitly denied consent
 */
export function hasExplicitDenial(): boolean {
  const consent = getConsent();
  return consent !== null && consent.analytics === false;
}

/**
 * Check if consent banner should be shown
 */
export function shouldShowConsentBanner(): boolean {
  return getConsent() === null;
}
