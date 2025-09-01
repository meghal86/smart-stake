# Subscription System Testing Guide

This guide explains how to test the subscription system automatically instead of manually updating the database.

## Overview

The subscription system includes:
- **Edge Functions**: `create-checkout-session`, `stripe-webhook`, `manage-subscription`
- **Database Tables**: `users`, `subscriptions`, `users_metadata`
- **Plan Types**: `free`, `pro`, `premium`
- **Stripe Integration**: Webhooks, checkout sessions, subscription management

## Automated Testing

### Quick Test (Recommended)

Run the comprehensive subscription test:

```bash
npm run test:subscription
```

This will test:
- ✅ Database operations (create, update, plan transitions)
- ✅ Edge function deployment status
- ✅ Complete subscription flow simulation
- ✅ Error handling and edge cases

### Unit Tests

Run individual component tests:

```bash
# Run all tests
npm test

# Run subscription-specific tests
npm test -- --grep "subscription"

# Run with coverage
npm run test:coverage
```

### Integration Tests

Run the full test suite including database and API tests:

```bash
# Run end-to-end subscription tests
npm test src/__tests__/e2e/SubscriptionE2E.test.ts

# Run database tests
npm test src/__tests__/database/SubscriptionDatabase.test.ts

# Run edge function tests
npm test src/__tests__/integration/EdgeFunctions.test.ts
```

## Test Scenarios Covered

### 1. Database Operations
- ✅ Create user with free plan
- ✅ Update user from free to pro
- ✅ Update user from pro to premium
- ✅ Downgrade user from premium to free
- ✅ Handle subscription records
- ✅ Update user metadata
- ✅ Data consistency between tables

### 2. Edge Functions
- ✅ `create-checkout-session` deployment and functionality
- ✅ `stripe-webhook` event handling
- ✅ `manage-subscription` operations
- ✅ Authentication and authorization
- ✅ Error handling and validation

### 3. Subscription Flow
- ✅ Free → Pro upgrade via Stripe checkout
- ✅ Pro → Premium upgrade via subscription update
- ✅ Premium → Free downgrade via cancellation
- ✅ Webhook event processing
- ✅ Database synchronization

### 4. Error Handling
- ✅ Missing user_id in webhook events
- ✅ Invalid plan transitions
- ✅ Database constraint violations
- ✅ Authentication failures
- ✅ Stripe API errors

## Manual Testing (If Needed)

If you need to manually test specific scenarios:

### 1. Test Pro Plan Upgrade

```javascript
// In browser console or test file
const { supabase } = await import('./src/integrations/supabase/client');

// Simulate pro plan upgrade
const result = await supabase.functions.invoke('create-checkout-session', {
  body: {
    priceId: 'price_1S0HB3JwuQyqUsks8bKNUt6M', // Pro plan
    successUrl: window.location.origin + '/subscription/success',
    cancelUrl: window.location.origin + '/subscription'
  }
});

console.log('Checkout session:', result);
```

### 2. Test Premium Plan Upgrade

```javascript
// Simulate premium plan upgrade
const result = await supabase.functions.invoke('create-checkout-session', {
  body: {
    priceId: 'price_1S0HBOJwuQyqUsksDCs7SbPB', // Premium plan
    successUrl: window.location.origin + '/subscription/success',
    cancelUrl: window.location.origin + '/subscription'
  }
});

console.log('Checkout session:', result);
```

### 3. Check User Plan Status

```javascript
// Check current user plan
const { data: user } = await supabase.auth.getUser();
if (user) {
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', user.user.id)
    .single();
  
  console.log('Current user plan:', userData.plan);
  console.log('Subscription status:', userData.subscription_status);
}
```

## Troubleshooting

### Common Issues

1. **Edge Functions Not Deployed**
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook
   supabase functions deploy manage-subscription
   ```

2. **Database Permission Issues**
   - Check RLS policies in Supabase dashboard
   - Ensure service role key has proper permissions

3. **Stripe Configuration**
   - Verify `STRIPE_SECRET_KEY` in Supabase Edge Function secrets
   - Verify `STRIPE_WEBHOOK_SECRET` for webhook validation
   - Check price IDs match your Stripe products

4. **Plan Not Updating After Payment**
   - Check webhook logs in Supabase dashboard
   - Verify webhook endpoint is configured in Stripe
   - Check that `user_id` is included in checkout session metadata

### Debug Commands

```bash
# Check edge function logs
supabase functions logs stripe-webhook

# Check database for user plan
supabase db inspect --table users

# Test webhook locally
supabase functions serve stripe-webhook
```

## Test Data Cleanup

The automated tests clean up after themselves, but if you need to manually clean up test data:

```sql
-- Clean up test users (replace with actual test user ID)
DELETE FROM subscriptions WHERE user_id LIKE 'test-user-%';
DELETE FROM users_metadata WHERE user_id LIKE 'test-user-%';
DELETE FROM users WHERE user_id LIKE 'test-user-%';
```

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Test Subscription System
  run: |
    npm install
    npm run test:subscription
    npm run test:ci
```

## Monitoring

Set up monitoring for:
- Webhook success/failure rates
- Plan upgrade/downgrade events
- Database consistency checks
- Edge function performance

## Support

If tests are failing:
1. Check the test output for specific error messages
2. Verify all environment variables are set
3. Ensure Stripe webhooks are configured correctly
4. Check Supabase dashboard for function logs and database issues

For additional help, check the logs in:
- Supabase Dashboard → Functions → Logs
- Supabase Dashboard → Database → Logs
- Stripe Dashboard → Webhooks → Events