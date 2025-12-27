/**
 * HarvestPro Performance Monitoring
 * 
 * Tracks and reports performance metrics for HarvestPro components
 * Requirements: Enhanced Req 17 AC1-3 (performance standards)
 * Design: Performance → Monitoring and Optimization
 */

import React from 'react';

// HarvestPro-specific performance thresholds (in milliseconds)
export const HARVESTPRO_PERFORMANCE_THRESHOLDS = {
  // Loading state thresholds
  LOADING_STATE_RESPONSE: 100, // Loading states must appear within 100ms
  SKELETON_RENDER: 50, // Skeleton components must render within 50ms
  
  // Opportunity loading thresholds
  OPPORTUNITIES_API_CALL: 2000, // API call should complete within 2s
  OPPORTUNITIES_PROCESSING: 500, // Client-side processing within 500ms
  OPPORTUNITIES_RENDER: 200, // Rendering opportunities within 200ms
  
  // CSV generation thresholds
  CSV_GENERATION: 2000, // CSV generation within 2s (Requirement 11.1)
  CSV_DOWNLOAD_TRIGGER: 100, // Download trigger response within 100ms
  
  // UI interaction thresholds
  MODAL_OPEN: 150, // Detail modal opens within 150ms
  FILTER_APPLICATION: 100, // Filter changes apply within 100ms
  DEMO_MODE_TOGGLE: 50, // Demo mode toggle within 50ms
  
  // Cache performance thresholds
  CACHE_HIT_RESPONSE: 10, // Cache hits should be near-instant
  CACHE_MISS_TOLERANCE: 500, // Cache misses acceptable up to 500ms
} as const;

interface HarvestProMetric {
  name: string;
  value: number;
  threshold: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface PerformanceSummary {
  [metricName: string]: {
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
    violations: number;
    lastValue: number;
  };
}

class HarvestProPerformanceMonitor {
  private metrics: HarvestProMetric[] = [];
  private maxMetrics = 1000; // Prevent memory leaks

  /**
   * Record a performance metric with HarvestPro-specific context
   */
  recordMetric(
    name: string, 
    value: number, 
    threshold: number, 
    metadata?: Record<string, unknown>
  ): void {
    const metric: HarvestProMetric = {
      name,
      value,
      threshold,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Prevent memory leaks by keeping only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log performance violations
    if (value > threshold) {
      console.warn(
        `🚨 HarvestPro Performance Violation: ${name} = ${value.toFixed(2)}ms (threshold: ${threshold}ms)`,
        metadata
      );
    }

    // Send to analytics if available
    this.sendToAnalytics(metric);
  }

  /**
   * Measure loading state response time
   */
  measureLoadingState(stateName: string, fn: () => void | Promise<void>): Promise<void> | void {
    const start = performance.now();
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        this.recordMetric(
          `loading_state:${stateName}`,
          duration,
          HARVESTPRO_PERFORMANCE_THRESHOLDS.LOADING_STATE_RESPONSE,
          { stateName }
        );
      });
    } else {
      const duration = performance.now() - start;
      this.recordMetric(
        `loading_state:${stateName}`,
        duration,
        HARVESTPRO_PERFORMANCE_THRESHOLDS.LOADING_STATE_RESPONSE,
        { stateName }
      );
    }
  }

  /**
   * Measure opportunity loading performance
   */
  async measureOpportunityLoading<T>(
    stage: 'api_call' | 'processing' | 'render',
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      const thresholds = {
        api_call: HARVESTPRO_PERFORMANCE_THRESHOLDS.OPPORTUNITIES_API_CALL,
        processing: HARVESTPRO_PERFORMANCE_THRESHOLDS.OPPORTUNITIES_PROCESSING,
        render: HARVESTPRO_PERFORMANCE_THRESHOLDS.OPPORTUNITIES_RENDER,
      };
      
      this.recordMetric(
        `opportunities:${stage}`,
        duration,
        thresholds[stage],
        { stage, ...metadata }
      );
      
      return result;
    } catch (error: unknown) {
      const duration = performance.now() - start;
      this.recordMetric(
        `opportunities:${stage}:error`,
        duration,
        HARVESTPRO_PERFORMANCE_THRESHOLDS.OPPORTUNITIES_API_CALL,
        { stage, error: error instanceof Error ? error.message : 'Unknown error', ...metadata }
      );
      throw error;
    }
  }

  /**
   * Measure CSV generation performance
   */
  async measureCSVGeneration<T>(
    operation: 'generation' | 'download_trigger',
    fn: () => T | Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await Promise.resolve(fn());
      const duration = performance.now() - start;
      
      const threshold = operation === 'generation' 
        ? HARVESTPRO_PERFORMANCE_THRESHOLDS.CSV_GENERATION
        : HARVESTPRO_PERFORMANCE_THRESHOLDS.CSV_DOWNLOAD_TRIGGER;
      
      this.recordMetric(
        `csv:${operation}`,
        duration,
        threshold,
        { operation, ...metadata }
      );
      
      return result;
    } catch (error: unknown) {
      const duration = performance.now() - start;
      this.recordMetric(
        `csv:${operation}:error`,
        duration,
        HARVESTPRO_PERFORMANCE_THRESHOLDS.CSV_GENERATION,
        { operation, error: error instanceof Error ? error.message : 'Unknown error', ...metadata }
      );
      throw error;
    }
  }

  /**
   * Measure UI interaction performance
   */
  measureInteraction(
    interactionName: string,
    fn: () => void | Promise<void>,
    metadata?: Record<string, unknown>
  ): Promise<void> | void {
    const start = performance.now();
    
    const thresholds = {
      modal_open: HARVESTPRO_PERFORMANCE_THRESHOLDS.MODAL_OPEN,
      filter_application: HARVESTPRO_PERFORMANCE_THRESHOLDS.FILTER_APPLICATION,
      demo_mode_toggle: HARVESTPRO_PERFORMANCE_THRESHOLDS.DEMO_MODE_TOGGLE,
    };
    
    const threshold = thresholds[interactionName as keyof typeof thresholds] || 
                     HARVESTPRO_PERFORMANCE_THRESHOLDS.MODAL_OPEN;
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        this.recordMetric(
          `interaction:${interactionName}`,
          duration,
          threshold,
          { interactionName, ...metadata }
        );
      });
    } else {
      const duration = performance.now() - start;
      this.recordMetric(
        `interaction:${interactionName}`,
        duration,
        threshold,
        { interactionName, ...metadata }
      );
    }
  }

  /**
   * Measure cache performance
   */
  measureCachePerformance(
    operation: 'hit' | 'miss',
    cacheKey: string,
    duration: number,
    metadata?: Record<string, unknown>
  ): void {
    const threshold = operation === 'hit' 
      ? HARVESTPRO_PERFORMANCE_THRESHOLDS.CACHE_HIT_RESPONSE
      : HARVESTPRO_PERFORMANCE_THRESHOLDS.CACHE_MISS_TOLERANCE;
    
    this.recordMetric(
      `cache:${operation}`,
      duration,
      threshold,
      { cacheKey, operation, ...metadata }
    );
  }

  /**
   * Get performance summary with percentiles
   */
  getSummary(): PerformanceSummary {
    const summary: PerformanceSummary = {};

    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          avg: 0,
          min: Infinity,
          max: 0,
          p95: 0,
          violations: 0,
          lastValue: 0,
        };
      }

      const s = summary[metric.name];
      s.count++;
      s.avg = (s.avg * (s.count - 1) + metric.value) / s.count;
      s.min = Math.min(s.min, metric.value);
      s.max = Math.max(s.max, metric.value);
      s.lastValue = metric.value;
      
      if (metric.value > metric.threshold) {
        s.violations++;
      }
    }

    // Calculate P95 for each metric
    for (const [metricName, stats] of Object.entries(summary)) {
      const metricValues = this.metrics
        .filter(m => m.name === metricName)
        .map(m => m.value)
        .sort((a, b) => a - b);
      
      if (metricValues.length > 0) {
        const p95Index = Math.floor(metricValues.length * 0.95);
        stats.p95 = metricValues[p95Index] || stats.max;
      }
    }

    return summary;
  }

  /**
   * Get metrics for a specific time window
   */
  getMetricsInWindow(windowMs: number): HarvestProMetric[] {
    const cutoff = Date.now() - windowMs;
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Get performance health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'critical';
    issues: string[];
    summary: PerformanceSummary;
  } {
    const summary = this.getSummary();
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';

    // Check for critical performance issues
    for (const [metricName, stats] of Object.entries(summary)) {
      const violationRate = stats.violations / stats.count;
      
      if (violationRate > 0.5) {
        issues.push(`${metricName}: ${(violationRate * 100).toFixed(1)}% violations`);
        status = 'critical';
      } else if (violationRate > 0.2) {
        issues.push(`${metricName}: ${(violationRate * 100).toFixed(1)}% violations`);
        if (status === 'healthy') status = 'degraded';
      }
      
      // Check P95 performance
      if (stats.p95 > stats.lastValue * 2) {
        issues.push(`${metricName}: P95 significantly higher than recent performance`);
        if (status === 'healthy') status = 'degraded';
      }
    }

    return { status, issues, summary };
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThanMs: number = 5 * 60 * 1000): void {
    const cutoff = Date.now() - olderThanMs;
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Clear all metrics (for testing)
   */
  clearAllMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get all metrics (for debugging)
   */
  getAllMetrics(): HarvestProMetric[] {
    return [...this.metrics];
  }

  /**
   * Send metric to analytics service
   */
  private sendToAnalytics(metric: HarvestProMetric): void {
    try {
      // Send to PostHog if available
      if (typeof window !== 'undefined' && (window as unknown as { posthog?: unknown }).posthog) {
        const posthog = (window as unknown as { posthog: { capture: (event: string, properties: Record<string, unknown>) => void } }).posthog;
        posthog.capture('harvestpro_performance_metric', {
          metric_name: metric.name,
          value: Math.round(metric.value),
          threshold: metric.threshold,
          exceeded: metric.value > metric.threshold,
          metadata: metric.metadata,
        });
      }

      // Send to custom analytics if available
      if (typeof window !== 'undefined' && (window as unknown as { analytics?: unknown }).analytics) {
        const analytics = (window as unknown as { analytics: { track: (event: string, properties: Record<string, unknown>) => void } }).analytics;
        analytics.track('harvestpro_performance_metric', {
          metric_name: metric.name,
          value: Math.round(metric.value),
          threshold: metric.threshold,
          exceeded: metric.value > metric.threshold,
          metadata: metric.metadata,
        });
      }
    } catch (error: unknown) {
      // Silently fail analytics to avoid impacting performance
      console.debug('Analytics tracking failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

// Singleton instance
export const harvestProPerformanceMonitor = new HarvestProPerformanceMonitor();

/**
 * React hook for measuring HarvestPro component performance
 */
export function useHarvestProPerformance(componentName: string, metadata?: Record<string, unknown>) {
  const renderStart = typeof window !== 'undefined' ? performance.now() : 0;

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const renderTime = performance.now() - renderStart;
    harvestProPerformanceMonitor.recordMetric(
      `component:${componentName}`,
      renderTime,
      HARVESTPRO_PERFORMANCE_THRESHOLDS.SKELETON_RENDER,
      { componentName, ...metadata }
    );
  }, [componentName, renderStart, metadata]);
}

/**
 * Performance monitoring decorator for async functions
 */
export function withPerformanceMonitoring<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  metricName: string,
  threshold: number,
  metadata?: Record<string, unknown>
): T {
  return (async (...args: Parameters<T>) => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - start;
      harvestProPerformanceMonitor.recordMetric(metricName, duration, threshold, metadata);
      return result;
    } catch (error: unknown) {
      const duration = performance.now() - start;
      harvestProPerformanceMonitor.recordMetric(
        `${metricName}:error`,
        duration,
        threshold,
        { error: error instanceof Error ? error.message : 'Unknown error', ...metadata }
      );
      throw error;
    }
  }) as T;
}

// Auto-cleanup old metrics every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    harvestProPerformanceMonitor.clearOldMetrics();
  }, 5 * 60 * 1000);
}