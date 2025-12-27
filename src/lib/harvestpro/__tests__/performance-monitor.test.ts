/**
 * Performance Monitor Tests
 * 
 * Tests for HarvestPro performance monitoring system
 * Requirements: Enhanced Req 17 AC1-3 (performance standards)
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { 
  harvestProPerformanceMonitor, 
  HARVESTPRO_PERFORMANCE_THRESHOLDS,
  withPerformanceMonitoring 
} from '../performance-monitor';

describe('HarvestPro Performance Monitor', () => {
  beforeEach(() => {
    // Clear metrics before each test
    harvestProPerformanceMonitor.clearAllMetrics();
  });

  test('records basic performance metrics', () => {
    const metricName = 'test-metric';
    const value = 150;
    const threshold = 100;
    
    harvestProPerformanceMonitor.recordMetric(metricName, value, threshold);
    
    const metrics = harvestProPerformanceMonitor.getAllMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe(metricName);
    expect(metrics[0].value).toBe(value);
    expect(metrics[0].threshold).toBe(threshold);
  });

  test('measures loading state performance', async () => {
    const stateName = 'test-loading';
    
    await harvestProPerformanceMonitor.measureLoadingState(stateName, () => {
      // Simulate some work
      return new Promise(resolve => setTimeout(resolve, 10));
    });
    
    const metrics = harvestProPerformanceMonitor.getAllMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe(`loading_state:${stateName}`);
    expect(metrics[0].threshold).toBe(HARVESTPRO_PERFORMANCE_THRESHOLDS.LOADING_STATE_RESPONSE);
  });

  test('measures opportunity loading performance', async () => {
    const mockFn = vi.fn().mockResolvedValue({ data: 'test' });
    
    const result = await harvestProPerformanceMonitor.measureOpportunityLoading(
      'api_call',
      mockFn,
      { testMetadata: true }
    );
    
    expect(result).toEqual({ data: 'test' });
    expect(mockFn).toHaveBeenCalledOnce();
    
    const metrics = harvestProPerformanceMonitor.getAllMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe('opportunities:api_call');
    expect(metrics[0].threshold).toBe(HARVESTPRO_PERFORMANCE_THRESHOLDS.OPPORTUNITIES_API_CALL);
  });

  test('measures CSV generation performance', async () => {
    const mockFn = vi.fn().mockReturnValue('csv,data');
    
    const result = await harvestProPerformanceMonitor.measureCSVGeneration(
      'generation',
      mockFn,
      { rows: 100 }
    );
    
    expect(result).toBe('csv,data');
    expect(mockFn).toHaveBeenCalledOnce();
    
    const metrics = harvestProPerformanceMonitor.getAllMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe('csv:generation');
    expect(metrics[0].threshold).toBe(HARVESTPRO_PERFORMANCE_THRESHOLDS.CSV_GENERATION);
  });

  test('measures interaction performance', () => {
    const mockFn = vi.fn();
    
    harvestProPerformanceMonitor.measureInteraction('modal_open', mockFn);
    
    expect(mockFn).toHaveBeenCalledOnce();
    
    const metrics = harvestProPerformanceMonitor.getAllMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe('interaction:modal_open');
    expect(metrics[0].threshold).toBe(HARVESTPRO_PERFORMANCE_THRESHOLDS.MODAL_OPEN);
  });

  test('measures cache performance', () => {
    const cacheKey = 'test-cache-key';
    const duration = 5;
    
    harvestProPerformanceMonitor.measureCachePerformance('hit', cacheKey, duration);
    
    const metrics = harvestProPerformanceMonitor.getAllMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe('cache:hit');
    expect(metrics[0].value).toBe(duration);
    expect(metrics[0].threshold).toBe(HARVESTPRO_PERFORMANCE_THRESHOLDS.CACHE_HIT_RESPONSE);
  });

  test('generates performance summary', () => {
    // Add some test metrics
    harvestProPerformanceMonitor.recordMetric('test-metric', 50, 100);
    harvestProPerformanceMonitor.recordMetric('test-metric', 150, 100); // Violation
    harvestProPerformanceMonitor.recordMetric('test-metric', 75, 100);
    
    const summary = harvestProPerformanceMonitor.getSummary();
    
    expect(summary['test-metric']).toBeDefined();
    expect(summary['test-metric'].count).toBe(3);
    expect(summary['test-metric'].violations).toBe(1);
    expect(summary['test-metric'].min).toBe(50);
    expect(summary['test-metric'].max).toBe(150);
  });

  test('gets health status', () => {
    // Add metrics with high violation rate
    for (let i = 0; i < 10; i++) {
      harvestProPerformanceMonitor.recordMetric('slow-metric', 200, 100); // All violations
    }
    
    const health = harvestProPerformanceMonitor.getHealthStatus();
    
    expect(health.status).toBe('critical');
    expect(health.issues).toHaveLength(1);
    expect(health.issues[0]).toContain('slow-metric');
    expect(health.issues[0]).toContain('100.0% violations');
  });

  test('withPerformanceMonitoring decorator works', async () => {
    const mockFn = vi.fn().mockResolvedValue('result');
    const decoratedFn = withPerformanceMonitoring(
      mockFn,
      'decorated-function',
      1000,
      { decorator: true }
    );
    
    const result = await decoratedFn('arg1', 'arg2');
    
    expect(result).toBe('result');
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    
    const metrics = harvestProPerformanceMonitor.getAllMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe('decorated-function');
    expect(metrics[0].threshold).toBe(1000);
  });

  test('handles errors in decorated functions', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));
    const decoratedFn = withPerformanceMonitoring(
      mockFn,
      'error-function',
      1000
    );
    
    await expect(decoratedFn()).rejects.toThrow('Test error');
    
    const metrics = harvestProPerformanceMonitor.getAllMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe('error-function:error');
  });

  test('clears old metrics', async () => {
    // Add some metrics
    harvestProPerformanceMonitor.recordMetric('old-metric', 100, 200);
    
    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    harvestProPerformanceMonitor.recordMetric('new-metric', 50, 100);
    
    expect(harvestProPerformanceMonitor.getAllMetrics()).toHaveLength(2);
    
    // Clear metrics older than 5ms (should clear the old one)
    harvestProPerformanceMonitor.clearOldMetrics(5);
    
    const remainingMetrics = harvestProPerformanceMonitor.getAllMetrics();
    expect(remainingMetrics).toHaveLength(1);
    expect(remainingMetrics[0].name).toBe('new-metric');
  });

  test('gets metrics in time window', () => {
    const now = Date.now();
    
    // Mock Date.now to control timestamps
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(now - 2000) // 2 seconds ago
      .mockReturnValueOnce(now - 500)  // 500ms ago
      .mockReturnValueOnce(now);       // Now
    
    harvestProPerformanceMonitor.recordMetric('old-metric', 100, 200);
    harvestProPerformanceMonitor.recordMetric('recent-metric', 50, 100);
    harvestProPerformanceMonitor.recordMetric('new-metric', 75, 150);
    
    // Get metrics from last 1 second
    const recentMetrics = harvestProPerformanceMonitor.getMetricsInWindow(1000);
    
    expect(recentMetrics).toHaveLength(2);
    expect(recentMetrics.map(m => m.name)).toEqual(['recent-metric', 'new-metric']);
  });
});