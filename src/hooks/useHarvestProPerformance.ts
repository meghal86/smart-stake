/**
 * React Hook for HarvestPro Performance Monitoring
 * 
 * Provides easy integration of performance monitoring in HarvestPro components
 * Requirements: Enhanced Req 17 AC1-3 (performance standards)
 */

import { useEffect, useCallback, useRef } from 'react';
import { harvestProPerformanceMonitor } from '@/lib/harvestpro/performance-monitor';

interface UseHarvestProPerformanceOptions {
  componentName: string;
  metadata?: Record<string, unknown>;
  trackRender?: boolean;
  trackInteractions?: boolean;
}

/**
 * Hook for monitoring HarvestPro component performance
 */
export function useHarvestProPerformance({
  componentName,
  metadata = {},
  trackRender = true,
  trackInteractions = true,
}: UseHarvestProPerformanceOptions) {
  const renderStart = useRef<number>(0);
  const interactionTimers = useRef<Map<string, number>>(new Map());

  // Track component render time
  useEffect(() => {
    if (!trackRender || typeof window === 'undefined') return;
    
    renderStart.current = performance.now();
    
    // Measure render time on next tick
    const timeoutId = setTimeout(() => {
      const renderTime = performance.now() - renderStart.current;
      harvestProPerformanceMonitor.recordMetric(
        `component:${componentName}:render`,
        renderTime,
        50, // 50ms threshold for component render
        { componentName, ...metadata }
      );
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [componentName, trackRender, metadata]);

  // Measure interaction performance
  const measureInteraction = useCallback((
    interactionName: string,
    fn: () => void | Promise<void>,
    interactionMetadata?: Record<string, unknown>
  ) => {
    if (!trackInteractions) {
      return fn();
    }

    return harvestProPerformanceMonitor.measureInteraction(
      `${componentName}:${interactionName}`,
      fn,
      { componentName, ...metadata, ...interactionMetadata }
    );
  }, [componentName, trackInteractions, metadata]);

  // Start timing an interaction
  const startInteractionTimer = useCallback((interactionName: string) => {
    if (!trackInteractions) return;
    
    const key = `${componentName}:${interactionName}`;
    interactionTimers.current.set(key, performance.now());
  }, [componentName, trackInteractions]);

  // End timing an interaction
  const endInteractionTimer = useCallback((
    interactionName: string,
    interactionMetadata?: Record<string, unknown>
  ) => {
    if (!trackInteractions) return;
    
    const key = `${componentName}:${interactionName}`;
    const startTime = interactionTimers.current.get(key);
    
    if (startTime) {
      const duration = performance.now() - startTime;
      harvestProPerformanceMonitor.recordMetric(
        `interaction:${key}`,
        duration,
        150, // 150ms threshold for interactions
        { componentName, interactionName, ...metadata, ...interactionMetadata }
      );
      interactionTimers.current.delete(key);
    }
  }, [componentName, trackInteractions, metadata]);

  // Measure async operations
  const measureAsync = useCallback(async <T>(
    operationName: string,
    fn: () => Promise<T>,
    threshold: number = 1000,
    operationMetadata?: Record<string, unknown>
  ): Promise<T> => {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      harvestProPerformanceMonitor.recordMetric(
        `async:${componentName}:${operationName}`,
        duration,
        threshold,
        { componentName, operationName, ...metadata, ...operationMetadata }
      );
      
      return result;
    } catch (error: unknown) {
      const duration = performance.now() - start;
      
      harvestProPerformanceMonitor.recordMetric(
        `async:${componentName}:${operationName}:error`,
        duration,
        threshold,
        { 
          componentName, 
          operationName, 
          error: error instanceof Error ? error.message : 'Unknown error', 
          ...metadata, 
          ...operationMetadata 
        }
      );
      
      throw error;
    }
  }, [componentName, metadata]);

  // Record custom metrics
  const recordMetric = useCallback((
    metricName: string,
    value: number,
    threshold: number,
    customMetadata?: Record<string, unknown>
  ) => {
    harvestProPerformanceMonitor.recordMetric(
      `${componentName}:${metricName}`,
      value,
      threshold,
      { componentName, ...metadata, ...customMetadata }
    );
  }, [componentName, metadata]);

  return {
    measureInteraction,
    startInteractionTimer,
    endInteractionTimer,
    measureAsync,
    recordMetric,
  };
}

/**
 * Hook for monitoring loading states performance
 */
export function useLoadingStatePerformance(stateName: string) {
  const loadingStart = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);

  const startLoading = useCallback(() => {
    loadingStart.current = performance.now();
    isLoadingRef.current = true;
  }, []);

  const endLoading = useCallback((metadata?: Record<string, unknown>) => {
    if (!isLoadingRef.current) return;
    
    const duration = performance.now() - loadingStart.current;
    harvestProPerformanceMonitor.recordMetric(
      `loading_state:${stateName}`,
      duration,
      100, // 100ms threshold for loading state response
      { stateName, ...metadata }
    );
    
    isLoadingRef.current = false;
  }, [stateName]);

  return { startLoading, endLoading };
}

/**
 * Hook for monitoring filter performance
 */
export function useFilterPerformance() {
  const measureFilterChange = useCallback((
    filterName: string,
    fn: () => void,
    metadata?: Record<string, unknown>
  ) => {
    return harvestProPerformanceMonitor.measureInteraction(
      `filter:${filterName}`,
      fn,
      { filterName, ...metadata }
    );
  }, []);

  return { measureFilterChange };
}

/**
 * Hook for monitoring opportunity rendering performance
 */
export function useOpportunityRenderPerformance() {
  const measureOpportunityRender = useCallback((
    opportunityCount: number,
    fn: () => void,
    metadata?: Record<string, unknown>
  ) => {
    return harvestProPerformanceMonitor.measureOpportunityLoading(
      'render',
      async () => fn(),
      { opportunityCount, ...metadata }
    );
  }, []);

  return { measureOpportunityRender };
}

/**
 * Performance monitoring context for debugging
 */
export function usePerformanceDebug() {
  const getHealthStatus = useCallback(() => {
    return harvestProPerformanceMonitor.getHealthStatus();
  }, []);

  const getSummary = useCallback(() => {
    return harvestProPerformanceMonitor.getSummary();
  }, []);

  const getRecentMetrics = useCallback((windowMs: number = 60000) => {
    return harvestProPerformanceMonitor.getMetricsInWindow(windowMs);
  }, []);

  return {
    getHealthStatus,
    getSummary,
    getRecentMetrics,
  };
}