/**
 * Risk-Aware Caching System
 * 
 * Implements SWR (stale-while-revalidate) caching with TTL values based on risk level.
 * Higher risk states have shorter cache times to ensure fresh data.
 * 
 * Requirements: 14.4, 14.5
 */

import { TodayCardKind } from '@/lib/cockpit/types';

// ============================================================================
// Cache Configuration
// ============================================================================

/**
 * Risk-aware TTL values in seconds
 * Higher risk = shorter cache time for fresher data
 */
export const CACHE_TTL = {
  // Critical states - very short cache
  critical_risk: 10,     // 10 seconds
  scan_required: 15,     // 15 seconds
  
  // Active states - short cache
  pending_actions: 20,   // 20 seconds
  
  // Healthy states - longer cache
  daily_pulse: 60,       // 60 seconds
  portfolio_anchor: 60,  // 60 seconds
  onboarding: 60,        // 60 seconds (stable state)
} as const;

/**
 * Default cache settings for different data types
 */
export const DEFAULT_CACHE_CONFIG = {
  // Cockpit summary - uses risk-aware TTL
  summary: {
    staleTime: 0, // Always consider stale, let TTL handle freshness
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
  
  // User preferences - stable data
  preferences: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  
  // Daily pulse - timezone-dependent
  pulse: {
    staleTime: 60 * 1000,     // 1 minute
    gcTime: 10 * 60 * 1000,   // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
  
  // Investment data - user-specific
  investments: {
    staleTime: 30 * 1000,     // 30 seconds
    gcTime: 5 * 60 * 1000,    // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
} as const;

// ============================================================================
// Cache Key Generators
// ============================================================================

/**
 * Generate cache key for cockpit summary
 */
export const getCockpitSummaryKey = (
  userId: string | null,
  walletScope: 'active' | 'all',
  isDemo: boolean = false
) => {
  if (isDemo) {
    return ['cockpit', 'summary', 'demo', walletScope];
  }
  return ['cockpit', 'summary', userId, walletScope];
};

/**
 * Generate cache key for user preferences
 */
export const getCockpitPreferencesKey = (
  userId: string | null,
  isDemo: boolean = false
) => {
  if (isDemo) {
    return ['cockpit', 'preferences', 'demo'];
  }
  return ['cockpit', 'preferences', userId];
};

/**
 * Generate cache key for daily pulse
 */
export const getDailyPulseKey = (
  userId: string | null,
  date: string,
  isDemo: boolean = false
) => {
  if (isDemo) {
    return ['cockpit', 'pulse', 'demo', date];
  }
  return ['cockpit', 'pulse', userId, date];
};

/**
 * Generate cache key for investment data
 */
export const getInvestmentKey = (
  userId: string | null,
  type: 'save' | 'bookmark' | 'alert_rules',
  isDemo: boolean = false
) => {
  if (isDemo) {
    return ['cockpit', 'investments', 'demo', type];
  }
  return ['cockpit', 'investments', userId, type];
};

// ============================================================================
// Risk-Aware Cache Configuration
// ============================================================================

/**
 * Get cache configuration based on Today Card risk level
 */
export const getRiskAwareCacheConfig = (todayCardKind?: TodayCardKind) => {
  const baseTTL = todayCardKind ? CACHE_TTL[todayCardKind] : CACHE_TTL.daily_pulse;
  
  return {
    ...DEFAULT_CACHE_CONFIG.summary,
    staleTime: baseTTL * 1000, // Convert to milliseconds
    // Refetch interval should be slightly longer than stale time
    refetchInterval: (baseTTL + 5) * 1000,
  };
};

/**
 * Get cache invalidation patterns for different risk states
 */
export const getCacheInvalidationConfig = (todayCardKind: TodayCardKind) => {
  switch (todayCardKind) {
    case 'critical_risk':
      return {
        // Critical risk: invalidate frequently, background refetch
        refetchInterval: 15 * 1000,
        refetchIntervalInBackground: true,
        refetchOnMount: true,
      };
      
    case 'scan_required':
      return {
        // Scan required: moderate refresh rate
        refetchInterval: 20 * 1000,
        refetchIntervalInBackground: true,
        refetchOnMount: true,
      };
      
    case 'pending_actions':
      return {
        // Pending actions: regular refresh
        refetchInterval: 30 * 1000,
        refetchIntervalInBackground: false,
        refetchOnMount: true,
      };
      
    default:
      return {
        // Healthy states: less frequent refresh
        refetchInterval: 60 * 1000,
        refetchIntervalInBackground: false,
        refetchOnMount: false,
      };
  }
};

// ============================================================================
// Cache Utilities
// ============================================================================

/**
 * Check if data should be considered stale based on risk level
 */
export const isDataStale = (
  lastFetch: number,
  todayCardKind?: TodayCardKind
): boolean => {
  const now = Date.now();
  const ttl = todayCardKind ? CACHE_TTL[todayCardKind] : CACHE_TTL.daily_pulse;
  return (now - lastFetch) > (ttl * 1000);
};

/**
 * Get next refetch time based on risk level
 */
export const getNextRefetchTime = (
  todayCardKind?: TodayCardKind
): number => {
  const ttl = todayCardKind ? CACHE_TTL[todayCardKind] : CACHE_TTL.daily_pulse;
  return Date.now() + (ttl * 1000);
};

/**
 * Cache invalidation helper
 */
export const shouldInvalidateCache = (
  currentKind: TodayCardKind,
  previousKind?: TodayCardKind
): boolean => {
  // Always invalidate if risk level changed
  if (previousKind && currentKind !== previousKind) {
    return true;
  }
  
  // Invalidate if moving to higher risk state
  const riskLevels = {
    portfolio_anchor: 0,
    daily_pulse: 1,
    onboarding: 1,
    pending_actions: 2,
    scan_required: 3,
    critical_risk: 4,
  };
  
  if (previousKind) {
    return riskLevels[currentKind] > riskLevels[previousKind];
  }
  
  return false;
};

// ============================================================================
// Performance Monitoring
// ============================================================================

/**
 * Cache performance metrics
 */
export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  avgResponseTime: number;
  totalRequests: number;
  cacheSize: number;
}

/**
 * Track cache performance (for monitoring)
 */
export const trackCachePerformance = (
  operation: 'hit' | 'miss' | 'invalidate',
  key: string,
  responseTime?: number
) => {
  // In production, this would send metrics to monitoring service
  if (process.env.NODE_ENV === 'development') {
    console.debug(`Cache ${operation}:`, {
      key,
      responseTime,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Cache warming utility for critical data
 */
export const warmCache = async (
  queryClient: any,
  userId: string,
  walletScope: 'active' | 'all'
) => {
  // Pre-fetch critical data to warm the cache
  const summaryKey = getCockpitSummaryKey(userId, walletScope);
  const prefsKey = getCockpitPreferencesKey(userId);
  
  try {
    // Prefetch in parallel without waiting
    queryClient.prefetchQuery({
      queryKey: summaryKey,
      staleTime: 0, // Force fresh fetch for warming
    });
    
    queryClient.prefetchQuery({
      queryKey: prefsKey,
      staleTime: 0,
    });
    
    trackCachePerformance('warm', `${summaryKey.join(':')},${prefsKey.join(':')}`);
  } catch (error) {
    console.warn('Cache warming failed:', error);
  }
};

export default {
  CACHE_TTL,
  DEFAULT_CACHE_CONFIG,
  getCockpitSummaryKey,
  getCockpitPreferencesKey,
  getDailyPulseKey,
  getInvestmentKey,
  getRiskAwareCacheConfig,
  getCacheInvalidationConfig,
  isDataStale,
  getNextRefetchTime,
  shouldInvalidateCache,
  trackCachePerformance,
  warmCache,
};