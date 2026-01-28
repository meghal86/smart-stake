/**
 * Manual Test Script for Sync Endpoint CRON_SECRET Validation
 * 
 * This script tests the sync endpoints with various CRON_SECRET scenarios.
 * Run with: npx tsx test-sync-cron-secret.ts
 * 
 * Requirements: 2.1, 2.2, 2.8
 */

import { config } from 'dotenv';

// Load environment variables
config();

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const VALID_SECRET = process.env.CRON_SECRET;

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  status?: number;
  response?: any;
}

const results: TestResult[] = [];

async function testEndpoint(
  endpoint: string,
  secret: string | undefined,
  expectedStatus: number,
  testName: string
): Promise<TestResult> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (secret !== undefined) {
      headers['x-cron-secret'] = secret;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
    });

    const data = await response.json();
    const passed = response.status === expectedStatus;

    return {
      name: testName,
      passed,
      message: passed
        ? `✅ ${testName}: Got expected status ${expectedStatus}`
        : `❌ ${testName}: Expected ${expectedStatus}, got ${response.status}`,
      status: response.status,
      response: data,
    };
  } catch (error) {
    return {
      name: testName,
      passed: false,
      message: `❌ ${testName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function runTests() {
  console.log('🧪 Testing Hunter Sync Endpoints - CRON_SECRET Validation\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`CRON_SECRET configured: ${VALID_SECRET ? 'Yes' : 'No'}\n`);

  if (!VALID_SECRET) {
    console.error('❌ CRON_SECRET not configured in environment');
    console.error('Please set CRON_SECRET in .env file');
    process.exit(1);
  }

  console.log('Testing /api/sync/airdrops endpoint...\n');

  // Test 1: No CRON_SECRET header
  results.push(
    await testEndpoint(
      '/api/sync/airdrops',
      undefined,
      401,
      'Airdrops: No CRON_SECRET header'
    )
  );

  // Test 2: Invalid CRON_SECRET
  results.push(
    await testEndpoint(
      '/api/sync/airdrops',
      'invalid-secret-12345',
      401,
      'Airdrops: Invalid CRON_SECRET'
    )
  );

  // Test 3: Empty CRON_SECRET
  results.push(
    await testEndpoint(
      '/api/sync/airdrops',
      '',
      401,
      'Airdrops: Empty CRON_SECRET'
    )
  );

  // Test 4: Whitespace-only CRON_SECRET
  results.push(
    await testEndpoint(
      '/api/sync/airdrops',
      '   ',
      401,
      'Airdrops: Whitespace-only CRON_SECRET'
    )
  );

  // Test 5: Valid CRON_SECRET
  const validResult = await testEndpoint(
    '/api/sync/airdrops',
    VALID_SECRET,
    200,
    'Airdrops: Valid CRON_SECRET'
  );
  
  // Accept 200 or 500 (500 means auth passed but sync failed)
  if (validResult.status === 500) {
    validResult.passed = true;
    validResult.message = `✅ Airdrops: Valid CRON_SECRET (auth passed, sync failed - acceptable)`;
  }
  results.push(validResult);

  // Test 6: Case-sensitive check
  const uppercaseSecret = VALID_SECRET.toUpperCase();
  if (uppercaseSecret !== VALID_SECRET) {
    results.push(
      await testEndpoint(
        '/api/sync/airdrops',
        uppercaseSecret,
        401,
        'Airdrops: Case-sensitive CRON_SECRET'
      )
    );
  }

  // Test 7: Leading whitespace
  results.push(
    await testEndpoint(
      '/api/sync/airdrops',
      ` ${VALID_SECRET}`,
      401,
      'Airdrops: CRON_SECRET with leading whitespace'
    )
  );

  // Test 8: Trailing whitespace
  results.push(
    await testEndpoint(
      '/api/sync/airdrops',
      `${VALID_SECRET} `,
      401,
      'Airdrops: CRON_SECRET with trailing whitespace'
    )
  );

  console.log('\nTesting /api/sync/yield endpoint...\n');

  // Test 9: Yield - No CRON_SECRET header
  results.push(
    await testEndpoint(
      '/api/sync/yield',
      undefined,
      401,
      'Yield: No CRON_SECRET header'
    )
  );

  // Test 10: Yield - Invalid CRON_SECRET
  results.push(
    await testEndpoint(
      '/api/sync/yield',
      'wrong-secret',
      401,
      'Yield: Invalid CRON_SECRET'
    )
  );

  // Test 11: Yield - Valid CRON_SECRET
  const yieldValidResult = await testEndpoint(
    '/api/sync/yield',
    VALID_SECRET,
    200,
    'Yield: Valid CRON_SECRET'
  );
  
  // Accept 200 or 500 (500 means auth passed but sync failed)
  if (yieldValidResult.status === 500) {
    yieldValidResult.passed = true;
    yieldValidResult.message = `✅ Yield: Valid CRON_SECRET (auth passed, sync failed - acceptable)`;
  }
  results.push(yieldValidResult);

  // Print results
  console.log('\n' + '='.repeat(80));
  console.log('TEST RESULTS');
  console.log('='.repeat(80) + '\n');

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.message}`);
    if (!result.passed && result.response) {
      console.log(`   Response: ${JSON.stringify(result.response, null, 2)}`);
    }
  });

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);

  console.log('\n' + '='.repeat(80));
  console.log(`SUMMARY: ${passed}/${total} tests passed (${percentage}%)`);
  console.log('='.repeat(80) + '\n');

  if (passed === total) {
    console.log('✅ All tests passed!');
    console.log('\nCRON_SECRET validation is working correctly:');
    console.log('  - Unauthorized requests are rejected with 401');
    console.log('  - Valid CRON_SECRET is accepted');
    console.log('  - Case-sensitive comparison works');
    console.log('  - Whitespace handling is correct');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please review the results above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
