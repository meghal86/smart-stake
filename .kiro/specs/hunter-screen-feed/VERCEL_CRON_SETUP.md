# Vercel Cron Setup for Ranking View Refresh

## Overview

The ranking materialized view (`mv_opportunity_rank`) needs to be refreshed periodically to keep rankings up-to-date. On Vercel, this is done using Vercel Cron Jobs.

## Configuration

### 1. vercel.json (✅ Already Updated)

The `vercel.json` file has been updated with the cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-ranking",
      "schedule": "*/3 * * * *"
    }
  ]
}
```

This will call the endpoint every 3 minutes.

### 2. API Route (✅ Already Created)

The API route is already created at:
- `src/app/api/cron/refresh-ranking/route.ts`

This endpoint:
- Verifies the request is from Vercel Cron using `CRON_SECRET`
- Calls the `refresh_opportunity_rank_view()` database function
- Uses concurrent refresh (non-blocking)
- Returns success/error status

## Deployment Steps

### Step 1: Set Environment Variable in Vercel

Add the `CRON_SECRET` environment variable to your Vercel project:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `CRON_SECRET`
   - **Value**: Generate a random secret (e.g., use `openssl rand -base64 32`)
   - **Environments**: Production, Preview, Development

Example command to generate a secret:
```bash
openssl rand -base64 32
```

Or use any random string generator.

### Step 2: Deploy to Vercel

```bash
git add vercel.json
git commit -m "Add cron job for ranking view refresh"
git push
```

Vercel will automatically detect the cron configuration and set it up.

### Step 3: Verify Cron Job is Active

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Cron Jobs**
3. You should see: `refresh-ranking` running every 3 minutes

## Testing the Cron Endpoint

### Local Testing

```bash
# Set the CRON_SECRET in your .env file
echo "CRON_SECRET=your-secret-here" >> .env

# Test the endpoint locally
curl -X GET http://localhost:3000/api/cron/refresh-ranking \
  -H "Authorization: Bearer your-secret-here"
```

### Production Testing

```bash
# Test the production endpoint
curl -X GET https://your-app.vercel.app/api/cron/refresh-ranking \
  -H "Authorization: Bearer your-secret-here"
```

Expected response:
```json
{
  "success": true,
  "duration_ms": 1234,
  "timestamp": "2025-01-06T12:00:00.000Z"
}
```

## Monitoring

### Check Cron Execution Logs

1. Go to Vercel Dashboard → Your Project
2. Click on **Deployments**
3. Click on a deployment
4. Go to **Functions** tab
5. Find `/api/cron/refresh-ranking`
6. View execution logs

### Check Database Refresh Status

Run this query in your Supabase SQL Editor:

```sql
-- Check last refresh time
SELECT 
  schemaname,
  matviewname,
  last_refresh
FROM pg_matviews
WHERE matviewname = 'mv_opportunity_rank';
```

### Manual Refresh (if needed)

If the cron job fails or you need to refresh immediately:

```sql
SELECT refresh_opportunity_rank_view();
```

## Troubleshooting

### Cron job not running

1. **Check CRON_SECRET is set**: Verify in Vercel environment variables
2. **Check deployment**: Ensure `vercel.json` is committed and deployed
3. **Check logs**: Look for errors in Vercel function logs
4. **Verify endpoint**: Test the endpoint manually with curl

### Refresh taking too long

The concurrent refresh should complete in 5-15 seconds. If it's taking longer:

1. Check database performance
2. Verify indexes are created
3. Check for locks: `SELECT * FROM pg_locks WHERE relation = 'mv_opportunity_rank'::regclass;`

### Authorization errors

- Ensure `CRON_SECRET` matches in both Vercel environment variables and your requests
- The cron job automatically includes the authorization header

## Schedule Options

The current schedule is `*/3 * * * *` (every 3 minutes).

You can adjust this in `vercel.json`:

- Every 2 minutes: `*/2 * * * *`
- Every 5 minutes: `*/5 * * * *`
- Every 10 minutes: `*/10 * * * *`
- Every hour: `0 * * * *`

**Recommendation**: Keep it at 3-5 minutes for good balance between freshness and load.

## Cost Considerations

- Vercel Cron Jobs are included in all plans
- Each execution counts as a function invocation
- At 3-minute intervals: ~480 invocations/day, ~14,400/month
- This is well within Vercel's free tier limits

## Alternative: Manual Refresh

If you prefer not to use automatic refresh, you can:

1. Remove the cron configuration from `vercel.json`
2. Manually refresh when needed via SQL:
   ```sql
   SELECT refresh_opportunity_rank_view();
   ```
3. Or create an admin endpoint to trigger refresh on-demand

## Summary

✅ `vercel.json` updated with cron configuration  
✅ API route created at `/api/cron/refresh-ranking`  
⏳ **Next**: Set `CRON_SECRET` in Vercel environment variables  
⏳ **Next**: Deploy to Vercel  

Once deployed, the ranking view will automatically refresh every 3 minutes!
