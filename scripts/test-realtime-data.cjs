#!/usr/bin/env node

/**
 * Test Script: Portfolio Real-Time Data Verification
 * 
 * This script tests if the portfolio page is fetching real-time data
 * by checking the API endpoint and service logs.
 */

const https = require('https');
const http = require('http');

console.log('');
console.log('='.repeat(70));
console.log('  PORTFOLIO REAL-TIME DATA VERIFICATION TEST');
console.log('='.repeat(70));
console.log('');

// Test configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_WALLET = process.env.TEST_WALLET || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

console.log('Configuration:');
console.log(`  Base URL: ${BASE_URL}`);
console.log(`  Test Wallet: ${TEST_WALLET}`);
console.log('');

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Test 1: Check if API endpoint exists
async function testApiEndpoint() {
  console.log('Test 1: API Endpoint Availability');
  console.log('-'.repeat(70));
  
  try {
    const url = `${BASE_URL}/api/v1/portfolio/snapshot?scope=active_wallet&wallet=${TEST_WALLET}`;
    const response = await makeRequest(url);
    
    console.log(`  Status Code: ${response.statusCode}`);
    
    if (response.statusCode === 401) {
      console.log('  ✅ API endpoint exists (requires authentication)');
      return true;
    } else if (response.statusCode === 200) {
      console.log('  ✅ API endpoint exists and responding');
      
      try {
        const data = JSON.parse(response.body);
        console.log(`  API Version: ${data.apiVersion || 'N/A'}`);
        console.log(`  Has Data: ${!!data.data}`);
      } catch (e) {
        console.log('  ⚠️  Could not parse response');
      }
      
      return true;
    } else {
      console.log(`  ❌ Unexpected status code: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

// Test 2: Check environment variables
async function testEnvironmentVariables() {
  console.log('');
  console.log('Test 2: Environment Variables');
  console.log('-'.repeat(70));
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const optionalVars = [
    'COINGECKO_API_KEY',
    'COINMARKETCAP_API_KEY'
  ];
  
  let allRequired = true;
  
  console.log('  Required:');
  for (const varName of requiredVars) {
    const isSet = !!process.env[varName];
    console.log(`    ${isSet ? '✅' : '❌'} ${varName}`);
    if (!isSet) allRequired = false;
  }
  
  console.log('  Optional (for real-time prices):');
  for (const varName of optionalVars) {
    const isSet = !!process.env[varName];
    console.log(`    ${isSet ? '✅' : '⚠️ '} ${varName}`);
  }
  
  return allRequired;
}

// Test 3: Check if services are configured
async function testServiceConfiguration() {
  console.log('');
  console.log('Test 3: Service Configuration');
  console.log('-'.repeat(70));
  
  const fs = require('fs');
  const path = require('path');
  
  const filesToCheck = [
    'src/lib/auth/serverAuth.ts',
    'src/services/priceOracleService.ts',
    'src/services/guardianService.ts',
    'src/services/hunterService.ts',
    'src/services/harvestService.ts',
    'supabase/migrations/20240215000000_create_user_portfolio_addresses.sql'
  ];
  
  let allExist = true;
  
  for (const file of filesToCheck) {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allExist = false;
  }
  
  return allExist;
}

// Test 4: Check for demo mode indicators
async function testDemoModeConfiguration() {
  console.log('');
  console.log('Test 4: Demo Mode Configuration');
  console.log('-'.repeat(70));
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const hookFile = path.join(process.cwd(), 'src/hooks/portfolio/usePortfolioIntegration.ts');
    const content = fs.readFileSync(hookFile, 'utf-8');
    
    // Check if demo mode check exists
    const hasDemoCheck = content.includes('if (isDemo)');
    console.log(`  ${hasDemoCheck ? '✅' : '❌'} Demo mode check implemented`);
    
    // Check if real API call exists
    const hasApiCall = content.includes('/api/v1/portfolio/snapshot');
    console.log(`  ${hasApiCall ? '✅' : '❌'} Real API call implemented`);
    
    // Check if demo data fallback exists
    const hasDemoFallback = content.includes('getDemoPortfolioSnapshot');
    console.log(`  ${hasDemoFallback ? '✅' : '❌'} Demo data fallback implemented`);
    
    console.log('');
    console.log('  ℹ️  Demo mode is active when:');
    console.log('     - Wallet is not connected');
    console.log('     - Data sources are unavailable');
    console.log('     - User manually enables demo mode');
    console.log('');
    console.log('  ℹ️  Real-time data is fetched when:');
    console.log('     - Wallet is connected');
    console.log('     - Data sources are available');
    console.log('     - Demo mode is not manually enabled');
    
    return hasDemoCheck && hasApiCall && hasDemoFallback;
  } catch (error) {
    console.log(`  ❌ Error reading file: ${error.message}`);
    return false;
  }
}

// Test 5: Verify logging is in place
async function testLoggingConfiguration() {
  console.log('');
  console.log('Test 5: Logging Configuration');
  console.log('-'.repeat(70));
  
  const fs = require('fs');
  const path = require('path');
  
  const servicesToCheck = [
    { file: 'src/services/guardianService.ts', realLog: '✅ [Guardian] Received REAL', mockLog: '🎭 [Guardian] Using MOCK' },
    { file: 'src/services/hunterService.ts', realLog: '✅ [Hunter] Received REAL', mockLog: '🎭 [Hunter] Using MOCK' },
    { file: 'src/services/harvestService.ts', realLog: '✅ [Harvest] Received REAL', mockLog: '🎭 [Harvest] Using MOCK' },
    { file: 'src/services/PortfolioValuationService.ts', realLog: '✅ [PortfolioValuation] Aggregated REAL', mockLog: '🎭 [PortfolioValuation] Using MOCK' },
  ];
  
  let allConfigured = true;
  
  for (const service of servicesToCheck) {
    try {
      const content = fs.readFileSync(path.join(process.cwd(), service.file), 'utf-8');
      const hasRealLog = content.includes(service.realLog);
      const hasMockLog = content.includes(service.mockLog);
      
      if (hasRealLog && hasMockLog) {
        console.log(`  ✅ ${path.basename(service.file)}`);
      } else {
        console.log(`  ❌ ${path.basename(service.file)} (missing logs)`);
        allConfigured = false;
      }
    } catch (error) {
      console.log(`  ❌ ${path.basename(service.file)} (error reading)`);
      allConfigured = false;
    }
  }
  
  console.log('');
  console.log('  ℹ️  Check browser console for these log prefixes:');
  console.log('     ✅ = Real data fetched successfully');
  console.log('     🎭 = Mock data used (fallback)');
  console.log('     ⚠️  = Warning (using fallback)');
  console.log('     ❌ = Error occurred');
  
  return allConfigured;
}

// Run all tests
async function runTests() {
  const results = {
    apiEndpoint: await testApiEndpoint(),
    envVars: await testEnvironmentVariables(),
    serviceConfig: await testServiceConfiguration(),
    demoMode: await testDemoModeConfiguration(),
    logging: await testLoggingConfiguration()
  };
  
  console.log('');
  console.log('='.repeat(70));
  console.log('  TEST RESULTS SUMMARY');
  console.log('='.repeat(70));
  console.log('');
  
  const allPassed = Object.values(results).every(r => r);
  
  console.log(`  API Endpoint:          ${results.apiEndpoint ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Environment Variables: ${results.envVars ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Service Configuration: ${results.serviceConfig ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Demo Mode Config:      ${results.demoMode ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Logging Configuration: ${results.logging ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
  
  if (allPassed) {
    console.log('  🎉 ALL TESTS PASSED!');
    console.log('');
    console.log('  The portfolio page is configured to fetch real-time data.');
    console.log('  To verify it\'s working:');
    console.log('');
    console.log('  1. Start the dev server: npm run dev');
    console.log('  2. Navigate to http://localhost:3000/portfolio');
    console.log('  3. Connect your wallet');
    console.log('  4. Open browser console and look for:');
    console.log('     - ✅ logs = Real data being fetched');
    console.log('     - 🎭 logs = Mock data (edge functions not available)');
    console.log('');
  } else {
    console.log('  ⚠️  SOME TESTS FAILED');
    console.log('');
    console.log('  Please review the failed tests above and:');
    console.log('  1. Set missing environment variables');
    console.log('  2. Ensure all files are created');
    console.log('  3. Deploy edge functions if needed');
    console.log('');
  }
  
  console.log('='.repeat(70));
  console.log('');
  
  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  console.error('');
  console.error('Fatal error:', error);
  console.error('');
  process.exit(1);
});
