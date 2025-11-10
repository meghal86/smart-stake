/**
 * Analytics Client
 * 
 * Main analytics client using PostHog for event tracking.
 * Requirements: 10.1-10.14
 */

import posthog from 'posthog-js';
import type { AnalyticsConfig, AnalyticsEvent } from './types';
import { isAnalyticsAllowed } from './consent';
import { hashWalletAddress, sanitizeEventProperties } from './hash';

class AnalyticsClient {
  private initialized = false;
  private config: AnalyticsConfig = {
    enabled: false,
    debug: false,
    respectDNT: true,
    sessionReplay: false,
    capturePageview: false,
  };

  /**
   * Initialize the analytics client
   */
  initialize(config: Partial<AnalyticsConfig>): void {
    if (this.initialized) {
      console.warn('Analytics client already initialized');
      return;
    }

    this.config = { ...this.config, ...config };

    // Don't initialize if disabled or no API key
    if (!this.config.enabled || !this.config.apiKey) {
      console.log('Analytics disabled or no API key provided');
      return;
    }

    // Check consent before initializing
    if (!isAnalyticsAllowed()) {
      console.log('Analytics not allowed by user consent or DNT');
      return;
    }

    try {
      posthog.init(this.config.apiKey, {
        api_host: this.config.apiHost || 'https://app.posthog.com',
        loaded: (posthog) => {
          if (this.config.debug) {
            console.log('PostHog loaded successfully');
          }
        },
        capture_pageview: this.config.capturePageview || false,
        capture_pageleave: true,
        session_recording: {
          enabled: this.config.sessionReplay || false,
        },
        autocapture: false, // We'll manually track events
        disable_session_recording: !this.config.sessionReplay,
        respect_dnt: this.config.respectDNT,
        opt_out_capturing_by_default: false,
        persistence: 'localStorage',
      });

      this.initialized = true;
      
      if (this.config.debug) {
        console.log('Analytics client initialized');
      }
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  /**
   * Check if analytics is ready to track events
   */
  private isReady(): boolean {
    if (!this.initialized) {
      if (this.config.debug) {
        console.log('Analytics not initialized');
      }
      return false;
    }

    if (!isAnalyticsAllowed()) {
      if (this.config.debug) {
        console.log('Analytics not allowed by consent');
      }
      return false;
    }

    return true;
  }

  /**
   * Track an analytics event
   */
  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.isReady()) return;

    try {
      // Sanitize properties to ensure no plain wallet addresses
      const sanitizedProperties = sanitizeEventProperties(event.properties);

      // Add user_id_hash if present
      if (event.user_id_hash) {
        sanitizedProperties.user_id_hash = event.user_id_hash;
      }

      // Add session_id
      sanitizedProperties.session_id = event.session_id;

      posthog.capture(event.event, sanitizedProperties);

      if (this.config.debug) {
        console.log('Analytics event tracked:', event.event, sanitizedProperties);
      }
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }

  /**
   * Identify a user (with hashed wallet address)
   */
  async identify(walletAddress: string): Promise<void> {
    if (!this.isReady()) return;

    try {
      const hashedAddress = await hashWalletAddress(walletAddress);
      posthog.identify(hashedAddress);

      if (this.config.debug) {
        console.log('User identified with hashed address');
      }
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  }

  /**
   * Reset user identity (on disconnect)
   */
  reset(): void {
    if (!this.isReady()) return;

    try {
      posthog.reset();

      if (this.config.debug) {
        console.log('User identity reset');
      }
    } catch (error) {
      console.error('Failed to reset user identity:', error);
    }
  }

  /**
   * Opt out of analytics
   */
  optOut(): void {
    if (!this.initialized) return;

    try {
      posthog.opt_out_capturing();

      if (this.config.debug) {
        console.log('User opted out of analytics');
      }
    } catch (error) {
      console.error('Failed to opt out:', error);
    }
  }

  /**
   * Opt in to analytics
   */
  optIn(): void {
    if (!this.initialized) return;

    try {
      posthog.opt_in_capturing();

      if (this.config.debug) {
        console.log('User opted in to analytics');
      }
    } catch (error) {
      console.error('Failed to opt in:', error);
    }
  }

  /**
   * Shutdown the analytics client
   */
  shutdown(): void {
    if (!this.initialized) return;

    try {
      // PostHog doesn't have a shutdown method, but we can reset
      posthog.reset();
      this.initialized = false;

      if (this.config.debug) {
        console.log('Analytics client shutdown');
      }
    } catch (error) {
      console.error('Failed to shutdown analytics:', error);
    }
  }
}

// Export singleton instance
export const analytics = new AnalyticsClient();
