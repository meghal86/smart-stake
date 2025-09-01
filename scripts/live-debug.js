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
const STRIPE_SECRET_KEY = envVars.STRIPE_SECRET_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📋';
  console.log(`${emoji} [${timestamp}] ${message}`);
}

async function liveDebug() {
  log('🔥 LIVE SYSTEM DEBUG - FINDING THE REAL ISSUE');
  log('Let me check your actual live system and see what happens when you upgrade');
  log('');

  try {
    // 1. Check Stripe API directly
    log('📊 STEP 1: Testing Stripe API Connection');
    
    try {
      const stripeResponse = await fetch('https://api.stripe.com/v1/products', {
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (stripeResponse.ok) {
        const stripeData = await stripeResponse.json();
        log(`✅ Stripe API connected - found ${stripeData.data.length} products`, 'success');
      } else {
        log(`❌ Stripe API failed: ${stripeResponse.status}`, 'error');
      }
    } catch (error) {
      log(`❌ Stripe API error: ${error.message}`, 'error');
    }

    // 2. Check your actual Stripe subscriptions
    log('\n📊 STEP 2: Checking Your Stripe Subscriptions');
    
    try {
      const subsResponse = await fetch('https://api.stripe.com/v1/subscriptions?limit=10', {
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (subsResponse.ok) {
        const subsData = await subsResponse.json();
        log(`✅ Found ${subsData.data.length} Stripe subscriptions`, 'success');
        
        if (subsData.data.length > 0) {
          log('Your Stripe subscriptions:');
          subsData.data.forEach((sub, i) => {
            const priceId = sub.items.data[0]?.price?.id;
            const planName = priceId === 'price_1S0HB3JwuQyqUsks8bKNUt6M' ? 'PRO' : 
                           priceId === 'price_1S0HBOJwuQyqUsksDCs7SbPB' ? 'PREMIUM' : 'UNKNOWN';
            log(`  ${i + 1}. ID: ${sub.id}, Status: ${sub.status}, Plan: ${planName}, Customer: ${sub.customer}`);
            log(`     Price ID: ${priceId}`);
            log(`     Metadata: ${JSON.stringify(sub.metadata)}`);
          });
        } else {
          log('⚠️ No subscriptions found in Stripe', 'warning');
        }
      } else {
        log(`❌ Failed to get Stripe subscriptions: ${subsResponse.status}`, 'error');
      }
    } catch (error) {
      log(`❌ Stripe subscriptions error: ${error.message}`, 'error');
    }

    // 3. Check Stripe webhooks
    log('\n📊 STEP 3: Checking Stripe Webhook Configuration');
    
    try {
      const webhooksResponse = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (webhooksResponse.ok) {
        const webhooksData = await webhooksResponse.json();
        log(`✅ Found ${webhooksData.data.length} webhook endpoints`, 'success');
        
        const expectedUrl = `${SUPABASE_URL}/functions/v1/stripe-webhook`;
        let foundCorrectWebhook = false;
        
        webhooksData.data.forEach((webhook, i) => {
          log(`  ${i + 1}. URL: ${webhook.url}`);
          log(`     Status: ${webhook.status}`);
          log(`     Events: ${webhook.enabled_events.join(', ')}`);
          
          if (webhook.url === expectedUrl) {
            foundCorrectWebhook = true;
            log(`     ✅ This is your webhook!`, 'success');
          }
        });
        
        if (!foundCorrectWebhook) {
          log(`❌ CRITICAL: No webhook found for ${expectedUrl}`, 'error');
          log('This is why your subscription upgrades are not syncing!');
        }
      } else {
        log(`❌ Failed to get webhooks: ${webhooksResponse.status}`, 'error');
      }
    } catch (error) {
      log(`❌ Webhook check error: ${error.message}`, 'error');
    }

    // 4. Test your actual webhook function with a real payload
    log('\n📊 STEP 4: Testing Your Webhook Function');
    
    const testWebhookPayload = {
      id: 'evt_test_webhook',
      object: 'event',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test123',
          object: 'subscription',
          status: 'active',
          customer: 'cus_test123',
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
        body: JSON.stringify(testWebhookPayload)
      });
      
      const webhookText = await webhookResponse.text();
      log(`Webhook function response: ${webhookResponse.status}`);
      log(`Response body: ${webhookText}`);
      
      if (webhookResponse.status === 400 && webhookText.includes('signature')) {
        log('✅ Webhook function is working (correctly rejecting invalid signature)', 'success');
      } else if (webhookResponse.status === 500) {
        log('❌ Webhook function has internal errors', 'error');
      }
    } catch (error) {
      log(`❌ Webhook function test failed: ${error.message}`, 'error');
    }

    // 5. Check your database directly
    log('\n📊 STEP 5: Checking Your Database State');
    
    // Check users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      log(`❌ Cannot read users: ${usersError.message}`, 'error');
    } else {
      log(`✅ Users table: ${users.length} records`, 'success');
      users.forEach((user, i) => {
        log(`  ${i + 1}. Email: ${user.email}, Plan: ${user.plan}, User ID: ${user.user_id}`);
      });
    }

    // Check subscriptions
    const { data: subs, error: subsError } = await supabase
      .from('subscriptions')
      .select('*');
    
    if (subsError) {
      log(`❌ Cannot read subscriptions: ${subsError.message}`, 'error');
    } else {
      log(`✅ Subscriptions table: ${subs.length} records`, 'success');
      subs.forEach((sub, i) => {
        log(`  ${i + 1}. User: ${sub.user_id}, Status: ${sub.status}, Product: ${sub.product_id}`);
      });
    }

    // Check webhook logs
    const { data: webhookLogs, error: webhookLogsError } = await supabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (webhookLogsError) {
      log(`❌ Cannot read webhook logs: ${webhookLogsError.message}`, 'error');
    } else {
      log(`✅ Webhook logs: ${webhookLogs.length} records`, 'success');
      webhookLogs.forEach((log_entry, i) => {
        log(`  ${i + 1}. ${log_entry.event_type} - ${log_entry.status} (${log_entry.created_at})`);
      });
    }

    // 6. FINAL DIAGNOSIS
    log('\n🎯 REAL ISSUE DIAGNOSIS');
    log('========================');
    
    log('Based on the live system check:');
    
    if (webhooksData?.data?.length === 0 || !foundCorrectWebhook) {
      log('❌ PRIMARY ISSUE: Stripe webhook not configured', 'error');
      log('');
      log('🔧 IMMEDIATE FIX:');
      log('1. Go to https://dashboard.stripe.com/webhooks');
      log('2. Click "Add endpoint"');
      log(`3. URL: ${SUPABASE_URL}/functions/v1/stripe-webhook`);
      log('4. Events: customer.subscription.updated, checkout.session.completed');
      log('5. Save and copy the signing secret');
      log('6. Update STRIPE_WEBHOOK_SECRET in your .env file');
    }
    
    if (users.length === 0) {
      log('❌ SECONDARY ISSUE: No users in database', 'error');
      log('Your signup process is not creating user records');
    }
    
    if (subs.length === 0 && users.length > 0) {
      log('❌ TERTIARY ISSUE: Users exist but no subscriptions', 'error');
      log('Webhook is not processing subscription events');
    }

    log('\n💡 NEXT STEPS:');
    log('1. Fix the webhook configuration first (most critical)');
    log('2. Test a subscription upgrade');
    log('3. Check if webhook events start appearing');
    log('4. If still broken, we\'ll debug the webhook processing');

  } catch (error) {
    log(`❌ Live debug failed: ${error.message}`, 'error');
    console.error('Full error:', error);
  }
}

liveDebug();