/**
 * Cockpit Query Client Configuration
 * 
 * Configures React Query with risk-aware caching and performance optimizations.
 * Implements SWR patterns with TTL values based on Today Card risk levels.
 * 
 * Requirements: 14.4, 14.5
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { trackCachePerformance, shouldInvalidateCache } from './cache';
import type { TodayCardKind } from './types';

// ============================================================================
// Query Client Configuration
// ============================================================================

/**
 * Create optimized query client for cockpit data
 */
export const createCockpitQueryClient = () => {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        console.error('Query error:', error, 'Query key:', query.queryKey);
        trackCachePerformance('miss', query.queryKey.join(':'));
      },
      onSuccess: (data, query) => {
        trackCachePerformance('hit', query.queryKey.join(':'));
      },
    }),
    
    mutationCache: new MutationCache({
      onError: (error, variables, context, mutation) => {
        console.error('Mutation error:', error, 'Variables:', variables);
      },
    }),
    
    defaultOptions: {
      queries: {
        // Global query defaults
        staleTime: 30 * 1000,        // 30 seconds default
        gcTime: 5 * 60 * 1000,       // 5 minutes garbage collection
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry up to 3 times for network/server errors
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      
      mutations: {
        // Global mutation defaults
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
};

// ============================================================================
// Cache Invalidation Strategies
// ============================================================================

/**
 * Invalidate cache based on risk state changes
 */
export const invalidateCockpitCache = async (
  queryClient: QueryClient,
  userId: string,
  newTodayCardKind: TodayCardKind,
  previousTodayCardKind?: TodayCardKind
) => {
  if (shouldInvalidateCache(newTodayCardKind, previousTodayCardKind)) {
    // Invalidate summary cache for this user
    await queryClient.invalidateQueries({
      queryKey: ['cockpit', 'summary', userId],
      exact: false, // Invalidate all wallet scopes
    });
    
    // If moving to critical risk, also invalidate related data
    if (newTodayCardKind === 'critical_risk') {
      await queryClient.invalidateQueries({
        queryKey: ['cockpit', 'pulse', userId],
        exact: false,
      });
    }
    
    trackCachePerformance('invalidate', `risk-change:${previousTodayCardKind}->${newTodayCardKind}`);
  }
};

/**
 * Selective cache invalidation for specific data types
 */
export const invalidateSpecificCache = async (
  queryClient: QueryClient,
  userId: string,
  cacheType: 'summary' | 'preferences' | 'pulse' | 'investments'
) => {
  const queryKey = ['cockpit', cacheType, userId];
  
  await queryClient.invalidateQueries({
    queryKey,
    exact: false,
  });
  
  trackCachePerformance('invalidate', `${cacheType}:${userId}`);
};

/**
 * Optimistic updates for mutations
 */
export const updateCacheOptimistically = <T>(
  queryClient: QueryClient,
  queryKey: (string | null)[],
  updater: (oldData: T | undefined) => T
) => {
  queryClient.setQueryData(queryKey, updater);
  
  // Invalidate to ensure consistency
  setTimeout(() => {
    queryClient.invalidateQueries({ queryKey, exact: true });
  }, 100);
};

// ============================================================================
// Performance Monitoring
// ============================================================================

/**
 * Monitor query performance and cache efficiency
 */
export const setupQueryPerformanceMonitoring = (queryClient: QueryClient) => {
  // Track cache hit/miss ratios
  let cacheHits = 0;
  let cacheMisses = 0;
  let totalQueries = 0;
  
  const originalFetch = queryClient.getQueryCache().build;
  
  // Override query cache to track performance
  queryClient.getQueryCache().build = function(client, options, state) {
    totalQueries++;
    
    const query = originalFetch.call(this, client, options, state);
    
    // Track if data was served from cache
    const originalFetchFn = query.fetch;
    query.fetch = function(...args) {
      const startTime = Date.now();
      
      // Check if we have cached data
      const hasCachedData = query.state.data !== undefined;
      
      if (hasCachedData && !query.isStale()) {
        cacheHits++;
        trackCachePerformance('hit', query.queryKey.join(':'), Date.now() - startTime);
      } else {
        cacheMisses++;
        trackCachePerformance('miss', query.queryKey.join(':'), Date.now() - startTime);
      }
      
      return originalFetchFn.apply(this, args);
    };
    
    return query;
  };
  
  // Log performance metrics periodically in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const hitRate = totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0;
      console.debug('Cache Performance:', {
        hitRate: `${hitRate.toFixed(1)}%`,
        hits: cacheHits,
        misses: cacheMisses,
        total: totalQueries,
      });
    }, 30000); // Log every 30 seconds
  }
};

// ============================================================================
// Background Sync
// ============================================================================

/**
 * Setup background sync for critical data
 */
export const setupBackgroundSync = (
  queryClient: QueryClient,
  userId: string,
  todayCardKind: TodayCardKind
) => {
  // Only setup background sync for high-risk states
  if (todayCardKind === 'critical_risk' || todayCardKind === 'scan_required') {
    const interval = todayCardKind === 'critical_risk' ? 15000 : 20000; // 15s or 20s
    
    const syncInterval = setInterval(() => {
      // Refetch summary data in background
      queryClient.refetchQueries({
        queryKey: ['cockpit', 'summary', userId],
        type: 'active',
      });
    }, interval);
    
    // Return cleanup function
    return () => clearInterval(syncInterval);
  }
  
  return () => {}; // No-op cleanup for non-critical states
};

// ============================================================================
// Exports
// ============================================================================

export default {
  createCockpitQueryClient,
  invalidateCockpitCache,
  invalidateSpecificCache,
  updateCacheOptimistically,
  setupQueryPerformanceMonitoring,
  setupBackgroundSync,
};