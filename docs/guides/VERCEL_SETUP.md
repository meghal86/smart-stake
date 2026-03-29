# Vercel Production Setup Guide

## Step 1: Connect Repository
1. Go to https://vercel.com → New Project
2. Import from GitHub — select your smart-stake repo
3. Framework: Vite (auto-detected)
4. Root directory: ./ (leave default)

## Step 2: Environment Variables
Go to Project Settings → Environment Variables and add ALL of these:

### Required (App won't work without these)
| Variable | Where to find it | Example |
|----------|-----------------|---------|
| VITE_SUPABASE_URL | Supabase → Project Settings → API | https://xxx.supabase.co |
| VITE_SUPABASE_ANON_KEY | Supabase → Project Settings → API | eyJ... |
| SUPABASE_SERVICE_ROLE_KEY | Supabase → Project Settings → API | eyJ... (secret!) |
| VITE_SUPABASE_PROJECT_REF | Supabase → Project Settings → General | abcdefghijklm |
| VITE_ADMIN_EMAILS | Your email address(es) | you@email.com |
| STRIPE_SECRET_KEY | Stripe → Developers → API Keys (Live mode) | sk_live_... |
| STRIPE_WEBHOOK_SECRET | Stripe → Developers → Webhooks → signing secret | whsec_... |
| CRON_SECRET | Generate: openssl rand -base64 32 | random string |

### Recommended
| Variable | Purpose | Where to get |
|----------|---------|-------------|
| VITE_SENTRY_DSN | Error monitoring | sentry.io → Project → Settings → DSN |
| VITE_ALCHEMY_API_KEY | Blockchain RPC | dashboard.alchemy.com |
| NEXT_PUBLIC_POSTHOG_KEY | Analytics | app.posthog.com → Project Settings |
| WHALE_ALERT_API_KEY | Whale data | whale-alert.io/account |

### Important: Set environment to "Production" only for sensitive keys
- SUPABASE_SERVICE_ROLE_KEY → Production only
- STRIPE_SECRET_KEY → Production only (use sk_test_ for Preview)
- STRIPE_WEBHOOK_SECRET → Production only

## Step 3: Post-Deploy Verification
After first deploy, check these URLs:
- https://[your-domain]/ → Landing page loads
- https://[your-domain]/signup → Signup form renders
- https://[your-domain]/legal/privacy → Privacy policy loads
- https://[your-domain]/admin/bi → Redirects to /login (not accessible)
- https://[your-domain]/debug → Returns 404 (not accessible in prod)

## Step 4: Register Stripe Webhook
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: https://[your-domain]/api/stripe/webhook
3. Events to listen for:
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
4. Copy the signing secret → add as STRIPE_WEBHOOK_SECRET in Vercel

## Step 5: Update Supabase Auth URLs
1. Supabase → Authentication → URL Configuration
2. Site URL: https://[your-domain]
3. Redirect URLs: Add https://[your-domain]/**
4. This is required for OAuth (Google login) and magic links to work

## Troubleshooting
- **White screen after deploy**: Check Vercel build logs for missing env vars
- **Auth not working**: Verify Supabase Site URL matches your domain exactly
- **Stripe webhooks failing**: Check webhook secret matches, verify endpoint URL
- **Admin routes accessible**: Verify VITE_ADMIN_EMAILS is set correctly
