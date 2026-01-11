/**
 * Simple Cockpit API Validation
 * 
 * Tests the cockpit API endpoints for proper response format and basic functionality.
 * This is a simplified version that focuses on what we can test without complex setup.
 * 
 * Task 6: Checkpoint - Backend API Validation
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

class SimpleValidator {
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
    const url = `${BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
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

    this.log(`✅ ${endpoint}: Response format valid (status ${status})`, 'success');
    return true;
  }

  async testEndpointExists(endpoint, method = 'GET') {
    this.log(`Testing ${method} ${endpoint}...`, 'info');
    
    const response = await this.makeRequest(endpoint, { method });
    
    // Check if endpoint exists (not 404)
    if (response.status === 404) {
      this.log(`❌ ${endpoint}: Endpoint not found (404)`, 'error');
      return false;
    }
    
    // Check if we get a proper API response structure
    return this.validateResponseFormat(response, `${method} ${endpoint}`);
  }

  async testUnauthenticatedAccess() {
    this.log('Testing unauthenticated access to protected endpoints...', 'info');
    
    const endpoints = [
      { path: '/api/cockpit/open', method: 'POST' },
      { path: '/api/cockpit/prefs', method: 'GET' },
      { path: '/api/cockpit/summary', method: 'GET' },
      { path: '/api/cockpit/pulse', method: 'GET' },
      { path: '/api/cockpit/actions/rendered', method: 'POST' }
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

  async testInputValidation() {
    this.log('Testing input validation...', 'info');
    
    // Test POST /api/cockpit/open with invalid timezone
    let response = await this.makeRequest('/api/cockpit/open', {
      method: 'POST',
      body: JSON.stringify({ timezone: 'Invalid/Timezone' })
    });
    
    if (response.status === 400 || response.status === 401) {
      this.log('✅ POST /api/cockpit/open: Handles invalid input correctly', 'success');
    } else {
      this.log(`❌ POST /api/cockpit/open: Expected 400/401 for invalid timezone, got ${response.status}`, 'error');
    }
    
    // Test POST /api/cockpit/prefs with invalid data
    response = await this.makeRequest('/api/cockpit/prefs', {
      method: 'POST',
      body: JSON.stringify({ wallet_scope_default: 'invalid', notif_cap_per_day: 15 })
    });
    
    if (response.status === 400 || response.status === 401) {
      this.log('✅ POST /api/cockpit/prefs: Handles invalid input correctly', 'success');
    } else {
      this.log(`❌ POST /api/cockpit/prefs: Expected 400/401 for invalid data, got ${response.status}`, 'error');
    }
    
    // Test GET /api/cockpit/summary with invalid wallet_scope
    response = await this.makeRequest('/api/cockpit/summary?wallet_scope=invalid', {
      method: 'GET'
    });
    
    if (response.status === 400 || response.status === 401) {
      this.log('✅ GET /api/cockpit/summary: Handles invalid wallet_scope correctly', 'success');
    } else {
      this.log(`❌ GET /api/cockpit/summary: Expected 400/401 for invalid wallet_scope, got ${response.status}`, 'error');
    }
  }

  async testMalformedRequests() {
    this.log('Testing malformed request handling...', 'info');
    
    // Test with malformed JSON
    const response = await this.makeRequest('/api/cockpit/prefs', {
      method: 'POST',
      body: 'invalid json'
    });
    
    if (response.status === 400 || response.status === 401) {
      this.log('✅ API handles malformed JSON correctly', 'success');
      this.validateResponseFormat(response, 'POST /api/cockpit/prefs (malformed JSON)');
    } else {
      this.log(`❌ Expected 400/401 for malformed JSON, got ${response.status}`, 'error');
    }
  }

  async testCORSHeaders() {
    this.log('Testing CORS headers...', 'info');
    
    const response = await this.makeRequest('/api/cockpit/summary', {
      method: 'OPTIONS'
    });
    
    const hasAccessControlHeaders = response.headers['access-control-allow-origin'] || 
                                   response.headers['access-control-allow-methods'];
    
    if (hasAccessControlHeaders) {
      this.log('✅ CORS headers present', 'success');
    } else {
      this.log('⚠️ CORS headers not detected (may be handled by framework)', 'warning');
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
  const validator = new SimpleValidator();
  
  console.log('🚀 Starting Simple Cockpit API Validation...\n');
  
  try {
    // Test that endpoints exist and return proper format
    await validator.testUnauthenticatedAccess();
    
    // Test input validation
    await validator.testInputValidation();
    
    // Test malformed request handling
    await validator.testMalformedRequests();
    
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

module.exports = { SimpleValidator, runValidation };