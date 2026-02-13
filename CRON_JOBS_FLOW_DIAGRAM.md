# Cron Jobs Flow Diagram

## Current State (NOT WORKING) ❌

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL CRON SCHEDULER                     │
│                                                              │
│  Every day at 00:00 UTC:                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │ POST /api/sync/yield                                │    │
│  │ Headers: x-cron-secret: <vercel-internal-secret>   │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              YOUR API ENDPOINT (Vercel Function)             │
│                                                              │
│  /api/sync/yield/route.ts                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ const secret = req.headers.get('x-cron-secret');   │    │
│  │ const expected = process.env.CRON_SECRET;          │    │
│  │                                                     │    │
│  │ // ❌ expected = undefined (not set in Vercel!)    │    │
│  │                                                     │    │
│  │ if (secret !== expected) {                         │    │
│  │   return 401 Unauthorized ❌                        │    │
│  │ }                                                   │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    ❌ 401 UNAUTHORIZED
                    Cron job fails silently
                    No data synced
```

---

## After Fix (WORKING) ✅

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL CRON SCHEDULER                     │
│                                                              │
│  Every day at 00:00 UTC:                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │ POST /api/sync/yield                                │    │
│  │ Headers: x-cron-secret: <vercel-internal-secret>   │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              YOUR API ENDPOINT (Vercel Function)             │
│                                                              │
│  /api/sync/yield/route.ts                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ const secret = req.headers.get('x-cron-secret');   │    │
│  │ const expected = process.env.CRON_SECRET;          │    │
│  │                                                     │    │
│  │ // ✅ expected = "StV8oyC6wHd04QFSj7K33+fQPDt..." │    │
│  │                                                     │    │
│  │ if (secret !== expected) {                         │    │
│  │   return 401 Unauthorized                          │    │
│  │ }                                                   │    │
│  │                                                     │    │
│  │ // ✅ Secrets match! Continue...                   │    │
│  │ const result = await syncYieldOpportunities();     │    │
│  │ return 200 OK ✅                                    │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    SYNC FUNCTION                             │
│                                                              │
│  syncYieldOpportunities()                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 1. Fetch from DeFiLlama API                        │    │
│  │ 2. Transform data                                  │    │
│  │ 3. Upsert to Supabase                              │    │
│  │ 4. Return count                                    │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                         │
│                                                              │
│  opportunities table                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ✅ 150 new yield opportunities inserted            │    │
│  │ ✅ last_synced_at updated                          │    │
│  │ ✅ Users see fresh data                            │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Variables Flow

### Local Development (.env file)
```
┌──────────────────────┐
│   .env (local)       │
│                      │
│  CRON_SECRET=...     │ ──────► Works locally ✅
│                      │
└──────────────────────┘
```

### Production (Vercel)
```
BEFORE FIX:
┌──────────────────────────────────┐
│   Vercel Environment Variables   │
│                                  │
│  CRON_SECRET = ❌ NOT SET        │ ──────► Fails in production ❌
│                                  │
└──────────────────────────────────┘

AFTER FIX:
┌──────────────────────────────────┐
│   Vercel Environment Variables   │
│                                  │
│  CRON_SECRET = ✅ SET            │ ──────► Works in production ✅
│                                  │
└──────────────────────────────────┘
```

---

## Complete Cron Job Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                         STEP 1                               │
│                   Vercel Cron Scheduler                      │
│                                                              │
│  Triggers at scheduled time (e.g., 00:00 UTC daily)         │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                         STEP 2                               │
│                  HTTP POST Request                           │
│                                                              │
│  POST https://your-app.vercel.app/api/sync/yield            │
│  Headers:                                                    │
│    x-cron-secret: <internal-secret>                         │
│    Content-Type: application/json                           │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                         STEP 3                               │
│                  Authentication Check                        │
│                                                              │
│  if (req.headers.get('x-cron-secret') !== env.CRON_SECRET)  │
│    return 401 Unauthorized ❌                                │
│                                                              │
│  ✅ Authentication passed                                    │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                         STEP 4                               │
│                  Fetch External Data                         │
│                                                              │
│  const data = await fetch('https://yields.llama.fi/pools')  │
│  ✅ 150 yield opportunities fetched                          │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                         STEP 5                               │
│                  Transform Data                              │
│                                                              │
│  const opportunities = data.map(pool => ({                   │
│    source: 'defillama',                                     │
│    type: 'yield',                                           │
│    apy: pool.apy,                                           │
│    tvl: pool.tvlUsd,                                        │
│    ...                                                      │
│  }))                                                        │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                         STEP 6                               │
│                  Upsert to Database                          │
│                                                              │
│  await supabase                                             │
│    .from('opportunities')                                   │
│    .upsert(opportunities, {                                 │
│      onConflict: 'source,source_ref'                        │
│    })                                                       │
│                                                              │
│  ✅ 150 rows inserted/updated                                │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                         STEP 7                               │
│                  Return Success Response                     │
│                                                              │
│  return {                                                   │
│    count: 150,                                              │
│    source: 'defillama',                                     │
│    duration_ms: 2500,                                       │
│    ts: '2026-02-08T00:00:00.000Z'                           │
│  }                                                          │
│                                                              │
│  ✅ 200 OK                                                   │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                         STEP 8                               │
│                  Vercel Logs Success                         │
│                                                              │
│  Function: api/sync/yield                                   │
│  Status: 200 OK                                             │
│  Duration: 2.5s                                             │
│  Timestamp: 2026-02-08 00:00:02 UTC                         │
│                                                              │
│  ✅ Cron job completed successfully                          │
└─────────────────────────────────────────────────────────────┘
```

---

## All 5 Cron Jobs Timeline

```
UTC Time    Job                 Status
────────────────────────────────────────────────────────────
00:00       /api/sync/yield     ✅ Syncs DeFi yield opportunities
            │
            ├─ Fetches from DeFiLlama
            ├─ Upserts ~150 opportunities
            └─ Completes in ~2-3 seconds

02:00       /api/sync/airdrops  ✅ Syncs airdrop campaigns
            │
            ├─ Fetches from Galxe, DeFiLlama
            ├─ Upserts ~50 airdrops
            └─ Completes in ~3-4 seconds

04:00       /api/sync/quests    ✅ Syncs quest campaigns
            │
            ├─ Fetches from Galxe
            ├─ Upserts ~30 quests
            └─ Completes in ~2-3 seconds

06:00       /api/sync/points    ⚠️ Stub (returns 0 count)
            │
            └─ Awaiting Layer3/Galxe partnership

08:00       /api/sync/rwa       ⚠️ Stub (returns 0 count)
            │
            └─ Awaiting RWA.xyz partnership
```

---

## Security Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    WHY CRON_SECRET?                          │
│                                                              │
│  Without CRON_SECRET:                                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ❌ Anyone can call /api/sync/yield                  │    │
│  │ ❌ Malicious actors can trigger expensive syncs     │    │
│  │ ❌ DDoS attack vector                               │    │
│  │ ❌ API rate limits exhausted                        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  With CRON_SECRET:                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ✅ Only Vercel cron scheduler can call endpoints    │    │
│  │ ✅ Protected from unauthorized access               │    │
│  │ ✅ Rate limiting controlled                         │    │
│  │ ✅ Secure sync jobs                                 │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

**Problem:** `CRON_SECRET` environment variable is missing in Vercel production.

**Impact:** All cron jobs return 401 Unauthorized and fail silently.

**Solution:** Add `CRON_SECRET` to Vercel environment variables and redeploy.

**Result:** Cron jobs will run daily and sync Hunter opportunities automatically.

**See:** `CRON_FIX_QUICK_CHECKLIST.md` for step-by-step fix instructions.
