/**
 * Synthetic Smoke Tests for Hunter Screen API
 * 
 * This module provides uptime checks for the Hunter Screen API
 * from multiple regions (US, EU, APAC) to ensure availability
 * and performance.
 * 
 * Requirements: 14.1-14.6
 */

export interface SmokeTestConfig {
  endpoint: string;
  timeout: number;
  expectedStatus: number;
  maxLatency: number;
  regions: Region[];
}

export interface Region {
  code: string;
  name: string;
  endpoint?: string; // Optional regional endpoint
}

export interface SmokeTestResult {
  success: boolean;
  region: string;
  latency: number;
  status?: number;
  error?: string;
  timestamp: string;
}

export interface SmokeTestReport {
  testId: string;
  timestamp: string;
  results: SmokeTestResult[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    avgLatency: number;
    maxLatency: number;
  };
}

// Default configuration
export const DEFAULT_CONFIG: SmokeTestConfig = {
  endpoint: '/api/hunter/opportunities?mode=fixtures',
  timeout: 10000, // 10 seconds
  expectedStatus: 200,
  maxLatency: 2000, // 2 seconds (alert threshold)
  regions: [
    { code: 'us-east-1', name: 'US East (Virginia)' },
    { code: 'eu-west-1', name: 'EU West (Ireland)' },
    { code: 'ap-southeast-1', name: 'APAC (Singapore)' },
  ],
};

/**
 * Run a smoke test from a specific region
 */
export async function runSmokeTest(
  baseUrl: string,
  config: SmokeTestConfig = DEFAULT_CONFIG,
  region: Region
): Promise<SmokeTestResult> {
  const startTime = Date.now();
  const url = `${baseUrl}${config.endpoint}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': `AlphaWhale-SmokeTest/${region.code}`,
        'X-Smoke-Test': 'true',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const latency = Date.now() - startTime;
    const success = response.status === config.expectedStatus;

    return {
      success,
      region: region.code,
      latency,
      status: response.status,
      timestamp: new Date().toISOString(),
      ...(success ? {} : { error: `Unexpected status: ${response.status}` }),
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      success: false,
      region: region.code,
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Run smoke tests from all configured regions
 */
export async function runAllSmokeTests(
  baseUrl: string,
  config: SmokeTestConfig = DEFAULT_CONFIG
): Promise<SmokeTestReport> {
  const testId = `smoke-${Date.now()}`;
  const timestamp = new Date().toISOString();

  // Run tests in parallel from all regions
  const results = await Promise.all(
    config.regions.map((region) => runSmokeTest(baseUrl, config, region))
  );

  // Calculate summary
  const passed = results.filter((r) => r.success).length;
  const failed = results.length - passed;
  const latencies = results.map((r) => r.latency);
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const maxLatency = Math.max(...latencies);

  return {
    testId,
    timestamp,
    results,
    summary: {
      totalTests: results.length,
      passed,
      failed,
      avgLatency: Math.round(avgLatency),
      maxLatency,
    },
  };
}

/**
 * Check if smoke test results should trigger an alert
 */
export function shouldAlert(
  report: SmokeTestReport,
  config: SmokeTestConfig = DEFAULT_CONFIG
): { alert: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Alert if any test failed
  if (report.summary.failed > 0) {
    reasons.push(`${report.summary.failed} region(s) failed`);
  }

  // Alert if max latency exceeds threshold
  if (report.summary.maxLatency > config.maxLatency) {
    reasons.push(
      `Max latency ${report.summary.maxLatency}ms exceeds threshold ${config.maxLatency}ms`
    );
  }

  // Alert if average latency is too high (80% of max threshold)
  const avgThreshold = config.maxLatency * 0.8;
  if (report.summary.avgLatency > avgThreshold) {
    reasons.push(
      `Avg latency ${report.summary.avgLatency}ms exceeds threshold ${avgThreshold}ms`
    );
  }

  return {
    alert: reasons.length > 0,
    reasons,
  };
}

/**
 * Format smoke test report for logging
 */
export function formatReport(report: SmokeTestReport): string {
  const lines = [
    `Smoke Test Report: ${report.testId}`,
    `Timestamp: ${report.timestamp}`,
    `Summary: ${report.summary.passed}/${report.summary.totalTests} passed`,
    `Avg Latency: ${report.summary.avgLatency}ms`,
    `Max Latency: ${report.summary.maxLatency}ms`,
    '',
    'Results by Region:',
  ];

  for (const result of report.results) {
    const status = result.success ? '✓' : '✗';
    const details = result.success
      ? `${result.latency}ms`
      : `${result.error} (${result.latency}ms)`;
    lines.push(`  ${status} ${result.region}: ${details}`);
  }

  return lines.join('\n');
}

/**
 * Send alert notification (placeholder for integration with alerting service)
 */
export async function sendAlert(
  report: SmokeTestReport,
  reasons: string[]
): Promise<void> {
  // This would integrate with your alerting service (PagerDuty, Slack, etc.)
  console.error('🚨 SMOKE TEST ALERT', {
    testId: report.testId,
    timestamp: report.timestamp,
    reasons,
    summary: report.summary,
    results: report.results,
  });

  // TODO: Integrate with actual alerting service
  // Examples:
  // - await sendSlackAlert(report, reasons);
  // - await sendPagerDutyAlert(report, reasons);
  // - await sendEmailAlert(report, reasons);
}
