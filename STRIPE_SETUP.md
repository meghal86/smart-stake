# Stripe Integration Setup Guide

This guide will help you set up Stripe payments for your whale tracking app with Apple and Google authentication.

## Prerequisites

1. **Stripe Account**: Create a Stripe account at [stripe.com](https://stripe.com)
2. **Supabase Project**: Ensure your Supabase project is set up with the required tables
3. **Environment Variables**: Set up the required environment variables

## Environment Variables

Add these to your `.env` file:

```env
# Stripe Keys
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase (if not already set)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Stripe Dashboard Setup

### 1. Create Products and Prices

In your Stripe Dashboard:

1. Go to **Products** → **Add Product**
2. Create these products:

**Premium Monthly:**
- Name: "Premium Monthly"
- Price: $9.99 USD
- Billing: Recurring monthly
- Copy the Price ID (starts with `price_`) and update `stripePriceId` in `src/pages/Subscription.tsx`

**Premium Annual:**
- Name: "Premium Annual" 
- Price: $99.99 USD
- Billing: Recurring yearly
- Copy the Price ID and update `stripePriceId` in `src/pages/Subscription.tsx`

### 2. Configure Webhooks

1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://yourdomain.com/api/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret and add it to your environment variables

## Supabase Authentication Setup

### 1. Enable OAuth Providers

In your Supabase Dashboard:

1. Go to **Authentication** → **Providers**
2. Enable **Google**:
   - Get credentials from [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   
3. Enable **Apple**:
   - Get credentials from [Apple Developer](https://developer.apple.com/)
   - Create a Sign in with Apple service
   - Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`

### 2. Configure Redirect URLs

Add these URLs to your Supabase Auth settings:
- `http://localhost:3000` (for development)
- `https://yourdomain.com` (for production)

## Database Schema

Ensure these tables exist in your Supabase database:

```sql
-- Users table (should already exist)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  plan TEXT DEFAULT 'free',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  product_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE,
  rc_entitlement TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
```

## Deployment

### Option 1: Vercel Functions

1. Deploy your app to Vercel
2. The API routes in `/api` will automatically become serverless functions
3. Set environment variables in Vercel dashboard

### Option 2: Netlify Functions

1. Move API files to `/netlify/functions/`
2. Update import paths if needed
3. Deploy to Netlify and set environment variables

### Option 3: Custom Backend

Deploy the API endpoints to your preferred backend service (Express.js, FastAPI, etc.)

## Testing

### Test Mode

1. Use Stripe test keys during development
2. Use test card numbers from [Stripe Testing](https://stripe.com/docs/testing)
3. Test webhook events using Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```

### Production

1. Switch to live Stripe keys
2. Update webhook endpoint to production URL
3. Test the complete flow with real payment methods

## Security Considerations

1. **Never expose secret keys** in client-side code
2. **Validate webhook signatures** to ensure requests come from Stripe
3. **Use HTTPS** in production
4. **Implement rate limiting** on API endpoints
5. **Sanitize user inputs** before database operations

## Troubleshooting

### Common Issues

1. **Webhook signature verification fails**:
   - Ensure webhook secret is correct
   - Check that raw request body is used for verification

2. **OAuth redirect issues**:
   - Verify redirect URLs in provider settings
   - Check Supabase Auth configuration

3. **Subscription not updating**:
   - Check webhook events are being received
   - Verify database permissions and RLS policies

4. **Payment fails**:
   - Check Stripe logs in dashboard
   - Verify price IDs are correct
   - Ensure customer email is valid

### Support

- Stripe Documentation: [stripe.com/docs](https://stripe.com/docs)
- Supabase Documentation: [supabase.com/docs](https://supabase.com/docs)
- For app-specific issues, check the console logs and network requests

## Next Steps

1. Set up the environment variables
2. Configure Stripe products and webhooks
3. Enable OAuth providers in Supabase
4. Deploy API endpoints
5. Test the complete payment flow
6. Go live with production keys

Remember to test thoroughly in development before switching to live mode!