# 🔑 Guardian API Keys Setup

## Current Issue: 500 Internal Server Error

The Guardian Edge Function is deployed but missing required API keys:
- ✅ Upstash Redis (configured)
- ❌ Alchemy API Key (missing)
- ❌ Etherscan API Key (missing)

## Quick Solution: Deploy All Secrets

### Step 1: Get Your API Keys

#### Alchemy (Required for blockchain data)
1. Go to [alchemy.com](https://www.alchemy.com/)
2. Sign up / Sign in
3. Create a new app (select "Ethereum Mainnet")
4. Copy the API Key

#### Etherscan (Required for contract verification)
1. Go to [etherscan.io/apis](https://etherscan.io/apis)
2. Sign up / Sign in
3. Create a free API key (under "My API Keys")
4. Copy the API Key

### Step 2: Deploy All Secrets to Supabase

```bash
# Deploy all secrets at once
supabase secrets set \
  UPSTASH_REDIS_REST_URL="https://prepared-shark-8055.upstash.io" \
  UPSTASH_REDIS_REST_TOKEN="AR93AAImcDJlYzRmNTI1MDczNTQ0MDc3ODk4MDg5Mzc2ZmU4ZGMzZnAyODA1NQ" \
  ALCHEMY_API_KEY="your_alchemy_key_here" \
  ETHERSCAN_API_KEY="your_etherscan_key_here"
```

### Step 3: Verify Secrets

```bash
# Check that secrets are set
supabase secrets list
```

You should see:
```
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN  
ALCHEMY_API_KEY
ETHERSCAN_API_KEY
SUPABASE_URL (auto-configured)
SUPABASE_SERVICE_ROLE_KEY (auto-configured)
```

### Step 4: Test Guardian

```bash
# Restart your dev server
npm run dev

# Navigate to:
http://localhost:8080/guardian
```

## Alternative: Deploy Edge Functions with Secrets

If you haven't deployed the Edge Functions yet:

```bash
# Make sure you're logged in
supabase login

# Deploy guardian functions
supabase functions deploy guardian-scan-v2
supabase functions deploy guardian-revoke-v2
supabase functions deploy guardian-healthz
```

## Troubleshooting

### Check Edge Function Logs

To see the actual error:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/rebeznxivaxgserswhbn)
2. Click **Edge Functions** in the sidebar
3. Click **guardian-scan-v2**
4. Click **Logs** tab
5. Look for the most recent error

Common errors:
- `"ALCHEMY_API_KEY not configured"` → Set ALCHEMY_API_KEY secret
- `"Invalid API key"` → Check that your Alchemy/Etherscan keys are correct
- `"Rate limit exceeded"` → Upgrade your Alchemy/Etherscan plan or wait

### Verify Secrets Are Set

```bash
# List all secrets
supabase secrets list

# If a secret is missing, set it:
supabase secrets set ALCHEMY_API_KEY="your_key_here"
```

### Re-deploy After Setting Secrets

Secrets are only loaded when Edge Functions are deployed:

```bash
# Re-deploy to pick up new secrets
supabase functions deploy guardian-scan-v2
```

## What Each API Key Does

### Alchemy API Key
- **Purpose**: Fetches wallet approvals, transactions, and blockchain data
- **Usage**: ~10 requests per wallet scan
- **Free Tier**: 300M compute units/month (sufficient for development)
- **Docs**: https://docs.alchemy.com/

### Etherscan API Key
- **Purpose**: Checks contract verification, labels, and reputation
- **Usage**: ~3 requests per wallet scan
- **Free Tier**: 5 requests/second (sufficient for development)
- **Docs**: https://docs.etherscan.io/

### Upstash Redis
- **Purpose**: Rate limiting and idempotency
- **Usage**: ~20 requests per wallet scan
- **Free Tier**: 10,000 requests/day (sufficient for development)
- **Docs**: https://docs.upstash.com/redis

## Production Checklist

Before going to production:
- [ ] Get production API keys (not free-tier)
- [ ] Set up monitoring/alerts for API rate limits
- [ ] Configure proper rate limiting (adjust in `_lib/rate-limit.ts`)
- [ ] Set up Sentry for error tracking
- [ ] Test with high-volume wallets (100+ approvals)
- [ ] Load test (500 req/min)

## Cost Estimates

### Development (1000 scans/day)
- Alchemy: FREE (within free tier)
- Etherscan: FREE (within free tier)
- Upstash: FREE (within free tier)
- **Total: $0/month**

### Production (50,000 scans/day)
- Alchemy: ~$49/month (Growth plan)
- Etherscan: FREE (within free tier)
- Upstash: ~$10/month (Pay As You Go)
- **Total: ~$59/month**

## Next Steps

1. **Get API keys** (5 minutes)
2. **Deploy secrets** (1 minute)
3. **Test Guardian** (30 seconds)
4. **Ship it!** 🚀

---

**Questions?** Check the Edge Function logs in Supabase Dashboard or the docs above.

