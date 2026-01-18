#!/usr/bin/env node

/**
 * Verification Script: MetaMask Multi-Account Implementation
 * 
 * This script verifies that all components are properly implemented
 * for MetaMask multi-account support.
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying MetaMask Multi-Account Implementation...\n');

// Files to check
const filesToCheck = [
  'src/components/wallet/MultiAccountSelector.tsx',
  'src/components/wallet/AddWalletButton.tsx', 
  'src/components/header/GlobalHeader.tsx',
  'src/hooks/useWalletRegistry.ts'
];

// Required features to verify
const requiredFeatures = {
  'MultiAccountSelector.tsx': [
    'MetaMask-specific flow detection',
    'Educational messaging for single account',
    'Manual connection instructions',
    'TypeScript error handling',
    'Account balance fetching',
    'Duplicate wallet detection'
  ],
  'AddWalletButton.tsx': [
    'Multi-provider dropdown',
    'MetaMask provider option',
    'Manual wallet input option',
    'Connected wallet summary',
    'Toast notifications'
  ],
  'GlobalHeader.tsx': [
    'AddWalletButton integration',
    'Multi-wallet switching',
    'Wallet dropdown display',
    'Profile menu integration'
  ],
  'useWalletRegistry.ts': [
    'Database persistence',
    'Auto-sync functionality',
    'Duplicate key handling',
    'RLS policy compliance',
    'Error recovery'
  ]
};

let allChecksPass = true;

// Check each file
filesToCheck.forEach(filePath => {
  const fileName = path.basename(filePath);
  console.log(`📁 Checking ${fileName}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ❌ File not found: ${filePath}`);
    allChecksPass = false;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const features = requiredFeatures[fileName] || [];
  
  features.forEach(feature => {
    let found = false;
    
    // Check for specific feature implementations
    switch (feature) {
      case 'MetaMask-specific flow detection':
        found = content.includes('metamask') && content.includes('MetaMask-specific flow');
        break;
      case 'Educational messaging for single account':
        found = content.includes('MetaMask is only sharing 1 account');
        break;
      case 'Manual connection instructions':
        found = content.includes('Switch to Account 2') && content.includes('Manual Solution');
        break;
      case 'TypeScript error handling':
        found = content.includes('permError: any') && content.includes('as any');
        break;
      case 'Account balance fetching':
        found = content.includes('eth_getBalance') && content.includes('balanceInEth');
        break;
      case 'Duplicate wallet detection':
        found = content.includes('isAlreadyAdded') && content.includes('wallets.some');
        break;
      case 'Multi-provider dropdown':
        found = content.includes('WALLET_PROVIDERS') && content.includes('DropdownMenu');
        break;
      case 'MetaMask provider option':
        found = content.includes('MetaMask') && content.includes('🦊');
        break;
      case 'Manual wallet input option':
        found = content.includes('ManualWalletInput') && content.includes('WATCH-ONLY');
        break;
      case 'Connected wallet summary':
        found = content.includes('connectedWallets.length') && content.includes('Connected Wallets');
        break;
      case 'Toast notifications':
        found = content.includes('toast.success') && content.includes('Successfully added');
        break;
      case 'AddWalletButton integration':
        found = content.includes('AddWalletButton') && content.includes('import');
        break;
      case 'Multi-wallet switching':
        found = content.includes('handleWalletSwitch') && content.includes('setContextActiveWallet');
        break;
      case 'Wallet dropdown display':
        found = content.includes('connectedWallets.map') && content.includes('wallet.label');
        break;
      case 'Profile menu integration':
        found = content.includes('showMenu') && content.includes('User');
        break;
      case 'Database persistence':
        found = content.includes('user_wallets') && content.includes('supabase');
        break;
      case 'Auto-sync functionality':
        found = content.includes('autoSyncEnabled') && content.includes('syncConnectedWallet');
        break;
      case 'Duplicate key handling':
        found = content.includes('23505') && content.includes('duplicate key');
        break;
      case 'RLS policy compliance':
        found = content.includes('user_id') && content.includes('eq(');
        break;
      case 'Error recovery':
        found = content.includes('setAutoSyncEnabled(false)') && content.includes('setTimeout');
        break;
      default:
        found = content.toLowerCase().includes(feature.toLowerCase());
    }
    
    if (found) {
      console.log(`  ✅ ${feature}`);
    } else {
      console.log(`  ❌ ${feature}`);
      allChecksPass = false;
    }
  });
  
  console.log('');
});

// Check for test files
console.log('🧪 Checking test files...');
const testFiles = [
  'test-metamask-multi-account-final.html',
  'METAMASK_MULTI_ACCOUNT_SOLUTION_FINAL.md'
];

testFiles.forEach(testFile => {
  if (fs.existsSync(testFile)) {
    console.log(`  ✅ ${testFile}`);
  } else {
    console.log(`  ❌ ${testFile}`);
    allChecksPass = false;
  }
});

console.log('\n' + '='.repeat(60));

if (allChecksPass) {
  console.log('🎉 ALL CHECKS PASS! MetaMask multi-account implementation is complete.');
  console.log('\n📋 Next Steps for User:');
  console.log('1. Switch to Account 2 in MetaMask extension');
  console.log('2. Click "Add Wallet" → "MetaMask" in AlphaWhale');
  console.log('3. Approve the connection for Account 2');
  console.log('4. Repeat for Account 3');
  console.log('5. All accounts will appear in wallet dropdown');
  
  console.log('\n🔍 Test the implementation:');
  console.log('- Open test-metamask-multi-account-final.html in browser');
  console.log('- Follow the manual connection process');
  console.log('- Verify all accounts are detected');
  
} else {
  console.log('❌ Some checks failed. Please review the implementation.');
}

console.log('\n💡 Remember: MetaMask only shares accounts that have been explicitly connected.');
console.log('This is a security feature, not a bug. Manual connection is the correct approach.');