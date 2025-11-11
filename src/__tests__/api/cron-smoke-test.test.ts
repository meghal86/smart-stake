/**
 * Unit tests for smoke test cron endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/cron/smoke-test/route';
import { NextRequest } from 'next/server';
import * as smokeTests from '@/lib/monitoring/smoke-tests';

// Mock the smoke test module
vi.mock('@/lib/monitoring/smoke-tests', () => ({
  runAllSmokeTests: vi.fn(),
  shouldAlert: vi.fn(),
  formatReport: vi.fn(),
  sendAlert: vi.fn(),
  DEFAULT_CONFIG: {
    endpoint: '/api/hunter/opportunities?mode=fixtures',
    timeout: 10000,
    expectedStatus: 200,
    maxLatency: 2000,
    regions: [
      { code: 'us-east-1', name: 'US East' },
      { code: 'eu-west-1', name: 'EU West' },
      { code: 'ap-southeast-1', name: 'APAC' },
    ],
  },
}));

describe('Smoke Test Cron Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  });

  const createRequest = (headers: Record<string, string> = {}) => {
    return new NextRequest('https://example.com/api/cron/smoke-test', {
      headers: new Headers({
        host: 'example.com',
        ...headers,
      }),
    });
  };

  it('should run smoke tests and return success when all pass', async () => {
    const mockReport = {
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
      ],
      summary: {
        totalTests: 1,
        passed: 1,
        failed: 0,
        avgLatency: 150,
        maxLatency: 150,
      },
    };

    vi.mocked(smokeTests.runAllSmokeTests).mockResolvedValueOnce(mockReport);
    vi.mocked(smokeTests.shouldAlert).mockReturnValueOnce({
      alert: false,
      reasons: [],
    });
    vi.mocked(smokeTests.formatReport).mockReturnValueOnce('Report');

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.report).toEqual(mockReport);
    expect(data.alert.triggered).toBe(false);
    expect(smokeTests.sendAlert).not.toHaveBeenCalled();
  });

  it('should trigger alert when tests fail', async () => {
    const mockReport = {
      testId: 'smoke-123',
      timestamp: '2025-01-10T12:00:00.000Z',
      results: [
        {
          success: false,
          region: 'us-east-1',
          latency: 5000,
          error: 'Timeout',
          timestamp: '2025-01-10T12:00:00.000Z',
        },
      ],
      summary: {
        totalTests: 1,
        passed: 0,
        failed: 1,
        avgLatency: 5000,
        maxLatency: 5000,
      },
    };

    const reasons = ['1 region(s) failed', 'Max latency exceeded'];

    vi.mocked(smokeTests.runAllSmokeTests).mockResolvedValueOnce(mockReport);
    vi.mocked(smokeTests.shouldAlert).mockReturnValueOnce({
      alert: true,
      reasons,
    });
    vi.mocked(smokeTests.formatReport).mockReturnValueOnce('Report');

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.alert.triggered).toBe(true);
    expect(data.alert.reasons).toEqual(reasons);
    expect(smokeTests.sendAlert).toHaveBeenCalledWith(mockReport, reasons);
  });

  it('should verify cron secret when configured', async () => {
    process.env.CRON_SECRET = 'test-secret';

    const req = createRequest();
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it('should allow request with valid cron secret', async () => {
    process.env.CRON_SECRET = 'test-secret';

    const mockReport = {
      testId: 'smoke-123',
      timestamp: '2025-01-10T12:00:00.000Z',
      results: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        avgLatency: 0,
        maxLatency: 0,
      },
    };

    vi.mocked(smokeTests.runAllSmokeTests).mockResolvedValueOnce(mockReport);
    vi.mocked(smokeTests.shouldAlert).mockReturnValueOnce({
      alert: false,
      reasons: [],
    });
    vi.mocked(smokeTests.formatReport).mockReturnValueOnce('Report');

    const req = createRequest({
      authorization: 'Bearer test-secret',
    });
    const response = await GET(req);

    expect(response.status).toBe(200);
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(smokeTests.runAllSmokeTests).mockRejectedValueOnce(
      new Error('Test error')
    );

    const req = createRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Test error');
    expect(smokeTests.sendAlert).toHaveBeenCalled();
  });

  it('should use NEXT_PUBLIC_APP_URL when available', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://custom-url.com';

    const mockReport = {
      testId: 'smoke-123',
      timestamp: '2025-01-10T12:00:00.000Z',
      results: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        avgLatency: 0,
        maxLatency: 0,
      },
    };

    vi.mocked(smokeTests.runAllSmokeTests).mockResolvedValueOnce(mockReport);
    vi.mocked(smokeTests.shouldAlert).mockReturnValueOnce({
      alert: false,
      reasons: [],
    });
    vi.mocked(smokeTests.formatReport).mockReturnValueOnce('Report');

    const req = createRequest();
    await GET(req);

    expect(smokeTests.runAllSmokeTests).toHaveBeenCalledWith(
      'https://custom-url.com',
      expect.any(Object)
    );
  });

  it('should fall back to host header when NEXT_PUBLIC_APP_URL not set', async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;

    const mockReport = {
      testId: 'smoke-123',
      timestamp: '2025-01-10T12:00:00.000Z',
      results: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        avgLatency: 0,
        maxLatency: 0,
      },
    };

    vi.mocked(smokeTests.runAllSmokeTests).mockResolvedValueOnce(mockReport);
    vi.mocked(smokeTests.shouldAlert).mockReturnValueOnce({
      alert: false,
      reasons: [],
    });
    vi.mocked(smokeTests.formatReport).mockReturnValueOnce('Report');

    const req = createRequest();
    await GET(req);

    expect(smokeTests.runAllSmokeTests).toHaveBeenCalledWith(
      'https://example.com',
      expect.any(Object)
    );
  });
});
