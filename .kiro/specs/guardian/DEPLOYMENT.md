# Guardian Deployment Guide

## Complete Deployment Checklist

---

## Prerequisites

### 1. Environment Variables

Create `.env.local` with:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Upstash Redis (Rate Limiting & Caching)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Alchemy (Blockchain Data)
ALCHEMY_API_KEY=your-alchemy-key

# Etherscan (Reputation Data)
ETHERSCAN_API_KEY=your-etherscan-key

# WalletConnect (Wallet Connection)
VITE_WALLETCONNECT_PROJECT_ID=your-project-id

# Analytics (Optional)
VITE_POSTHOG_KEY=your-posthog-key
VITE_SENTRY_DSN=your-sentry-dsn
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Migration

Run the Guardian schema migration:

```bash
supabase db push
```

This creates:
- `guardian_scans` table
- `guardian_wallets` table
- Indexes for performance
- RLS policies for security

---

## Deployment Steps

### Step 1: Deploy Supabase Edge Functions

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy Edge Functions
supabase functions deploy guardian-scan-v2
supabase functions deploy guardian-revoke-v2
supabase functions deploy guardian-healthz
```

### Step 2: Set Supabase Secrets

```bash
# Option A: Automated script
./deploy-guardian-secrets.sh

# Option B: Manual
supabase secrets set \
  UPSTASH_REDIS_REST_URL="https://..." \
  UPSTASH_REDIS_REST_TOKEN="..." \
  ALCHEMY_API_KEY="..." \
  ETHERSCAN_API_KEY="..."
```

### Step 3: Build Frontend

```bash
npm run build
```

### Step 4: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Or use Vercel Dashboard:**
1. Connect GitHub repository
2. Set environment variables
3. Deploy

### Step 5: Verify Deployment

```bash
# Check Edge Functions
curl https://your-project.supabase.co/functions/v1/guardian-healthz

# Expected response:
# {"status":"healthy","services":{"alchemy":"up","etherscan":"up","upstash":"up"}}

# Test scan
curl -X POST https://your-project.supabase.co/functions/v1/guardian-scan-v2 \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"wallet_address":"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045","network":"ethereum"}'
```

---

## Post-Deployment Checklist

### Functionality Tests
- [ ] Wallet connection works
- [ ] Scan completes in <5 seconds
- [ ] Trust score displays correctly
- [ ] Risk cards show accurate data
- [ ] Revoke modal opens and estimates gas
- [ ] Multi-wallet management works
- [ ] Notifications appear
- [ ] Mobile navigation functions

### Performance Tests
- [ ] Lighthouse score >90
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] No layout shifts (CLS <0.1)

### Security Tests
- [ ] Rate limiting enforced
- [ ] RLS policies active
- [ ] No sensitive data in logs
- [ ] HTTPS enforced
- [ ] CORS configured correctly

### Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Screen reader announces content
- [ ] Color contrast passes WCAG AA
- [ ] Focus indicators visible
- [ ] ARIA labels present

---

## Monitoring Setup

### 1. Sentry Error Tracking

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

### 2. PostHog Analytics

```typescript
// src/lib/analytics/guardian.ts
import posthog from 'posthog-js';

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: 'https://app.posthog.com',
});
```

### 3. Uptime Monitoring

Set up monitoring for:
- `https://your-app.vercel.app/guardian`
- `https://your-project.supabase.co/functions/v1/guardian-healthz`

Recommended tools:
- UptimeRobot
- Pingdom
- Better Uptime

---

## Rollback Procedure

If issues arise:

### 1. Rollback Frontend
```bash
vercel rollback
```

### 2. Rollback Edge Functions
```bash
# Redeploy previous version
git checkout previous-commit
supabase functions deploy guardian-scan-v2
```

### 3. Rollback Database
```bash
# Restore from backup
supabase db dump > backup.sql
supabase db reset
psql -f backup.sql
```

---

## Scaling Considerations

### Database Optimization
- Add indexes for frequently queried columns
- Partition `guardian_scans` by month
- Archive old scans (>90 days)

### Caching Strategy
- Increase Redis cache TTL for stable data
- Implement CDN caching for static assets
- Use React Query cache aggressively

### Rate Limiting
- Adjust limits based on usage patterns
- Implement tiered limits (Free/Pro/Enterprise)
- Add burst allowance for legitimate spikes

---

## Troubleshooting

### Issue: Scans timing out

**Solution:**
- Check Alchemy API quota
- Verify Etherscan API key
- Increase Edge Function timeout

### Issue: Rate limit errors

**Solution:**
- Check Upstash Redis connection
- Verify rate limit configuration
- Increase limits if needed

### Issue: Incorrect trust scores

**Solution:**
- Review trust score calculation logic
- Check data source responses
- Verify confidence score calculation

---

## Support

For deployment issues:
- Check Edge Function logs: `supabase functions logs guardian-scan-v2`
- Review Sentry errors
- Check Vercel deployment logs
- Contact support with `x-request-id` from failed requests
