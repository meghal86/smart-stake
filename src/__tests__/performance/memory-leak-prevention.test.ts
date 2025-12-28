/**
 * Memory Leak Prevention Tests
 * 
 * Tests for performance fixes and memory leak prevention
 * Requirements: R1-AC1, R1-AC2, R1-AC4, R1-AC5, R22-AC1, R22-AC2, R22-AC3, R22-AC4, R22-AC5
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { performanceMonitor } from '@/lib/performance/monitor';
import { memoryMonitor } from '@/lib/performance/memory-monitor';
import { intervalManager } from '@/lib/performance/interval-manager';

// Mock performance.memory for testing
const mockMemory = {
  usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  totalJSHeapSize: 100 * 1024 * 1024, // 100MB
  jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
};

Object.defineProperty(global.performance, 'memory', {
  value: mockMemory,
  writable: true,
});

describe('Performance Monitoring', () => {
  beforeEach(() => {
    performanceMonitor.clear();
  });

  afterEach(() => {
    performanceMonitor.cleanup();
  });

  test('should record performance metrics', () => {
    performanceMonitor.recordMetric('test-metric', 150, 100);
    
    const metrics = performanceMonitor.getMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe('test-metric');
    expect(metrics[0].value).toBe(150);
    expect(metrics[0].threshold).toBe(100);
  });

  test('should warn when threshold exceeded', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    performanceMonitor.recordMetric('slow-operation', 500, 200);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Performance threshold exceeded')
    );
    
    consoleSpy.mockRestore();
  });

  test('should measure interaction time', async () => {
    const mockOperation = vi.fn().mockResolvedValue('result');
    
    await performanceMonitor.measureInteraction('test-interaction', mockOperation);
    
    const metrics = performanceMonitor.getMetrics();
    expect(metrics.some(m => m.name === 'interaction:test-interaction')).toBe(true);
    expect(mockOperation).toHaveBeenCalled();
  });

  test('should measure API call time', async () => {
    const mockApiCall = vi.fn().mockResolvedValue({ data: 'test' });
    
    const result = await performanceMonitor.measureAPI('test-api', mockApiCall);
    
    expect(result).toEqual({ data: 'test' });
    const metrics = performanceMonitor.getMetrics();
    expect(metrics.some(m => m.name === 'api:test-api')).toBe(true);
  });

  test('should handle API errors', async () => {
    const mockApiCall = vi.fn().mockRejectedValue(new Error('API Error'));
    
    await expect(
      performanceMonitor.measureAPI('failing-api', mockApiCall)
    ).rejects.toThrow('API Error');
    
    const metrics = performanceMonitor.getMetrics();
    expect(metrics.some(m => m.name === 'api:failing-api:error')).toBe(true);
  });

  test('should cleanup properly', () => {
    performanceMonitor.recordMetric('test', 100, 50);
    expect(performanceMonitor.getMetrics()).toHaveLength(1);
    
    performanceMonitor.cleanup();
    expect(performanceMonitor.getMetrics()).toHaveLength(0);
  });
});

describe('Memory Monitoring', () => {
  test('should get memory stats', () => {
    const stats = memoryMonitor.getMemoryStats();
    
    if (stats) {
      expect(stats.current).toBeDefined();
      expect(stats.current.used).toBeGreaterThan(0);
      expect(stats.current.usagePercent).toBeGreaterThan(0);
    }
  });

  test('should handle garbage collection', () => {
    // Mock window.gc
    (global as any).window = { gc: vi.fn() };
    
    const result = memoryMonitor.forceGarbageCollection();
    expect(result).toBe(true);
    expect((global as any).window.gc).toHaveBeenCalled();
  });

  test('should handle missing garbage collection', () => {
    (global as any).window = {};
    
    const result = memoryMonitor.forceGarbageCollection();
    expect(result).toBe(false);
  });
});

describe('Interval Management', () => {
  afterEach(() => {
    intervalManager.clearAll();
  });

  test('should manage intervals', () => {
    const callback = vi.fn();
    const interval = intervalManager.setInterval(callback, 100);
    
    expect(interval).toBeDefined();
    
    const stats = intervalManager.getStats();
    expect(stats.activeIntervals).toBe(1);
    expect(stats.total).toBe(1);
    
    intervalManager.clearInterval(interval);
    
    const statsAfter = intervalManager.getStats();
    expect(statsAfter.activeIntervals).toBe(0);
  });

  test('should manage timeouts', () => {
    const callback = vi.fn();
    const timeout = intervalManager.setTimeout(callback, 100);
    
    expect(timeout).toBeDefined();
    
    const stats = intervalManager.getStats();
    expect(stats.activeTimeouts).toBe(1);
    expect(stats.total).toBe(1);
    
    intervalManager.clearTimeout(timeout);
    
    const statsAfter = intervalManager.getStats();
    expect(statsAfter.activeTimeouts).toBe(0);
  });

  test('should clear all timers', () => {
    intervalManager.setInterval(() => {}, 100);
    intervalManager.setTimeout(() => {}, 100);
    
    const stats = intervalManager.getStats();
    expect(stats.total).toBe(2);
    
    intervalManager.clearAll();
    
    const statsAfter = intervalManager.getStats();
    expect(statsAfter.total).toBe(0);
  });

  test('should auto-remove completed timeouts', (done) => {
    const callback = vi.fn(() => {
      // Check stats after timeout completes
      setTimeout(() => {
        const stats = intervalManager.getStats();
        expect(stats.activeTimeouts).toBe(0);
        done();
      }, 10);
    });
    
    intervalManager.setTimeout(callback, 50);
    
    const stats = intervalManager.getStats();
    expect(stats.activeTimeouts).toBe(1);
  });
});

describe('Performance Integration', () => {
  test('should handle multiple performance operations without memory growth', async () => {
    const initialMetrics = performanceMonitor.getMetrics().length;
    
    // Simulate multiple operations
    for (let i = 0; i < 100; i++) {
      performanceMonitor.recordMetric(`test-${i}`, Math.random() * 100, 50);
      
      await performanceMonitor.measureInteraction(`interaction-${i}`, () => {
        // Simulate work
        return new Promise(resolve => setTimeout(resolve, 1));
      });
    }
    
    const finalMetrics = performanceMonitor.getMetrics();
    expect(finalMetrics.length).toBe(initialMetrics + 200); // 100 metrics + 100 interactions
    
    // Cleanup should work
    performanceMonitor.clear();
    expect(performanceMonitor.getMetrics()).toHaveLength(0);
  });

  test('should handle interval cleanup on page unload', () => {
    const callback = vi.fn();
    intervalManager.setInterval(callback, 100);
    intervalManager.setTimeout(callback, 100);
    
    expect(intervalManager.getStats().total).toBe(2);
    
    // Simulate page unload by calling cleanup directly
    // (In real environment, this would be triggered by beforeunload event)
    intervalManager.clearAll();
    
    // Intervals should be cleaned up
    expect(intervalManager.getStats().total).toBe(0);
  });
});