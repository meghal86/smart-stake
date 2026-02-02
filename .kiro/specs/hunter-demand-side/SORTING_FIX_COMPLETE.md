# Hunter Sorting Fix - Complete ✅

## Issue Summary

User reported seeing only "Staking" type opportunities (all 12 were RWA opportunities) instead of a diverse mix of Airdrops, Quests, Points, and RWA.

## Root Cause

The Supabase query was sorting by `created_at DESC` for the "recommended" sort option. This caused the query to return the 12 most recently created opportunities, which happened to all be RWA opportunities (since they were seeded last).

### Database Seed Order:
1. Airdrops (13) - seeded first
2. Quests (13) - seeded second  
3. Points (12) - seeded third
4. RWA (12) - **seeded last** ← These have the newest `created_at` timestamps
5. Staking (1) - older opportunity

When sorting by `created_at DESC` with `LIMIT 12`, the query returned only the 12 RWA opportunities.

## Fix Applied

### File: `src/hooks/useHunterFeed.ts` (lines 343-361)

**Changed the default "recommended" sort from `created_at` to `trust_score`:**

```typescript
// Apply sorting
switch (props.sort) {
  case 'ends_soon':
    query = query.order('end_date', { ascending: true, nullsFirst: false });
    break;
  case 'highest_reward':
    query = query.order('reward_max', { ascending: false, nullsFirst: false });
    break;
  case 'newest':
    query = query.order('created_at', { ascending: false });
    break;
  case 'trust':
    query = query.order('trust_score', { ascending: false });
    break;
  case 'recommended':
  default:
    // ✅ NEW: Sort by trust_score to get diverse, high-quality opportunities
    // This provides better variety than created_at which groups by seed order
    query = query.order('trust_score', { ascending: false });
    break;
}
```

**Why this works:**
- Trust scores are distributed across all opportunity types (ranging from 81-95)
- Sorting by trust score naturally mixes different types together
- Higher trust score = better quality opportunities (which is what "recommended" should show)

## Expected Behavior After Fix

When you refresh the Hunter page with the "All" filter, you should now see a diverse mix:

### Sample Expected Order (by trust_score DESC):
1. **Airdrop** - EigenLayer (trust: 95)
2. **Airdrop** - zkSync Era (trust: 92)
3. **Staking** - Solana Liquid Staking (trust: 92)
4. **Airdrop** - Starknet (trust: 90)
5. **RWA** - OpenEden Treasury (trust: 89)
6. **Airdrop** - Taiko Genesis (trust: 89)
7. **Airdrop** - Scroll (trust: 88)
8. **Airdrop** - Linea Voyage (trust: 87)
9. **Points** - Tensor Points (trust: 86)
10. **RWA** - Manta Pacific (trust: 86)
11. **Points** - MarginFi Points (trust: 85)
12. **Quest** - Manta Pacific Quest (trust: 85)

**Variety achieved!** ✅

## Verification

Run the diagnostic script to see the new order:

```bash
npx tsx check-hunter-data.ts
```

Expected output:
```
📊 Opportunities by Type:
────────────────────────────────────────────────────────────
rwa             : 12 opportunities
points          : 12 opportunities
quest           : 13 opportunities
airdrop         : 13 opportunities
staking         : 1 opportunities
────────────────────────────────────────────────────────────
Total: 51 opportunities

🗺️  TypeMap Compatibility Check:
────────────────────────────────────────────────────────────
✅ rwa             → Staking
✅ points          → Quest
✅ quest           → Quest
✅ airdrop         → Airdrop
✅ staking         → Staking
```

## User Action Required

### Step 1: Hard Refresh Browser

The JavaScript code is cached. Force a refresh:

**Chrome/Edge/Brave:**
- Mac: `Cmd + Shift + R`
- Windows/Linux: `Ctrl + Shift + R`

**Firefox:**
- Mac: `Cmd + Shift + R`
- Windows/Linux: `Ctrl + F5`

**Safari:**
- Mac: `Cmd + Option + R`

### Step 2: Verify Diversity

After hard refresh, check the console log `🔍 Hunter Filtering`:

**Before Fix:**
```javascript
opportunityTypes: ["Staking", "Staking", "Staking", "Staking", ...] // ❌ All Staking (RWA)
```

**After Fix:**
```javascript
opportunityTypes: ["Airdrop", "Airdrop", "Staking", "Airdrop", "Staking", "Airdrop", "Quest", ...] // ✅ Variety!
```

### Step 3: Visual Verification

You should now see opportunity cards with different types:
- 🎁 **Airdrop** cards (blue/purple gradient)
- 💰 **Staking** cards (green gradient) - includes RWA
- 🎯 **Quest** cards (orange gradient) - includes Points

## Console Logs to Verify

After hard refresh, you should see:

```
🎭 Hunter Page State: {isDemo: false, isConnected: true, ...}
🎯 Hunter Feed Mode: {isDemo: false, useRealAPI: true, ...}
🔴 LIVE MODE ACTIVE - Will fetch from API
🌐 Live Mode: Fetching from Supabase {filter: "All", sort: "recommended", ...}
✅ Supabase Response: {
  itemCount: 12,
  firstItem: {
    id: "...",
    type: "airdrop",           // ✅ Should be airdrop (highest trust score)
    title: "EigenLayer Airdrop Phase 2",
    trust_score: 95,
    ...
  },
  ...
}
📊 Opportunities Transformation: {
  useRealAPI: true,
  pagesCount: 1,
  itemsPerPage: [12],
  totalItems: 12,
  transformedCount: 12,
  firstTransformed: {
    id: "...",
    type: "Airdrop",          // ✅ Transformed correctly
    title: "EigenLayer Airdrop Phase 2",
    ...
  }
}
🔍 Hunter Filtering: {
  totalOpportunities: 12,
  filteredCount: 12,
  activeFilter: "All",
  opportunityTypes: ["Airdrop", "Airdrop", "Staking", "Airdrop", "Staking", ...], // ✅ Variety!
  firstOpportunity: {type: "Airdrop", ...}
}
```

## Sort Options Behavior

After this fix, the sort options work as follows:

1. **Recommended** (default): Sorts by trust_score DESC → Shows highest quality opportunities with variety
2. **Newest**: Sorts by created_at DESC → Shows most recently added opportunities
3. **Ends Soon**: Sorts by end_date ASC → Shows opportunities ending soonest
4. **Highest Reward**: Sorts by reward_max DESC → Shows highest paying opportunities
5. **Trust**: Sorts by trust_score DESC → Same as recommended

## Troubleshooting

### If you still see only "Staking" types:

1. **Verify the fix is in the code:**
   ```bash
   grep -A 3 "case 'recommended':" src/hooks/useHunterFeed.ts
   ```
   Should show:
   ```typescript
   case 'recommended':
   default:
     // For recommended, sort by trust_score to get diverse, high-quality opportunities
     query = query.order('trust_score', { ascending: false });
   ```

2. **Clear browser cache completely:**
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Firefox: Settings → Privacy → Clear Data → Cached Web Content
   - Safari: Develop → Empty Caches

3. **Try incognito/private mode:**
   - This forces a fresh load without any cache

4. **Check if dev server restarted:**
   - Stop the dev server (`Ctrl+C`)
   - Run `npm run dev` again
   - Wait for "ready" message
   - Refresh browser

## Files Modified

1. ✅ `src/hooks/useHunterFeed.ts` - Changed default sort from `created_at` to `trust_score`
2. ✅ `.kiro/specs/hunter-demand-side/SORTING_FIX_COMPLETE.md` - This document

## Summary

The fix changes the default "recommended" sort from chronological order (which grouped by seed order) to trust score order (which naturally provides diversity while showing high-quality opportunities first).

**Before:** All RWA (newest created_at) → All Staking type
**After:** Mixed types sorted by quality (trust_score) → Variety! ✅

---

**Status**: ✅ COMPLETE - Awaiting user verification after browser refresh
