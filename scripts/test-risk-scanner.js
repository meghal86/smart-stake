#!/usr/bin/env node

/**
 * Risk Scanner Manual Testing Script
 * Tests the risk scanner with real wallet addresses
 */

const TEST_WALLETS = {
  // Low Risk - Established exchange wallets
  LOW_RISK: [
    '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE', // Binance Hot Wallet
    '0x28C6c06298d514Db089934071355E5743bf21d60', // Binance 14
    '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549', // Binance 15
  ],
  
  // Medium Risk - Active DeFi users
  MEDIUM_RISK: [
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Random active wallet
    '0x1111111254fb6c44bAC0beD2854e76F90643097d', // 1inch Router
    '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // Uniswap Router
  ],
  
  // High Risk - New/empty/suspicious wallets
  HIGH_RISK: [
    '0x0000000000000000000000000000000000000000', // Null address
    '0x000000000000000000000000000000000000dEaD', // Burn address
    '0x1234567890123456789012345678901234567890', // Likely new/empty
  ],
  
  // Invalid addresses for error testing
  INVALID: [
    '0xinvalid',
    'not-an-address',
    '0x123', // Too short
    '', // Empty
  ]
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'your-anon-key';

async function testRiskScanner(walletAddress, expectedRiskLevel = null) {
  console.log(`\n🔍 Testing wallet: ${walletAddress}`);
  console.log(`Expected risk level: ${expectedRiskLevel || 'Unknown'}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/riskScan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        walletAddress: walletAddress,
        userId: 'test-user'
      })
    });

    const result = await response.json();
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
      return { success: false, error: result.error };
    }

    console.log(`✅ Scan completed successfully`);
    console.log(`📊 Risk Score: ${result.risk_score}/10`);
    console.log(`⚠️  Risk Level: ${result.risk_level}`);
    console.log(`💰 Balance: ${result.analysis?.currentBalance?.toFixed(4) || 'N/A'} ETH`);
    console.log(`📈 Total Transactions: ${result.analysis?.totalTransactions?.toLocaleString() || 'N/A'}`);
    console.log(`📅 Wallet Age: ${result.analysis?.walletAge || 'N/A'} days`);
    
    if (result.risk_factors?.length > 0) {
      console.log(`🚨 Risk Factors:`);
      result.risk_factors.forEach(factor => console.log(`   - ${factor}`));
    }
    
    if (result.recommendations?.length > 0) {
      console.log(`💡 Recommendations:`);
      result.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }

    // Validate expected results
    if (expectedRiskLevel && result.risk_level !== expectedRiskLevel) {
      console.log(`⚠️  WARNING: Expected ${expectedRiskLevel} risk, got ${result.risk_level}`);
    }

    return { 
      success: true, 
      result: {
        riskScore: result.risk_score,
        riskLevel: result.risk_level,
        analysis: result.analysis
      }
    };

  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTestSuite() {
  console.log('🧪 Starting Risk Scanner Test Suite');
  console.log('=====================================');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test Low Risk Wallets
  console.log('\n📊 Testing LOW RISK wallets...');
  for (const wallet of TEST_WALLETS.LOW_RISK) {
    const result = await testRiskScanner(wallet, 'low');
    results.total++;
    if (result.success && result.result?.riskLevel === 'low') {
      results.passed++;
    } else {
      results.failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }

  // Test Medium Risk Wallets
  console.log('\n📊 Testing MEDIUM RISK wallets...');
  for (const wallet of TEST_WALLETS.MEDIUM_RISK) {
    const result = await testRiskScanner(wallet, 'medium');
    results.total++;
    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Test High Risk Wallets
  console.log('\n📊 Testing HIGH RISK wallets...');
  for (const wallet of TEST_WALLETS.HIGH_RISK) {
    const result = await testRiskScanner(wallet, 'high');
    results.total++;
    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Test Invalid Addresses
  console.log('\n📊 Testing INVALID addresses...');
  for (const wallet of TEST_WALLETS.INVALID) {
    const result = await testRiskScanner(wallet);
    results.total++;
    if (!result.success) {
      results.passed++; // Expected to fail
      console.log(`✅ Correctly rejected invalid address: ${wallet}`);
    } else {
      results.failed++;
      console.log(`❌ Should have rejected invalid address: ${wallet}`);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Print Summary
  console.log('\n📋 TEST SUMMARY');
  console.log('================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log(`⚠️  ${results.failed} tests failed. Check logs above.`);
  }
}

async function testSingleWallet() {
  const wallet = process.argv[2];
  if (!wallet) {
    console.log('Usage: node test-risk-scanner.js <wallet-address>');
    console.log('   or: node test-risk-scanner.js --suite');
    return;
  }
  
  await testRiskScanner(wallet);
}

// Main execution
if (process.argv.includes('--suite')) {
  runTestSuite();
} else if (process.argv[2]) {
  testSingleWallet();
} else {
  console.log('Risk Scanner Test Script');
  console.log('========================');
  console.log('');
  console.log('Usage:');
  console.log('  node test-risk-scanner.js <wallet-address>  # Test single wallet');
  console.log('  node test-risk-scanner.js --suite           # Run full test suite');
  console.log('');
  console.log('Examples:');
  console.log('  node test-risk-scanner.js 0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE');
  console.log('  node test-risk-scanner.js --suite');
}