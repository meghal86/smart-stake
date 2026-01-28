# Vercel Cron Jobs Setup Guide

## Overview

Vercel Cron Jobs allow you to schedule serverless functions to run at specific intervals. This guide covers setting up cron jobs for the Hunter Demand-Side sync endpoints.

## Prerequisites

- Vercel account with a deployed project
- Project connected to GitHub repository
- Environment variables configured in Vercel dashboard

## Step 1: Configure `vercel.json`

Your `vercel.json` file already includes the cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/sync/yield",
      "schedule": "0 */2 * * *"
    },
    {
      "path": "/api/sync/airdrops",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/sync/quests",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/sync/points",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/sync/rwa",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Cron Schedule Format

The schedule uses standard cron syntax: `minute hour day month dayOfWeek`

**Examples:**
- `0 */2 * * *` - Every 2 hours (at minute 0)
- `0 * * * *` - Every hour (at minute 0)
- `0 0 * * *` - Daily at midnight UTC
- `*/15 * * * *` - Every 15 minutes
- `0 9 * * 1` - Every Monday at 9:00 AM UTC

**Your Current Schedule:**
- **Yield sync**: Every 2 hours (keeps DeFiLlama data fresh)
- **Airdrops/Quests sync**: Every hour (frequent updates for time-sensitive opportunities)
- **Points/RWA sync**: Daily at midnight (less frequent updates needed)

## Step 2: Deploy to Vercel

### Option A: Deploy via Git Push (Recommended)

1. **Commit your changes:**
   ```bash
   git add vercel.json
   git commit -m "feat: add cron jobs for Hunter sync endpoints"
   git push origin main
   ```

2. **Vercel auto-deploys:**
   - Vercel detects the push and automatically deploys
   - Cron jobs are automatically registered during deployment

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

## Step 3: Configure Environment Variables in Vercel

Cron jobs need access to environment variables. Set these in the Vercel dashboard:

1. **Go to Vercel Dashboard:**
   - Navigate to https://vercel.com/dashboard
   - Select your project

2. **Go to Settings → Environment Variables:**
   - Click "Settings" in the top navigation
   - Click "Environment Variables" in the sidebar

3. **Add Required Variables:**

   **Phase 1 Required (for Yield sync):**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   CRON_SECRET=your-random-secret-min-32-chars
   DEFILLAMA_API_URL=https://yields.llama.fi
   ```

   **Optional (for Wallet Signals):**
   ```
   ALCHEMY_TRANSFERS_API_KEY=your_alchemy_key
   ALCHEMY_ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_key
   ALCHEMY_BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_key
   ALCHEMY_ARB_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your_key
   ```

4. **Apply to All Environments:**
   - Check "Production", "Preview", and "Development"
   - Click "Save"

## Step 4: Verify Cron Jobs in Vercel Dashboard

After deployment, verify cron jobs are registered:

1. **Go to Project Settings:**
   - Navigate to your project in Vercel dashboard
   - Click "Settings" → "Cron Jobs"

2. **You should see 5 cron jobs:**
   ```
   /api/sync/yield        - Every 2 hours
   /api/sync/airdrops     - Every hour
   /api/sync/quests       - Every hour
   /api/sync/points       - Daily at midnight
   /api/sync/rwa          - Daily at midnight
   ```

3. **Check Status:**
   - Each cron job should show "Active" status
   - You'll see "Next Run" timestamp

## Step 5: Test Cron Jobs Manually

You can trigger cron jobs manually to test them:

### Method 1: Via Vercel Dashboard

1. Go to "Settings" → "Cron Jobs"
2. Click the "..." menu next to a cron job
3. Click "Trigger Now"
4. Check the logs to verify execution

### Method 2: Via API Call (Local Testing)

```bash
# Get your CRON_SECRET from .env
CRON_SECRET=$(grep CRON_SECRET .env | cut -d '=' -f2)

# Test yield sync endpoint
curl -X POST https://your-project.vercel.app/api/sync/yield \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json" \
  | jq '.'
```

**Expected Response:**
```json
{
  "count": 150,
  "source": "defillama",
  "duration_ms": 2500,
  "ts": "2026-01-28T15:30:00.000Z"
}
```

### Method 3: Via Vercel CLI

```bash
# Trigger a specific cron job
vercel cron trigger /api/sync/yield
```

## Step 6: Monitor Cron Job Execution

### View Logs in Vercel Dashboard

1. **Go to Deployments:**
   - Click "Deployments" in top navigation
   - Click on the latest deployment

2. **View Function Logs:**
   - Click "Functions" tab
   - Find your cron job function (e.g., `api/sync/yield`)
   - Click to view logs

3. **Check for Errors:**
   - Look for 200 status codes (success)
   - Look for error messages or stack traces
   - Check execution duration

### Set Up Monitoring Alerts

1. **Go to Settings → Monitoring:**
   - Enable "Function Errors" alerts
   - Enable "Function Duration" alerts
   - Set threshold (e.g., alert if duration > 10s)

2. **Configure Notifications:**
   - Add email or Slack webhook
   - Choose alert frequency

## Step 7: Verify Database Updates

After cron jobs run, verify data is being synced:

```bash
# Connect to Supabase database
psql $DATABASE_URL -c "
SELECT 
  source, 
  COUNT(*) as count,
  MAX(last_synced_at) as last_sync
FROM opportunities 
WHERE source = 'defillama'
GROUP BY source;
"
```

**Expected Output:**
```
  source   | count | last_sync
-----------+-------+-------------------------
 defillama |   150 | 2026-01-28 15:00:00+00
```

## Troubleshooting

### Issue 1: Cron Jobs Not Showing in Dashboard

**Cause:** `vercel.json` not committed or deployment failed

**Solution:**
```bash
# Verify vercel.json is committed
git status

# If not committed:
git add vercel.json
git commit -m "feat: add cron jobs"
git push origin main

# Wait for deployment to complete
```

### Issue 2: Cron Job Returns 401 Unauthorized

**Cause:** `CRON_SECRET` not configured or incorrect

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify `CRON_SECRET` is set
3. Ensure it matches the value in your `.env` file
4. Redeploy if you just added it

### Issue 3: Cron Job Times Out

**Cause:** Function execution exceeds Vercel timeout (10s for Hobby, 60s for Pro)

**Solution:**
1. Optimize sync logic (reduce API calls, batch operations)
2. Implement pagination for large datasets
3. Upgrade to Vercel Pro for longer timeouts
4. Split into multiple smaller cron jobs

### Issue 4: Cron Job Returns 500 Error

**Cause:** Runtime error in sync function

**Solution:**
1. Check function logs in Vercel dashboard
2. Test endpoint locally:
   ```bash
   npm run dev
   curl -X POST http://localhost:3000/api/sync/yield \
     -H "x-cron-secret: $CRON_SECRET"
   ```
3. Fix errors and redeploy

### Issue 5: Database Not Updating

**Cause:** Supabase credentials incorrect or RLS policies blocking

**Solution:**
1. Verify Supabase environment variables
2. Test database connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```
3. Check RLS policies allow service role access
4. Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)

## Cron Job Limits

### Vercel Hobby Plan
- **Max executions:** 100 per day
- **Timeout:** 10 seconds
- **Concurrent executions:** 1

### Vercel Pro Plan
- **Max executions:** 1000 per day
- **Timeout:** 60 seconds
- **Concurrent executions:** 10

**Your Current Usage:**
- Yield: 12 executions/day (every 2 hours)
- Airdrops: 24 executions/day (every hour)
- Quests: 24 executions/day (every hour)
- Points: 1 execution/day (daily)
- RWA: 1 execution/day (daily)
- **Total:** 62 executions/day ✅ (within Hobby limit)

## Best Practices

### 1. Use CRON_SECRET for Security

Always validate the `x-cron-secret` header:

```typescript
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }
  // Continue with sync logic
}
```

### 2. Implement Idempotency

Ensure cron jobs can run multiple times without duplicating data:

```typescript
// Use UPSERT instead of INSERT
await supabase
  .from('opportunities')
  .upsert(opportunities, {
    onConflict: 'source,source_ref',
    ignoreDuplicates: false
  });
```

### 3. Add Logging

Log execution details for monitoring:

```typescript
console.log('[Sync] Starting yield sync...');
const startTime = Date.now();

// Sync logic here

const duration = Date.now() - startTime;
console.log(`[Sync] Completed in ${duration}ms, synced ${count} opportunities`);
```

### 4. Handle Errors Gracefully

Return partial results on errors:

```typescript
try {
  const result = await syncYieldOpportunities();
  return NextResponse.json(result);
} catch (error) {
  console.error('[Sync] Error:', error);
  return NextResponse.json(
    {
      count: 0,
      source: 'defillama',
      error: error.message,
      duration_ms: 0
    },
    { status: 500 }
  );
}
```

### 5. Set Reasonable Schedules

Don't over-sync:
- **High-frequency data** (prices, balances): Every 5-15 minutes
- **Medium-frequency data** (opportunities, airdrops): Every 1-2 hours
- **Low-frequency data** (protocols, RWA): Daily

## Next Steps

1. ✅ Verify `vercel.json` is committed
2. ✅ Deploy to Vercel (git push or vercel CLI)
3. ✅ Configure environment variables in Vercel dashboard
4. ✅ Verify cron jobs appear in Settings → Cron Jobs
5. ✅ Trigger a test run manually
6. ✅ Check logs for successful execution
7. ✅ Verify database updates
8. ✅ Set up monitoring alerts

## Additional Resources

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Cron Expression Generator](https://crontab.guru/)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## Summary

Your cron jobs are already configured in `vercel.json`. To activate them:

1. **Deploy to Vercel** (git push or vercel CLI)
2. **Add environment variables** in Vercel dashboard
3. **Verify in Settings → Cron Jobs**
4. **Test manually** to ensure they work
5. **Monitor logs** for errors

Your current setup will sync:
- Yield opportunities every 2 hours
- Airdrops/Quests every hour
- Points/RWA daily

This keeps your Hunter feed fresh without exceeding Vercel's free tier limits.
