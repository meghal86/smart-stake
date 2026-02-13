# Cron Jobs Fix - Quick Checklist

## Problem
❌ Cron jobs are not running because `CRON_SECRET` is missing in Vercel production environment.

## Quick Fix (5 minutes)

### 1. Add CRON_SECRET to Vercel
```
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click: Settings → Environment Variables
4. Click: "Add New"
5. Enter:
   - Key: CRON_SECRET
   - Value: StV8oyC6wHd04QFSj7K33+fQPDttlN1Aogl54Fnpeg4=
   - Check: ✅ Production ✅ Preview ✅ Development
6. Click: "Save"
```

### 2. Redeploy
```bash
git commit --allow-empty -m "chore: trigger redeploy for CRON_SECRET"
git push origin main
```

### 3. Verify (after 2-3 minutes)
```
1. Go to: Settings → Cron Jobs
2. Check: All 5 jobs show "Active" status
3. Check: "Next Run" times are displayed
```

### 4. Test Manually (optional)
```bash
curl -X POST "https://your-project.vercel.app/api/sync/yield" \
  -H "x-cron-secret: StV8oyC6wHd04QFSj7K33+fQPDttlN1Aogl54Fnpeg4="
```

Expected: `{"count": 150, "source": "defillama", ...}`

## Other Required Environment Variables

While you're in Vercel environment variables, also add:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://rebeznxivaxgserswhbn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYmV6bnhpdmF4Z3NlcnN3aGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDc0NDIsImV4cCI6MjA3MDk4MzQ0Mn0.u2t2SEmm3rTpseRRdgym3jnaOq7lRLHW531PxPmu6xo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYmV6bnhpdmF4Z3NlcnN3aGJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwNzQ0MiwiZXhwIjoyMDcwOTgzNDQyfQ.zVEUhynJtV2Or7nGLil9cmEBLJH1nnyX9dL9PES19Hk

# DeFiLlama (Required for yield sync)
DEFILLAMA_API_URL=https://yields.llama.fi

# Alchemy (Required for airdrops/quests)
ALCHEMY_TRANSFERS_API_KEY=vfd7KCFYm3oks_sGLmAss
ALCHEMY_ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/vfd7KCFYm3oks_sGLmAss
ALCHEMY_BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/vfd7KCFYm3oks_sGLmAss
ALCHEMY_ARB_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/vfd7KCFYm3oks_sGLmAss

# Optional (Phase 2/3)
ZEALY_API_KEY=32defcW_pEYyikMvP6SewsrwuHI
DEBANK_API_KEY=2a1721e00a45376564d9703b2849adb74ba960a4
```

## Current Cron Schedule

| Job | Runs At (UTC) | Purpose |
|-----|---------------|---------|
| `/api/sync/yield` | 00:00 daily | DeFi yield opportunities |
| `/api/sync/airdrops` | 02:00 daily | Airdrop campaigns |
| `/api/sync/quests` | 04:00 daily | Quest/campaign data |
| `/api/sync/points` | 06:00 daily | Loyalty programs (stub) |
| `/api/sync/rwa` | 08:00 daily | RWA vault data (stub) |

**Note:** Daily schedule due to Vercel Hobby plan limits. Upgrade to Pro for hourly syncs.

## Monitoring

After first cron run, check:
1. **Vercel Dashboard → Deployments → Functions**
2. Look for 200 status codes (success)
3. Check execution duration (should be < 10s)
4. Verify database has new data

## Need More Frequent Syncs?

**Option 1:** Upgrade to Vercel Pro ($20/month)
- Change schedules to hourly: `"0 * * * *"`

**Option 2:** Use GitHub Actions (free)
- See `CRON_JOBS_VALIDATION_REPORT.md` for setup

**Option 3:** Add manual refresh button in UI
- Let users trigger syncs on-demand

## Full Documentation

See `CRON_JOBS_VALIDATION_REPORT.md` for complete details.
