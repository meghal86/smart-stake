#!/usr/bin/env node

/**
 * Simple test script to verify add wallet functionality
 * Run with: node test-add-wallet.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAddWallet() {
  console.log('Testing add wallet functionality...');
  
  try {
    // Test 1: Check if guardian_wallets table exists
    console.log('1. Checking if guardian_wallets table exists...');
    const { data: tables, error: tablesError } = await supabase
      .from('guardian_wallets')
      .select('id')
      .limit(1);
    
    if (tablesError) {
      console.error('❌ guardian_wallets table does not exist:', tablesError.message);
      console.log('💡 Run the migration: npx supabase db reset --linked');
      return;
    }
    
    console.log('✅ guardian_wallets table exists');
    
    // Test 2: Check if guardian_logs table exists
    console.log('2. Checking if guardian_logs table exists...');
    const { data: logs, error: logsError } = await supabase
      .from('guardian_logs')
      .select('id')
      .limit(1);
    
    if (logsError) {
      console.error('❌ guardian_logs table does not exist:', logsError.message);
      console.log('💡 Run the migration: npx supabase db reset --linked');
      return;
    }
    
    console.log('✅ guardian_logs table exists');
    
    // Test 3: Test API endpoint
    console.log('3. Testing add wallet API endpoint...');
    const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
    
    const response = await fetch('http://localhost:3000/api/guardian/add-wallet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: testAddress,
        alias: 'Test Wallet',
        walletType: 'readonly'
      })
    });
    
    if (response.status === 401) {
      console.log('⚠️  API endpoint requires authentication (expected)');
    } else if (response.ok) {
      console.log('✅ API endpoint is working');
    } else {
      console.error('❌ API endpoint error:', response.status, await response.text());
    }
    
    console.log('\n🎉 Add wallet functionality test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAddWallet();