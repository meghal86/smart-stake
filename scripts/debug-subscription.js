#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables manually
const envContent = readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📋';
  console.log(`${emoji} [${timestamp}] ${message}`);
}

async function debugSubscription() {
  log('🔍 Debugging Subscription Issue');
  log('Checking why your plan upgrade is not showing correctly');
  
  try {
    // Test webhook endpoint
    log('\n🎯 Testing Webhook Endpoint');
    
    const webhookUrl = `${SUPABASE_URL}/functions/v1/stripe-webhook`;
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ test: true })
      });
      
      const responseText = await response.text();
      log(`Webhook Status: ${response.status}`);
      log(`Webhook Response: ${responseText}`);
      
      if (response.status === 400 && responseText.includes('Invalid signature')) {
        log('✅ Webhook is working - correctly rejecting test requests');
      } else if (response.status === 200) {
        log('⚠️ Webhook accepted test request - this might be an issue', 'warning');
      }
    } catch (error) {
      log(`❌ Webhook test failed: ${error.message}`, 'error');
    }
    
    // Test other functions
    log('\n🔧 Testing Other Functions');
    
    const functions = ['create-checkout-session', 'manage-subscription'];
    
    for (const funcName of functions) {
      try {
        const funcUrl = `${SUPABASE_URL}/functions/v1/${funcName}`;
        const response = await fetch(funcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ test: true })
        });
        
        log(`${funcName}: Status ${response.status}`);
      } catch (error) {
        log(`❌ ${funcName} failed: ${error.message}`, 'error');
      }
    }
    
    log('\n📊 Diagnosis Summary');
    log('The basic tests show your functions are deployed.');
    log('');
    log('🔍 To debug your specific issue:');
    log('1. Check Supabase Dashboard > Functions > stripe-webhook > Logs');
    log('2. Look for recent webhook events from Stripe');
    log('3. Check if webhooks are being received and processed');
    log('');
    log('💡 Common issues:');
    log('- Webhook not configured in Stripe dashboard');
    log('- Wrong webhook URL in Stripe');
    log('- Webhook secret mismatch');
    log('- Database permissions preventing updates');
    log('');
    log('🎯 Next steps:');
    log('1. Go to Stripe Dashboard > Webhooks');
    log('2. Check if your webhook URL is correct');
    log('3. Verify recent webhook deliveries');
    log('4. Check Supabase function logs for errors');
    
  } catch (error) {
    log(`❌ Debug failed: ${error.message}`, 'error');
  }
}

debugSubscription();