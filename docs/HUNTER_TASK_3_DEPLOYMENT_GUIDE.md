# Hunter Task 3 Deployment Guide

## Overview

This guide walks you through deploying the Hunter Yield/Staking Module (Task 3) to Vercel with cron jobs enabled.

## Pre-Deployment Checklist

### ✅ Files Already Committed

All Task 3 files are already in your repository:

- ✅ `src/lib/hunter/sync/defillama.ts` - DeFiLlama sync service
- ✅ `src/app/api/sync/yield/route.ts` - Yield sync API endpoint
- ✅ `supabase/migrations/20260128000000_hunter_yield_columns.sql` - Database schema
- ✅ `src/__tests__/properties/hunter-defillama-sync.property.test.ts` - Property tests
- ✅ `src/__tests__/properties/hunter-sync-authorization.property.test.ts` - Auth tests
- ✅ `src/__tests__/integration/hunter-yield-sync.integration.test.ts` - Integration tests
- ✅ `vercel.json` - Cron job configuration

### ✅ Environment Variables Ready

Your `.env` file has all required variables:

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Sync Jobs Security
CRON_SECRET=your-random-secret-min-32-chars

# Yield Data (DeFiLlama - FREE, no key needed)
DEFILLAMA_API_URL=https://yields.llama.fi

# Optional: Wallet Signals (Alchemy - FREE tier)
ALCHEMY_TRANSFERS_API_KEY=your_alchemy_key
ALCHEMY_ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_key
ALCHEMY_BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_key
ALCHEMY_ARB_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your_key
```

## Step-by-Step Deployment

### Step 1: Verify Your Code is Ready

```bash
# Check git status (should be clean)
git status

# Verify all files are committed
git log --oneline -5
```

**Expected:** "nothing to commit, working tree clean"

### Step 2: Run Local Tests (Optional but Recommended)

Before deploying, verify everything works locally:

```bash
# Run property tests
npm test -- src/__tests__/properties/hunter-defillama-sync.property.test.ts --run
npm test -- src/__tests__/properties/hunter-sync-authorization.property.test.ts --run

# Run integration tests
npm test -- src/__tests__/integration/hunter-yield-sync.integration.test.ts --run

# Start dev server and test endpoint
npm run dev

# In another terminal, test the sync endpoint
CRON_SECRET=$(grep CRON_SECRET .env | cut -d '=' -f2)
curl -X POST http://localhost:3000/api/sync/yield \
  -H "x-cron-secret: $CRON_SECRET" \
  | jq '.'
```

**Expected:** All tests pass, endpoint returns `{ count: N, source: "defillama", ... }`

### Step 3: Push to GitHub

Your code is already committed, so just push:

```bash
# Push to main branch
git push origin main
```

**What happens:**
- GitHub receives your code
- Vercel detects the push (if connected)
- Vercel automatically starts deployment
- Cron jobs are registered from `vercel.json`

### Step 4: Connect Vercel to GitHub (If Not Already Connected)

If this is your first deployment:

1. **Go to Vercel Dashboard:**
   - Visit https://vercel.com/dashboard
   - Click "Add New..." → "Project"

2. **Import Git Repository:**
   - Select "Import Git Repository"
   - Choose your GitHub account
   - Select your repository (e.g., `smart-stake`)
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add all variables from your `.env` file (see Step 5 below)
   - Apply to: Production, Preview, Development

5. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete (~2-5 minutes)

### Step 5: Add Environment Variables in Vercel

**CRITICAL:** Cron jobs need these environment variables to work.

1. **Go to Project Settings:**
   - Navigate to your project in Vercel dashboard
   - Click "Settings" in the top navigation
   - Click "Environment Variables" in the sidebar

2. **Add Required Variables:**

   Copy these from your `.env` file:

   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   CRON_SECRET
   DEFILLAMA_API_URL
   ```

   **Optional (for Wallet Signals):**
   ```
   ALCHEMY_TRANSFERS_API_KEY
   ALCHEMY_ETH_RPC_URL
   ALCHEMY_BASE_RPC_URL
   ALCHEMY_ARB_RPC_URL
   ```

3. **For Each Variable:**
   - Click "Add New"
   - Enter **Name** (e.g., `CRON_SECRET`)
   - Enter **Value** (copy from your `.env` file)
   - Select **Environments:** Production, Preview, Development
   - Click "Save"

4. **Verify All Variables Added:**
   - You should see 5-9 environment variables listed
   - Each should show "Production, Preview, Development"

### Step 6: Verify Cron Jobs Are Registered

After deployment completes:

1. **Go to Project Settings:**
   - Click "Settings" → "Cron Jobs"

2. **Verify 5 Cron Jobs:**
   ```
   ✅ /api/sync/yield        - Every 2 hours (0 */2 * * *)
   ✅ /api/sync/airdrops     - Every hour (0 * * * *)
   ✅ /api/sync/quests       - Every hour (0 * * * *)
   ✅ /api/sync/points       - Daily at midnight (0 0 * * *)
   ✅ /api/sync/rwa          - Daily at midnight (0 0 * * *)
   ```

3. **Check Status:**
   - Each should show "Active" status
   - You'll see "Next Run" timestamp

**If cron jobs don't appear:**
- Verify `vercel.json` is in your repository root
- Check deployment logs for errors
- Redeploy: `vercel --prod` (using Vercel CLI)

### Step 7: Test Cron Jobs Manually

Don't wait for the scheduled run - test immediately:

#### Method 1: Via Vercel Dashboard

1. Go to "Settings" → "Cron Jobs"
2. Click the "..." menu next to `/api/sync/yield`
3. Click "Trigger Now"
4. Go to "Deployments" → Latest deployment → "Functions"
5. Find `api/sync/yield` and check logs

**Expected:** Status 200, logs show "Synced N opportunities"

#### Method 2: Via API Call

```bash
# Get your deployed URL
VERCEL_URL="https://your-project.vercel.app"

# Get your CRON_SECRET
CRON_SECRET=$(grep CRON_SECRET .env | cut -d '=' -f2)

# Test yield sync endpoint
curl -X POST "$VERCEL_URL/api/sync/yield" \
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

#### Method 3: Via Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login
vercel login

# Trigger cron job
vercel cron trigger /api/sync/yield
```

### Step 8: Verify Database Updates

After triggering the sync job, check if data was synced:

```bash
# Connect to Supabase database
psql $DATABASE_URL -c "
SELECT 
  source, 
  COUNT(*) as count,
  MAX(last_synced_at) as last_sync,
  MAX(created_at) as newest_opportunity
FROM opportunities 
WHERE source = 'defillama'
GROUP BY source;
"
```

**Expected Output:**
```
  source   | count | last_sync               | newest_opportunity
-----------+-------+-------------------------+-------------------------
 defillama |   150 | 2026-01-28 15:00:00+00 | 2026-01-28 15:00:00+00
```

**If no data:**
- Check function logs in Vercel dashboard
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Test endpoint locally first

### Step 9: Monitor Cron Job Execution

#### View Logs in Vercel Dashboard

1. **Go to Deployments:**
   - Click "Deployments" in top navigation
   - Click on the latest deployment

2. **View Function Logs:**
   - Click "Functions" tab
   - Find `api/sync/yield`
   - Click to view logs

3. **Check for:**
   - ✅ Status 200 (success)
   - ✅ "Synced N opportunities" message
   - ✅ Execution duration < 10s (Hobby plan limit)
   - ❌ Error messages or stack traces

#### Set Up Monitoring Alerts

1. **Go to Settings → Monitoring:**
   - Enable "Function Errors" alerts
   - Enable "Function Duration" alerts
   - Set threshold: Alert if duration > 10s

2. **Configure Notifications:**
   - Add email or Slack webhook
   - Choose alert frequency: Immediate

### Step 10: Verify Automatic Execution

Wait for the next scheduled run (2 hours for yield sync):

1. **Check Cron Jobs Dashboard:**
   - Go to "Settings" → "Cron Jobs"
   - Look at "Last Run" timestamp
   - Verify it updates after scheduled time

2. **Check Database:**
   - Query `opportunities` table
   - Verify `last_synced_at` updates every 2 hours

3. **Check Function Logs:**
   - Go to "Deployments" → Latest → "Functions"
   - Verify logs show automatic executions

## Troubleshooting

### Issue 1: Deployment Fails

**Symptoms:** Build fails, deployment shows error

**Solutions:**
```bash
# Check build locally
npm run build

# Fix any TypeScript errors
npm run type-check

# Fix any linting errors
npm run lint

# Commit fixes and push
git add .
git commit -m "fix: resolve build errors"
git push origin main
```

### Issue 2: Cron Jobs Not Showing

**Symptoms:** "Settings → Cron Jobs" is empty

**Solutions:**
1. Verify `vercel.json` is in repository root
2. Check `vercel.json` syntax is valid JSON
3. Redeploy using Vercel CLI:
   ```bash
   vercel --prod
   ```

### Issue 3: Cron Job Returns 401 Unauthorized

**Symptoms:** Manual trigger returns `{ error: { code: "UNAUTHORIZED" } }`

**Solutions:**
1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Ensure it matches your local `.env` value
3. Redeploy after adding environment variable

### Issue 4: Cron Job Returns 500 Error

**Symptoms:** Function logs show errors

**Solutions:**
1. Check function logs for specific error message
2. Test endpoint locally:
   ```bash
   npm run dev
   curl -X POST http://localhost:3000/api/sync/yield \
     -H "x-cron-secret: $CRON_SECRET"
   ```
3. Common issues:
   - Missing `SUPABASE_SERVICE_ROLE_KEY`
   - Invalid Supabase URL
   - DeFiLlama API timeout (increase timeout in code)

### Issue 5: Database Not Updating

**Symptoms:** Cron job succeeds but no data in database

**Solutions:**
1. Verify Supabase credentials:
   ```bash
   # Test connection
   psql $DATABASE_URL -c "SELECT 1;"
   ```
2. Check RLS policies allow service role:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM pg_policies WHERE tablename = 'opportunities';
   ```
3. Verify migration was applied:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'opportunities' 
     AND column_name IN ('apy', 'tvl_usd', 'source', 'source_ref');
   ```

### Issue 6: Timeout Errors

**Symptoms:** Function times out after 10 seconds

**Solutions:**
1. **Optimize sync logic:**
   - Reduce number of pools fetched
   - Implement pagination
   - Batch database operations

2. **Upgrade Vercel plan:**
   - Hobby: 10s timeout
   - Pro: 60s timeout

3. **Split into multiple jobs:**
   - Create separate endpoints for different chains
   - Schedule them at different times

## Post-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel deployment successful
- [ ] All environment variables added
- [ ] 5 cron jobs visible in dashboard
- [ ] Manual trigger test passed
- [ ] Database shows synced data
- [ ] Monitoring alerts configured
- [ ] Automatic execution verified (wait 2 hours)

## Next Steps

### 1. Monitor First 24 Hours

- Check logs every 2 hours
- Verify data is syncing correctly
- Watch for errors or timeouts

### 2. Optimize Performance

- Review execution duration
- Optimize slow queries
- Implement caching if needed

### 3. Set Up Alerts

- Configure Slack/email notifications
- Set up error tracking (Sentry)
- Monitor API usage (DeFiLlama, Alchemy)

### 4. Continue with Task 4

Once Task 3 is deployed and working:
- Move to Task 4: Airdrops Module
- Follow same deployment process
- Add new cron jobs as needed

## Summary

**Your deployment workflow:**

1. ✅ Code already committed
2. 🚀 Push to GitHub: `git push origin main`
3. ⚙️ Add environment variables in Vercel dashboard
4. ✅ Verify cron jobs registered
5. 🧪 Test manually via dashboard or API
6. 📊 Check database for synced data
7. 🔔 Set up monitoring alerts
8. ⏰ Wait for automatic execution

**Time estimate:** 15-20 minutes (excluding wait time)

**Cost:** $0/month (Vercel Hobby + Supabase Free + DeFiLlama Free)

Your Hunter Yield/Staking Module will now automatically sync opportunities every 2 hours! 🎉
