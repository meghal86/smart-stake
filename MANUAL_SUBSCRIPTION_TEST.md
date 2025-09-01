# Manual Subscription Testing Guide

Your subscription system is now properly configured! Here's how to test the upgrade flow manually to ensure everything works end-to-end.

## ✅ System Status

All automated tests passed:
- ✅ Edge functions deployed and responding
- ✅ Database connection working
- ✅ Environment variables configured
- ✅ Price IDs properly set
- ⚠️ Webhook secret needs to be configured (see below)

## 🔧 Final Setup Step

### Configure Stripe Webhook Secret

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Find your webhook endpoint (should be: `https://rebeznxivaxgserswhbn.supabase.co/functions/v1/stripe-webhook`)
3. Copy the webhook signing secret (starts with `whsec_`)
4. Update your `.env` file:
   ```
   STRIPE_WEBHOOK_SECRET="whsec_your_actual_secret_here"
   ```
5. Redeploy the webhook function:
   ```bash
   supabase functions deploy stripe-webhook
   ```

## 🧪 Manual Testing Steps

### Test 1: Pro Plan Upgrade

1. **Open your app**: Navigate to `http://localhost:5173` (or your deployed URL)
2. **Sign up/Login**: Create a test account or log in
3. **Go to subscription page**: Navigate to `/subscription`
4. **Click "Upgrade to Pro"**: This should open Stripe checkout
5. **Use test card**: `4242 4242 4242 4242`, any future date, any CVC
6. **Complete payment**: You should be redirected to success page
7. **Check your plan**: 
   - Go to `/profile` or `/subscription/manage`
   - Your plan should show as "Pro"
   - UserHeader should show "Pro" badge

### Test 2: Premium Plan Upgrade

1. **From Pro plan**: If you're on Pro, click "Upgrade to Premium"
2. **Or from Free**: Click "Upgrade to Premium" directly
3. **Complete Stripe checkout**: Same test card process
4. **Verify upgrade**: Plan should show as "Premium"

### Test 3: Plan Downgrade

1. **Go to manage subscription**: `/subscription/manage`
2. **Click "Change Plan"**: Should show downgrade options
3. **Select Free plan**: This should downgrade you
4. **Verify downgrade**: Plan should show as "Free"

## 🔍 Verification Points

After each test, check these:

### In the App
- [ ] UserHeader shows correct plan badge
- [ ] Subscription page shows "Current Plan" for active plan
- [ ] Profile page displays correct subscription status
- [ ] Features are enabled/disabled based on plan

### In Supabase Dashboard
1. **Database**: Check `users` table
   - `plan` field should match your selection
   - `subscription_status` should be "active"
   - `stripe_customer_id` and `stripe_subscription_id` should be populated

2. **Function Logs**: Check webhook function logs
   - Should see successful webhook events
   - No error messages about missing user_id or plan updates

### In Stripe Dashboard
1. **Customers**: Should see your test customer
2. **Subscriptions**: Should see active subscription
3. **Webhooks**: Should see successful webhook deliveries

## 🐛 Troubleshooting

### Issue: Plan doesn't update after payment
**Solution**: 
1. Check webhook logs in Supabase Dashboard
2. Verify webhook secret is configured
3. Check that webhook endpoint is reachable

### Issue: "Current Plan" not showing correctly
**Solution**:
1. Check browser console for errors
2. Verify user is authenticated
3. Check database for user record

### Issue: Stripe checkout fails
**Solution**:
1. Check browser console for errors
2. Verify Stripe publishable key is correct
3. Check edge function logs

### Issue: Double headers still showing
**Solution**:
1. Hard refresh the page (Cmd/Ctrl + Shift + R)
2. Clear browser cache
3. Check that both pages use `showHeader={false}`

## 📊 Database Queries for Verification

You can run these in Supabase SQL Editor to check data:

```sql
-- Check user plan status
SELECT user_id, email, plan, subscription_status, 
       stripe_customer_id, stripe_subscription_id,
       created_at, updated_at
FROM users 
WHERE email = 'your-test-email@example.com';

-- Check subscription records
SELECT user_id, status, current_period_end,
       stripe_subscription_id, stripe_customer_id,
       created_at, updated_at
FROM subscriptions 
WHERE user_id = 'your-user-id';

-- Check user metadata
SELECT user_id, subscription, created_at, updated_at
FROM users_metadata 
WHERE user_id = 'your-user-id';
```

## 🎯 Success Criteria

Your subscription system is working correctly if:

- ✅ Users can upgrade from Free → Pro → Premium
- ✅ Users can downgrade from Premium → Pro → Free  
- ✅ Plan changes are reflected immediately in the UI
- ✅ Database records are updated correctly
- ✅ Stripe webhooks are processed successfully
- ✅ No double headers are showing
- ✅ All edge functions respond without errors

## 🚀 Production Deployment

When ready for production:

1. **Update environment variables** with production Stripe keys
2. **Configure production webhook** endpoint in Stripe
3. **Test with real payment methods** (small amounts)
4. **Set up monitoring** for webhook failures
5. **Configure email notifications** for subscription events

## 📞 Support

If you encounter any issues:
1. Check the automated test results: `npm run test:subscription`
2. Review the logs in Supabase Dashboard
3. Verify all environment variables are set correctly
4. Test with different browsers/devices

Your subscription system is now ready for testing! 🎉