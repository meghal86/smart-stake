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

async function manualSync() {
  log('🔄 Manual Subscription Sync');
  log('This will try to sync your subscription using the fix-subscription function');
  
  try {
    // Call the fix-subscription function
    const { data, error } = await supabase.functions.invoke('fix-subscription', {
      body: { 
        action: 'sync_all',
        force: true 
      }
    });
    
    if (error) {
      log(`❌ Sync failed: ${error.message}`, 'error');
      log('This might be because:');
      log('1. Function not deployed');
      log('2. Database permissions issue');
      log('3. Stripe API issue');
    } else {
      log('✅ Sync function called successfully', 'success');
      log(`Response: ${JSON.stringify(data, null, 2)}`);
    }
    
    // Also try the manage-subscription function
    log('\n🔧 Testing manage-subscription function');
    
    const { data: manageData, error: manageError } = await supabase.functions.invoke('manage-subscription', {
      body: { 
        action: 'get_status'
      }
    });
    
    if (manageError) {
      log(`❌ Manage subscription failed: ${manageError.message}`, 'error');
    } else {
      log('✅ Manage subscription responded', 'success');
      log(`Response: ${JSON.stringify(manageData, null, 2)}`);
    }
    
  } catch (error) {
    log(`❌ Manual sync failed: ${error.message}`, 'error');
  }
  
  log('\n📋 Next Steps:');
  log('1. Check the responses above for any errors');
  log('2. If functions are not working, check Supabase Dashboard > Functions');
  log('3. If no errors but still wrong plan, check Stripe webhook configuration');
  log('4. Consider manually updating database as temporary fix');
}

manualSync();