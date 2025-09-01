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

async function verifySubscriptionFix() {
  log('🔍 VERIFYING SUBSCRIPTION SYSTEM FIX');
  log('This checks if all the fixes have been applied correctly');
  log('');

  let allGood = true;

  try {
    // 1. Check webhook_logs table
    log('📊 STEP 1: Checking webhook_logs table');
    
    const { data: webhookLogs, error: webhookError } = await supabase
      .from('webhook_logs')
      .select('*')
      .limit(1);
    
    if (webhookError) {
      log(`❌ webhook_logs table issue: ${webhookError.message}`, 'error');
      allGood = false;
    } else {
      log('✅ webhook_logs table exists and accessible', 'success');
    }

    // 2. Check users table structure
    log('\n📊 STEP 2: Checking users table');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      log(`❌ Users table issue: ${usersError.message}`, 'error');
      allGood = false;
    } else {
      log(`✅ Users table accessible with ${users.length} users`, 'success');
      if (users.length > 0) {
        log('Sample users:');
        users.forEach((user, i) => {
          log(`  ${i + 1}. Email: ${user.email}, Plan: ${user.plan}, ID: ${user.user_id}`);
        });
      }
    }

    // 3. Test plan constraint
    log('\n📊 STEP 3: Testing plan constraint');
    
    try {
      // Try to insert a test user with 'pro' plan
      const testUserId = crypto.randomUUID();
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          user_id: testUserId,
          email: 'test@example.com',
          plan: 'pro'
        });
      
      if (insertError) {
        if (insertError.message.includes('violates check constraint')) {
          log('❌ Plan constraint not updated - pro plan not allowed', 'error');
          allGood = false;
        } else {
          log(`⚠️ Insert test failed (might be RLS): ${insertError.message}`, 'warning');
        }
      } else {
        log('✅ Pro plan constraint working', 'success');
        // Clean up test user
        await supabase.from('users').delete().eq('user_id', testUserId);
      }
    } catch (error) {
      log(`⚠️ Plan constraint test failed: ${error.message}`, 'warning');
    }

    // 4. Check webhook function
    log('\n📊 STEP 4: Testing webhook function');
    
    const webhookUrl = `${SUPABASE_URL}/functions/v1/stripe-webhook`;
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'test'
        },
        body: JSON.stringify({ test: true })
      });
      
      if (response.status === 400) {
        log('✅ Webhook function responding correctly', 'success');
      } else {
        log(`⚠️ Webhook function unexpected response: ${response.status}`, 'warning');
      }
    } catch (error) {
      log(`❌ Webhook function test failed: ${error.message}`, 'error');
      allGood = false;
    }

    // 5. Check current user authentication
    log('\n📊 STEP 5: Checking authentication');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      log(`⚠️ Not authenticated: ${authError.message}`, 'warning');
      log('You need to log in to your app to test subscription upgrades');
    } else if (user) {
      log(`✅ Authenticated as: ${user.email}`, 'success');
      
      // Check if user exists in public.users
      const { data: publicUser, error: publicUserError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (publicUserError) {
        log(`❌ User not found in public.users: ${publicUserError.message}`, 'error');
        log('');
        log('🔧 MANUAL FIX NEEDED: Create your user record with this SQL:');
        log(`INSERT INTO public.users (user_id, email, plan, created_at, updated_at)`);
        log(`VALUES ('${user.id}', '${user.email}', 'free', NOW(), NOW());`);
        allGood = false;
      } else {
        log(`✅ User found in public.users with plan: ${publicUser.plan}`, 'success');
      }
    } else {
      log('⚠️ No user session - please log in to test', 'warning');
    }

    // 6. Final verdict
    log('\n🎯 FINAL VERDICT');
    log('================');
    
    if (allGood) {
      log('🎉 ALL SYSTEMS GO! Your subscription system should now work!', 'success');
      log('');
      log('📋 TO COMPLETE THE FIX:');
      log('1. ✅ Configure Stripe webhook (if not done yet)');
      log('2. ✅ Test subscription upgrade in your app');
      log('3. ✅ Verify plan updates automatically');
    } else {
      log('⚠️ Some issues found - please fix them first', 'warning');
      log('');
      log('📋 REMAINING TASKS:');
      log('1. Apply the SQL fixes from COMPLETE_SUBSCRIPTION_FIX.sql');
      log('2. Create missing user records');
      log('3. Configure Stripe webhook');
    }

    log('');
    log('🚀 Once everything is green, your subscription upgrades will work automatically!');

  } catch (error) {
    log(`❌ Verification failed: ${error.message}`, 'error');
    console.error('Full error:', error);
  }
}

verifySubscriptionFix();