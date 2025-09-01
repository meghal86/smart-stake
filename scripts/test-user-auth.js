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

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📋';
  console.log(`${emoji} [${timestamp}] ${message}`);
}

async function testUserAuth() {
  log('🔍 TESTING USER AUTHENTICATION & DATABASE');
  log('This will help us understand if users are being created and stored correctly');
  log('');

  try {
    // 1. Check auth.users table (this requires service role, so it might fail)
    log('📊 STEP 1: Checking Auth Users');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      log(`⚠️ Cannot access auth.users (expected with anon key): ${authError.message}`, 'warning');
    } else {
      log(`✅ Found ${authUsers.users.length} users in auth.users`);
    }

    // 2. Check public.users table with different approaches
    log('\n📊 STEP 2: Checking Public Users Table');
    
    // Try to get users without RLS restrictions
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*');
    
    if (publicError) {
      log(`❌ Cannot read public.users: ${publicError.message}`, 'error');
      log('This could be due to RLS (Row Level Security) policies');
    } else {
      log(`✅ Found ${publicUsers.length} users in public.users`);
      if (publicUsers.length > 0) {
        publicUsers.forEach((user, i) => {
          log(`  ${i + 1}. ID: ${user.id}, User ID: ${user.user_id}, Email: ${user.email}, Plan: ${user.plan}`);
        });
      }
    }

    // 3. Test creating a test user entry
    log('\n📊 STEP 3: Testing User Creation');
    
    const testUserId = 'test-user-' + Date.now();
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert({
        user_id: testUserId,
        email: 'test@example.com',
        plan: 'free'
      })
      .select();
    
    if (insertError) {
      log(`❌ Cannot insert test user: ${insertError.message}`, 'error');
      log('This indicates a permissions or schema issue');
    } else {
      log(`✅ Successfully created test user`, 'success');
      
      // Clean up test user
      await supabase
        .from('users')
        .delete()
        .eq('user_id', testUserId);
      log('✅ Cleaned up test user');
    }

    // 4. Check RLS policies
    log('\n📊 STEP 4: Checking RLS Policies');
    
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'users');
    
    if (policiesError) {
      log(`⚠️ Cannot check RLS policies: ${policiesError.message}`, 'warning');
    } else {
      log(`Found ${policies.length} RLS policies for users table`);
      policies.forEach((policy, i) => {
        log(`  ${i + 1}. ${policy.policyname} - ${policy.cmd} - ${policy.qual}`);
      });
    }

    // 5. Test subscription table
    log('\n📊 STEP 5: Testing Subscriptions Table');
    
    const { data: subs, error: subsError } = await supabase
      .from('subscriptions')
      .select('*');
    
    if (subsError) {
      log(`❌ Cannot read subscriptions: ${subsError.message}`, 'error');
    } else {
      log(`✅ Subscriptions table accessible with ${subs.length} entries`);
    }

    // 6. Test webhook logs
    log('\n📊 STEP 6: Testing Webhook Logs');
    
    const { data: webhooks, error: webhookError } = await supabase
      .from('webhook_logs')
      .select('*')
      .limit(5);
    
    if (webhookError) {
      log(`❌ Cannot read webhook_logs: ${webhookError.message}`, 'error');
      log('You need to create the webhook_logs table');
    } else {
      log(`✅ Webhook logs table accessible with ${webhooks.length} entries`);
    }

    // 7. Final diagnosis
    log('\n🎯 DIAGNOSIS');
    log('===========');
    
    if (publicError && publicError.message.includes('RLS')) {
      log('❌ ISSUE: RLS policies are blocking access to users table', 'error');
      log('🔧 SOLUTION: You need to be authenticated to read your own user data');
      log('');
      log('This means:');
      log('1. Users must be logged in to see their subscription plan');
      log('2. The subscription page should only work for authenticated users');
      log('3. If you\'re not seeing your plan, you might not be logged in');
    }
    
    if (insertError) {
      log('❌ ISSUE: Cannot create users in database', 'error');
      log('🔧 SOLUTION: Check database permissions and schema');
    }
    
    log('\n📋 NEXT STEPS:');
    log('1. Make sure you are logged in to your app');
    log('2. Check if user data is created when you sign up');
    log('3. Verify that subscription upgrades create webhook events');
    log('4. Configure Stripe webhooks to sync subscription data');

  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'error');
    console.error('Full error:', error);
  }
}

testUserAuth();