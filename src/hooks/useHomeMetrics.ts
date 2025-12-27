/**
 * useHomeMetrics Hook
 * 
 * Manages data fetching for the AlphaWhale Home page metrics.
 * Handles demo vs live data switching, error recovery, and retry logic.
 * 
 * Requirements:
 * - 7.1: Fetch data from /api/home-metrics endpoint
 * - 7.2: Ensure data freshness < 5 minutes
 * - System Req 14.1-14.8: API resilience, retry logic, JWT handling
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useHomeAuth } from '@/lib/context/HomeAuthContext';
import { getDemoMetrics } from '@/lib/services/demoDataService';
import { HomeMetrics } from '@/types/home';
import { ERROR_MESSAGES } from '@/lib/constants/errorMessages';

interface UseHomeMetricsOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
  staleTime?: number;
}

/**
 * Data freshness status
 * - current: < 2 minutes old
 * - stale: 2-5 minutes old
 * - outdated: > 5 minutes old
 */
export type FreshnessStatus = 'current' | 'stale' | 'outdated';

interface UseHomeMetricsReturn extends Omit<UseQueryResult<HomeMetrics, Error>, 'data'> {
  metrics: HomeMetrics | undefined;
  isDemo: boolean;
  isFresh: boolean;
  freshnessStatus: FreshnessStatus;
  dataAge: number | null; // Age in minutes
  manualRefresh: () => void;
}

/**
 * Hook for fetching home page metrics
 * 
 * Automatically switches between demo and live data based on authentication state.
 * Implements exponential backoff retry logic and handles JWT expiration.
 * 
 * @param {UseHomeMetricsOptions} options - Configuration options
 * @returns {UseHomeMetricsReturn} Metrics data and query state
 * 
 * @example
 * ```tsx
 * const { metrics, isLoading, isDemo, manualRefresh } = useHomeMetrics();
 * 
 * if (isLoading) return <Skeleton />;
 * if (metrics) return <FeatureCard value={metrics.guardianScore} isDemo={isDemo} />;
 * ```
 */
export const useHomeMetrics = (
  options?: UseHomeMetricsOptions
): UseHomeMetricsReturn => {
  const { isAuthenticated } = useHomeAuth();
  
  const query = useQuery<HomeMetrics, Error>({
    queryKey: ['homeMetrics', isAuthenticated],
    queryFn: async (): Promise<HomeMetrics> => {
      // Demo mode: return instantly without API call
      if (!isAuthenticated) {
        return getDemoMetrics();
      }
      
      // Live mode: fetch from API with retry logic
      try {
        const response = await fetch('/api/home-metrics', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include httpOnly cookies for JWT
        });
        
        // Handle 401 Unauthorized (JWT expired)
        // System Req 14.6: Handle JWT expiration gracefully
        if (response.status === 401) {
          console.warn('JWT expired, reverting to demo mode');
          
          // Clear expired JWT cookie
          document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
          
          // Return demo metrics instead of throwing error
          return getDemoMetrics();
        }
        
        // Handle other HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error?.message || 
            `API error: ${response.status} ${response.statusText}`
          );
        }
        
        // Parse response
        const result = await response.json();
        
        // Validate response structure
        if (!result.data) {
          throw new Error('Invalid API response: missing data field');
        }
        
        return result.data as HomeMetrics;
      } catch (err) {
        // Log error for monitoring
        console.error('Failed to fetch live metrics:', err);
        
        // Re-throw to trigger React Query retry logic
        throw err instanceof Error 
          ? err 
          : new Error(ERROR_MESSAGES.API_FAILED);
      }
    },
    
    // Query configuration
    enabled: options?.enabled !== false,
    
    // Stale time: how long data is considered fresh
    // Demo: Infinity (never stale, no refetch needed)
    // Live: 60 seconds (refetch after 1 minute)
    staleTime: options?.staleTime ?? (isAuthenticated ? 60 * 1000 : Infinity),
    
    // Refetch interval: automatic background refetch
    // Demo: false (no polling)
    // Live: 30 seconds (poll every 30s for fresh data)
    refetchInterval: options?.refetchInterval ?? (isAuthenticated ? 30 * 1000 : false),
    
    // Retry configuration with exponential backoff
    // System Req 14.5: Retry with exponential backoff
    retry: (failureCount, error) => {
      // Don't retry on 401 (JWT expired) - we already handled it
      if (error.message?.includes('401')) {
        return false;
      }
      
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    
    // Exponential backoff: 1s, 2s, 4s, max 30s
    retryDelay: (attemptIndex) => {
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    },
    
    // Keep previous data while refetching
    // System Req 14.10: Show cached data during refetch
    placeholderData: (previousData) => previousData,
    
    // Refetch on window focus (user returns to tab)
    refetchOnWindowFocus: isAuthenticated,
    
    // Refetch on reconnect (network comes back online)
    refetchOnReconnect: isAuthenticated,
  });
  
  // Calculate data age in minutes
  // System Req 18.1: Timestamp comparison logic
  const dataAge = (() => {
    if (!query.data?.lastUpdated) return null;
    
    const lastUpdated = new Date(query.data.lastUpdated);
    const now = new Date();
    const ageInMs = now.getTime() - lastUpdated.getTime();
    const ageInMinutes = ageInMs / (1000 * 60);
    
    return ageInMinutes;
  })();
  
  // Determine freshness status
  // System Req 18.2: Return freshness status (current, stale, outdated)
  const freshnessStatus: FreshnessStatus = (() => {
    if (dataAge === null) return 'outdated';
    
    if (dataAge < 2) return 'current';      // < 2 minutes: current
    if (dataAge < 5) return 'stale';        // 2-5 minutes: stale
    return 'outdated';                       // > 5 minutes: outdated
  })();
  
  // Determine if data is fresh (< 5 minutes old)
  // Requirement 7.2: Data freshness < 5 minutes
  const isFresh = freshnessStatus !== 'outdated';
  
  // Manual refresh function
  // System Req 18.3: Implement manual refresh functionality
  const manualRefresh = () => {
    query.refetch();
  };
  
  return {
    ...query,
    metrics: query.data,
    isDemo: query.data?.isDemo ?? true,
    isFresh,
    freshnessStatus,
    dataAge,
    manualRefresh,
  };
};

/**
 * Hook for checking if metrics are stale
 * 
 * @param {HomeMetrics | undefined} metrics - Metrics to check
 * @returns {boolean} True if metrics are stale (> 5 minutes old)
 */
export const useIsMetricsStale = (metrics: HomeMetrics | undefined): boolean => {
  if (!metrics?.lastUpdated) return true;
  
  const lastUpdated = new Date(metrics.lastUpdated);
  const now = new Date();
  const ageInMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
  
  return ageInMinutes >= 5;
};

/**
 * Get freshness status from metrics
 * 
 * System Req 18.4: Freshness status calculation
 * 
 * @param {HomeMetrics | undefined} metrics - Metrics to check
 * @returns {FreshnessStatus} Freshness status
 */
export const getFreshnessStatus = (metrics: HomeMetrics | undefined): FreshnessStatus => {
  if (!metrics?.lastUpdated) return 'outdated';
  
  const lastUpdated = new Date(metrics.lastUpdated);
  const now = new Date();
  const ageInMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
  
  if (ageInMinutes < 2) return 'current';
  if (ageInMinutes < 5) return 'stale';
  return 'outdated';
};

/**
 * Get human-readable freshness message
 * 
 * System Req 18.5: User-friendly freshness indicators
 * 
 * @param {FreshnessStatus} status - Freshness status
 * @param {number | null} dataAge - Age in minutes
 * @returns {string} Human-readable message
 */
export const getFreshnessMessage = (
  status: FreshnessStatus,
  dataAge: number | null
): string => {
  if (dataAge === null) {
    return 'Data unavailable';
  }
  
  switch (status) {
    case 'current': {
      if (dataAge < 0.083) { // Less than 5 seconds
        return 'Just now';
      }
      if (dataAge < 1) { // Less than 1 minute
        const seconds = Math.floor(dataAge * 60);
        return `${seconds}s ago`;
      }
      const minutes = Math.floor(dataAge);
      return `${minutes}m ago`;
    }
    
    case 'stale':
      return `${Math.floor(dataAge)}m ago`;
    
    case 'outdated': {
      const minutes = Math.floor(dataAge);
      if (dataAge < 60) {
        return `${minutes}m ago (outdated)`;
      }
      const hours = Math.floor(dataAge / 60);
      return `${hours}h ago (outdated)`;
    }
    
    default:
      return 'Unknown';
  }
};

/**
 * Get freshness indicator color
 * 
 * System Req 18.6: Visual freshness indicators
 * 
 * @param {FreshnessStatus} status - Freshness status
 * @returns {string} Tailwind color class
 */
export const getFreshnessColor = (status: FreshnessStatus): string => {
  switch (status) {
    case 'current':
      return 'text-green-500';
    case 'stale':
      return 'text-yellow-500';
    case 'outdated':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

