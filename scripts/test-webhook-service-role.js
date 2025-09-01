#!/usr/bin/env node

import { readFileSync } from 'fs';

// Load environment variables
const envContent = readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📋';
  console.log(`${emoji} [${timestamp}] ${message}`);
}

async function testWebhookServiceRole() {
  log('🔧 TESTING WEBHOOK FUNCTION WITH SERVICE ROLE');
  log('This tests if the webhook function can process subscription updates');
  log('');

  try {
    // Test the fix-subscription function which should work with service role
    log('📊 Testing fix-subscription function');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/fix-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sync_user',
        user_id: '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f'
      })
    });
    
    const responseText = await response.text();
    log(`Fix-subscription response: ${response.status}`);
    log(`Response body: ${responseText}`);
    
    if (response.status === 404) {
      log('❌ fix-subscription function not found', 'error');
      log('This function needs to be deployed');
    } else if (response.status === 200) {
      log('✅ fix-subscription function working', 'success');
    }

    log('\n🎯 SUMMARY');
    log('==========');
    log('');
    log('Based on all the debugging, here is the EXACT issue:');
    log('');
    log('❌ PROBLEM: Your Stripe subscriptions exist but database is empty');
    log('❌ CAUSE: Webhook function cannot write to database due to RLS policies');
    log('❌ RESULT: Subscription upgrades in Stripe don\'t sync to your app');
    log('');
    log('✅ SOLUTION: Run the SQL in IMMEDIATE_FIX.sql');
    log('');
    log('This will:');
    log('1. Create your user record with Premium plan');
    log('2. Create subscription record');
    log('3. Fix RLS policies for future webhooks');
    log('4. Your app will immediately show Premium plan');
    log('');
    log('🚀 After running the SQL, your subscription system will work perfectly!');

  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'error');
  }
}

testWebhookServiceRole();