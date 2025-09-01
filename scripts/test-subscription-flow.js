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

// Test configuration
const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📋';
  console.log(`${emoji} [${timestamp}] ${message}`);
}

async function testSubscriptionFlow() {
  log('🚀 Starting Subscription Flow Test');
  log('This test verifies that subscription upgrades actually work');
  
  try {
    // Test 1: Check if we can find a user with a subscription
    log('\n🔍 Testing Database Subscription Records');
    
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(5);
    
    if (subError) {
      log(`❌ Error fetching subscriptions: ${subError.message}`, 'error');
      return false;
    }
    
    log(`Found ${subscriptions.length} subscription records`);
    
    if (subscriptions.length > 0) {
      log('Sample subscription records:');
      subscriptions.forEach((sub, index) => {
        log(`  ${index + 1}. User: ${sub.user_id}, Plan: ${sub.plan_type}, Status: ${sub.status}, Stripe ID: ${sub.stripe_subscription_id}`);
      });
    }
    
    // Test 2: Check webhook logs
    log('\n📧 Checking Recent Webhook Activity');
    
    const { data: webhookLogs, error: webhookError } = await supabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (webhookError) {
      log(`⚠️ Could not fetch webhook logs: ${webhookError.message}`, 'warning');
    } else {
      log(`Found ${webhookLogs.length} recent webhook events`);
      
      if (webhookLogs.length > 0) {
        log('Recent webhook events:');
        webhookLogs.forEach((log_entry, index) => {
          log(`  ${index + 1}. Type: ${log_entry.event_type}, Status: ${log_entry.status}, Time: ${log_entry.created_at}`);
        });
      }
    }
    
    // Test 3: Test subscription sync function
    log('\n🔄 Testing Subscription Sync Function');
    
    const { data: syncResult, error: syncError } = await supabase.functions.invoke('fix-subscription', {
      body: { action: 'test' }
    });
    
    if (syncError) {
      log(`❌ Sync function error: ${syncError.message}`, 'error');
    } else {
      log('✅ Sync function is responding');
    }
    
    // Test 4: Check for plan mismatches
    log('\n🔍 Checking for Plan Mismatches');
    
    const { data: users, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        subscription_plan,
        subscriptions (
          plan_type,
          status,
          stripe_subscription_id
        )
      `)
      .limit(10);
    
    if (userError) {
      log(`❌ Error fetching user data: ${userError.message}`, 'error');
    } else {
      log(`Checking ${users.length} users for plan mismatches`);
      
      let mismatches = 0;
      users.forEach(user => {
        if (user.subscriptions && user.subscriptions.length > 0) {
          const dbPlan = user.subscription_plan;
          const stripePlan = user.subscriptions[0].plan_type;
          
          if (dbPlan !== stripePlan) {
            mismatches++;
            log(`⚠️ MISMATCH FOUND: User ${user.email}`, 'warning');
            log(`   Database plan: ${dbPlan}`);
            log(`   Stripe plan: ${stripePlan}`);
            log(`   Subscription status: ${user.subscriptions[0].status}`);
          }
        }
      });
      
      if (mismatches === 0) {
        log('✅ No plan mismatches found');
      } else {
        log(`❌ Found ${mismatches} plan mismatches that need fixing`, 'error');
      }
    }
    
    // Test 5: Test webhook endpoint directly
    log('\n🎯 Testing Webhook Endpoint Response');
    
    try {
      const webhookUrl = `${SUPABASE_URL}/functions/v1/stripe-webhook`;
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ test: true })
      });
      
      log(`Webhook endpoint status: ${response.status}`);
      
      if (response.status === 400) {
        log('✅ Webhook correctly rejects invalid requests');
      } else {
        log(`⚠️ Unexpected webhook response: ${response.status}`, 'warning');
      }
    } catch (error) {
      log(`❌ Webhook test failed: ${error.message}`, 'error');
    }
    
    log('\n📊 Test Summary');
    log('This test helps identify subscription sync issues');
    log('If you see plan mismatches above, your webhook may not be processing correctly');
    
    return true;
    
  } catch (error) {
    log(`❌ Test failed with error: ${error.message}`, 'error');
    return false;
  }
}

// Run the test
testSubscriptionFlow().then(success => {
  if (success) {
    log('\n🎉 Subscription flow test completed');
  } else {
    log('\n💥 Subscription flow test failed');
    process.exit(1);
  }
});