# Guardian Staleness Cron Job - Quick Setup Guide

## Overview

This guide will help you set up the Guardian staleness cron job in production.

## Prerequisites

- Vercel account with project deployed
- Access to Vercel environment variables
- Redis/Upstash configured (for queue)
- Supabase database with Guardian tables

## Setup Steps

### Step 1: Generate CRON_SECRET

```bash
# Generate a secure random secret
openssl rand -base64 32
```

Copy the output (e.g., `dGVzdC1zZWNyZXQtZm9yLWNyb24tam9iLWF1dGhlbnRpY2F0aW9u`)

### Step 2: Add Environment Variable to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Click **Add New**
5. Fill in:
   - **Name:** `CRON_SECRET`
   - **Value:** (paste the generated secret)
   - **Environments:** Select all (Production, Preview, Development)
6. Click **Save**

### Step 3: Verify vercel.json Configuration

The `vercel.json` file should already be configured:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-ranking",
      "schedule": "*/3 * * * *"
    },
    {
      "path": "/api/cron/guardian-rescan",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

If not, add the Guardian cron configuration.

### Step 4: Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "Add Guardian staleness cron job"

# Push to trigger deployment
git push
```

Vercel will automatically detect the cron configuration and set it up.

### Step 5: Verify Cron Job is Active

1. Go to Vercel Dashboard → Your Project
2. Navigate to **Settings** → **Cron Jobs**
3. You should see two cron jobs:
   - `refresh-ranking` (every 3 minutes)
   - `guardian-rescan` (every 30 minutes)
4. Both should show as "Active"

### Step 6: Test the Endpoint

```bash
# Replace with your actual values
VERCEL_URL="your-app.vercel.app"
CRON_SECRET="your-secret-here"

# Test the endpoint
curl -X GET "https://${VERCEL_URL}/api/cron/guardian-rescan" \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

Expected response:

```json
{
  "success": true,
  "stale_found": 0,
  "queued": 0,
  "queue_errors": 0,
  "category_flips": 0,
  "cache_purged": 0,
  "duration_ms": 123,
  "timestamp": "2025-01-06T12:00:00.000Z"
}
```

### Step 7: Monitor First Execution

1. Wait for the next scheduled execution (up to 30 minutes)
2. Go to Vercel Dashboard → Deployments
3. Click on your latest deployment
4. Go to **Functions** tab
5. Find `/api/cron/guardian-rescan`
6. Check the execution logs

Look for:
- ✅ `[Guardian Cron] Starting Guardian staleness check`
- ✅ `[Guardian Cron] Found X stale opportunities`
- ✅ `[Guardian Cron] Queued X/X opportunities for rescan`
- ✅ Success response with metrics

## Troubleshooting

### Cron job not appearing in Vercel

**Problem:** Cron job doesn't show up in Vercel dashboard

**Solution:**
1. Verify `vercel.json` is committed and pushed
2. Check the file is in the root directory
3. Redeploy the project
4. Wait a few minutes for Vercel to detect the configuration

### 401 Unauthorized errors

**Problem:** Endpoint returns 401 Unauthorized

**Solution:**
1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Check the secret matches in your test request
3. Ensure the environment variable is set for the correct environment (Production/Preview)
4. Redeploy after adding the environment variable

### No stale opportunities found

**Problem:** Cron job runs but finds 0 stale opportunities

**Solution:**
1. Check if there are opportunities in the database:
   ```sql
   SELECT COUNT(*) FROM opportunities WHERE status = 'published';
   ```
2. Check if there are Guardian scans:
   ```sql
   SELECT COUNT(*) FROM guardian_scans;
   ```
3. Check if scans are recent:
   ```sql
   SELECT 
     COUNT(*) as stale_count
   FROM opportunities o
   JOIN guardian_scans gs ON gs.opportunity_id = o.id
   WHERE o.status = 'published'
   AND gs.scanned_at < NOW() - INTERVAL '24 hours';
   ```

### Cron job timing out

**Problem:** Cron job execution times out

**Solution:**
1. Check the batch size (default: 100)
2. Reduce the limit in the code if needed
3. Check database performance
4. Verify Redis is accessible
5. Check Vercel function logs for specific errors

## Monitoring

### Check Execution History

1. Vercel Dashboard → Deployments
2. Click on a deployment
3. Go to **Functions** tab
4. Find `/api/cron/guardian-rescan`
5. View execution history and logs

### Check Queue Status

Query Redis to see queued rescans:

```typescript
import { cacheGet } from '@/lib/redis/cache';

// Check if an opportunity is queued
const queueData = await cacheGet(`guardian:rescan:queue:${opportunityId}`);
console.log(queueData);
```

### Check Guardian Scans

Query the database to see recent scans:

```sql
-- Check recent Guardian scans
SELECT 
  o.slug,
  o.trust_level,
  gs.level,
  gs.score,
  gs.scanned_at,
  EXTRACT(EPOCH FROM (NOW() - gs.scanned_at)) / 3600 AS hours_since_scan
FROM opportunities o
LEFT JOIN guardian_scans gs ON gs.opportunity_id = o.id
WHERE o.status = 'published'
ORDER BY gs.scanned_at DESC
LIMIT 20;
```

## Schedule Customization

To change the cron schedule, edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/guardian-rescan",
      "schedule": "*/15 * * * *"  // Every 15 minutes
    }
  ]
}
```

**Schedule Options:**
- `*/15 * * * *` - Every 15 minutes
- `*/30 * * * *` - Every 30 minutes (recommended)
- `0 * * * *` - Every hour
- `0 */2 * * *` - Every 2 hours

After changing, commit and push to redeploy.

## Cost Considerations

- **Vercel Cron Jobs:** Included in all plans
- **Function Invocations:** Each execution counts as one invocation
- **At 30-minute intervals:** ~48 invocations/day, ~1,440/month
- **Well within free tier limits**

## Security Best Practices

1. ✅ Keep `CRON_SECRET` secure and never commit to git
2. ✅ Rotate the secret periodically (every 90 days)
3. ✅ Use different secrets for different environments
4. ✅ Monitor execution logs for suspicious activity
5. ✅ Set up alerts for failed executions

## Next Steps

After setup is complete:

1. ✅ Monitor first few executions
2. ✅ Verify stale opportunities are being queued
3. ✅ Check Guardian scans are being updated
4. ✅ Set up alerting for failures (optional)
5. ✅ Review execution metrics weekly

## Support

For issues or questions:

1. Check the [README](src/app/api/cron/guardian-rescan/README.md)
2. Review [Task 28 Completion](.kiro/specs/hunter-screen-feed/TASK_28_COMPLETION.md)
3. Check [Guardian Audit](.kiro/specs/hunter-screen-feed/GUARDIAN_AUDIT.md)
4. Review Vercel function logs

## Summary

✅ Generate `CRON_SECRET`  
✅ Add to Vercel environment variables  
✅ Verify `vercel.json` configuration  
✅ Deploy to Vercel  
✅ Verify cron job is active  
✅ Test the endpoint  
✅ Monitor first execution  

The Guardian staleness cron job is now active and will automatically maintain the freshness of Guardian security scans every 30 minutes!

---

**Last Updated:** January 6, 2025  
**Status:** Production Ready
