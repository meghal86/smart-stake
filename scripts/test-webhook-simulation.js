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

async function testWebhookSimulation() {
  log('🧪 Testing Webhook Simulation');
  log('This simulates what happens when Stripe sends a subscription.updated webhook');
  
  try {
    // Create a test webhook payload similar to what Stripe would send
    const testWebhookPayload = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test123',
          customer: 'cus_test123',
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days from now
          items: {
            data: [{
              price: {
                id: 'price_1S0HBOJwuQyqUsksDCs7SbPB' // Premium plan price ID
              }
            }]
          },
          metadata: {
            user_id: 'test-user-id-123'
          }
        }
      }
    };
    
    log('📤 Sending test webhook to stripe-webhook function');
    
    // Test the webhook function with a simulated payload
    const webhookUrl = `${SUPABASE_URL}/functions/v1/stripe-webhook`;
    
    // This will fail signature verification, but we can see if the function is processing correctly
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'stripe-signature': 'test-signature' // This will fail verification, which is expected
      },
      body: JSON.stringify(testWebhookPayload)
    });
    
    const responseText = await response.text();
    log(`Webhook Response Status: ${response.status}`);
    log(`Webhook Response: ${responseText}`);
    
    if (response.status === 400 && responseText.includes('Webhook Error')) {
      log('✅ Webhook correctly validates signatures (this is expected for test)', 'success');
    }
    
    // Now let's check what the real issue might be
    log('\n🔍 Checking Your Stripe Webhook Configuration');
    
    log('📋 To fix your subscription upgrade issue, you need to:');
    log('');
    log('1. 🌐 Go to Stripe Dashboard > Webhooks');
    log('2. ✅ Verify webhook URL is: ' + webhookUrl);
    log('3. ✅ Ensure these events are enabled:');
    log('   - customer.subscription.created');
    log('   - customer.subscription.updated');
    log('   - customer.subscription.deleted');
    log('   - checkout.session.completed');
    log('4. ✅ Copy the webhook signing secret to your .env file');
    log('');
    log('🎯 Most likely issue: Webhook URL not configured in Stripe');
    log('');
    log('📊 After configuring the webhook:');
    log('1. Try upgrading your subscription again');
    log('2. Check Stripe Dashboard > Webhooks > Recent deliveries');
    log('3. Check Supabase Dashboard > Functions > stripe-webhook > Logs');
    log('4. Your plan should update automatically!');
    
    // Check if webhook_logs table exists
    log('\n🗄️ Checking webhook logs table');
    
    const { data: logs, error: logsError } = await supabase
      .from('webhook_logs')
      .select('*')
      .limit(5);
    
    if (logsError) {
      log('⚠️ Webhook logs table not found - this is needed for debugging', 'warning');
      log('Run this SQL in Supabase Dashboard > SQL Editor:');
      log('');
      log('CREATE TABLE IF NOT EXISTS public.webhook_logs (');
      log('  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,');
      log('  event_type TEXT NOT NULL,');
      log('  event_id TEXT,');
      log('  status TEXT NOT NULL,');
      log('  error_message TEXT,');
      log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
      log(');');
    } else {
      log(`✅ Webhook logs table exists with ${logs.length} entries`, 'success');
      if (logs.length > 0) {
        log('Recent webhook events:');
        logs.forEach((entry, i) => {
          log(`  ${i + 1}. ${entry.event_type} - ${entry.status} (${entry.created_at})`);
        });
      }
    }
    
  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'error');
  }
}

testWebhookSimulation();