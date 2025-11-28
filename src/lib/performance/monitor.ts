/**
 * Performance Monitoring Utilities
 * 
 * Tracks and reports performance metrics for Hunter Screen
 * Requirements: 1.1-1.6
 */

// Performance thresholds (in milliseconds)
export const PERFORMANCE_THRESHOLDS = {
  FCP_WARM: 1000, // First Contentful Paint (warm cache)
  FCP_COLD: 1600, // First Contentful Paint (cold cache)
  TTI: 2000, // Time to Interactive
  INTERACTION: 150, // Interaction response time
  API_P95: 200, // API P95 latency
} as const;

interface PerformanceMetric {
  name: string;
  value: number;
  threshold: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observer: PerformanceObserver | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObserver();
    }
  }

  private initializeObserver() {
    try {
      // Observe paint timing
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            this.recordMetric('FCP', entry.startTime, PERFORMANCE_THRESHOLDS.FCP_WARM);
          }
        }
      });

      this.observer.observe({ entryTypes: ['paint', 'navigation', 'resource'] });
    } catch (error) {
      console.warn('Performance monitoring not supported:', error);
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, threshold: number) {
    const metric: PerformanceMetric = {
      name,
      value,
      threshold,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Log warning if threshold exceeded
    if (value > threshold) {
      console.warn(
        `⚠️ Performance threshold exceeded: ${name} = ${value.toFixed(2)}ms (threshold: ${threshold}ms)`
      );
    }

    // Send to analytics (if available)
    if (typeof window !== 'undefined' && (window as unknown).analytics) {
      (window as unknown).analytics.track('performance_metric', {
        metric_name: name,
        value: Math.round(value),
        threshold,
        exceeded: value > threshold,
      });
    }
  }

  /**
   * Measure interaction time
   */
  measureInteraction(name: string, fn: () => void | Promise<void>) {
    const start = performance.now();
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        this.recordMetric(`interaction:${name}`, duration, PERFORMANCE_THRESHOLDS.INTERACTION);
      });
    } else {
      const duration = performance.now() - start;
      this.recordMetric(`interaction:${name}`, duration, PERFORMANCE_THRESHOLDS.INTERACTION);
    }
  }

  /**
   * Measure API call time
   */
  async measureAPI<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(`api:${name}`, duration, PERFORMANCE_THRESHOLDS.API_P95);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`api:${name}:error`, duration, PERFORMANCE_THRESHOLDS.API_P95);
      throw error;
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    const summary: Record<string, { count: number; avg: number; max: number; violations: number }> = {};

    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          avg: 0,
          max: 0,
          violations: 0,
        };
      }

      const s = summary[metric.name];
      s.count++;
      s.avg = (s.avg * (s.count - 1) + metric.value) / s.count;
      s.max = Math.max(s.max, metric.value);
      if (metric.value > metric.threshold) {
        s.violations++;
      }
    }

    return summary;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Disconnect observer
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for measuring component render time
 */
export function usePerformanceMonitor(componentName: string) {
  if (typeof window === 'undefined') return;

  const renderStart = performance.now();

  React.useEffect(() => {
    const renderTime = performance.now() - renderStart;
    performanceMonitor.recordMetric(
      `render:${componentName}`,
      renderTime,
      50 // 50ms threshold for component render
    );
  }, [componentName, renderStart]);
}

/**
 * Measure Web Vitals
 */
export function measureWebVitals() {
  if (typeof window === 'undefined') return;

  // FCP - First Contentful Paint
  const paintEntries = performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
  if (fcpEntry) {
    performanceMonitor.recordMetric('FCP', fcpEntry.startTime, PERFORMANCE_THRESHOLDS.FCP_WARM);
  }

  // LCP - Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as unknown;
        if (lastEntry) {
          performanceMonitor.recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime, 2500);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP monitoring not supported:', error);
    }
  }

  // CLS - Cumulative Layout Shift
  if ('PerformanceObserver' in window) {
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        performanceMonitor.recordMetric('CLS', clsValue * 1000, 100); // Convert to ms equivalent
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('CLS monitoring not supported:', error);
    }
  }

  // FID - First Input Delay
  if ('PerformanceObserver' in window) {
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          performanceMonitor.recordMetric('FID', entry.processingStart - entry.startTime, 100);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('FID monitoring not supported:', error);
    }
  }
}

// Auto-initialize Web Vitals measurement
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(measureWebVitals, 0);
  });
}
