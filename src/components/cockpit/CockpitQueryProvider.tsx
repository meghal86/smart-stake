/**
 * Cockpit Query Provider
 * 
 * Provides React Query context with risk-aware caching configuration for cockpit components.
 * Sets up performance monitoring and background sync for optimal user experience.
 * 
 * Requirements: 14.4, 14.5
 */

import React, { useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { 
  createCockpitQueryClient, 
  setupQueryPerformanceMonitoring 
} from '@/lib/cockpit/query-client';

// ============================================================================
// Types
// ============================================================================

interface CockpitQueryProviderProps {
  children: React.ReactNode;
  /** Enable React Query devtools (development only) */
  enableDevtools?: boolean;
  /** Custom query client (for testing) */
  queryClient?: QueryClient;
}

// ============================================================================
// Provider Component
// ============================================================================

export const CockpitQueryProvider: React.FC<CockpitQueryProviderProps> = ({
  children,
  enableDevtools = process.env.NODE_ENV === 'development',
  queryClient: customQueryClient,
}) => {
  // Create or use provided query client
  const queryClient = useMemo(() => {
    if (customQueryClient) {
      return customQueryClient;
    }
    
    const client = createCockpitQueryClient();
    
    // Setup performance monitoring in development
    if (process.env.NODE_ENV === 'development') {
      setupQueryPerformanceMonitoring(client);
    }
    
    return client;
  }, [customQueryClient]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all queries on unmount to prevent memory leaks
      queryClient.clear();
    };
  }, [queryClient]);
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {enableDevtools && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
};

// ============================================================================
// Hook for accessing query client
// ============================================================================

/**
 * Hook to access the cockpit query client
 * Provides type-safe access to query client with cockpit-specific methods
 */
export const useCockpitQueryClient = () => {
  const queryClient = useQueryClient();
  
  return useMemo(() => ({
    // Standard query client methods
    ...queryClient,
    
    // Cockpit-specific helpers
    invalidateCockpitData: (userId: string) => {
      return queryClient.invalidateQueries({
        queryKey: ['cockpit'],
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key.includes(userId);
        },
      });
    },
    
    getCockpitCacheSize: () => {
      const cache = queryClient.getQueryCache();
      const cockpitQueries = cache.findAll({
        queryKey: ['cockpit'],
        exact: false,
      });
      return cockpitQueries.length;
    },
    
    getCockpitCacheStats: () => {
      const cache = queryClient.getQueryCache();
      const cockpitQueries = cache.findAll({
        queryKey: ['cockpit'],
        exact: false,
      });
      
      const stats = {
        totalQueries: cockpitQueries.length,
        staleQueries: 0,
        errorQueries: 0,
        loadingQueries: 0,
        successQueries: 0,
      };
      
      cockpitQueries.forEach(query => {
        if (query.state.error) stats.errorQueries++;
        else if (query.state.isFetching) stats.loadingQueries++;
        else if (query.state.data) stats.successQueries++;
        
        if (query.isStale()) stats.staleQueries++;
      });
      
      return stats;
    },
  }), [queryClient]);
};

// ============================================================================
// Performance Monitoring Hook
// ============================================================================

/**
 * Hook for monitoring cockpit query performance
 * Provides real-time cache statistics and performance metrics
 */
export const useCockpitPerformanceMonitor = () => {
  const queryClient = useCockpitQueryClient();
  const [metrics, setMetrics] = React.useState({
    cacheHitRate: 0,
    averageResponseTime: 0,
    totalQueries: 0,
    errorRate: 0,
  });
  
  useEffect(() => {
    const updateMetrics = () => {
      const stats = queryClient.getCockpitCacheStats();
      const cache = queryClient.getQueryCache();
      
      // Calculate metrics
      const totalQueries = stats.totalQueries;
      const errorRate = totalQueries > 0 ? (stats.errorQueries / totalQueries) * 100 : 0;
      
      // Get cache hit rate from query cache
      const queries = cache.findAll({ queryKey: ['cockpit'], exact: false });
      let cacheHits = 0;
      let totalResponseTime = 0;
      
      queries.forEach(query => {
        if (query.state.data && !query.state.isFetching) {
          cacheHits++;
        }
        
        // Estimate response time based on data freshness
        if (query.state.dataUpdatedAt) {
          const responseTime = Date.now() - query.state.dataUpdatedAt;
          totalResponseTime += responseTime;
        }
      });
      
      const cacheHitRate = totalQueries > 0 ? (cacheHits / totalQueries) * 100 : 0;
      const averageResponseTime = totalQueries > 0 ? totalResponseTime / totalQueries : 0;
      
      setMetrics({
        cacheHitRate,
        averageResponseTime,
        totalQueries,
        errorRate,
      });
    };
    
    // Update metrics every 5 seconds in development
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(updateMetrics, 5000);
      updateMetrics(); // Initial update
      
      return () => clearInterval(interval);
    }
  }, [queryClient]);
  
  return metrics;
};

export default CockpitQueryProvider;