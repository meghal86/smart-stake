# Whale Tracker Deployment Guide

## 🚀 Complete Setup and Deployment Instructions

### Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Supabase CLI**
4. **Git**
5. **Stripe Account**
6. **Vercel Account** (for deployment)

### 1. Environment Setup

#### Install Dependencies
```bash
npm install
```

#### Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Supabase Setup

#### Initialize Supabase Project
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Start local development
supabase start
```

#### Deploy Edge Functions
```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy create-checkout-session
supabase functions deploy verify-session
supabase functions deploy stripe-webhook
```

#### Set Environment Variables in Supabase
```bash
# Set Stripe keys
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Set other required secrets
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Database Setup

#### Run Migrations
```bash
# Reset and apply all migrations
supabase db reset

# Or apply specific migrations
supabase migration up
```

#### Generate Types
```bash
npm run supabase:gen-types
```

### 4. Stripe Configuration

#### Create Products in Stripe Dashboard

1. **Premium Monthly**
   - Name: "Premium Monthly"
   - Price: $9.99 USD
   - Billing: Recurring monthly
   - Copy Price ID: `price_xxxxx`

2. **Premium Annual**
   - Name: "Premium Annual"
   - Price: $99.99 USD
   - Billing: Recurring yearly
   - Copy Price ID: `price_xxxxx`

#### Update Price IDs in Code
```typescript
// In src/pages/Subscription.tsx
const pricingPlans: PricingPlan[] = [
  // ...
  {
    id: 'premium-monthly',
    stripePriceId: 'price_your_monthly_price_id', // Update this
  },
  {
    id: 'premium-yearly',
    stripePriceId: 'price_your_yearly_price_id', // Update this
  },
];
```

#### Configure Webhooks
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret

### 5. OAuth Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. Add to Supabase Auth settings

#### Apple OAuth
1. Go to [Apple Developer](https://developer.apple.com/)
2. Create Sign in with Apple service
3. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. Add to Supabase Auth settings

### 6. Frontend Deployment

#### Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# VITE_SUPABASE_URL
# VITE_SUPABASE_PUBLISHABLE_KEY
# VITE_STRIPE_PUBLISHABLE_KEY
```

#### Alternative: Netlify
```bash
# Build the project
npm run build

# Deploy to Netlify (drag & drop dist folder)
# Or use Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### 7. Testing

#### Run Unit Tests
```bash
npm test
```

#### Run Coverage Report
```bash
npm run test:coverage
```

#### Test Edge Functions Locally
```bash
# Start Supabase locally
supabase start

# Test create-checkout-session
curl -X POST 'http://localhost:54321/functions/v1/create-checkout-session' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{"priceId": "price_test_123"}'
```

### 8. Production Checklist

#### Security
- [ ] All environment variables set correctly
- [ ] Stripe webhook endpoints configured
- [ ] OAuth redirect URIs updated for production
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] API rate limiting configured

#### Performance
- [ ] Database indexes created for frequently queried columns
- [ ] CDN configured for static assets
- [ ] Image optimization enabled
- [ ] Caching strategies implemented

#### Monitoring
- [ ] Error tracking set up (Sentry)
- [ ] Analytics configured
- [ ] Uptime monitoring enabled
- [ ] Performance monitoring active

#### Testing
- [ ] All unit tests passing
- [ ] Integration tests completed
- [ ] End-to-end tests successful
- [ ] Payment flow tested with test cards
- [ ] OAuth flows tested

### 9. Environment Variables Reference

#### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key
```

#### Supabase Secrets
```env
STRIPE_SECRET_KEY=sk_live_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 10. Monitoring and Maintenance

#### Health Checks
```bash
# Check Edge Functions
curl https://your-project.supabase.co/functions/v1/health

# Check database connection
supabase db ping
```

#### Log Monitoring
```bash
# View Edge Function logs
supabase functions logs create-checkout-session

# View database logs
supabase logs db
```

#### Performance Monitoring
- Monitor Stripe webhook delivery success rates
- Track API response times
- Monitor database query performance
- Track user conversion rates

### 11. Troubleshooting

#### Common Issues

**Stripe Webhook Failures**
- Verify webhook signing secret
- Check endpoint URL is correct
- Ensure HTTPS is used in production

**OAuth Login Issues**
- Verify redirect URIs match exactly
- Check OAuth credentials are correct
- Ensure proper scopes are requested

**Database Connection Issues**
- Verify connection string
- Check RLS policies
- Ensure proper permissions

**Edge Function Errors**
- Check function logs
- Verify environment variables
- Test locally first

### 12. Scaling Considerations

#### Database Optimization
- Add indexes for frequently queried columns
- Implement connection pooling
- Consider read replicas for heavy read workloads

#### API Optimization
- Implement caching strategies
- Add rate limiting
- Use CDN for static assets

#### Monitoring and Alerts
- Set up alerts for high error rates
- Monitor payment success rates
- Track user engagement metrics

### 13. Backup and Recovery

#### Database Backups
```bash
# Create backup
supabase db dump > backup.sql

# Restore from backup
supabase db reset
psql -h localhost -p 54322 -U postgres -d postgres < backup.sql
```

#### Code Backups
- Ensure code is in version control
- Tag releases for easy rollback
- Maintain staging environment

This deployment guide provides a comprehensive setup process for the Whale Tracker application with proper security, monitoring, and scaling considerations.