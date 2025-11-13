#!/usr/bin/env node

/**
 * Verification script for Multi-Wallet E2E Tests
 * 
 * This script verifies that the E2E test file is properly structured
 * and contains all required test scenarios.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFilePath = path.join(__dirname, '../tests/e2e/multi-wallet-flow.spec.ts');

console.log('🔍 Verifying Multi-Wallet E2E Tests...\n');

// Check if test file exists
if (!fs.existsSync(testFilePath)) {
  console.error('❌ Test file not found:', testFilePath);
  process.exit(1);
}

const testContent = fs.readFileSync(testFilePath, 'utf-8');

// Required test scenarios
const requiredTests = [
  'should connect multiple wallets',
  'should switch between wallets',
  'should show feed personalization for each wallet',
  'should update eligibility for each wallet',
  'should display wallet selector correctly on mobile',
  'should support keyboard navigation',
  'should be accessible with screen readers',
  'should display ENS names when available',
  'should display and persist wallet labels',
  'should restore last selected wallet on page load',
  'should show loading state while switching wallets',
  'should handle wallet disconnection gracefully',
  'should prevent layout shift when switching wallets',
  'should close dropdown when clicking outside',
  'should display chain icons for each wallet',
  'should handle ENS resolution failure gracefully',
  'should support wallet label editing from dropdown',
];

// Edge case tests
const edgeCaseTests = [
  'should handle rapid wallet switching',
  'should handle very long wallet labels',
  'should handle wallet with no transaction history',
];

let missingTests = [];
let foundTests = [];

console.log('📋 Checking for required test scenarios:\n');

requiredTests.forEach(testName => {
  if (testContent.includes(`test('${testName}'`) || testContent.includes(`test("${testName}"`)) {
    console.log(`  ✅ ${testName}`);
    foundTests.push(testName);
  } else {
    console.log(`  ❌ ${testName}`);
    missingTests.push(testName);
  }
});

console.log('\n📋 Checking for edge case tests:\n');

edgeCaseTests.forEach(testName => {
  if (testContent.includes(`test('${testName}'`) || testContent.includes(`test("${testName}"`)) {
    console.log(`  ✅ ${testName}`);
    foundTests.push(testName);
  } else {
    console.log(`  ❌ ${testName}`);
    missingTests.push(testName);
  }
});

// Check for helper functions
console.log('\n🔧 Checking for helper functions:\n');

const requiredHelpers = [
  'mockWalletConnection',
  'mockENSResolution',
];

requiredHelpers.forEach(helper => {
  if (testContent.includes(`async function ${helper}`) || testContent.includes(`function ${helper}`)) {
    console.log(`  ✅ ${helper}`);
  } else {
    console.log(`  ❌ ${helper}`);
  }
});

// Check for test data
console.log('\n📊 Checking for test data:\n');

const requiredData = [
  'WALLET_1',
  'WALLET_2',
  'WALLET_3',
  'ENS_NAME',
  'ENS_ADDRESS',
];

requiredData.forEach(data => {
  if (testContent.includes(`const ${data}`) || testContent.includes(`let ${data}`)) {
    console.log(`  ✅ ${data}`);
  } else {
    console.log(`  ❌ ${data}`);
  }
});

// Check for accessibility attributes
console.log('\n♿ Checking for accessibility attributes:\n');

const accessibilityChecks = [
  'role',
  'aria-haspopup',
  'aria-expanded',
  'aria-current',
  'aria-label',
];

accessibilityChecks.forEach(attr => {
  if (testContent.includes(attr)) {
    console.log(`  ✅ ${attr}`);
  } else {
    console.log(`  ❌ ${attr}`);
  }
});

// Check for keyboard navigation
console.log('\n⌨️  Checking for keyboard navigation:\n');

const keyboardKeys = [
  'Tab',
  'Enter',
  'ArrowDown',
  'Escape',
];

keyboardKeys.forEach(key => {
  if (testContent.includes(key)) {
    console.log(`  ✅ ${key}`);
  } else {
    console.log(`  ❌ ${key}`);
  }
});

// Check for mobile viewport
console.log('\n📱 Checking for mobile viewport tests:\n');

if (testContent.includes('setViewportSize')) {
  console.log('  ✅ Mobile viewport configuration');
} else {
  console.log('  ❌ Mobile viewport configuration');
}

if (testContent.includes('375') && testContent.includes('667')) {
  console.log('  ✅ Mobile dimensions (375x667)');
} else {
  console.log('  ❌ Mobile dimensions');
}

// Check for touch target size verification
if (testContent.includes('44')) {
  console.log('  ✅ Touch target size verification (44px)');
} else {
  console.log('  ❌ Touch target size verification');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 SUMMARY\n');
console.log(`Total required tests: ${requiredTests.length + edgeCaseTests.length}`);
console.log(`Tests found: ${foundTests.length}`);
console.log(`Tests missing: ${missingTests.length}`);

if (missingTests.length > 0) {
  console.log('\n❌ Missing tests:');
  missingTests.forEach(test => console.log(`  - ${test}`));
}

// Check file size
const stats = fs.statSync(testFilePath);
const fileSizeKB = (stats.size / 1024).toFixed(2);
console.log(`\nTest file size: ${fileSizeKB} KB`);

// Count test cases
const testMatches = testContent.match(/test\(/g) || [];
console.log(`Total test cases: ${testMatches.length}`);

// Count describe blocks
const describeMatches = testContent.match(/test\.describe\(/g) || [];
console.log(`Test suites: ${describeMatches.length}`);

console.log('\n' + '='.repeat(60));

if (missingTests.length === 0) {
  console.log('\n✅ All required tests are present!');
  console.log('\n📝 Next steps:');
  console.log('  1. Start dev server: npm run dev');
  console.log('  2. Run tests: npx playwright test tests/e2e/multi-wallet-flow.spec.ts');
  console.log('  3. View report: npx playwright show-report');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests are missing. Please add them before running E2E tests.');
  process.exit(1);
}
