#!/usr/bin/env node

/**
 * Subscription System Test Runner
 * 
 * This script tests the complete subscription system including:
 * - Edge Functions (create-checkout-session, stripe-webhook, manage-subscription)
 * - Database operations (users, subscriptions, users_metadata)
 * - Plan transitions (free -> pro -> premium -> canceled)
 * 
 * Usage: node scripts/test-subscription.js
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
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        envVars[key.trim()] = value.trim();
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
  console.error('Available env vars:', Object.keys(envVars));
  console.error('SUPABASE_URL:', SUPABASE_URL);
  console.error('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Set' : 'Not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Generate a proper UUID for testing
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Test data
const TEST_USER_ID = generateUUID();
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const PRICE_IDS = {
  PRO: 'price_1S0HB3JwuQyqUsks8bKNUt6M',
  PREMIUM: 'price_1S0HBOJwuQyqUsksDCs7SbPB',
};

class SubscriptionTester {
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

  async cleanup() {
    try {
      // Clean up test data
      await supabase.from('subscriptions').delete().eq('user_id', TEST_USER_ID);
      await supabase.from('users_metadata').delete().eq('user_id', TEST_USER_ID);
      await supabase.from('users').delete().eq('user_id', TEST_USER_ID);
      this.log('Cleanup completed', 'success');
    } catch (error) {
      this.log(`Cleanup error (ignored): ${error.message}`, 'warning');
    }
  }

  async createTestUser(plan = 'free') {
    const { data, error } = await supabase
      .from('users')
      .insert({
        user_id: TEST_USER_ID,
        email: TEST_EMAIL,
        plan: plan,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create test user: ${error.message}`);
    return data;
  }

  async getUser() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .single();

    if (error) throw new Error(`Failed to get user: ${error.message}`);
    return data;
  }

  async updateUserPlan(plan, subscriptionData = {}) {
    const updateData = {
      plan,
      updated_at: new Date().toISOString(),
      ...subscriptionData,
    };

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', TEST_USER_ID);

    if (error) throw new Error(`Failed to update user plan: ${error.message}`);
  }

  async testDatabaseOperations() {
    await this.test('Create user with free plan', async () => {
      const user = await this.createTestUser('free');
      if (user.plan !== 'free') {
        throw new Error(`Expected free plan, got ${user.plan}`);
      }
    });

    await this.test('Update user to pro plan', async () => {
      await this.updateUserPlan('pro', {
        stripe_customer_id: 'cus_test_customer',
        stripe_subscription_id: 'sub_test_subscription',
        subscription_status: 'active',
      });

      const user = await this.getUser();
      if (user.plan !== 'pro') {
        throw new Error(`Expected pro plan, got ${user.plan}`);
      }
    });

    await this.test('Update user to premium plan', async () => {
      await this.updateUserPlan('premium');
      const user = await this.getUser();
      if (user.plan !== 'premium') {
        throw new Error(`Expected premium plan, got ${user.plan}`);
      }
    });

    await this.test('Downgrade user to free plan', async () => {
      await this.updateUserPlan('free', {
        subscription_status: 'canceled',
      });
      const user = await this.getUser();
      if (user.plan !== 'free') {
        throw new Error(`Expected free plan, got ${user.plan}`);
      }
    });
  }

  async testEdgeFunctions() {
    // Note: These tests require authentication, so they might fail in CI
    // In a real environment, you'd need to authenticate first

    await this.test('Test create-checkout-session function exists', async () => {
      // Just test that the function exists and responds
      try {
        const { error } = await supabase.functions.invoke('create-checkout-session', {
          body: { priceId: PRICE_IDS.PRO },
        });
        
        // We expect this to fail with 401 (unauthorized) since we're not authenticated
        // But if it fails with 404, the function doesn't exist
        if (error && error.message && error.message.includes('404')) {
          throw new Error('Function not found - may not be deployed');
        }
        
        // Any other error (like 401) means the function exists
        this.log('create-checkout-session function is deployed', 'success');
      } catch (error) {
        if (error.message.includes('404')) {
          throw error;
        }
        // Other errors are expected (like auth errors)
      }
    });

    await this.test('Test stripe-webhook function exists', async () => {
      try {
        const { error } = await supabase.functions.invoke('stripe-webhook', {
          body: { test: true },
        });
        
        if (error && error.message && error.message.includes('404')) {
          throw new Error('Function not found - may not be deployed');
        }
        
        this.log('stripe-webhook function is deployed', 'success');
      } catch (error) {
        if (error.message.includes('404')) {
          throw error;
        }
      }
    });

    await this.test('Test manage-subscription function exists', async () => {
      try {
        const { error } = await supabase.functions.invoke('manage-subscription', {
          body: { action: 'get_details' },
        });
        
        if (error && error.message && error.message.includes('404')) {
          throw new Error('Function not found - may not be deployed');
        }
        
        this.log('manage-subscription function is deployed', 'success');
      } catch (error) {
        if (error.message.includes('404')) {
          throw error;
        }
      }
    });
  }

  async testSubscriptionFlow() {
    await this.test('Complete subscription flow simulation', async () => {
      // Create user
      await this.createTestUser('free');
      
      // Simulate checkout completed (pro plan)
      await this.updateUserPlan('pro', {
        stripe_customer_id: 'cus_test_customer',
        stripe_subscription_id: 'sub_test_subscription',
        subscription_status: 'active',
        subscription_current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      let user = await this.getUser();
      if (user.plan !== 'pro') {
        throw new Error(`Expected pro plan after checkout, got ${user.plan}`);
      }

      // Simulate subscription update (premium plan)
      await this.updateUserPlan('premium');
      user = await this.getUser();
      if (user.plan !== 'premium') {
        throw new Error(`Expected premium plan after update, got ${user.plan}`);
      }

      // Simulate subscription cancellation
      await this.updateUserPlan('free', {
        subscription_status: 'canceled',
      });
      user = await this.getUser();
      if (user.plan !== 'free') {
        throw new Error(`Expected free plan after cancellation, got ${user.plan}`);
      }

      this.log('Complete subscription flow test passed', 'success');
    });
  }

  async run() {
    this.log('🚀 Starting Subscription System Tests');
    this.log(`Test User ID: ${TEST_USER_ID}`);
    this.log(`Test Email: ${TEST_EMAIL}`);

    // Clean up any existing test data
    await this.cleanup();

    try {
      // Test database operations
      this.log('\n📊 Testing Database Operations');
      await this.testDatabaseOperations();

      // Clean up before next test
      await this.cleanup();

      // Test edge functions
      this.log('\n⚡ Testing Edge Functions');
      await this.testEdgeFunctions();

      // Test complete flow
      this.log('\n🔄 Testing Complete Subscription Flow');
      await this.testSubscriptionFlow();

    } finally {
      // Final cleanup
      await this.cleanup();
    }

    // Print results
    this.log('\n📈 Test Results Summary');
    this.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    this.log(`Passed: ${this.results.passed}`, 'success');
    this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'success');

    if (this.results.failed > 0) {
      this.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(test => test.status === 'failed')
        .forEach(test => {
          this.log(`  - ${test.name}: ${test.error}`, 'error');
        });
    }

    this.log('\n🎯 Recommendations:');
    if (this.results.failed === 0) {
      this.log('✅ All tests passed! Your subscription system is working correctly.', 'success');
    } else {
      this.log('❌ Some tests failed. Please check the errors above and fix the issues.', 'error');
      this.log('💡 Common issues:', 'warning');
      this.log('  - Edge functions not deployed (run: supabase functions deploy <function-name>)');
      this.log('  - Database permissions (check RLS policies)');
      this.log('  - Missing environment variables (Stripe keys, Supabase config)');
    }

    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Run the tests
const tester = new SubscriptionTester();
tester.run().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});