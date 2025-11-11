/**
 * Unit tests for smoke test functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  runSmokeTest,
  runAllSmokeTests,
  shouldAlert,
  formatReport,
  DEFAULT_CONFIG,
  type Region,
  type SmokeTestReport,
} from '@/lib/monitoring/smoke-tests';

// Mock fetch
global.fetch = vi.fn();

describe('Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('runSmokeTest', () => {
    it('should return success for 200 response', async () => {
      const mockResponse = {
        status: 200,
        ok: true,
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const region: Region = { code: 'us-east-1', name: 'US East' };
      const result = await runSmokeTest('https://example.com', DEFAULT_CONFIG, region);

      expect(result.success).toBe(true);
      expect(result.region).toBe('us-east-1');
      expect(result.status).toBe(200);
      expect(result.latency).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });

    it('should return failure for non-200 response', async () => {
      const mockResponse = {
        status: 500,
        ok: false,
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const region: Region = { code: 'us-east-1', name: 'US East' };
      const result = await runSmokeTest('https://example.com', DEFAULT_CONFIG, region);

      expect(result.success).toBe(false);
      expect(result.status).toBe(500);
      expect(result.error).toContain('Unexpected status: 500');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const region: Region = { code: 'us-east-1', name: 'US East' };
      const result = await runSmokeTest('https://example.com', DEFAULT_CONFIG, region);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle timeout', async () => {
      // Mock a slow response that will be aborted
      (global.fetch as any).mockImplementationOnce(
        (_url: string, options: any) =>
          new Promise((resolve, reject) => {
            // Simulate abort signal
            if (options.signal) {
              options.signal.addEventListener('abort', () => {
                reject(new Error('The operation was aborted'));
              });
            }
            // Never resolve to simulate timeout
          })
      );

      const config = { ...DEFAULT_CONFIG, timeout: 100 };
      const region: Region = { code: 'us-east-1', name: 'US East' };
      const result = await runSmokeTest('https://example.com', config, region);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should include correct headers', async () => {
      const mockResponse = { status: 200, ok: true };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const region: Region = { code: 'eu-west-1', name: 'EU West' };
      await runSmokeTest('https://example.com', DEFAULT_CONFIG, region);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/api/hunter/opportunities?mode=fixtures',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'AlphaWhale-SmokeTest/eu-west-1',
            'X-Smoke-Test': 'true',
          }),
        })
      );
    });
  });

  describe('runAllSmokeTests', () => {
    it('should run tests from all regions in parallel', async () => {
      const mockResponse = { status: 200, ok: true };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const report = await runAllSmokeTests('https://example.com', DEFAULT_CONFIG);

      expect(report.results).toHaveLength(3);
      expect(report.summary.totalTests).toBe(3);
      expect(report.summary.passed).toBe(3);
      expect(report.summary.failed).toBe(0);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should calculate correct summary statistics', async () => {
      // Mock different latencies
      let callCount = 0;
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        return new Promise((resolve) => {
          setTimeout(() => resolve({ status: 200, ok: true }), callCount * 50);
        });
      });

      const report = await runAllSmokeTests('https://example.com', DEFAULT_CONFIG);

      expect(report.summary.avgLatency).toBeGreaterThan(0);
      expect(report.summary.maxLatency).toBeGreaterThanOrEqual(report.summary.avgLatency);
    });

    it('should handle mixed success and failure', async () => {
      let callCount = 0;
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          status: callCount === 2 ? 500 : 200,
          ok: callCount !== 2,
        });
      });

      const report = await runAllSmokeTests('https://example.com', DEFAULT_CONFIG);

      expect(report.summary.passed).toBe(2);
      expect(report.summary.failed).toBe(1);
    });
  });

  describe('shouldAlert', () => {
    const createReport = (overrides: Partial<SmokeTestReport>): SmokeTestReport => ({
      testId: 'test-123',
      timestamp: new Date().toISOString(),
      results: [],
      summary: {
        totalTests: 3,
        passed: 3,
        failed: 0,
        avgLatency: 100,
        maxLatency: 150,
      },
      ...overrides,
    });

    it('should not alert when all tests pass with good latency', () => {
      const report = createReport({});
      const { alert, reasons } = shouldAlert(report, DEFAULT_CONFIG);

      expect(alert).toBe(false);
      expect(reasons).toHaveLength(0);
    });

    it('should alert when tests fail', () => {
      const report = createReport({
        summary: {
          totalTests: 3,
          passed: 2,
          failed: 1,
          avgLatency: 100,
          maxLatency: 150,
        },
      });
      const { alert, reasons } = shouldAlert(report, DEFAULT_CONFIG);

      expect(alert).toBe(true);
      expect(reasons).toContain('1 region(s) failed');
    });

    it('should alert when max latency exceeds threshold', () => {
      const report = createReport({
        summary: {
          totalTests: 3,
          passed: 3,
          failed: 0,
          avgLatency: 1500,
          maxLatency: 2500,
        },
      });
      const { alert, reasons } = shouldAlert(report, DEFAULT_CONFIG);

      expect(alert).toBe(true);
      expect(reasons.some((r) => r.includes('Max latency'))).toBe(true);
    });

    it('should alert when average latency is too high', () => {
      const report = createReport({
        summary: {
          totalTests: 3,
          passed: 3,
          failed: 0,
          avgLatency: 1700, // > 80% of 2000ms threshold
          maxLatency: 1900,
        },
      });
      const { alert, reasons } = shouldAlert(report, DEFAULT_CONFIG);

      expect(alert).toBe(true);
      expect(reasons.some((r) => r.includes('Avg latency'))).toBe(true);
    });

    it('should include multiple reasons when multiple conditions fail', () => {
      const report = createReport({
        summary: {
          totalTests: 3,
          passed: 1,
          failed: 2,
          avgLatency: 1800,
          maxLatency: 2500,
        },
      });
      const { alert, reasons } = shouldAlert(report, DEFAULT_CONFIG);

      expect(alert).toBe(true);
      expect(reasons.length).toBeGreaterThan(1);
    });
  });

  describe('formatReport', () => {
    it('should format report with all details', () => {
      const report: SmokeTestReport = {
        testId: 'smoke-123',
        timestamp: '2025-01-10T12:00:00.000Z',
        results: [
          {
            success: true,
            region: 'us-east-1',
            latency: 150,
            status: 200,
            timestamp: '2025-01-10T12:00:00.000Z',
          },
          {
            success: false,
            region: 'eu-west-1',
            latency: 3000,
            error: 'Timeout',
            timestamp: '2025-01-10T12:00:00.000Z',
          },
        ],
        summary: {
          totalTests: 2,
          passed: 1,
          failed: 1,
          avgLatency: 1575,
          maxLatency: 3000,
        },
      };

      const formatted = formatReport(report);

      expect(formatted).toContain('smoke-123');
      expect(formatted).toContain('1/2 passed');
      expect(formatted).toContain('1575ms');
      expect(formatted).toContain('3000ms');
      expect(formatted).toContain('✓ us-east-1');
      expect(formatted).toContain('✗ eu-west-1');
      expect(formatted).toContain('Timeout');
    });
  });
});
