# 🔍 Subscription Debug Guide

## Issue: Upgraded to Premium but still showing Pro

Your subscription system is **technically working** - all functions are deployed and responding correctly. The issue is likely that **Stripe webhooks are not reaching your system** or **not being processed correctly**.

## 🎯 Step-by-Step Debugging

### 1. Check Stripe Webhook Configuration

**Go to Stripe Dashboard > Webhooks**

✅ **Verify your webhook URL is correct:**
```
https://rebeznxivaxgserswhbn.supabase.co/functions/v1/stripe-webhook
```

✅ **Check webhook events are enabled:**
- `customer.subscription.created`
- `customer.subscription.updated` 
- `customer.subscription.deleted`
- `invoice.payment_succeeded`

✅ **Verify webhook secret matches your .env:**
```
STRIPE_WEBHOOK_SECRET="whsec_LNR4H0efb2qJdMAXPa1rmpwRIrFkDico"
```

### 2. Check Recent Webhook Deliveries

In Stripe Dashboard > Webhooks > [Your Webhook] > Recent deliveries:

❌ **If NO recent deliveries:** Webhook URL is wrong or not configured
✅ **If deliveries exist but failed:** Check the error messages
✅ **If deliveries succeeded:** Check Supabase function logs

### 3. Check Supabase Function Logs

**Go to Supabase Dashboard > Functions > stripe-webhook > Logs**

Look for:
- Recent webhook events
- Error messages
- Database update attempts

### 4. Manual Database Check

**Go to Supabase Dashboard > Table Editor**

Check these tables:
- `users` - Look for your email, check `subscription_plan` column
- `subscriptions` - Look for your user_id, check `plan_type` and `status`
- `webhook_logs` - Check for recent webhook events

## 🚨 Most Likely Issues

### Issue 1: Webhook URL Not Set in Stripe
**Solution:** Add webhook URL in Stripe Dashboard

### Issue 2: Wrong Webhook Events
**Solution:** Enable subscription events in Stripe webhook config

### Issue 3: Webhook Secret Mismatch  
**Solution:** Copy exact webhook secret from Stripe to your .env

### Issue 4: Database Permissions
**Solution:** Check RLS policies allow webhook updates

## 🔧 Quick Fixes

### Fix 1: Redeploy Webhook Function
```bash
supabase functions deploy stripe-webhook
```

### Fix 2: Test Webhook Manually
In Stripe Dashboard > Webhooks > [Your Webhook] > Send test webhook

### Fix 3: Check Database Directly
```sql
-- Check your subscription status
SELECT u.email, u.subscription_plan, s.plan_type, s.status 
FROM users u 
LEFT JOIN subscriptions s ON u.id = s.user_id 
WHERE u.email = 'your-email@example.com';
```

## 🎯 Expected Webhook Flow

1. **User upgrades** → Stripe processes payment
2. **Stripe sends webhook** → `customer.subscription.updated` 
3. **Webhook function receives** → Verifies signature
4. **Database updates** → `users.subscription_plan` and `subscriptions` table
5. **UI refreshes** → Shows new plan

## 📊 Debugging Commands

Run these to check your system:

```bash
# Test basic connectivity
node scripts/debug-subscription.js

# Check function deployment
supabase functions list

# View function logs
supabase functions logs stripe-webhook
```

## 🆘 If Still Not Working

1. **Check Stripe webhook logs** for delivery failures
2. **Check Supabase function logs** for processing errors  
3. **Manually update database** as temporary fix:
   ```sql
   UPDATE users SET subscription_plan = 'premium' WHERE email = 'your-email@example.com';
   ```
4. **Contact support** with webhook delivery logs

## ✅ Success Indicators

- ✅ Stripe webhook shows successful deliveries
- ✅ Supabase function logs show webhook processing
- ✅ Database shows updated subscription plan
- ✅ UI displays correct plan immediately after upgrade

The most common issue is **webhook URL not configured in Stripe** - check this first!