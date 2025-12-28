/**
 * Memory Leak Detection and Prevention
 * 
 * Monitors memory usage and detects potential leaks
 * Requirements: R1-AC2, R22-AC3
 */

import * as React from 'react';

interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface WindowWithGC extends Window {
  gc?: () => void;
}

interface WindowWithAnalytics extends Window {
  analytics?: {
    track: (event: string, properties: Record<string, unknown>) => void;
  };
}

class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MAX_SNAPSHOTS = 20; // Keep last 20 snapshots
  private readonly MONITORING_INTERVAL = 30000; // 30 seconds
  private readonly MEMORY_LEAK_THRESHOLD = 50 * 1024 * 1024; // 50MB growth

  constructor() {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      this.startMonitoring();
    }
  }

  private startMonitoring() {
    this.takeSnapshot();
    
    this.monitoringInterval = setInterval(() => {
      this.takeSnapshot();
      this.checkForLeaks();
    }, this.MONITORING_INTERVAL);

    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.stopMonitoring();
      });
    }
  }

  private takeSnapshot() {
    if (typeof window === 'undefined' || !('performance' in window) || !('memory' in performance)) {
      return;
    }

    const memory = (performance as Performance & { memory: PerformanceMemory }).memory;
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };

    this.snapshots.push(snapshot);

    // Keep only the last MAX_SNAPSHOTS
    if (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots.shift();
    }
  }

  private checkForLeaks() {
    if (this.snapshots.length < 5) return; // Need at least 5 snapshots

    const recent = this.snapshots.slice(-5);
    const oldest = recent[0];
    const newest = recent[recent.length - 1];

    const memoryGrowth = newest.usedJSHeapSize - oldest.usedJSHeapSize;
    const timeSpan = newest.timestamp - oldest.timestamp;

    // Check for sustained memory growth
    if (memoryGrowth > this.MEMORY_LEAK_THRESHOLD) {
      const growthRate = memoryGrowth / (timeSpan / 1000); // bytes per second
      
      console.warn('🚨 Potential memory leak detected:', {
        memoryGrowth: `${(memoryGrowth / 1024 / 1024).toFixed(2)} MB`,
        timeSpan: `${(timeSpan / 1000).toFixed(0)} seconds`,
        growthRate: `${(growthRate / 1024).toFixed(2)} KB/s`,
        currentUsage: `${(newest.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      });

      // Trigger garbage collection if available
      if ('gc' in window) {
        try {
          (window as WindowWithGC).gc?.();
          console.log('🧹 Triggered garbage collection');
        } catch (error) {
          console.warn('Failed to trigger garbage collection:', error);
        }
      }

      // Send to analytics if available
      if (typeof window !== 'undefined') {
        const windowWithAnalytics = window as WindowWithAnalytics;
        windowWithAnalytics.analytics?.track('memory_leak_detected', {
          memoryGrowth,
          timeSpan,
          growthRate,
          currentUsage: newest.usedJSHeapSize,
        });
      }
    }
  }

  public getMemoryStats() {
    if (this.snapshots.length === 0) return null;

    const latest = this.snapshots[this.snapshots.length - 1];
    const oldest = this.snapshots[0];

    return {
      current: {
        used: latest.usedJSHeapSize,
        total: latest.totalJSHeapSize,
        limit: latest.jsHeapSizeLimit,
        usagePercent: (latest.usedJSHeapSize / latest.jsHeapSizeLimit) * 100,
      },
      trend: this.snapshots.length > 1 ? {
        growth: latest.usedJSHeapSize - oldest.usedJSHeapSize,
        timeSpan: latest.timestamp - oldest.timestamp,
      } : null,
      snapshots: this.snapshots.length,
    };
  }

  public forceGarbageCollection() {
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        (window as WindowWithGC).gc?.();
        console.log('🧹 Manual garbage collection triggered');
        return true;
      } catch (error) {
        console.warn('Failed to trigger garbage collection:', error);
        return false;
      }
    }
    return false;
  }

  public stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  public cleanup() {
    this.stopMonitoring();
    this.snapshots = [];
  }
}

// Singleton instance
export const memoryMonitor = new MemoryMonitor();

/**
 * React hook for memory monitoring
 */
export function useMemoryMonitor() {
  const [memoryStats, setMemoryStats] = React.useState(memoryMonitor.getMemoryStats());

  React.useEffect(() => {
    const updateStats = () => {
      setMemoryStats(memoryMonitor.getMemoryStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    memoryStats,
    forceGarbageCollection: memoryMonitor.forceGarbageCollection,
  };
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    memoryMonitor.cleanup();
  });
}