# Quick Stripe Setup Checklist

## Current Status: ❌ Stripe Not Configured

The subscription page is working, but Stripe payment processing needs to be set up.

## Quick Setup Steps:

### 1. Create Stripe Account
- Go to [stripe.com](https://stripe.com) and create an account
- Get your test API keys from the Dashboard

### 2. Set Environment Variables in Supabase
Go to your Supabase Dashboard → Settings → Environment Variables and add:

```
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### 3. Deploy Edge Function
In your Supabase Dashboard → Edge Functions:
- Create a new function called `create-checkout-session`
- Copy the code from `supabase/functions/create-checkout-session/index.ts`
- Deploy the function

### 4. Create Stripe Products
In Stripe Dashboard → Products:
- Create "Pro Monthly" product at $9.99/month
- Create "Premium Monthly" product at $19.99/month
- Copy the Price IDs and update them in the subscription page

### 5. Update Price IDs
Replace the placeholder Price IDs in `src/pages/Subscription.tsx`:
```typescript
stripePriceId: 'price_your_actual_pro_price_id', // Replace this
stripePriceId: 'price_your_actual_premium_price_id', // Replace this
```

## Current Error:
The Edge Function `create-checkout-session` is returning a 500 error because:
1. The function doesn't exist in your Supabase project yet
2. Stripe environment variables are not set

## Next Steps:
1. Set up Stripe account and get API keys
2. Add environment variables to Supabase
3. Deploy the Edge Function
4. Test the subscription flow

Once these are set up, the subscription page will work perfectly!