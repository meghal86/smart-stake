# Enhanced Stripe Integration Setup Guide

This comprehensive guide will help you set up Stripe integration for the Whale Tracker application with support for Credit Cards, Apple Pay, and Google Pay, plus complete subscription management.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Supabase project with Edge Functions enabled
3. Domain configured for your application

## Step 1: Stripe Dashboard Configuration

### 1.1 Create Products and Prices

1. Log into your Stripe Dashboard
2. Go to **Products** → **Add Product**
3. Create the following products:

**Premium Monthly:**
- Name: "Premium Monthly"
- Description: "Advanced whale tracking features"
- Price: $9.99 USD
- Billing: Monthly
- Copy the Price ID (starts with `price_`)

**Premium Annual:**
- Name: "Premium Annual" 
- Description: "Advanced whale tracking features - Annual billing"
- Price: $99.99 USD
- Billing: Yearly
- Copy the Price ID (starts with `price_`)

### 1.2 Configure Payment Methods

1. Go to **Settings** → **Payment methods**
2. Enable the following payment methods:
   - **Cards**: Visa, Mastercard, American Express, Discover
   - **Apple Pay**: For iOS Safari and macOS Safari users
   - **Google Pay**: For Chrome and Android users
3. Configure your business information for digital wallet payments

### 1.3 Payment Method Configuration

1. Go to **Settings** → **Payment method configurations**
2. Create a new configuration or edit the default
3. Enable:
   - Card payments
   - Apple Pay
   - Google Pay
4. Copy the Payment Method Configuration ID (starts with `pmc_`)

### 1.4 Set up Webhooks

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL to: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
5. Copy the webhook signing secret

## Step 2: Environment Variables

Add these environment variables to your Supabase project:

### In Supabase Dashboard → Settings → Edge Functions

```bash
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Your webhook signing secret
```

### In your local .env file

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key
```

## Step 3: Update Configuration IDs

Update the configuration in `supabase/functions/create-checkout-session/index.ts`:

```typescript
payment_method_configuration: 'pmc_YOUR_CONFIG_ID', // Replace with your actual PMC ID
```

Update the price IDs in `src/pages/Subscription.tsx`:

```typescript
const pricingPlans: PricingPlan[] = [
  // ... free plan
  {
    id: 'premium-monthly',
    name: 'Premium',
    price: 9.99,
    interval: 'month',
    // ... other properties
    stripePriceId: 'price_YOUR_MONTHLY_PRICE_ID', // Replace with your actual price ID
  },
  {
    id: 'premium-yearly',
    name: 'Premium Annual',
    price: 99.99,
    interval: 'year',
    // ... other properties
    stripePriceId: 'price_YOUR_YEARLY_PRICE_ID', // Replace with your actual price ID
  },
];
```

## Step 4: Deploy Edge Functions

Deploy the Stripe Edge Functions to Supabase:

```bash
# Deploy create-checkout-session function
supabase functions deploy create-checkout-session

# Deploy stripe-webhook function  
supabase functions deploy stripe-webhook

# Deploy manage-subscription function
supabase functions deploy manage-subscription
```

## Step 5: Database Setup

Ensure your database has the required tables and columns:

```sql
-- Add Stripe-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);
```

## Step 6: Apple Pay Configuration

### Domain Verification
1. In Stripe Dashboard → Settings → Payment methods → Apple Pay
2. Add your domain(s) (both www and non-www versions)
3. Download the domain verification file
4. Host it at `https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association`
5. Verify the domain in Stripe Dashboard

### Business Verification
1. Complete business verification in Stripe Dashboard
2. Provide required business documents
3. Wait for approval (usually 1-2 business days)

### Testing Apple Pay
- Use Safari on macOS or iOS
- Ensure you have a payment method set up in Wallet
- Test with Stripe test mode first

## Step 7: Google Pay Configuration

### Business Profile
1. Complete your business profile in Stripe Dashboard
2. Provide business information and verification documents
3. Enable Google Pay in payment methods settings

### Testing Google Pay
- Use Chrome browser (desktop or mobile)
- Ensure you're signed into Google account
- Have a payment method saved in Google Pay

## Step 8: Testing Payment Methods

### Test Cards
Use these test card numbers in Stripe test mode:

**Successful payments:**
- Visa: `4242424242424242`
- Visa (debit): `4000056655665556`
- Mastercard: `5555555555554444`
- American Express: `378282246310005`

**Declined payments:**
- Generic decline: `4000000000000002`
- Insufficient funds: `4000000000009995`
- Lost card: `4000000000009987`

### Apple Pay Testing
1. Use Safari on supported device
2. Ensure test mode is enabled
3. Use test cards configured in Wallet

### Google Pay Testing
1. Use Chrome browser
2. Sign in to Google account
3. Add test payment methods to Google Pay

## Step 9: Subscription Management Features

The implementation includes:

### For Users:
- **View subscription details** (plan, billing cycle, next payment)
- **Cancel subscription** (remains active until period end)
- **Reactivate subscription** (if canceled but still active)
- **Change payment methods** (via Stripe Customer Portal)
- **Download invoices** (PDF receipts)
- **View billing history**

### Available Routes:
- `/subscription` - View and purchase plans
- `/subscription/manage` - Manage existing subscription
- `/subscription/success` - Post-purchase confirmation

## Step 10: Production Deployment

### Switch to Live Mode
1. Get live API keys from Stripe Dashboard
2. Update environment variables with live keys
3. Update webhook endpoint to production URL
4. Complete business verification for live payments

### Domain Verification (Production)
1. Add production domains to Apple Pay settings
2. Upload domain verification files to production
3. Verify domains are accessible

## Security Best Practices

1. **API Keys**: Never expose secret keys in client-side code
2. **Webhooks**: Always verify webhook signatures
3. **HTTPS**: Use HTTPS for all endpoints
4. **Error Handling**: Implement proper error handling for failed payments
5. **Logging**: Log all transactions for audit purposes
6. **PCI Compliance**: Stripe handles PCI compliance for card data

## Troubleshooting

### Apple Pay Issues
- **Not showing**: Check domain verification and business verification status
- **Payment fails**: Verify test cards are set up correctly in Wallet
- **Domain errors**: Ensure verification file is accessible at correct path

### Google Pay Issues
- **Not appearing**: Complete business profile verification
- **Browser compatibility**: Test in Chrome or Edge browsers
- **Account issues**: Ensure Google account has payment methods

### General Issues
- **Webhook failures**: Check endpoint URL and signing secret
- **Subscription not updating**: Verify webhook events are being processed
- **Database errors**: Check user permissions and table structure

## Monitoring and Analytics

### Stripe Dashboard
- Monitor payment success rates
- Track subscription metrics
- View customer lifetime value
- Analyze payment method usage

### Application Metrics
- Track conversion rates from free to premium
- Monitor subscription churn
- Analyze payment method preferences
- Track failed payment recovery

## Support Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Apple Pay Developer**: https://developer.apple.com/apple-pay/
- **Google Pay Developer**: https://developers.google.com/pay

For technical support, check the Stripe Dashboard logs and Supabase Edge Function logs for detailed error information.