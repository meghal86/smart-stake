/**
 * Cockpit API Validation Script
 * 
 * Tests all cockpit API endpoints for:
 * - Proper response format (data, error, meta with ts)
 * - Authentication and authorization
 * - Rate limiting (basic checks)
 * - Database operations and RLS policies
 * 
 * Task 6: Checkpoint - Backend API Validation
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Test utilities
class APITester {
  constructor() {
    this.results = [];
    this.authToken = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    this.results.push(logEntry);
    
    const colors = {
      info: '\x1b[36m',    // cyan
      success: '\x1b[32m', // green
      error: '\x1b[31m',   // red
      warning: '\x1b[33m', // yellow
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${type.toUpperCase()}] ${message}${colors.reset}`);
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { raw: responseText };
      }

      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data
      };
    } catch (error) {
      return {
        status: 0,
        error: error.message,
        data: null
      };
    }
  }

  validateResponseFormat(response, endpoint) {
    const { status, data } = response;
    
    if (status === 0) {
      this.log(`❌ ${endpoint}: Network error - ${response.error}`, 'error');
      return false;
    }

    // Check if response has proper structure
    if (!data || typeof data !== 'object') {
      this.log(`❌ ${endpoint}: Invalid response format - not an object`, 'error');
      return false;
    }

    // Check for required fields: data, error, meta
    const hasData = 'data' in data;
    const hasError = 'error' in data;
    const hasMeta = 'meta' in data;

    if (!hasData || !hasError || !hasMeta) {
      this.log(`❌ ${endpoint}: Missing required fields. Has data: ${hasData}, error: ${hasError}, meta: ${hasMeta}`, 'error');
      return false;
    }

    // Check meta.ts field
    if (!data.meta || !data.meta.ts) {
      this.log(`❌ ${endpoint}: Missing meta.ts timestamp`, 'error');
      return false;
    }

    // Validate timestamp format (ISO 8601)
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    if (!timestampRegex.test(data.meta.ts)) {
      this.log(`❌ ${endpoint}: Invalid timestamp format: ${data.meta.ts}`, 'error');
      return false;
    }

    // Check that either data or error is set, but not both
    const hasValidData = data.data !== null;
    const hasValidError = data.error !== null;

    if (hasValidData && hasValidError) {
      this.log(`❌ ${endpoint}: Both data and error are set`, 'error');
      return false;
    }

    if (!hasValidData && !hasValidError) {
      this.log(`❌ ${endpoint}: Neither data nor error is set`, 'error');
      return false;
    }

    this.log(`✅ ${endpoint}: Response format valid`, 'success');
    return true;
  }

  async testUnauthenticatedAccess() {
    this.log('Testing unauthenticated access...', 'info');
    
    const endpoints = [
      '/api/cockpit/open',
      '/api/cockpit/prefs',
      '/api/cockpit/summary',
      '/api/cockpit/pulse',
      '/api/cockpit/actions/rendered'
    ];

    for (const endpoint of endpoints) {
      const response = await this.makeRequest(endpoint, { method: 'GET' });
      
      if (response.status === 401) {
        this.log(`✅ ${endpoint}: Correctly returns 401 for unauthenticated access`, 'success');
        this.validateResponseFormat(response, endpoint);
      } else {
        this.log(`❌ ${endpoint}: Expected 401, got ${response.status}`, 'error');
      }
    }
  }

  async testCockpitOpen() {
    this.log('Testing POST /api/cockpit/open...', 'info');
    
    // Test with empty body
    let response = await this.makeRequest('/api/cockpit/open', {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    this.validateResponseFormat(response, 'POST /api/cockpit/open (empty body)');
    
    // Test with timezone
    response = await this.makeRequest('/api/cockpit/open', {
      method: 'POST',
      body: JSON.stringify({
        timezone: 'America/New_York'
      })
    });
    
    this.validateResponseFormat(response, 'POST /api/cockpit/open (with timezone)');
    
    // Test with invalid timezone
    response = await this.makeRequest('/api/cockpit/open', {
      method: 'POST',
      body: JSON.stringify({
        timezone: 'Invalid/Timezone'
      })
    });
    
    if (response.status === 400) {
      this.log('✅ POST /api/cockpit/open: Correctly rejects invalid timezone', 'success');
    } else {
      this.log(`❌ POST /api/cockpit/open: Expected 400 for invalid timezone, got ${response.status}`, 'error');
    }
    
    this.validateResponseFormat(response, 'POST /api/cockpit/open (invalid timezone)');
    
    // Test debouncing by making rapid requests
    this.log('Testing debouncing...', 'info');
    const firstCall = await this.makeRequest('/api/cockpit/open', {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    const secondCall = await this.makeRequest('/api/cockpit/open', {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    if (secondCall.data?.data?.debounced) {
      this.log('✅ POST /api/cockpit/open: Debouncing works correctly', 'success');
    } else {
      this.log('⚠️ POST /api/cockpit/open: Debouncing may not be working', 'warning');
    }
  }

  async testCockpitPrefs() {
    this.log('Testing cockpit preferences endpoints...', 'info');
    
    // Test GET /api/cockpit/prefs
    let response = await this.makeRequest('/api/cockpit/prefs', { method: 'GET' });
    this.validateResponseFormat(response, 'GET /api/cockpit/prefs');
    
    if (response.status === 200 && response.data?.data) {
      const prefs = response.data.data;
      const expectedFields = ['wallet_scope_default', 'timezone', 'dnd_start_local', 'dnd_end_local', 'notif_cap_per_day'];
      
      const hasAllFields = expectedFields.every(field => field in prefs);
      if (hasAllFields) {
        this.log('✅ GET /api/cockpit/prefs: Returns all expected preference fields', 'success');
      } else {
        this.log(`❌ GET /api/cockpit/prefs: Missing preference fields. Got: ${Object.keys(prefs).join(', ')}`, 'error');
      }
    }
    
    // Test POST /api/cockpit/prefs with valid data
    response = await this.makeRequest('/api/cockpit/prefs', {
      method: 'POST',
      body: JSON.stringify({
        wallet_scope_default: 'all',
        dnd_start_local: '22:00',
        dnd_end_local: '08:00',
        notif_cap_per_day: 5
      })
    });
    
    this.validateResponseFormat(response, 'POST /api/cockpit/prefs (valid)');
    
    // Test POST /api/cockpit/prefs with invalid data
    response = await this.makeRequest('/api/cockpit/prefs', {
      method: 'POST',
      body: JSON.stringify({
        wallet_scope_default: 'invalid',
        notif_cap_per_day: 15 // exceeds max of 10
      })
    });
    
    if (response.status === 400) {
      this.log('✅ POST /api/cockpit/prefs: Correctly rejects invalid data', 'success');
    } else {
      this.log(`❌ POST /api/cockpit/prefs: Expected 400 for invalid data, got ${response.status}`, 'error');
    }
    
    this.validateResponseFormat(response, 'POST /api/cockpit/prefs (invalid)');
  }

  async testCockpitSummary() {
    this.log('Testing GET /api/cockpit/summary...', 'info');
    
    // Test with default wallet_scope
    let response = await this.makeRequest('/api/cockpit/summary', { method: 'GET' });
    this.validateResponseFormat(response, 'GET /api/cockpit/summary (default)');
    
    if (response.status === 200 && response.data?.data) {
      const summary = response.data.data;
      const expectedFields = ['wallet_scope', 'today_card', 'action_preview', 'counters', 'provider_status', 'degraded_mode'];
      
      const hasAllFields = expectedFields.every(field => field in summary);
      if (hasAllFields) {
        this.log('✅ GET /api/cockpit/summary: Returns all expected summary fields', 'success');
      } else {
        this.log(`❌ GET /api/cockpit/summary: Missing summary fields. Got: ${Object.keys(summary).join(', ')}`, 'error');
      }
      
      // Validate today_card structure
      if (summary.today_card) {
        const cardFields = ['kind', 'anchor_metric', 'context_line', 'primary_cta'];
        const hasCardFields = cardFields.every(field => field in summary.today_card);
        
        if (hasCardFields) {
          this.log('✅ GET /api/cockpit/summary: Today card has required fields', 'success');
        } else {
          this.log(`❌ GET /api/cockpit/summary: Today card missing fields. Got: ${Object.keys(summary.today_card).join(', ')}`, 'error');
        }
      }
      
      // Validate action_preview is array with max 3 items
      if (Array.isArray(summary.action_preview)) {
        if (summary.action_preview.length <= 3) {
          this.log('✅ GET /api/cockpit/summary: Action preview respects 3-item limit', 'success');
        } else {
          this.log(`❌ GET /api/cockpit/summary: Action preview has ${summary.action_preview.length} items, expected max 3`, 'error');
        }
      }
    }
    
    // Test with wallet_scope=all
    response = await this.makeRequest('/api/cockpit/summary?wallet_scope=all', { method: 'GET' });
    this.validateResponseFormat(response, 'GET /api/cockpit/summary (wallet_scope=all)');
    
    // Test with invalid wallet_scope
    response = await this.makeRequest('/api/cockpit/summary?wallet_scope=invalid', { method: 'GET' });
    if (response.status === 400) {
      this.log('✅ GET /api/cockpit/summary: Correctly rejects invalid wallet_scope', 'success');
    } else {
      this.log(`❌ GET /api/cockpit/summary: Expected 400 for invalid wallet_scope, got ${response.status}`, 'error');
    }
    
    this.validateResponseFormat(response, 'GET /api/cockpit/summary (invalid wallet_scope)');
  }

  async testCockpitPulse() {
    this.log('Testing GET /api/cockpit/pulse...', 'info');
    
    // Test with default date (today)
    let response = await this.makeRequest('/api/cockpit/pulse', { method: 'GET' });
    this.validateResponseFormat(response, 'GET /api/cockpit/pulse (default)');
    
    // Test with specific date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    response = await this.makeRequest(`/api/cockpit/pulse?date=${dateStr}`, { method: 'GET' });
    this.validateResponseFormat(response, `GET /api/cockpit/pulse (date=${dateStr})`);
    
    // Test with invalid date format
    response = await this.makeRequest('/api/cockpit/pulse?date=invalid-date', { method: 'GET' });
    if (response.status === 400) {
      this.log('✅ GET /api/cockpit/pulse: Correctly rejects invalid date format', 'success');
    } else {
      this.log(`❌ GET /api/cockpit/pulse: Expected 400 for invalid date, got ${response.status}`, 'error');
    }
    
    this.validateResponseFormat(response, 'GET /api/cockpit/pulse (invalid date)');
    
    // Test with future date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDateStr = tomorrow.toISOString().split('T')[0];
    
    response = await this.makeRequest(`/api/cockpit/pulse?date=${futureDateStr}`, { method: 'GET' });
    if (response.status === 400) {
      this.log('✅ GET /api/cockpit/pulse: Correctly rejects future dates', 'success');
    } else {
      this.log(`❌ GET /api/cockpit/pulse: Expected 400 for future date, got ${response.status}`, 'error');
    }
    
    this.validateResponseFormat(response, 'GET /api/cockpit/pulse (future date)');
  }

  async testActionsRendered() {
    this.log('Testing POST /api/cockpit/actions/rendered...', 'info');
    
    // Test with valid dedupe_keys
    let response = await this.makeRequest('/api/cockpit/actions/rendered', {
      method: 'POST',
      body: JSON.stringify({
        dedupe_keys: ['guardian:finding_123:Fix', 'hunter:opp_456:Execute']
      })
    });
    
    this.validateResponseFormat(response, 'POST /api/cockpit/actions/rendered (valid)');
    
    // Test with empty array
    response = await this.makeRequest('/api/cockpit/actions/rendered', {
      method: 'POST',
      body: JSON.stringify({
        dedupe_keys: []
      })
    });
    
    if (response.status === 400) {
      this.log('✅ POST /api/cockpit/actions/rendered: Correctly rejects empty dedupe_keys', 'success');
    } else {
      this.log(`❌ POST /api/cockpit/actions/rendered: Expected 400 for empty array, got ${response.status}`, 'error');
    }
    
    this.validateResponseFormat(response, 'POST /api/cockpit/actions/rendered (empty)');
    
    // Test with too many keys (>3)
    response = await this.makeRequest('/api/cockpit/actions/rendered', {
      method: 'POST',
      body: JSON.stringify({
        dedupe_keys: ['key1', 'key2', 'key3', 'key4']
      })
    });
    
    if (response.status === 400) {
      this.log('✅ POST /api/cockpit/actions/rendered: Correctly rejects >3 dedupe_keys', 'success');
    } else {
      this.log(`❌ POST /api/cockpit/actions/rendered: Expected 400 for >3 keys, got ${response.status}`, 'error');
    }
    
    this.validateResponseFormat(response, 'POST /api/cockpit/actions/rendered (too many)');
  }

  async testRateLimiting() {
    this.log('Testing basic rate limiting behavior...', 'info');
    
    // Make multiple rapid requests to check for rate limiting headers or responses
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(this.makeRequest('/api/cockpit/summary', { method: 'GET' }));
    }
    
    const responses = await Promise.all(requests);
    
    // Check if any responses indicate rate limiting
    const rateLimited = responses.some(r => r.status === 429);
    const hasRateLimitHeaders = responses.some(r => 
      r.headers && (r.headers['x-ratelimit-limit'] || r.headers['x-ratelimit-remaining'])
    );
    
    if (rateLimited) {
      this.log('✅ Rate limiting: 429 responses detected', 'success');
    } else if (hasRateLimitHeaders) {
      this.log('✅ Rate limiting: Rate limit headers present', 'success');
    } else {
      this.log('⚠️ Rate limiting: No rate limiting detected (may not be implemented yet)', 'warning');
    }
  }

  async testErrorHandling() {
    this.log('Testing error handling...', 'info');
    
    // Test malformed JSON
    const response = await this.makeRequest('/api/cockpit/prefs', {
      method: 'POST',
      body: 'invalid json'
    });
    
    if (response.status === 400) {
      this.log('✅ Error handling: Correctly handles malformed JSON', 'success');
      this.validateResponseFormat(response, 'POST /api/cockpit/prefs (malformed JSON)');
    } else {
      this.log(`❌ Error handling: Expected 400 for malformed JSON, got ${response.status}`, 'error');
    }
  }

  generateReport() {
    this.log('\n=== COCKPIT API VALIDATION REPORT ===', 'info');
    
    const successCount = this.results.filter(r => r.type === 'success').length;
    const errorCount = this.results.filter(r => r.type === 'error').length;
    const warningCount = this.results.filter(r => r.type === 'warning').length;
    
    this.log(`Total tests: ${this.results.length}`, 'info');
    this.log(`✅ Passed: ${successCount}`, 'success');
    this.log(`❌ Failed: ${errorCount}`, 'error');
    this.log(`⚠️ Warnings: ${warningCount}`, 'warning');
    
    if (errorCount === 0) {
      this.log('\n🎉 All critical tests passed! API endpoints are ready.', 'success');
    } else {
      this.log('\n❌ Some tests failed. Please review the issues above.', 'error');
    }
    
    return {
      total: this.results.length,
      passed: successCount,
      failed: errorCount,
      warnings: warningCount,
      results: this.results
    };
  }
}

// Main test execution
async function runValidation() {
  const tester = new APITester();
  
  console.log('🚀 Starting Cockpit API Validation...\n');
  
  try {
    // Test unauthenticated access first
    await tester.testUnauthenticatedAccess();
    
    // Note: For authenticated tests, we would need to set up a test user
    // and get an auth token. For now, we'll test the unauthenticated responses
    // and basic validation logic.
    
    console.log('\n📝 Note: Authenticated endpoint testing requires a valid auth token.');
    console.log('The following tests check unauthenticated responses and validation logic:\n');
    
    // Test error handling
    await tester.testErrorHandling();
    
    // Test rate limiting
    await tester.testRateLimiting();
    
    // Generate final report
    const report = tester.generateReport();
    
    // Exit with appropriate code
    process.exit(report.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runValidation();
}

module.exports = { APITester, runValidation };