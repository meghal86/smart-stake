import { supabase } from '@/integrations/supabase/client';

export interface TestUser {
  id: string;
  email: string;
  plan: 'free' | 'pro' | 'premium';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface TestSubscription {
  id: string;
  customerId: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  priceId: string;
  currentPeriodEnd: number;
}

export class SubscriptionTestUtils {
  static readonly PRICE_IDS = {
    PRO: 'price_1S0HB3JwuQyqUsks8bKNUt6M',
    PREMIUM: 'price_1S0HBOJwuQyqUsksDCs7SbPB',
  };

  /**
   * Create a test user in the database
   */
  static async createTestUser(userData: Partial<TestUser> & { id: string; email: string }): Promise<TestUser> {
    const user: TestUser = {
      plan: 'free',
      ...userData,
    };

    const { data, error } = await supabase
      .from('users')
      .insert({
        user_id: user.id,
        email: user.email,
        plan: user.plan,
        stripe_customer_id: user.stripeCustomerId,
        stripe_subscription_id: user.stripeSubscriptionId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }

    return user;
  }

  /**
   * Update user plan in the database
   */
  static async updateUserPlan(userId: string, plan: 'free' | 'pro' | 'premium', subscriptionData?: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    currentPeriodEnd?: string;
  }): Promise<void> {
    const updateData: unknown = {
      plan,
      updated_at: new Date().toISOString(),
    };

    if (subscriptionData) {
      if (subscriptionData.stripeCustomerId) {
        updateData.stripe_customer_id = subscriptionData.stripeCustomerId;
      }
      if (subscriptionData.stripeSubscriptionId) {
        updateData.stripe_subscription_id = subscriptionData.stripeSubscriptionId;
      }
      if (subscriptionData.subscriptionStatus) {
        updateData.subscription_status = subscriptionData.subscriptionStatus;
      }
      if (subscriptionData.currentPeriodEnd) {
        updateData.subscription_current_period_end = subscriptionData.currentPeriodEnd;
      }
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update user plan: ${error.message}`);
    }
  }

  /**
   * Get user data from the database
   */
  static async getUser(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a subscription record
   */
  static async createSubscription(subscriptionData: {
    userId: string;
    productId: string;
    status: string;
    currentPeriodEnd: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: subscriptionData.userId,
        product_id: subscriptionData.productId,
        status: subscriptionData.status,
        current_period_end: subscriptionData.currentPeriodEnd,
        stripe_subscription_id: subscriptionData.stripeSubscriptionId,
        stripe_customer_id: subscriptionData.stripeCustomerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Update user metadata with subscription info
   */
  static async updateUserMetadata(userId: string, subscriptionInfo: {
    plan: string;
    status: string;
    currentPeriodEnd: string;
    stripeSubscriptionId: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('users_metadata')
      .upsert({
        user_id: userId,
        subscription: subscriptionInfo,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to update user metadata: ${error.message}`);
    }
  }

  /**
   * Simulate a Stripe webhook event
   */
  static async simulateWebhookEvent(eventType: string, eventData: unknown): Promise<Response> {
    // This would call the actual webhook function in a real test environment
    // For now, we'll simulate the database updates that the webhook would make
    
    switch (eventType) {
      case 'checkout.session.completed':
        return this.handleCheckoutCompleted(eventData);
      case 'customer.subscription.updated':
        return this.handleSubscriptionUpdated(eventData);
      case 'customer.subscription.deleted':
        return this.handleSubscriptionDeleted(eventData);
      default:
        throw new Error(`Unsupported event type: ${eventType}`);
    }
  }

  private static async handleCheckoutCompleted(sessionData: unknown): Promise<Response> {
    const userId = sessionData.metadata?.user_id;
    if (!userId) {
      throw new Error('No user_id in session metadata');
    }

    // Determine plan based on price ID
    let plan = 'free';
    if (sessionData.subscription?.items?.data?.[0]?.price?.id === this.PRICE_IDS.PRO) {
      plan = 'pro';
    } else if (sessionData.subscription?.items?.data?.[0]?.price?.id === this.PRICE_IDS.PREMIUM) {
      plan = 'premium';
    }

    // Update user plan
    await this.updateUserPlan(userId, plan as any, {
      stripeCustomerId: sessionData.subscription?.customer,
      stripeSubscriptionId: sessionData.subscription?.id,
      subscriptionStatus: sessionData.subscription?.status,
      currentPeriodEnd: new Date(sessionData.subscription?.current_period_end * 1000).toISOString(),
    });

    // Create subscription record
    await this.createSubscription({
      userId,
      productId: sessionData.subscription?.items?.data?.[0]?.price?.product || 'prod_test',
      status: sessionData.subscription?.status || 'active',
      currentPeriodEnd: new Date(sessionData.subscription?.current_period_end * 1000).toISOString(),
      stripeSubscriptionId: sessionData.subscription?.id,
      stripeCustomerId: sessionData.subscription?.customer,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  private static async handleSubscriptionUpdated(subscriptionData: unknown): Promise<Response> {
    const userId = subscriptionData.metadata?.user_id;
    if (!userId) {
      throw new Error('No user_id in subscription metadata');
    }

    // Determine plan based on price ID
    let plan = 'free';
    if (subscriptionData.items?.data?.[0]?.price?.id === this.PRICE_IDS.PRO) {
      plan = 'pro';
    } else if (subscriptionData.items?.data?.[0]?.price?.id === this.PRICE_IDS.PREMIUM) {
      plan = 'premium';
    }

    // Update user plan
    await this.updateUserPlan(userId, plan as any, {
      subscriptionStatus: subscriptionData.status,
      currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000).toISOString(),
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  private static async handleSubscriptionDeleted(subscriptionData: unknown): Promise<Response> {
    const userId = subscriptionData.metadata?.user_id;
    if (!userId) {
      throw new Error('No user_id in subscription metadata');
    }

    // Update user to free plan
    await this.updateUserPlan(userId, 'free', {
      subscriptionStatus: 'canceled',
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  /**
   * Clean up test data
   */
  static async cleanupTestUser(userId: string): Promise<void> {
    // Delete in order to avoid foreign key constraints
    await supabase.from('subscriptions').delete().eq('user_id', userId);
    await supabase.from('users_metadata').delete().eq('user_id', userId);
    await supabase.from('users').delete().eq('user_id', userId);
  }

  /**
   * Test the complete subscription flow
   */
  static async testSubscriptionFlow(userId: string, email: string, targetPlan: 'pro' | 'premium'): Promise<{
    success: boolean;
    steps: string[];
    errors: string[];
  }> {
    const steps: string[] = [];
    const errors: string[] = [];

    try {
      // Step 1: Create user with free plan
      steps.push('Creating user with free plan');
      await this.createTestUser({ id: userId, email, plan: 'free' });
      
      // Step 2: Simulate checkout session completed
      steps.push('Simulating checkout session completed');
      const priceId = targetPlan === 'pro' ? this.PRICE_IDS.PRO : this.PRICE_IDS.PREMIUM;
      const mockSessionData = {
        metadata: { user_id: userId },
        subscription: {
          id: `sub_test_${userId}`,
          customer: `cus_test_${userId}`,
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days from now
          items: {
            data: [{
              price: {
                id: priceId,
                product: `prod_test_${targetPlan}`,
              },
            }],
          },
        },
      };

      await this.simulateWebhookEvent('checkout.session.completed', mockSessionData);

      // Step 3: Verify user plan was updated
      steps.push('Verifying user plan update');
      const updatedUser = await this.getUser(userId);
      if (updatedUser.plan !== targetPlan) {
        errors.push(`Expected plan ${targetPlan}, got ${updatedUser.plan}`);
      }

      // Step 4: Test plan change (pro to premium or vice versa)
      if (targetPlan === 'pro') {
        steps.push('Testing upgrade to premium');
        const premiumSessionData = {
          ...mockSessionData,
          subscription: {
            ...mockSessionData.subscription,
            items: {
              data: [{
                price: {
                  id: this.PRICE_IDS.PREMIUM,
                  product: 'prod_test_premium',
                },
              }],
            },
          },
        };
        await this.simulateWebhookEvent('customer.subscription.updated', premiumSessionData.subscription);
        
        const premiumUser = await this.getUser(userId);
        if (premiumUser.plan !== 'premium') {
          errors.push(`Expected plan premium after upgrade, got ${premiumUser.plan}`);
        }
      }

      // Step 5: Test subscription cancellation
      steps.push('Testing subscription cancellation');
      await this.simulateWebhookEvent('customer.subscription.deleted', {
        metadata: { user_id: userId },
      });

      const canceledUser = await this.getUser(userId);
      if (canceledUser.plan !== 'free') {
        errors.push(`Expected plan free after cancellation, got ${canceledUser.plan}`);
      }

      steps.push('Subscription flow test completed successfully');
      return { success: errors.length === 0, steps, errors };

    } catch (error) {
      errors.push(`Test failed with error: ${error.message}`);
      return { success: false, steps, errors };
    } finally {
      // Clean up
      try {
        await this.cleanupTestUser(userId);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  }
}