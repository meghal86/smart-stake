# Hunter Live Mode Not Working - Fix

## Issue
When toggling demo mode OFF (live mode), the Hunter page still shows mock/dummy data instead of making API calls and fetching real opportunities.

**Symptoms**:
- Console shows `isDemo: false` and `isConnected: true`
- Console shows `🔴 LIVE MODE ACTIVE - Will fetch from API`
- BUT no network calls are made
- Still seeing mock data (e.g., "Unknown • Multi-chain", "0 TBD APY")

---

## Root Causes

### 1. Query Key Missing `isDemo` Parameter ✅ FIXED
The React Query `queryKey` didn't include `isDemo`, so when you toggled the switch, React Query didn't know it needed to refetch data.

**Before**:
```typescript
queryKey: hunterKeys.feed(activeWallet, activeNetwork)
// Result: ['hunter', 'feed', '0x123...', 'eip155:1']
```

**After**:
```typescript
queryKey: ['hunter', 'feed', activeWallet, activeNetwork, props.isDemo] as const
// Result: ['hunter', 'feed', '0x123...', 'eip155:1', false]
```

Now when `isDemo` changes, React Query will refetch the data.

### 2. Missing Database Table/View ⚠️ NEEDS VERIFICATION
The `getFeedPage` function queries `mv_opportunity_rank` materialized view in Supabase. This view might not exist or might be empty.

---

## Fixes Applied

### Fix 1: Updated Query Key
**File**: `src/hooks/useHunterFeed.ts`

```typescript
// OLD
queryKey: hunterKeys.feed(activeWallet, activeNetwork),

// NEW
queryKey: ['hunter', 'feed', activeWallet, activeNetwork, props.isDemo] as const,
```

### Fix 2: Enhanced Debug Logging
Added clearer console logs to show mode changes:

```typescript
if (props.isDemo) {
  console.log('🎭 DEMO MODE ACTIVE - Using mock data');
} else {
  console.log('🔴 LIVE MODE ACTIVE - Will fetch from API');
}
```

---

## Verification Steps

### Step 1: Hard Refresh Browser
```bash
# Clear React Query cache and Vite cache
Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Step 2: Check Console Output

**When Demo Mode is ON**:
```
🎯 Hunter Feed Mode: {isDemo: true, useRealAPI: false, ...}
🎭 DEMO MODE ACTIVE - Using mock data
📦 Demo Mode: Returning mock data (5 opportunities)
```

**When Demo Mode is OFF (Live Mode)**:
```
🎯 Hunter Feed Mode: {isDemo: false, useRealAPI: true, ...}
🔴 LIVE MODE ACTIVE - Will fetch from API
🌐 Live Mode: Fetching from API {endpoint: '/api/hunter/opportunities', ...}
```

### Step 3: Check Network Tab
When live mode is active, you should see:
- Supabase API calls to `mv_opportunity_rank` table
- OR error messages if the table doesn't exist

---

## Database Setup (If Needed)

If you see errors about `mv_opportunity_rank` not existing, you need to create the database schema.

### Check if Table Exists
```sql
-- Run in Supabase SQL Editor
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'mv_opportunity_rank'
);
```

### Create Hunter Schema (If Missing)
Look for migration files in `supabase/migrations/` that create:
- `opportunities` table
- `mv_opportunity_rank` materialized view
- Sample data

If these don't exist, you'll need to:
1. Create the opportunities table
2. Create the materialized view
3. Insert sample data

---

## Testing Checklist

### Demo Mode Testing
- [ ] Toggle demo mode ON
- [ ] Console shows "🎭 DEMO MODE ACTIVE"
- [ ] See 5 mock opportunities
- [ ] No network calls in Network tab
- [ ] Opportunities show: Ethereum Staking, LayerZero Airdrop, etc.

### Live Mode Testing
- [ ] Connect wallet
- [ ] Toggle demo mode OFF
- [ ] Console shows "🔴 LIVE MODE ACTIVE"
- [ ] Console shows "🌐 Live Mode: Fetching from API"
- [ ] See network calls in Network tab (Supabase API)
- [ ] Opportunities update with real data
- [ ] OR see error message if database not set up

### Mode Switching Testing
- [ ] Toggle demo mode ON → OFF → ON → OFF
- [ ] Each toggle triggers new data fetch
- [ ] Console logs show mode changes
- [ ] No stale data displayed
- [ ] Smooth transitions

---

## Expected Console Output

### Complete Flow (Demo → Live)

**Initial Load (Demo Mode)**:
```
🎯 Hunter Feed Mode: {isDemo: true, useRealAPI: false, activeWallet: null, ...}
🎭 DEMO MODE ACTIVE - Using mock data
📦 Demo Mode: Returning mock data (5 opportunities)
```

**After Connecting Wallet**:
```
🎯 Hunter Feed Mode: {isDemo: true, useRealAPI: false, activeWallet: '0x353...', ...}
🎭 DEMO MODE ACTIVE - Using mock data
📦 Demo Mode: Returning mock data (5 opportunities)
```

**After Toggling Demo Mode OFF**:
```
🎯 Hunter Feed Mode: {isDemo: false, useRealAPI: true, activeWallet: '0x353...', ...}
🔴 LIVE MODE ACTIVE - Will fetch from API
🌐 Live Mode: Fetching from API {
  endpoint: '/api/hunter/opportunities',
  params: {
    types: undefined,
    sort: 'recommended',
    trustMin: 80,
    showRisky: false,
    limit: 12,
    walletAddress: '0x353...',
    cursor: undefined
  }
}
✅ API Response: {itemCount: 12, hasMore: true, timestamp: '2026-01-20T...'}
```

---

## Troubleshooting

### Issue: Still Seeing Mock Data After Toggle

**Possible Causes**:
1. Browser cache not cleared → Hard refresh (Ctrl+Shift+R)
2. React Query cache not invalidated → Restart dev server
3. Database table doesn't exist → Check database setup

**Debug Steps**:
```javascript
// Open browser console and run:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Issue: Error "relation 'mv_opportunity_rank' does not exist"

**Solution**: Database schema not set up. You need to:
1. Run Supabase migrations
2. Create opportunities table
3. Create materialized view
4. Insert sample data

**Quick Fix** (temporary):
Modify `getFeedPage` to return mock data when table doesn't exist:
```typescript
const { data, error } = await query;

if (error && error.message.includes('does not exist')) {
  console.warn('Database table not found, returning mock data');
  return {
    items: mockOpportunities.map(transformMockToOpportunity),
    nextCursor: null,
    snapshotTs: Date.now() / 1000,
  };
}
```

### Issue: Network Calls Made But No Data Displayed

**Possible Causes**:
1. Empty database table
2. RLS policies blocking access
3. Data transformation error

**Debug Steps**:
```sql
-- Check if table has data
SELECT COUNT(*) FROM mv_opportunity_rank;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'mv_opportunity_rank';

-- Check if you can query directly
SELECT * FROM mv_opportunity_rank LIMIT 5;
```

---

## Next Steps

1. **Hard refresh browser** to clear all caches
2. **Toggle demo mode** and watch console logs
3. **Check Network tab** for Supabase API calls
4. **If errors**, check database setup
5. **Report results** with console logs and screenshots

---

## Files Modified

1. **src/hooks/useHunterFeed.ts**
   - Updated query key to include `isDemo`
   - Enhanced debug logging

---

## Summary

The main issue was that React Query's `queryKey` didn't include the `isDemo` parameter, so toggling the switch didn't trigger a refetch. This has been fixed.

**After hard refresh, you should see**:
- ✅ Console logs showing mode changes
- ✅ Network calls when live mode is active
- ✅ Real data displayed (or error if database not set up)

If you still see mock data after hard refresh, the database schema is likely missing and needs to be set up.

---

**Last Updated**: 2026-01-20  
**Status**: Query key fixed, awaiting database verification
