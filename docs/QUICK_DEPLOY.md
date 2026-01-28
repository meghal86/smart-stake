# Quick Deploy Commands

## TL;DR - Deploy Hunter Task 3 Now

```bash
# 1. Verify everything is committed
git status

# 2. Push to GitHub (triggers Vercel deployment)
git push origin main

# 3. Add environment variables in Vercel dashboard
# Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
# Add: CRON_SECRET, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 4. Test the deployed endpoint
VERCEL_URL="https://your-project.vercel.app"
CRON_SECRET=$(grep CRON_SECRET .env | cut -d '=' -f2)

curl -X POST "$VERCEL_URL/api/sync/yield" \
  -H "x-cron-secret: $CRON_SECRET" \
  | jq '.'

# 5. Verify cron jobs in Vercel dashboard
# Go to: Settings → Cron Jobs
# You should see 5 active cron jobs
```

## Environment Variables to Add in Vercel

Copy these from your `.env` file:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CRON_SECRET=your-random-secret-min-32-chars
DEFILLAMA_API_URL=https://yields.llama.fi

# Optional (for Wallet Signals)
ALCHEMY_TRANSFERS_API_KEY=your_alchemy_key
ALCHEMY_ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_key
ALCHEMY_BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_key
ALCHEMY_ARB_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your_key
```

## Verify Deployment

```bash
# Check database for synced data
psql $DATABASE_URL -c "
SELECT source, COUNT(*) as count, MAX(last_synced_at) as last_sync
FROM opportunities 
WHERE source = 'defillama'
GROUP BY source;
"
```

**Expected:** 100-200 opportunities synced

## Troubleshooting

### Deployment fails?
```bash
npm run build  # Test build locally
npm run type-check  # Check TypeScript errors
```

### Cron jobs not showing?
- Verify `vercel.json` exists in repo root
- Redeploy: `vercel --prod`

### 401 Unauthorized?
- Add `CRON_SECRET` to Vercel environment variables
- Ensure it matches your local `.env` value

### Database not updating?
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check function logs in Vercel dashboard

## Full Documentation

- **Deployment Guide:** `docs/HUNTER_TASK_3_DEPLOYMENT_GUIDE.md`
- **Vercel Cron Setup:** `docs/VERCEL_CRON_SETUP_GUIDE.md`
- **Manual Validation:** `.kiro/specs/hunter-demand-side/TASK_3_MANUAL_VALIDATION_GUIDE.md`
