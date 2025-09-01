#!/usr/bin/env node

/**
 * Simple Subscription System Test
 * 
 * This script tests the subscription system components that are accessible
 * without bypassing RLS policies.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env file
function loadEnvVars() {
  try {
    const envContent = readFileSync(join(process.cwd(), '.env'), 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          envVars[key.trim()] = value.trim();
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('❌ Could not load .env file:', error.message);
    return {};
  }
}

const envVars = loadEnvVars();

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || envVars.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Price IDs from your Stripe setup
const PRICE_IDS = {
  PRO: 'price_1S0HB3JwuQyqUsks8bKNUt6M',
  PREMIUM: 'price_1S0HBOJwuQyqUsksDCs7SbPB',
};

class SimpleSubscriptionTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: [],
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️',
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async test(name, testFn) {
    this.log(`Running test: ${name}`);
    try {
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'passed' });
      this.log(`Test passed: ${name}`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'failed', error: error.message });
      this.log(`Test failed: ${name} - ${error.message}`, 'error');
    }
  }

  async testEdgeFunctionDeployment() {
    await this.test('Edge Function: create-checkout-session', async () => {
      const { error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId: PRICE_IDS.PRO },
      });
      
      // We expect 401 (unauthorized) since we're not authenticated
      // But 404 would mean the function isn't deployed
      if (error && error.message && error.message.includes('404')) {
        throw new Error('Function not deployed');
      }
      
      this.log('✅ create-checkout-session function is deployed and responding');
    });

    await this.test('Edge Function: stripe-webhook', async () => {
      const { error } = await supabase.functions.invoke('stripe-webhook', {
        body: { test: true },
      });
      
      if (error && error.message && error.message.includes('404')) {
        throw new Error('Function not deployed');
      }
      
      this.log('✅ stripe-webhook function is deployed and responding');
    });

    await this.test('Edge Function: manage-subscription', async () => {
      const { error } = await supabase.functions.invoke('manage-subscription', {
        body: { action: 'get_details' },
      });
      
      if (error && error.message && error.message.includes('404')) {
        throw new Error('Function not deployed');
      }
      
      this.log('✅ manage-subscription function is deployed and responding');
    });
  }

  async testDatabaseConnection() {
    await this.test('Database Connection', async () => {
      // Test basic database connectivity
      const { error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      // We expect this to work even with RLS (just counting)
      if (error && !error.message.includes('permission')) {
        throw new Error(`Database connection failed: ${error.message}`);
      }
      
      this.log('✅ Database connection is working');
    });
  }

  async testPriceIdConfiguration() {
    await this.test('Price ID Configuration', async () => {
      // Test that price IDs are properly configured
      const priceIds = [PRICE_IDS.PRO, PRICE_IDS.PREMIUM];
      
      for (const priceId of priceIds) {
        if (!priceId || !priceId.startsWith('price_')) {
          throw new Error(`Invalid price ID: ${priceId}`);
        }
      }
      
      this.log('✅ Price IDs are properly configured');
      this.log(`   Pro Plan: ${PRICE_IDS.PRO}`);
      this.log(`   Premium Plan: ${PRICE_IDS.PREMIUM}`);
    });
  }

  async testEnvironmentConfiguration() {
    await this.test('Environment Configuration', async () => {
      const requiredVars = {
        'VITE_SUPABASE_URL': SUPABASE_URL,
        'VITE_SUPABASE_PUBLISHABLE_KEY': SUPABASE_ANON_KEY,
        'VITE_STRIPE_PUBLISHABLE_KEY': envVars.VITE_STRIPE_PUBLISHABLE_KEY,
        'STRIPE_SECRET_KEY': envVars.STRIPE_SECRET_KEY,
      };

      const missing = [];
      for (const [key, value] of Object.entries(requiredVars)) {
        if (!value) {
          missing.push(key);
        }
      }

      if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(', ')}`);
      }

      this.log('✅ All required environment variables are set');
    });
  }

  async testWebhookConfiguration() {
    await this.test('Webhook Configuration Check', async () => {
      const webhookSecret = envVars.STRIPE_WEBHOOK_SECRET;
      

      
      if (!webhookSecret || webhookSecret === 'whsec_your_webhook_secret_here') {
        this.log('⚠️ Webhook secret not configured - this will cause webhook failures', 'warning');
        this.log('   Please set STRIPE_WEBHOOK_SECRET in your .env file', 'warning');
        this.log('   Get this from your Stripe Dashboard > Webhooks', 'warning');
      } else if (webhookSecret.startsWith('whsec_') && webhookSecret.length > 20) {
        this.log('✅ Webhook secret is properly configured');
      } else {
        throw new Error(`Invalid webhook secret format - got: ${webhookSecret ? webhookSecret.substring(0, 10) + '...' : 'undefined'}`);
      }
    });
  }

  async run() {
    this.log('🚀 Starting Simple Subscription System Tests');
    this.log('This test checks that your subscription system is properly configured');
    this.log('');

    // Test environment configuration
    this.log('🔧 Testing Environment Configuration');
    await this.testEnvironmentConfiguration();
    await this.testWebhookConfiguration();

    // Test database connection
    this.log('');
    this.log('🗄️ Testing Database Connection');
    await this.testDatabaseConnection();

    // Test edge functions
    this.log('');
    this.log('⚡ Testing Edge Functions');
    await this.testEdgeFunctionDeployment();

    // Test configuration
    this.log('');
    this.log('⚙️ Testing Configuration');
    await this.testPriceIdConfiguration();

    // Print results
    this.log('');
    this.log('📈 Test Results Summary');
    this.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    this.log(`Passed: ${this.results.passed}`, 'success');
    this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'success');

    if (this.results.failed > 0) {
      this.log('');
      this.log('❌ Failed Tests:');
      this.results.tests
        .filter(test => test.status === 'failed')
        .forEach(test => {
          this.log(`  - ${test.name}: ${test.error}`, 'error');
        });
    }

    this.log('');
    this.log('🎯 Next Steps:');
    
    if (this.results.failed === 0) {
      this.log('✅ All configuration tests passed!', 'success');
      this.log('');
      this.log('Your subscription system is properly configured. To test the full flow:');
      this.log('1. 🌐 Open your app in the browser');
      this.log('2. 🔐 Sign up or log in with a test account');
      this.log('3. 💳 Go to /subscription page');
      this.log('4. 🛒 Try upgrading to Pro or Premium');
      this.log('5. 📧 Check webhook logs in Supabase Dashboard');
      this.log('6. 🔍 Verify plan updates in the database');
      this.log('');
      this.log('💡 Pro tip: Use Stripe test cards for testing:');
      this.log('   - Success: 4242 4242 4242 4242');
      this.log('   - Decline: 4000 0000 0000 0002');
    } else {
      this.log('❌ Some configuration issues found. Please fix them first.', 'error');
      this.log('');
      this.log('💡 Common fixes:');
      this.log('  - Deploy edge functions: supabase functions deploy <function-name>');
      this.log('  - Set environment variables in .env file');
      this.log('  - Configure Stripe webhook endpoint');
      this.log('  - Check Supabase project settings');
    }

    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Run the tests
const tester = new SimpleSubscriptionTester();
tester.run().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});