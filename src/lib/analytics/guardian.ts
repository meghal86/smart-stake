/**
 * Guardian Analytics Tracking
 * Event tracking for user actions, performance, and conversions
 */

// Event types
export enum GuardianEvent {
  // Scan lifecycle
  SCAN_STARTED = 'guardian_scan_started',
  SCAN_COMPLETED = 'guardian_scan_completed',
  SCAN_FAILED = 'guardian_scan_failed',
  RESCAN_REQUESTED = 'guardian_rescan_requested',

  // Wallet connection
  WALLET_CONNECTED = 'guardian_wallet_connected',
  WALLET_DISCONNECTED = 'guardian_wallet_disconnected',

  // Revoke actions
  REVOKE_MODAL_OPENED = 'guardian_revoke_modal_opened',
  REVOKE_MODAL_CLOSED = 'guardian_revoke_modal_closed',
  REVOKE_APPROVALS_SELECTED = 'guardian_revoke_approvals_selected',
  REVOKE_EXECUTED = 'guardian_revoke_executed',
  REVOKE_SUCCESS = 'guardian_revoke_success',
  REVOKE_FAILED = 'guardian_revoke_failed',

  // UI interactions
  TRUST_SCORE_VIEWED = 'guardian_trust_score_viewed',
  RISK_CARD_CLICKED = 'guardian_risk_card_clicked',
  VIEW_ALL_REPORTS = 'guardian_view_all_reports',

  // Performance
  SCAN_DURATION = 'guardian_scan_duration',
  TIME_TO_FIRST_RESULT = 'guardian_ttfr',

  // Errors
  API_ERROR = 'guardian_api_error',
  RATE_LIMIT_HIT = 'guardian_rate_limit_hit',
}

// Event properties
export interface GuardianEventProperties {
  // User context
  wallet_address?: string;
  network?: string;
  user_tier?: 'free' | 'pro' | 'premium';

  // Scan context
  scan_id?: string;
  trust_score?: number;
  confidence?: number;
  flags_count?: number;
  critical_flags?: number;
  scan_duration_ms?: number;
  ttfr_ms?: number;

  // Revoke context
  approvals_count?: number;
  approvals_revoked?: number;
  gas_estimate?: number;
  score_delta?: number;

  // Risk context
  risk_type?: 'mixer' | 'approval' | 'honeypot' | 'reputation';
  severity?: 'low' | 'medium' | 'high';

  // Error context
  error_message?: string;
  error_code?: string;
  http_status?: number;

  // Performance
  cache_hit?: boolean;
  request_id?: string;

  // Conversion
  is_first_scan?: boolean;
  cta_clicked?: 'rescan' | 'fix_approvals' | 'view_reports';
}

// Analytics provider interface
interface AnalyticsProvider {
  track(event: string, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  page(name: string, properties?: Record<string, unknown>): void;
}

// Simple console logger (development fallback)
class ConsoleAnalytics implements AnalyticsProvider {
  track(event: string, properties?: Record<string, unknown>) {
    console.log('[Analytics]', event, properties);
  }

  identify(userId: string, traits?: Record<string, unknown>) {
    console.log('[Analytics] Identify:', userId, traits);
  }

  page(name: string, properties?: Record<string, unknown>) {
    console.log('[Analytics] Page:', name, properties);
  }
}

// Segment/Mixpanel/Amplitude adapter (production)
class ProductionAnalytics implements AnalyticsProvider {
  track(event: string, properties?: Record<string, unknown>) {
    // @ts-expect-error - window.analytics is loaded by Segment snippet
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track(event, properties);
    }

    // Also send to internal metrics
    this.sendToMetrics(event, properties);
  }

  identify(userId: string, traits?: Record<string, unknown>) {
    // @ts-expect-error - window.analytics is loaded by Segment snippet
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.identify(userId, traits);
    }
  }

  page(name: string, properties?: Record<string, unknown>) {
    // @ts-expect-error - window.analytics is loaded by Segment snippet
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.page(name, properties);
    }
  }

  private sendToMetrics(event: string, properties?: Record<string, unknown>) {
    // Send to internal metrics endpoint for aggregation
    if (typeof window === 'undefined') return;

    navigator.sendBeacon?.(
      '/api/metrics',
      JSON.stringify({
        event,
        properties,
        timestamp: Date.now(),
      })
    );
  }
}

// Singleton instance
let analyticsInstance: AnalyticsProvider;

function getAnalytics(): AnalyticsProvider {
  if (!analyticsInstance) {
    const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
    analyticsInstance = isDev ? new ConsoleAnalytics() : new ProductionAnalytics();
  }
  return analyticsInstance;
}

// Public API
export const guardianAnalytics = {
  /**
   * Track a Guardian event
   */
  track(event: GuardianEvent, properties?: GuardianEventProperties) {
    const analytics = getAnalytics();

    // Enrich with default properties
    const enriched = {
      ...properties,
      feature: 'guardian',
      timestamp: Date.now(),
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    };

    analytics.track(event, enriched);
  },

  /**
   * Track scan started
   */
  scanStarted(walletAddress: string, network: string, isFirstScan: boolean = false) {
    this.track(GuardianEvent.SCAN_STARTED, {
      wallet_address: walletAddress,
      network,
      is_first_scan: isFirstScan,
    });
  },

  /**
   * Track scan completed
   */
  scanCompleted(
    walletAddress: string,
    trustScore: number,
    confidence: number,
    flagsCount: number,
    criticalFlags: number,
    durationMs: number,
    ttfrMs?: number,
    scanId?: string
  ) {
    this.track(GuardianEvent.SCAN_COMPLETED, {
      wallet_address: walletAddress,
      trust_score: trustScore,
      confidence,
      flags_count: flagsCount,
      critical_flags: criticalFlags,
      scan_duration_ms: durationMs,
      ttfr_ms: ttfrMs,
      scan_id: scanId,
    });
  },

  /**
   * Track scan failed
   */
  scanFailed(walletAddress: string, errorMessage: string, errorCode?: string) {
    this.track(GuardianEvent.SCAN_FAILED, {
      wallet_address: walletAddress,
      error_message: errorMessage,
      error_code: errorCode,
    });
  },

  /**
   * Track revoke modal opened
   */
  revokeModalOpened(approvalsCount: number) {
    this.track(GuardianEvent.REVOKE_MODAL_OPENED, {
      approvals_count: approvalsCount,
    });
  },

  /**
   * Track revoke executed
   */
  revokeExecuted(
    approvalsRevoked: number,
    gasEstimate: number,
    scoreDelta: number,
    walletAddress: string
  ) {
    this.track(GuardianEvent.REVOKE_EXECUTED, {
      approvals_revoked: approvalsRevoked,
      gas_estimate: gasEstimate,
      score_delta: scoreDelta,
      wallet_address: walletAddress,
    });
  },

  /**
   * Track risk card clicked
   */
  riskCardClicked(riskType: string, severity: string) {
    this.track(GuardianEvent.RISK_CARD_CLICKED, {
      risk_type: riskType as unknown,
      severity: severity as unknown,
    });
  },

  /**
   * Track API error
   */
  apiError(errorMessage: string, httpStatus: number, requestId?: string) {
    this.track(GuardianEvent.API_ERROR, {
      error_message: errorMessage,
      http_status: httpStatus,
      request_id: requestId,
    });
  },

  /**
   * Track performance metrics
   */
  performance(metricName: 'scan_duration' | 'ttfr', durationMs: number, cacheHit: boolean = false) {
    const event =
      metricName === 'scan_duration' ? GuardianEvent.SCAN_DURATION : GuardianEvent.TIME_TO_FIRST_RESULT;

    this.track(event, {
      [metricName === 'scan_duration' ? 'scan_duration_ms' : 'ttfr_ms']: durationMs,
      cache_hit: cacheHit,
    });
  },

  /**
   * Identify user
   */
  identify(walletAddress: string, userTier: 'free' | 'pro' | 'premium') {
    const analytics = getAnalytics();
    analytics.identify(walletAddress, {
      wallet_address: walletAddress,
      user_tier: userTier,
      feature_guardian_enabled: true,
    });
  },

  /**
   * Track page view
   */
  page(pageName: string, properties?: Record<string, unknown>) {
    const analytics = getAnalytics();
    analytics.page(pageName, {
      ...properties,
      feature: 'guardian',
    });
  },
};

// React hook for analytics
export function useGuardianAnalytics() {
  return guardianAnalytics;
}

/**
 * Higher-order function to track async operations
 */
export function withAnalytics<T>(
  operation: () => Promise<T>,
  eventName: GuardianEvent,
  properties?: GuardianEventProperties
): Promise<T> {
  const startTime = Date.now();

  return operation()
    .then((result) => {
      const duration = Date.now() - startTime;
      guardianAnalytics.track(eventName, {
        ...properties,
        scan_duration_ms: duration,
      });
      return result;
    })
    .catch((error) => {
      guardianAnalytics.apiError(error.message, error.status || 500);
      throw error;
    });
}

