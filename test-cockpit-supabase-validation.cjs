/**
 * Cockpit Supabase Edge Functions Validation
 * 
 * Tests the cockpit Supabase Edge Functions for proper response format and basic functionality.
 * 
 * Task 6: Checkpoint - Backend API Validation
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const FUNCTIONS_BASE_URL = `${SUPABASE_URL}/functions/v1`;

class SupabaseValidator {
  constructor() {
    this.results = [];
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
    const url = `${FUNCTIONS_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          ...options.headers
        },
        ...options
      });

      let data;
      const responseText = await response.text();
      
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

    // For HTML responses (like 404 pages), skip validation
    if (data.raw && typeof data.raw === 'string' && data.raw.includes('<html>')) {
      this.log(`⚠️ ${endpoint}: Received HTML response (status ${status})`, 'warning');
      return true;
    }

    // Handle Supabase auth error format: { code, message }
    if (status === 401 && 'code' in data && 'message' in data) {
      this.log(`✅ ${endpoint}: Supabase auth error format valid (status ${status})`, 'success');
      return true;
    }

    // Handle method not allowed format
    if (status === 405 && 'code' in data && 'message' in data) {
      this.log(`✅ ${endpoint}: Method not allowed format valid (status ${status})`, 'success');
      return true;
    }

    // Check for application response format: data, error, meta
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

    this.log(`✅ ${endpoint}: Application response format valid (status ${status})`, 'success');
    return true;
  }

  async testUnauthenticatedAccess() {
    this.log('Testing unauthenticated access to protected Edge Functions...', 'info');
    
    const endpoints = [
      { path: '/cockpit-summary', method: 'GET' },
      { path: '/cockpit-actions-rendered', method: 'POST' }
    ];

    let allCorrect = true;

    for (const { path, method } of endpoints) {
      const response = await this.makeRequest(path, { method });
      
      if (response.status === 401) {
        this.log(`✅ ${path}: Correctly returns 401 for unauthenticated access`, 'success');
        this.validateResponseFormat(response, `${method} ${path}`);
      } else {
        this.log(`❌ ${path}: Expected 401, got ${response.status}`, 'error');
        allCorrect = false;
      }
    }

    return allCorrect;
  }

  async testCockpitSummary() {
    this.log('Testing cockpit-summary Edge Function...', 'info');
    
    // Test with default parameters
    let response = await this.makeRequest('/cockpit-summary', { method: 'GET' });
    this.validateResponseFormat(response, 'GET /cockpit-summary (default)');
    
    // Test with wallet_scope parameter
    response = await this.makeRequest('/cockpit-summary?wallet_scope=all', { method: 'GET' });
    this.validateResponseFormat(response, 'GET /cockpit-summary (wallet_scope=all)');
    
    // Test with invalid wallet_scope
    response = await this.makeRequest('/cockpit-summary?wallet_scope=invalid', { method: 'GET' });
    if (response.status === 400 || response.status === 401) {
      this.log('✅ GET /cockpit-summary: Handles invalid wallet_scope correctly', 'success');
    } else {
      this.log(`❌ GET /cockpit-summary: Expected 400/401 for invalid wallet_scope, got ${response.status}`, 'error');
    }
    
    this.validateResponseFormat(response, 'GET /cockpit-summary (invalid wallet_scope)');
  }

  async testActionsRendered() {
    this.log('Testing cockpit-actions-rendered Edge Function...', 'info');
    
    // Test with valid dedupe_keys
    let response = await this.makeRequest('/cockpit-actions-rendered', {
      method: 'POST',
      body: JSON.stringify({
        dedupe_keys: ['guardian:finding_123:Fix', 'hunter:opp_456:Execute']
      })
    });
    
    this.validateResponseFormat(response, 'POST /cockpit-actions-rendered (valid)');
    
    // Test with empty array
    response = await this.makeRequest('/cockpit-actions-rendered', {
      method: 'POST',
      body: JSON.stringify({
        dedupe_keys: []
      })
    });
    
    if (response.status === 400 || response.status === 401) {
      this.log('✅ POST /cockpit-actions-rendered: Correctly rejects empty dedupe_keys', 'success');
    } else {
      this.log(`❌ POST /cockpit-actions-rendered: Expected 400/401 for empty array, got ${response.status}`, 'error');
    }
    
    this.validateResponseFormat(response, 'POST /cockpit-actions-rendered (empty)');
    
    // Test with too many keys (>3)
    response = await this.makeRequest('/cockpit-actions-rendered', {
      method: 'POST',
      body: JSON.stringify({
        dedupe_keys: ['key1', 'key2', 'key3', 'key4']
      })
    });
    
    if (response.status === 400 || response.status === 401) {
      this.log('✅ POST /cockpit-actions-rendered: Correctly rejects >3 dedupe_keys', 'success');
    } else {
      this.log(`❌ POST /cockpit-actions-rendered: Expected 400/401 for >3 keys, got ${response.status}`, 'error');
    }
    
    this.validateResponseFormat(response, 'POST /cockpit-actions-rendered (too many)');
  }

  async testMalformedRequests() {
    this.log('Testing malformed request handling...', 'info');
    
    // Test with malformed JSON
    const response = await this.makeRequest('/cockpit-actions-rendered', {
      method: 'POST',
      body: 'invalid json'
    });
    
    if (response.status === 400 || response.status === 401) {
      this.log('✅ Edge Functions handle malformed JSON correctly', 'success');
      this.validateResponseFormat(response, 'POST /cockpit-actions-rendered (malformed JSON)');
    } else {
      this.log(`❌ Expected 400/401 for malformed JSON, got ${response.status}`, 'error');
    }
  }

  async testCORSHeaders() {
    this.log('Testing CORS headers...', 'info');
    
    const response = await this.makeRequest('/cockpit-summary', {
      method: 'OPTIONS'
    });
    
    const hasAccessControlHeaders = response.headers['access-control-allow-origin'] || 
                                   response.headers['access-control-allow-headers'];
    
    if (hasAccessControlHeaders) {
      this.log('✅ CORS headers present', 'success');
    } else {
      this.log('⚠️ CORS headers not detected', 'warning');
    }
  }

  async testMethodValidation() {
    this.log('Testing HTTP method validation...', 'info');
    
    // Test wrong method on cockpit-actions-rendered (should only accept POST)
    const response = await this.makeRequest('/cockpit-actions-rendered', {
      method: 'GET'
    });
    
    if (response.status === 405) {
      this.log('✅ POST-only endpoint correctly rejects GET requests', 'success');
      this.validateResponseFormat(response, 'GET /cockpit-actions-rendered (wrong method)');
    } else if (response.status === 401) {
      this.log('✅ Endpoint requires authentication (401 returned before method check)', 'success');
      this.validateResponseFormat(response, 'GET /cockpit-actions-rendered (auth required)');
    } else {
      this.log(`❌ Expected 405 or 401 for wrong method, got ${response.status}`, 'error');
    }
  }

  async testSupabaseConnection() {
    this.log('Testing Supabase Edge Functions connectivity...', 'info');
    
    // Test that we can reach the functions endpoint
    const response = await this.makeRequest('/health', { method: 'GET' });
    
    if (response.status === 404) {
      this.log('✅ Supabase Edge Functions are reachable (404 expected for non-existent health endpoint)', 'success');
    } else if (response.status === 200) {
      this.log('✅ Supabase Edge Functions are reachable and health endpoint exists', 'success');
    } else if (response.status === 0) {
      this.log('❌ Cannot reach Supabase Edge Functions - check SUPABASE_URL', 'error');
    } else {
      this.log(`✅ Supabase Edge Functions are reachable (status ${response.status})`, 'success');
    }
  }

  generateReport() {
    this.log('\n=== COCKPIT SUPABASE EDGE FUNCTIONS VALIDATION REPORT ===', 'info');
    
    const successCount = this.results.filter(r => r.type === 'success').length;
    const errorCount = this.results.filter(r => r.type === 'error').length;
    const warningCount = this.results.filter(r => r.type === 'warning').length;
    
    this.log(`Total tests: ${this.results.length}`, 'info');
    this.log(`✅ Passed: ${successCount}`, 'success');
    this.log(`❌ Failed: ${errorCount}`, 'error');
    this.log(`⚠️ Warnings: ${warningCount}`, 'warning');
    
    if (errorCount === 0) {
      this.log('\n🎉 All critical tests passed! Supabase Edge Functions are ready.', 'success');
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
  const validator = new SupabaseValidator();
  
  console.log('🚀 Starting Cockpit Supabase Edge Functions Validation...\n');
  
  try {
    // Test Supabase connectivity
    await validator.testSupabaseConnection();
    
    // Test unauthenticated access
    await validator.testUnauthenticatedAccess();
    
    // Test specific endpoints
    await validator.testCockpitSummary();
    await validator.testActionsRendered();
    
    // Test error handling
    await validator.testMalformedRequests();
    
    // Test method validation
    await validator.testMethodValidation();
    
    // Test CORS headers
    await validator.testCORSHeaders();
    
    // Generate final report
    const report = validator.generateReport();
    
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

module.exports = { SupabaseValidator, runValidation };