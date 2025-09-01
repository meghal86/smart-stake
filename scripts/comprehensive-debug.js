#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
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
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

// Create both anon and service role clients
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📋';
  console.log(`${emoji} [${timestamp}] ${message}`);
}

async function comprehensiveDebug() {
  log('🔍 COMPREHENSIVE END-TO-END SUBSCRIPTION DEBUG');
  log('This will check EVERYTHING to find exactly what is broken');
  log('');

  try {
    // 1. Check database structure
    log('📊 STEP 1: Checking Database Structure');
    
    // Check if tables exist and their structure
    const { data: tables, error: tablesError } = await supabaseAnon
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'subscriptions', 'webhook_logs']);
    
    if (tablesError) {
      log(`❌ Cannot check database structure: ${tablesError.message}`, 'error');
    } else {
      const tableNames = tables.map(t => t.table_name);
      log(`Found tables: ${tableNames.join(', ')}`);
      
      if (!tableNames.includes('users')) log('❌ users table missing!', 'error');
      if (!tableNames.includes('subscriptions')) log('❌ subscriptions table missing!', 'error');
      if (!tableNames.includes('webhook_logs')) log('❌ webhook_logs table missing!', 'error');
    }

    // 2. Check current user data
    log('\n📊 STEP 2: Checking Current User Data');
    
    const { data: users, error: usersError } = await supabaseAnon
      .from('users')
      .select('*')
      .limit(10);
    
    if (usersError) {
      log(`❌ Cannot read users table: ${usersError.message}`, 'error');
      log('This might be an RLS (Row Level Security) issue');
    } else {
      log(`✅ Found ${users.length} users in database`);
      if (users.length > 0) {
        log('Sample user data:');
        users.forEach((user, i) => {
          log(`  ${i + 1}. Email: ${user.email || 'N/A'}, Plan: ${user.plan}, User ID: ${user.user_id}`);
        });
      } else {
        log('⚠️ No users found in database', 'warning');
      }
    }

    // 3. Check subscriptions data
    log('\n📊 STEP 3: Checking Subscriptions Data');
    
    const { data: subscriptions, error: subsError } = await supabaseAnon
      .from('subscriptions')
      .select('*')
      .limit(10);
    
    if (subsError) {
      log(`❌ Cannot read subscriptions table: ${subsError.message}`, 'error');
    } else {
      log(`✅ Found ${subscriptions.length} subscriptions in database`);
      if (subscriptions.length > 0) {
        log('Subscription data:');
        subscriptions.forEach((sub, i) => {
          log(`  ${i + 1}. User: ${sub.user_id}, Status: ${sub.status}, Product: ${sub.product_id}`);
        });
      } else {
        log('⚠️ No subscriptions found in database', 'warning');
      }
    }

    // 4. Check webhook logs
    log('\n📊 STEP 4: Checking Webhook Activity');
    
    const { data: webhookLogs, error: webhookError } = await supabaseAnon
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (webhookError) {
      log(`❌ Cannot read webhook_logs: ${webhookError.message}`, 'error');
    } else {
      log(`✅ Found ${webhookLogs.length} webhook events`);
      if (webhookLogs.length > 0) {
        log('Recent webhook events:');
        webhookLogs.forEach((log_entry, i) => {
          log(`  ${i + 1}. ${log_entry.event_type} - ${log_entry.status} (${log_entry.created_at})`);
          if (log_entry.error_message) {
            log(`     Error: ${log_entry.error_message}`);
          }
        });
      } else {
        log('⚠️ NO webhook events found - this is the problem!', 'warning');
      }
    }

    // 5. Test Edge Functions
    log('\n📊 STEP 5: Testing Edge Functions');
    
    const functions = [
      'stripe-webhook',
      'create-checkout-session', 
      'manage-subscription',
      'fix-subscription'
    ];
    
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
        
        const responseText = await response.text();
        log(`${funcName}: Status ${response.status} - ${responseText.substring(0, 100)}...`);
        
        if (response.status >= 500) {
          log(`❌ ${funcName} has server errors`, 'error');
        }
      } catch (error) {
        log(`❌ ${funcName} failed: ${error.message}`, 'error');
      }
    }

    // 6. Test webhook function specifically
    log('\n📊 STEP 6: Testing Webhook Function Specifically');
    
    // Test with a realistic webhook payload
    const testPayload = {
      id: 'evt_test_webhook',
      object: 'event',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test123',
          object: 'subscription',
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 2592000,
          items: {
            data: [{
              price: {
                id: 'price_1S0HBOJwuQyqUsksDCs7SbPB', // Premium plan
                product: 'prod_test'
              }
            }]
          },
          metadata: {
            user_id: 'test-user-123'
          }
        }
      }
    };

    try {
      const webhookResponse = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 't=1234567890,v1=test_signature'
        },
        body: JSON.stringify(testPayload)
      });
      
      const webhookText = await webhookResponse.text();
      log(`Webhook test response: ${webhookResponse.status} - ${webhookText}`);
      
      if (webhookResponse.status === 400 && webhookText.includes('signature')) {
        log('✅ Webhook correctly validates signatures', 'success');
      }
    } catch (error) {
      log(`❌ Webhook test failed: ${error.message}`, 'error');
    }

    // 7. Check environment variables
    log('\n📊 STEP 7: Checking Environment Configuration');
    
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY', 
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'VITE_STRIPE_PUBLISHABLE_KEY'
    ];
    
    requiredEnvVars.forEach(varName => {
      if (envVars[varName]) {
        log(`✅ ${varName}: ${envVars[varName].substring(0, 20)}...`);
      } else {
        log(`❌ ${varName}: MISSING`, 'error');
      }
    });

    // 8. Final diagnosis
    log('\n🎯 FINAL DIAGNOSIS');
    log('================');
    
    if (webhookLogs.length === 0) {
      log('❌ PRIMARY ISSUE: No webhooks received from Stripe', 'error');
      log('');
      log('🔧 SOLUTION STEPS:');
      log('1. Go to Stripe Dashboard > Webhooks');
      log('2. Add endpoint: https://rebeznxivaxgserswhbn.supabase.co/functions/v1/stripe-webhook');
      log('3. Enable events: customer.subscription.updated, checkout.session.completed');
      log('4. Copy webhook secret to .env file');
      log('5. Redeploy webhook function');
      log('');
      log('💡 Until webhooks are configured, subscription upgrades will NOT sync to your database');
    } else {
      log('✅ Webhooks are being received - checking for other issues');
      
      if (users.length === 0) {
        log('❌ No users in database - signup/login might be broken', 'error');
      }
      
      if (subscriptions.length === 0) {
        log('❌ No subscriptions in database - webhook processing might be broken', 'error');
      }
    }

    log('\n📋 NEXT STEPS:');
    log('1. Configure Stripe webhook (most likely issue)');
    log('2. Test subscription upgrade again');
    log('3. Check webhook logs in Supabase Dashboard');
    log('4. If still broken, check function logs for errors');

  } catch (error) {
    log(`❌ Debug failed: ${error.message}`, 'error');
    console.error('Full error:', error);
  }
}

comprehensiveDebug();