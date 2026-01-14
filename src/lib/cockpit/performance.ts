/**
 * Cockpit Performance Optimization Utilities
 * 
 * Implements performance optimizations to meet SLO requirements:
 * - /cockpit first meaningful paint < 1.2s on mobile
 * - GET /api/cockpit/summary: p50 < 150ms, p95 < 400ms, p99 < 900ms
 * - Drawer open latency < 100ms
 * 
 * Requirements: 14.1, 14.2, 14.3
 */

// ============================================================================
// Performance Monitoring
// ============================================================================

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  // Page load metrics
  firstContentfulPaint: number;
  firstMeaningfulPaint: number;
  timeToInteractive: number;
  
  // API response metrics
  apiResponseTimes: {
    p50: number;
    p95: number;
    p99: number;
    average: number;
  };
  
  // UI interaction metrics
  drawerOpenLatency: number;
  componentRenderTime: number;
  
  // Resource metrics
  bundleSize: number;
  memoryUsage: number;
}

/**
 * Performance observer for tracking key metrics
 */
class CockpitPerformanceObserver {
  private metrics: Partial<PerformanceMetrics> = {};
  private apiResponseTimes: number[] = [];
  private observers: PerformanceObserver[] = [];
  
  constructor() {
    this.setupObservers();
  }
  
  private setupObservers() {
    // Track paint metrics
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.firstContentfulPaint = entry.startTime;
            }
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch (error) {
        console.warn('Paint observer not supported:', error);
      }
      
      // Track navigation metrics
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const navEntry = entry as PerformanceNavigationTiming;
            this.metrics.timeToInteractive = navEntry.domInteractive - navEntry.navigationStart;
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (error) {
        console.warn('Navigation observer not supported:', error);
      }
      
      // Track resource loading
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name.includes('/api/cockpit/')) {
              const responseTime = entry.responseEnd - entry.requestStart;
              this.apiResponseTimes.push(responseTime);
              this.updateApiMetrics();
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported:', error);
      }
    }
  }
  
  private updateApiMetrics() {
    if (this.apiResponseTimes.length === 0) return;
    
    const sorted = [...this.apiResponseTimes].sort((a, b) => a - b);
    const len = sorted.length;
    
    this.metrics.apiResponseTimes = {
      p50: sorted[Math.floor(len * 0.5)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)],
      average: sorted.reduce((sum, time) => sum + time, 0) / len,
    };
  }
  
  /**
   * Track drawer open latency
   */
  trackDrawerOpen(startTime: number, endTime: number) {
    this.metrics.drawerOpenLatency = endTime - startTime;
  }
  
  /**
   * Track component render time
   */
  trackComponentRender(renderTime: number) {
    this.metrics.componentRenderTime = renderTime;
  }
  
  /**
   * Track first meaningful paint manually
   */
  trackFirstMeaningfulPaint(timestamp: number) {
    this.metrics.firstMeaningfulPaint = timestamp;
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }
  
  /**
   * Check if SLOs are being met
   */
  checkSLOs(): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    
    // First meaningful paint < 1.2s on mobile
    if (this.metrics.firstMeaningfulPaint && this.metrics.firstMeaningfulPaint > 1200) {
      violations.push(`First meaningful paint: ${this.metrics.firstMeaningfulPaint}ms > 1200ms`);
    }
    
    // API response times
    if (this.metrics.apiResponseTimes) {
      const { p50, p95, p99 } = this.metrics.apiResponseTimes;
      
      if (p50 > 150) {
        violations.push(`API p50: ${p50}ms > 150ms`);
      }
      if (p95 > 400) {
        violations.push(`API p95: ${p95}ms > 400ms`);
      }
      if (p99 > 900) {
        violations.push(`API p99: ${p99}ms > 900ms`);
      }
    }
    
    // Drawer open latency < 100ms
    if (this.metrics.drawerOpenLatency && this.metrics.drawerOpenLatency > 100) {
      violations.push(`Drawer open: ${this.metrics.drawerOpenLatency}ms > 100ms`);
    }
    
    return {
      passed: violations.length === 0,
      violations,
    };
  }
  
  /**
   * Cleanup observers
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global performance observer instance
let performanceObserver: CockpitPerformanceObserver | null = null;

/**
 * Get or create performance observer
 */
export const getPerformanceObserver = (): CockpitPerformanceObserver => {
  if (!performanceObserver) {
    performanceObserver = new CockpitPerformanceObserver();
  }
  return performanceObserver;
};

// ============================================================================
// Performance Optimization Utilities
// ============================================================================

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Measure function execution time
 */
export const measureExecutionTime = async <T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<{ result: T; duration: number }> => {
  const startTime = performance.now();
  const result = await fn();
  const duration = performance.now() - startTime;
  
  if (process.env.NODE_ENV === 'development') {
    console.debug(`Performance: ${name} took ${duration.toFixed(2)}ms`);
  }
  
  return { result, duration };
};

/**
 * Lazy load component with performance tracking
 */
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentName: string
) => {
  return React.lazy(async () => {
    const startTime = performance.now();
    const module = await importFn();
    const loadTime = performance.now() - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Lazy load: ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
    }
    
    return module;
  });
};

/**
 * Preload critical resources
 */
export const preloadCriticalResources = () => {
  // Preload critical API endpoints
  const criticalEndpoints = [
    '/api/cockpit/summary',
    '/api/cockpit/prefs',
  ];
  
  criticalEndpoints.forEach(endpoint => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = endpoint;
    document.head.appendChild(link);
  });
  
  // Preload critical fonts
  const criticalFonts = [
    '/fonts/inter-var.woff2',
  ];
  
  criticalFonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = font;
    document.head.appendChild(link);
  });
};

/**
 * Optimize images for performance
 */
export const optimizeImage = (
  src: string,
  width?: number,
  height?: number,
  quality: number = 80
): string => {
  // In a real implementation, this would use a service like Cloudinary or Next.js Image
  // For now, return the original src
  return src;
};

/**
 * Check if device is mobile for performance optimizations
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Get device performance tier
 */
export const getDevicePerformanceTier = (): 'low' | 'medium' | 'high' => {
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 1;
  
  // Check memory (if available)
  const memory = (navigator as any).deviceMemory || 1;
  
  // Check connection speed
  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType || '4g';
  
  // Determine tier based on hardware capabilities
  if (cores >= 8 && memory >= 8 && effectiveType === '4g') {
    return 'high';
  } else if (cores >= 4 && memory >= 4) {
    return 'medium';
  } else {
    return 'low';
  }
};

/**
 * Apply performance optimizations based on device tier
 */
export const applyDeviceOptimizations = (tier: 'low' | 'medium' | 'high') => {
  const optimizations = {
    low: {
      // Reduce animations
      reducedMotion: true,
      // Lower quality images
      imageQuality: 60,
      // Disable non-essential features
      disableParticles: true,
      // Longer cache times
      cacheMultiplier: 2,
    },
    medium: {
      reducedMotion: false,
      imageQuality: 75,
      disableParticles: false,
      cacheMultiplier: 1.5,
    },
    high: {
      reducedMotion: false,
      imageQuality: 90,
      disableParticles: false,
      cacheMultiplier: 1,
    },
  };
  
  return optimizations[tier];
};

// ============================================================================
// React Hooks for Performance
// ============================================================================

import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to track component render performance
 */
export const useRenderPerformance = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  
  useEffect(() => {
    renderStartTime.current = performance.now();
  });
  
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    getPerformanceObserver().trackComponentRender(renderTime);
    
    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(`Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  });
};

/**
 * Hook to track drawer open performance
 */
export const useDrawerPerformance = () => {
  const openStartTime = useRef<number>(0);
  
  const trackOpen = useCallback(() => {
    openStartTime.current = performance.now();
  }, []);
  
  const trackOpened = useCallback(() => {
    const latency = performance.now() - openStartTime.current;
    getPerformanceObserver().trackDrawerOpen(openStartTime.current, performance.now());
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Drawer opened in ${latency.toFixed(2)}ms`);
    }
  }, []);
  
  return { trackOpen, trackOpened };
};

/**
 * Hook to track first meaningful paint
 */
export const useFirstMeaningfulPaint = () => {
  useEffect(() => {
    // Track when the main content is rendered
    const timer = setTimeout(() => {
      getPerformanceObserver().trackFirstMeaningfulPaint(performance.now());
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);
};

/**
 * Hook for performance monitoring
 */
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = React.useState<Partial<PerformanceMetrics>>({});
  const [sloStatus, setSloStatus] = React.useState<{ passed: boolean; violations: string[] }>({
    passed: true,
    violations: [],
  });
  
  useEffect(() => {
    const observer = getPerformanceObserver();
    
    const updateMetrics = () => {
      const currentMetrics = observer.getMetrics();
      const sloCheck = observer.checkSLOs();
      
      setMetrics(currentMetrics);
      setSloStatus(sloCheck);
    };
    
    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  return { metrics, sloStatus };
};

export default {
  getPerformanceObserver,
  debounce,
  throttle,
  measureExecutionTime,
  createLazyComponent,
  preloadCriticalResources,
  optimizeImage,
  isMobileDevice,
  getDevicePerformanceTier,
  applyDeviceOptimizations,
  useRenderPerformance,
  useDrawerPerformance,
  useFirstMeaningfulPaint,
  usePerformanceMonitoring,
};