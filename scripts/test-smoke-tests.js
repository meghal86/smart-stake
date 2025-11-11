#!/usr/bin/env node

/**
 * Manual Smoke Test Runner
 * 
 * This script allows you to manually trigger smoke tests
 * and verify they're working correctly.
 * 
 * Usage:
 *   node scripts/test-smoke-tests.js [url]
 * 
 * Examples:
 *   node scripts/test-smoke-tests.js
 *   node scripts/test-smoke-tests.js https://your-app.vercel.app
 *   CRON_SECRET=your-secret node scripts/test-smoke-tests.js https://your-app.vercel.app
 */

const https = require('https');
const http = require('http');

const baseUrl = process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const cronSecret = process.env.CRON_SECRET;

console.log('🔍 Testing Smoke Test System');
console.log('━'.repeat(60));
console.log(`Base URL: ${baseUrl}`);
console.log(`Cron Secret: ${cronSecret ? '✓ Configured' : '✗ Not configured'}`);
console.log('━'.repeat(60));
console.log();

// Parse URL
const url = new URL('/api/cron/smoke-test', baseUrl);
const isHttps = url.protocol === 'https:';
const client = isHttps ? https : http;

// Prepare request options
const options = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname,
  method: 'GET',
  headers: {
    'User-Agent': 'AlphaWhale-SmokeTest-Manual',
  },
};

// Add authorization header if secret is provided
if (cronSecret) {
  options.headers['Authorization'] = `Bearer ${cronSecret}`;
}

console.log('📡 Sending request to smoke test endpoint...');
console.log();

const req = client.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log();

    if (res.statusCode === 401) {
      console.error('❌ Unauthorized - CRON_SECRET may be required or incorrect');
      console.log();
      console.log('Try setting CRON_SECRET environment variable:');
      console.log('  CRON_SECRET=your-secret node scripts/test-smoke-tests.js');
      process.exit(1);
    }

    try {
      const result = JSON.parse(data);
      
      console.log('📊 Smoke Test Results');
      console.log('━'.repeat(60));
      
      if (result.report) {
        const { report, alert } = result;
        
        console.log(`Test ID: ${report.testId}`);
        console.log(`Timestamp: ${report.timestamp}`);
        console.log();
        
        console.log('Summary:');
        console.log(`  Total Tests: ${report.summary.totalTests}`);
        console.log(`  Passed: ${report.summary.passed}`);
        console.log(`  Failed: ${report.summary.failed}`);
        console.log(`  Avg Latency: ${report.summary.avgLatency}ms`);
        console.log(`  Max Latency: ${report.summary.maxLatency}ms`);
        console.log();
        
        console.log('Results by Region:');
        report.results.forEach((r) => {
          const status = r.success ? '✓' : '✗';
          const details = r.success
            ? `${r.latency}ms (status: ${r.status})`
            : `${r.error} (${r.latency}ms)`;
          console.log(`  ${status} ${r.region}: ${details}`);
        });
        console.log();
        
        if (alert && alert.triggered) {
          console.log('🚨 ALERT TRIGGERED');
          console.log('Reasons:');
          alert.reasons.forEach((reason) => {
            console.log(`  - ${reason}`);
          });
          console.log();
        } else {
          console.log('✅ All checks passed - No alerts triggered');
          console.log();
        }
        
        // Exit with appropriate code
        if (result.success) {
          console.log('✅ Smoke tests completed successfully');
          process.exit(0);
        } else {
          console.log('❌ Smoke tests failed');
          process.exit(1);
        }
      } else if (result.error) {
        console.error('❌ Error:', result.error);
        process.exit(1);
      } else {
        console.log('Response:', JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
      console.log('Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log();
  console.log('Troubleshooting:');
  console.log('  1. Verify the URL is correct');
  console.log('  2. Check if the server is running');
  console.log('  3. Verify network connectivity');
  process.exit(1);
});

req.end();
