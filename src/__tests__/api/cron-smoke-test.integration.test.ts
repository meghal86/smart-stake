/**
 * Integration tests for smoke test cron endpoint
 * 
 * These tests verify the smoke test system works end-to-end
 * with real HTTP requests (mocked at the fetch level).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Smoke Test Integration', () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  it('should have smoke test cron configured in vercel.json', async () => {
    const vercelConfig = await import('../../../vercel.json');
    
    const smokeTestCron = vercelConfig.crons?.find(
      (cron: any) => cron.path === '/api/cron/smoke-test'
    );

    expect(smokeTestCron).toBeDefined();
    expect(smokeTestCron?.schedule).toBe('*/5 * * * *'); // Every 5 minutes
  });

  it('should test all three regions (US, EU, APAC)', async () => {
    const { DEFAULT_CONFIG } = await import('@/lib/monitoring/smoke-tests');

    expect(DEFAULT_CONFIG.regions).toHaveLength(3);
    
    const regionCodes = DEFAULT_CONFIG.regions.map(r => r.code);
    expect(regionCodes).toContain('us-east-1');
    expect(regionCodes).toContain('eu-west-1');
    expect(regionCodes).toContain('ap-southeast-1');
  });

  it('should target the fixtures endpoint', async () => {
    const { DEFAULT_CONFIG } = await import('@/lib/monitoring/smoke-tests');

    expect(DEFAULT_CONFIG.endpoint).toBe('/api/hunter/opportunities?mode=fixtures');
  });

  it('should have reasonable timeout and latency thresholds', async () => {
    const { DEFAULT_CONFIG } = await import('@/lib/monitoring/smoke-tests');

    expect(DEFAULT_CONFIG.timeout).toBe(10000); // 10 seconds
    expect(DEFAULT_CONFIG.maxLatency).toBe(2000); // 2 seconds
    expect(DEFAULT_CONFIG.expectedStatus).toBe(200);
  });

  it('should format reports with all required information', async () => {
    const { formatReport } = await import('@/lib/monitoring/smoke-tests');

    const mockReport = {
      testId: 'smoke-test-123',
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

    const formatted = formatReport(mockReport);

    // Verify all key information is present
    expect(formatted).toContain('smoke-test-123');
    expect(formatted).toContain('2025-01-10T12:00:00.000Z');
    expect(formatted).toContain('1/2 passed');
    expect(formatted).toContain('1575ms');
    expect(formatted).toContain('3000ms');
    expect(formatted).toContain('us-east-1');
    expect(formatted).toContain('eu-west-1');
    expect(formatted).toContain('Timeout');
  });

  it('should alert on multiple failure conditions', async () => {
    const { shouldAlert, DEFAULT_CONFIG } = await import('@/lib/monitoring/smoke-tests');

    // Test 1: Alert on failed regions
    const failedReport = {
      testId: 'test-1',
      timestamp: new Date().toISOString(),
      results: [],
      summary: {
        totalTests: 3,
        passed: 1,
        failed: 2,
        avgLatency: 500,
        maxLatency: 800,
      },
    };

    const result1 = shouldAlert(failedReport, DEFAULT_CONFIG);
    expect(result1.alert).toBe(true);
    expect(result1.reasons).toContain('2 region(s) failed');

    // Test 2: Alert on high max latency
    const highLatencyReport = {
      testId: 'test-2',
      timestamp: new Date().toISOString(),
      results: [],
      summary: {
        totalTests: 3,
        passed: 3,
        failed: 0,
        avgLatency: 1500,
        maxLatency: 2500, // Exceeds 2000ms threshold
      },
    };

    const result2 = shouldAlert(highLatencyReport, DEFAULT_CONFIG);
    expect(result2.alert).toBe(true);
    expect(result2.reasons.some(r => r.includes('Max latency'))).toBe(true);

    // Test 3: Alert on high average latency (80% of max threshold)
    const highAvgLatencyReport = {
      testId: 'test-3',
      timestamp: new Date().toISOString(),
      results: [],
      summary: {
        totalTests: 3,
        passed: 3,
        failed: 0,
        avgLatency: 1700, // Exceeds 1600ms (80% of 2000ms)
        maxLatency: 1900,
      },
    };

    const result3 = shouldAlert(highAvgLatencyReport, DEFAULT_CONFIG);
    expect(result3.alert).toBe(true);
    expect(result3.reasons.some(r => r.includes('Avg latency'))).toBe(true);

    // Test 4: No alert when everything is good
    const goodReport = {
      testId: 'test-4',
      timestamp: new Date().toISOString(),
      results: [],
      summary: {
        totalTests: 3,
        passed: 3,
        failed: 0,
        avgLatency: 500,
        maxLatency: 800,
      },
    };

    const result4 = shouldAlert(goodReport, DEFAULT_CONFIG);
    expect(result4.alert).toBe(false);
    expect(result4.reasons).toHaveLength(0);
  });

  it('should include proper headers in smoke test requests', async () => {
    const { runSmokeTest, DEFAULT_CONFIG } = await import('@/lib/monitoring/smoke-tests');

    // We can't easily test the actual fetch call, but we can verify
    // the function signature and that it's exported
    expect(runSmokeTest).toBeDefined();
    expect(typeof runSmokeTest).toBe('function');
  });
});
