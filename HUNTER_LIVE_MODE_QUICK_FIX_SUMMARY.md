# Hunter Live Mode - Quick Fix Summary

## ✅ Issue Identified

When you toggle demo mode OFF, the Hunter page still shows mock data because:

1. **Query Key Fixed** ✅ - The React Query `queryKey` now includes `isDemo` parameter
2. **Database Missing** ⚠️ - The `opportunities` table and `mv_opportunity_rank` view don't exist yet

---

## What Was Fixed

### Code Fix (Applied)
**File**: `src/hooks/useHunterFeed.ts`

Changed query key from:
```typescript
queryKey: hunterKeys.feed(activeWallet, activeNetwork)
```

To:
```typescript
queryKey: ['hunter', 'feed', activeWallet, activeNetwork, props.isDemo] as const
```

This ensures React Query refetches data when you toggle demo mode.

---

## Why You Still See Mock Data

The `getFeedPage` function tries to query this Supabase table:
```typescript
supabase.from('mv_opportunity_rank').select('*')
```

**But this table doesn't exist in your database yet!**

When the query fails (silently), it falls back to showing mock data.

---

## Quick Test

### Step 1: Hard Refresh
```bash
Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Step 2: Toggle Demo Mode OFF

### Step 3: Open Browser Console

You should now see:
```
🎯 Hunter Feed Mode: {isDemo: false, useRealAPI: true, ...}
🔴 LIVE MODE ACTIVE - Will fetch from API
🌐 Live Mode: Fetching from API
```

### Step 4: Check Network Tab

Look for Supabase API calls. You'll likely see:
- ❌ Error: "relation 'mv_opportunity_rank' does not exist"
- OR no calls at all (error caught silently)

---

## Solutions

### Option 1: Create Database Schema (Recommended)

You need to create:
1. `opportunities` table
2. `mv_opportunity_rank` materialized view  
3. Sample opportunity data

**This requires a database migration file** (not created yet).

### Option 2: Use Mock Data API Endpoint (Quick Workaround)

Create a simple API endpoint that returns mock data:

**File**: `src/app/api/hunter/opportunities/route.ts`
```typescript
import { NextResponse } from 'next/server';

const mockOpportunities = [
  {
    id: '1',
    slug: 'eth-staking',
    title: 'Ethereum 2.0 Staking',
    description: 'Stake ETH and earn rewards',
    protocol: { name: 'Lido', logo: '' },
    type: 'staking',
    chains: ['ethereum'],
    reward: { min: 0, max: 4.2, currency: 'PERCENT', confidence: 'confirmed' },
    apr: 4.2,
    trust: { score: 90, level: 'green', last_scanned_ts: new Date().toISOString(), issues: [] },
    urgency: 'low',
    difficulty: 'easy',
    featured: false,
    sponsored: false,
    time_left_sec: null,
    external_url: 'https://lido.fi',
    badges: [],
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    expires_at: null,
  },
  // Add more opportunities...
];

export async function GET() {
  return NextResponse.json({
    items: mockOpportunities,
    nextCursor: null,
    snapshotTs: Date.now() / 1000,
  });
}
```

Then modify `getFeedPage` to call this endpoint instead of Supabase.

### Option 3: Keep Using Demo Mode (Temporary)

Until the database is set up, just keep demo mode ON. The mock data works perfectly for UI development and testing.

---

## Recommended Next Steps

1. **Hard refresh browser** to load the query key fix
2. **Toggle demo mode** and check console logs
3. **Verify the error** in Network tab (should see Supabase error)
4. **Decide on solution**:
   - Create database schema (best for production)
   - Create mock API endpoint (quick workaround)
   - Keep using demo mode (temporary)

---

## Current Status

✅ **Code Fixed**: Query key now includes `isDemo`  
⚠️ **Database Missing**: `mv_opportunity_rank` table doesn't exist  
🎯 **Next**: Choose solution option above

---

**See `HUNTER_LIVE_MODE_NOT_WORKING_FIX.md` for detailed technical information.**

**Last Updated**: 2026-01-20
