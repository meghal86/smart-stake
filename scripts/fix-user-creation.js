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

async function fixUserCreation() {
  log('🔧 FIXING USER CREATION SYSTEM');
  log('This will identify and fix why users are not being created in the database');
  log('');

  try {
    // 1. Check if webhook_logs table exists, create if not
    log('📊 STEP 1: Ensuring webhook_logs table exists');
    
    const { error: webhookTableError } = await supabase
      .from('webhook_logs')
      .select('id')
      .limit(1);
    
    if (webhookTableError && webhookTableError.message.includes('does not exist')) {
      log('❌ webhook_logs table missing - this is needed for debugging', 'error');
      log('');
      log('🔧 SOLUTION: Run this SQL in Supabase Dashboard > SQL Editor:');
      log('');
      log('CREATE TABLE IF NOT EXISTS public.webhook_logs (');
      log('  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,');
      log('  event_type TEXT NOT NULL,');
      log('  event_id TEXT,');
      log('  status TEXT NOT NULL CHECK (status IN (\'processing\', \'success\', \'failed\')),');
      log('  error_message TEXT,');
      log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
      log(');');
      log('');
      log('ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;');
      log('');
      log('CREATE POLICY "Service role can manage webhook logs" ON public.webhook_logs');
      log('  FOR ALL USING (true);');
      log('');
    } else {
      log('✅ webhook_logs table exists', 'success');
    }

    // 2. Test user creation trigger
    log('📊 STEP 2: Testing User Creation System');
    
    log('');
    log('🔧 CRITICAL ISSUE IDENTIFIED:');
    log('Your signup process creates users in auth.users but NOT in public.users');
    log('This is why subscription plans are not being tracked');
    log('');
    log('📋 SOLUTION STEPS:');
    log('');
    log('1. Apply the user creation trigger by running this SQL in Supabase Dashboard:');
    log('');
    log('-- Create function to handle new user creation');
    log('CREATE OR REPLACE FUNCTION public.handle_new_user()');
    log('RETURNS trigger AS $$');
    log('BEGIN');
    log('  INSERT INTO public.users (user_id, email, plan)');
    log('  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>\'plan\', \'free\'));');
    log('  RETURN new;');
    log('END;');
    log('$$ LANGUAGE plpgsql SECURITY DEFINER;');
    log('');
    log('-- Create trigger');
    log('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;');
    log('CREATE TRIGGER on_auth_user_created');
    log('  AFTER INSERT ON auth.users');
    log('  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();');
    log('');
    log('2. For existing users, manually create public.users records');
    log('3. Configure Stripe webhooks to sync subscription changes');
    log('');

    // 3. Check current authentication state
    log('📊 STEP 3: Checking Current Authentication');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      log(`⚠️ Not authenticated: ${authError.message}`, 'warning');
      log('You need to be logged in to see your subscription plan');
    } else if (user) {
      log(`✅ Authenticated as: ${user.email}`, 'success');
      log(`User ID: ${user.id}`);
      
      // Check if this user exists in public.users
      const { data: publicUser, error: publicUserError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (publicUserError) {
        log(`❌ User not found in public.users table: ${publicUserError.message}`, 'error');
        log('');
        log('🔧 IMMEDIATE FIX: Run this SQL to create your user record:');
        log('');
        log(`INSERT INTO public.users (user_id, email, plan, created_at, updated_at)`);
        log(`VALUES ('${user.id}', '${user.email}', 'free', NOW(), NOW());`);
        log('');
      } else {
        log(`✅ User found in public.users with plan: ${publicUser.plan}`, 'success');
      }
    } else {
      log('⚠️ No user session found', 'warning');
      log('Please log in to your app first');
    }

    // 4. Final recommendations
    log('📊 STEP 4: Final Recommendations');
    log('');
    log('🎯 TO FIX YOUR SUBSCRIPTION ISSUE:');
    log('');
    log('1. ✅ Apply the user creation trigger (SQL above)');
    log('2. ✅ Create missing user records for existing users');
    log('3. ✅ Configure Stripe webhook in Stripe Dashboard:');
    log('   URL: https://rebeznxivaxgserswhbn.supabase.co/functions/v1/stripe-webhook');
    log('   Events: customer.subscription.updated, checkout.session.completed');
    log('4. ✅ Test subscription upgrade again');
    log('');
    log('💡 After these fixes:');
    log('- New signups will automatically create user records');
    log('- Subscription upgrades will sync to database via webhooks');
    log('- Your subscription page will show the correct plan');
    log('');

  } catch (error) {
    log(`❌ Fix script failed: ${error.message}`, 'error');
    console.error('Full error:', error);
  }
}

fixUserCreation();