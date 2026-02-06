# Vercel Cron Jobs Fixed for Hobby Plan

## Problem
Vercel deployment was failing with error:
```
Error: Hobby accounts are limited to daily cron jobs. 
This cron expression (0 */2 * * *) would run more than once per day.
```

## Root Cause
Your `vercel.json` had cron jobs configured to run **multiple times per day**:
- `0 */2 * * *` - Every 2 hours (12 times/day) ❌
- `0 * * * *` - Every hour (24 times/day) ❌

Vercel Hobby plan only allows **one execution per day** for each cron job.

## Solution Applied

Changed all cron jobs to run **once daily** at different times:

```json
"crons": [
  {
    "path": "/api/sync/yield",
    "schedule": "0 0 * * *"    // Daily at midnight UTC
  },
  {
    "path": "/api/sync/airdrops",
    "schedule": "0 2 * * *"    // Daily at 2 AM UTC
  },
  {
    "path": "/api/sync/quests",
    "schedule": "0 4 * * *"    // Daily at 4 AM UTC
  },
  {
    "path": "/api/sync/points",
    "schedule": "0 6 * * *"    // Daily at 6 AM UTC
  },
  {
    "path": "/api/sync/rwa",
    "schedule": "0 8 * * *"    // Daily at 8 AM UTC
  }
]
```

## Changes Made

**Before:**
- Yield sync: Every 2 hours
- Airdrops sync: Every hour
- Quests sync: Every hour
- Points sync: Daily at midnight
- RWA sync: Daily at midnight

**After:**
- Yield sync: Daily at 00:00 UTC
- Airdrops sync: Daily at 02:00 UTC
- Quests sync: Daily at 04:00 UTC
- Points sync: Daily at 06:00 UTC
- RWA sync: Daily at 08:00 UTC

## Deployment Status

✅ **Committed**: `780515a - fix: change cron jobs to daily for Vercel Hobby plan`  
✅ **Pushed**: to `main` branch  
🔄 **Vercel**: Should auto-deploy within 1-2 minutes

## Verification

Check Vercel dashboard:
1. Go to Deployments tab
2. Look for new deployment with commit `780515a`
3. Build should succeed without cron errors
4. Deployment should complete successfully

## If You Need More Frequent Cron Jobs

### Option 1: Upgrade to Vercel Pro ($20/month)
- Unlimited cron job frequency
- Can run every minute if needed
- More build minutes and bandwidth

### Option 2: Use External Cron Service (Free)
Use a service like:
- **GitHub Actions** (free for public repos)
- **Render Cron Jobs** (free tier available)
- **Cron-job.org** (free)
- **EasyCron** (free tier)

These can call your API endpoints at any frequency.

### Option 3: Client-Side Polling (Not Recommended)
Have the frontend poll the sync endpoints periodically. Not ideal for background jobs.

## Cron Schedule Format

For reference:
```
* * * * *
│ │ │ │ │
│ │ │ │ └─ Day of week (0-7, 0 and 7 are Sunday)
│ │ │ └─── Month (1-12)
│ │ └───── Day of month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

Examples:
- `0 0 * * *` - Daily at midnight
- `0 */6 * * *` - Every 6 hours (requires Pro)
- `*/30 * * * *` - Every 30 minutes (requires Pro)
- `0 0 * * 0` - Weekly on Sunday at midnight

## Impact on Your App

With daily syncs:
- Data will be up to 24 hours old
- Users might see stale opportunities
- Consider adding a "Refresh" button for manual syncs
- Or implement client-side caching with shorter TTLs

## Next Steps

1. ✅ Wait for Vercel deployment to complete
2. ✅ Verify deployment succeeded
3. ✅ Check that cron jobs are scheduled in Vercel dashboard
4. Consider adding manual refresh functionality if daily syncs aren't frequent enough

## Manual Sync Alternative

You can still trigger syncs manually by calling the endpoints:
```bash
curl https://your-app.vercel.app/api/sync/yield
curl https://your-app.vercel.app/api/sync/airdrops
# etc.
```

Or add a "Sync Now" button in your admin panel.
