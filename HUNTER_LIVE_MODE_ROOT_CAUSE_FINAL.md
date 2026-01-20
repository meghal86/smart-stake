# Hunter Live Mode Root Cause - FINAL DIAGNOSIS

## Problem Summary

When toggling demo mode OFF in Hunter, the UI shows `isDemo: false` and `isConnected: true`, but:
- ❌ No network calls are made to fetch live data
- ❌ The same dummy/demo data continues to display
- ❌ No API requests appear in Network tab

## Root Cause

**The `/api/hunter/opportunities` API endpoint does not exist.**

### What's Happening

1. **Demo Mode (Working):**
   - `useHunterFeed` hook checks `!props.isDemo` → `useRealAPI = true`
   - Calls `getFeedPage()` from `src/lib/feed/query.ts`
   - `getFeedPage()` returns mock data immediately without API call
   - ✅ Works because it's hardcoded

2. **Live Mode (Broken):**
   - `useHunterFeed` hook checks `!props.isDemo` → `useRealAPI = true`
   - Calls `getFeedPage()` from `src/lib/feed/query.ts`
   - `getFeedPage()` tries to query Supabase directly: `supabase.from('mv_opportunity_rank').select('*')`
   - ❌ **This materialized view doesn't exist in the database**
   - ❌ **No API route exists to handle this request properly**
   - Query fails silently or returns empty results
   - Falls back to showing cached/demo data

### Architecture Violation

Per the Hunter architecture rules (`.kiro/specs/hunter-screen-feed/design.md`):

> **CRITICAL RULE**: All business logic, calculations, and data transformations MUST live in Supabase Edge Functions. The UI is presentation-only.

The current implementation violates this by:
1. Having `getFeedPage()` in `src/lib/feed/query.ts` (client-side)
2. Querying Supabase directly from the browser
3. Not using the required API route → Edge Function architecture

### What Should Happen (Per Requirements)

**Requirement 1.7:**
> WHEN GET /api/hunter/opportunities is called THEN the response SHALL conform to: `{ "items": [OpportunityCard], "cursor": "string|null", "ts": "RFC3339 UTC" }`

**Task 12:**
> Create GET /api/hunter/opportunities endpoint
> - Set up Next.js 14 App Router API route
> - Implement query parameter validation with Zod
> - Add rate limiting check
> - Call getFeedPage() service
> - Status: NOT IMPLEMENTED

**Correct Architecture:**
```
UI (Hunter.tsx)
  ↓
useHunterFeed hook
  ↓
fetch('/api/hunter/opportunities')  ← API route (MISSING)
  ↓
Next.js API Route validates & proxies
  ↓
Supabase Edge Function (hunter-feed)  ← Business logic (MISSING)
  ↓
Database query with ranking
  ↓
Return ranked opportunities
```

**Current (Broken) Architecture:**
```
UI (Hunter.tsx)
  ↓
useHunterFeed hook
  ↓
getFeedPage() in src/lib/feed/query.ts  ← WRONG LAYER
  ↓
Direct Supabase query from browser  ← VIOLATES ARCHITECTURE
  ↓
Query fails (mv_opportunity_rank doesn't exist)
  ↓
Returns empty/cached data
```

## Evidence

### 1. Missing API Route
```bash
$ find . -path "*/api/hunter/opportunities*"
# No results
```

### 2. useHunterFeed Hook Calls getFeedPage Directly
**File:** `src/hooks/useHunterFeed.ts:280-320`
```typescript
queryFn: async ({ pageParam }) => {
  if (!useRealAPI) {
    // Demo mode - return mock data
    return { items: mockOpportunities, ... };
  }
  
  // Real API call with ranking from materialized view
  const result = await getFeedPage({  // ← Direct call, no API route
    ...queryParams,
    cursor: pageParam as string | undefined,
  });
  
  return { items: result.items, ... };
}
```

### 3. getFeedPage Queries Supabase Directly
**File:** `src/lib/feed/query.ts:109-200`
```typescript
export async function getFeedPage(params: FeedQueryParams): Promise<FeedPageResult> {
  // Build base query using materialized view for better performance
  let query = supabase
    .from('mv_opportunity_rank')  // ← This view doesn't exist
    .select('*', { count: 'exact' });
  
  // ... filtering logic ...
  
  const { data, error, count } = await query;  // ← Direct Supabase query from browser
  
  if (error) {
    console.error('Feed query error:', error);
    throw new Error(`Failed to fetch opportunities: ${error.message}`);
  }
  
  return { items, nextCursor, snapshotTs };
}
```

### 4. Database Missing Required Tables
The `mv_opportunity_rank` materialized view referenced in the code doesn't exist. Per Task 9a:
> Create mv_opportunity_rank materialized view
> Status: NOT IMPLEMENTED - No materialized view exists

## Solution

### Quick Fix (Temporary - Get Live Mode Working)

Create a minimal API route that returns live data from the existing `opportunities` table:

**File:** `src/app/api/hunter/opportunities/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Simple query without ranking (temporary)
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(12);
  
  if (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: error.message } },
      { status: 500 }
    );
  }
  
  return NextResponse.json({
    items: data || [],
    cursor: null,
    ts: new Date().toISOString()
  });
}
```

**Update useHunterFeed to call API route:**
```typescript
// src/hooks/useHunterFeed.ts
queryFn: async ({ pageParam }) => {
  if (!useRealAPI) {
    // Demo mode
    return { items: mockOpportunities, ... };
  }
  
  // Live mode - call API route
  const response = await fetch('/api/hunter/opportunities?' + new URLSearchParams({
    filter: props.filter,
    sort: props.sort || 'recommended',
    cursor: pageParam || '',
  }));
  
  if (!response.ok) {
    throw new Error('Failed to fetch opportunities');
  }
  
  const result = await response.json();
  return {
    items: result.items.map(transformToLegacyOpportunity),
    nextCursor: result.cursor,
    snapshotTs: Date.now() / 1000,
  };
}
```

### Proper Fix (Follow Architecture)

1. **Create Supabase Edge Function** (`supabase/functions/hunter-feed/index.ts`)
2. **Create Next.js API Route** that proxies to Edge Function
3. **Create materialized view** `mv_opportunity_rank` with ranking logic
4. **Update useHunterFeed** to call API route instead of direct Supabase query
5. **Remove `getFeedPage()` from client-side** code (move to Edge Function)

## Why Demo Mode Works

Demo mode works because it returns hardcoded mock data:

```typescript
const mockOpportunities: LegacyOpportunity[] = [
  { id: '1', type: 'Staking', title: 'Ethereum 2.0 Staking', ... },
  { id: '2', type: 'Airdrop', title: 'LayerZero Airdrop', ... },
  // ... 5 hardcoded opportunities
];

if (!useRealAPI) {
  return { items: mockOpportunities, ... };  // ← Instant return, no API call
}
```

## Why Live Mode Doesn't Work

Live mode tries to query a non-existent materialized view from the browser, which fails silently and returns no data.

## Next Steps

1. ✅ **Immediate:** Create minimal `/api/hunter/opportunities` route (Quick Fix above)
2. ⏳ **Short-term:** Verify `opportunities` table has data to display
3. ⏳ **Medium-term:** Implement proper Edge Function architecture (Tasks 9, 9a, 12)
4. ⏳ **Long-term:** Complete all missing Hunter features (ranking, eligibility, Guardian integration)

## Testing the Fix

After implementing the Quick Fix:

1. Open Hunter page
2. Toggle demo mode OFF
3. Check Network tab - should see `GET /api/hunter/opportunities`
4. Verify response contains live data from `opportunities` table
5. Verify opportunities display on screen (not mock data)

## Related Files

- `src/hooks/useHunterFeed.ts` - Hook that needs to call API route
- `src/lib/feed/query.ts` - Should be moved to Edge Function
- `src/pages/Hunter.tsx` - UI that displays opportunities
- `.kiro/specs/hunter-screen-feed/requirements.md` - Requirements (Req 1.7, Task 12)
- `.kiro/specs/hunter-screen-feed/design.md` - Architecture rules
- `HUNTER_LIVE_DATA_ARCHITECTURE_ANALYSIS.md` - Previous analysis

## Conclusion

**The Hunter live mode doesn't work because the required API infrastructure doesn't exist.** The code tries to query Supabase directly from the browser, which violates the architecture and fails because the required database views don't exist.

The Quick Fix above will get live mode working temporarily by creating a minimal API route. The Proper Fix requires implementing the full Edge Function architecture as specified in the requirements.
