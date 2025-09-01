import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Test data
const testUserId = 'test-user-12345';
const testEmail = 'test@example.com';
const testCustomerId = 'cus_test_customer_id';
const testSubscriptionId = 'sub_test_subscription_id';

describe('Subscription Database Tests', () => {
  beforeEach(async () => {
    // Clean up any existing test data
    await cleanupTestData();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });

  async function cleanupTestData() {
    try {
      // Delete test user data
      await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', testUserId);

      await supabase
        .from('users_metadata')
        .delete()
        .eq('user_id', testUserId);

      await supabase
        .from('users')
        .delete()
        .eq('user_id', testUserId);
    } catch (error) {
      // Ignore cleanup errors
      console.log('Cleanup error (ignored):', error);
    }
  }

  describe('User Creation and Plan Management', () => {
    it('should create a new user with free plan', async () => {
      const { data, error } = await supabase
        .from('users')
        .insert({
          user_id: testUserId,
          email: testEmail,
          plan: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.plan).toBe('free');
      expect(data.user_id).toBe(testUserId);
    });

    it('should update user plan from free to pro', async () => {
      // First create a user with free plan
      await supabase
        .from('users')
        .insert({
          user_id: testUserId,
          email: testEmail,
          plan: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      // Update to pro plan
      const { data, error } = await supabase
        .from('users')
        .update({
          plan: 'pro',
          stripe_customer_id: testCustomerId,
          stripe_subscription_id: testSubscriptionId,
          subscription_status: 'active',
          subscription_current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.plan).toBe('pro');
      expect(data.stripe_customer_id).toBe(testCustomerId);
      expect(data.subscription_status).toBe('active');
    });

    it('should update user plan from pro to premium', async () => {
      // First create a user with pro plan
      await supabase
        .from('users')
        .insert({
          user_id: testUserId,
          email: testEmail,
          plan: 'pro',
          stripe_customer_id: testCustomerId,
          stripe_subscription_id: testSubscriptionId,
          subscription_status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      // Update to premium plan
      const { data, error } = await supabase
        .from('users')
        .update({
          plan: 'premium',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.plan).toBe('premium');
    });

    it('should handle plan downgrade from premium to free', async () => {
      // First create a user with premium plan
      await supabase
        .from('users')
        .insert({
          user_id: testUserId,
          email: testEmail,
          plan: 'premium',
          stripe_customer_id: testCustomerId,
          stripe_subscription_id: testSubscriptionId,
          subscription_status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      // Downgrade to free plan
      const { data, error } = await supabase
        .from('users')
        .update({
          plan: 'free',
          subscription_status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.plan).toBe('free');
      expect(data.subscription_status).toBe('canceled');
    });
  });

  describe('Subscription Management', () => {
    it('should create a subscription record', async () => {
      const subscriptionData = {
        user_id: testUserId,
        product_id: 'prod_test_product',
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        stripe_subscription_id: testSubscriptionId,
        stripe_customer_id: testCustomerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.user_id).toBe(testUserId);
      expect(data.status).toBe('active');
    });

    it('should update subscription status', async () => {
      // First create a subscription
      await supabase
        .from('subscriptions')
        .insert({
          user_id: testUserId,
          product_id: 'prod_test_product',
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stripe_subscription_id: testSubscriptionId,
          stripe_customer_id: testCustomerId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      // Update subscription status
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.status).toBe('past_due');
    });

    it('should handle subscription cancellation', async () => {
      // First create a subscription
      await supabase
        .from('subscriptions')
        .insert({
          user_id: testUserId,
          product_id: 'prod_test_product',
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stripe_subscription_id: testSubscriptionId,
          stripe_customer_id: testCustomerId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      // Cancel subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.status).toBe('canceled');
    });
  });

  describe('User Metadata Management', () => {
    it('should create user metadata with subscription info', async () => {
      const metadataData = {
        user_id: testUserId,
        subscription: {
          plan: 'pro',
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stripe_subscription_id: testSubscriptionId,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('users_metadata')
        .insert(metadataData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.subscription.plan).toBe('pro');
      expect(data.subscription.status).toBe('active');
    });

    it('should update user metadata subscription info', async () => {
      // First create user metadata
      await supabase
        .from('users_metadata')
        .insert({
          user_id: testUserId,
          subscription: {
            plan: 'pro',
            status: 'active',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            stripe_subscription_id: testSubscriptionId,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      // Update to premium
      const { data, error } = await supabase
        .from('users_metadata')
        .update({
          subscription: {
            plan: 'premium',
            status: 'active',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            stripe_subscription_id: testSubscriptionId,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', testUserId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.subscription.plan).toBe('premium');
    });
  });

  describe('Data Consistency Tests', () => {
    it('should maintain consistency between users and subscriptions tables', async () => {
      // Create user with pro plan
      await supabase
        .from('users')
        .insert({
          user_id: testUserId,
          email: testEmail,
          plan: 'pro',
          stripe_customer_id: testCustomerId,
          stripe_subscription_id: testSubscriptionId,
          subscription_status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      // Create corresponding subscription
      await supabase
        .from('subscriptions')
        .insert({
          user_id: testUserId,
          product_id: 'prod_test_product',
          status: 'active',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stripe_subscription_id: testSubscriptionId,
          stripe_customer_id: testCustomerId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      // Verify consistency
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', testUserId)
        .single();

      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', testUserId)
        .single();

      expect(userData.plan).toBe('pro');
      expect(userData.subscription_status).toBe('active');
      expect(subscriptionData.status).toBe('active');
      expect(userData.stripe_subscription_id).toBe(subscriptionData.stripe_subscription_id);
    });

    it('should handle concurrent updates correctly', async () => {
      // Create initial user
      await supabase
        .from('users')
        .insert({
          user_id: testUserId,
          email: testEmail,
          plan: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      // Simulate concurrent updates (this would be handled by the webhook in real scenarios)
      const updates = [
        supabase
          .from('users')
          .update({
            plan: 'pro',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', testUserId),
        
        supabase
          .from('users')
          .update({
            stripe_customer_id: testCustomerId,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', testUserId),
      ];

      // Execute updates
      const results = await Promise.all(updates);
      
      // All updates should succeed
      results.forEach(result => {
        expect(result.error).toBeNull();
      });

      // Verify final state
      const { data: finalUser } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', testUserId)
        .single();

      expect(finalUser).toBeDefined();
      expect(finalUser.user_id).toBe(testUserId);
    });
  });
});