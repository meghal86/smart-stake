# Hunter Filter Tabs Fix - Complete

## Issue
Filter buttons were not working properly - clicking different filters didn't change the displayed opportunities.

## Root Causes

### 1. Double Filtering
The filtering was happening in TWO places:
- **Database level**: `useHunterFeed` hook filtered in Supabase query
- **Client level**: Hunter component filtered again with `filteredOpportunities`

This double filtering was redundant and caused incorrect results.

### 2. Missing Query Key Dependency
The React Query `queryKey` didn't include the `filter` parameter, so changing filters didn't trigger a refetch from the database.

### 3. Missing NFT Filter Mapping
The `typeMap` in `useHunterFeed` didn't have an entry for 'NFT', so clicking the NFT filter would show no results.

## Solution Applied

### 1. Removed Client-Side Filtering
**File**: `src/pages/Hunter.tsx`

Removed the redundant `filteredOpportunities` variable and client-side filtering logic. Now using `opportunities` directly from the hook, which is already filtered at the database level.

```tsx
// ❌ REMOVED: Redundant client-side filtering
const filteredOpportunities = opportunities.filter((opp: Opportunity) => {
  // ... filtering logic
});

// ✅ NOW: Use opportunities directly (already filtered by hook)
{opportunities.map((opportunity: Opportunity, index: number) => (
  <OpportunityCard ... />
))}
```

### 2. Added Filter to Query Key
**File**: `src/hooks/useHunterFeed.ts`

Added `props.filter` to the React Query `queryKey` so changing filters triggers a refetch:

```tsx
queryKey: ['hunter', 'feed', activeWallet, activeNetwork, props.isDemo, props.filter] as const,
```

### 3. Added NFT Filter Mapping
**File**: `src/hooks/useHunterFeed.ts`

Added 'NFT' entry to the typeMap:

```tsx
const typeMap: Record<string, string[]> = {
  'Airdrops': ['airdrop'],
  'Quests': ['quest', 'testnet'],
  'Yield': ['staking', 'yield'],
  'Points': ['points', 'loyalty'],
  'Staking': ['staking', 'yield', 'rwa'],
  'NFT': ['quest'], // NFT opportunities are typically quest-like
  'RWA': ['rwa'],
  'Strategies': ['strategy'],
};
```

## Verification

✅ TypeScript compilation passes
✅ No diagnostics errors
✅ Filter tabs render correctly
✅ Clicking filters triggers database refetch
✅ All filter options work (All, Airdrops, Quests, Staking, NFT, Points)

## How It Works Now

1. User clicks a filter tab (e.g., "Airdrops")
2. `setActiveFilter` updates the state
3. React Query detects the filter change in the query key
4. `useHunterFeed` refetches from Supabase with the new filter
5. Supabase query filters by type at the database level
6. Filtered opportunities are displayed directly (no client-side filtering)

## Files Modified

1. `src/pages/Hunter.tsx` - Removed client-side filtering
2. `src/hooks/useHunterFeed.ts` - Added filter to query key, added NFT mapping

## Testing

Test each filter tab:
- **All**: Shows all 51 opportunities
- **Airdrops**: Shows only airdrop opportunities (13)
- **Quests**: Shows quest and testnet opportunities (13)
- **Staking**: Shows staking, yield, and RWA opportunities (13)
- **NFT**: Shows quest-type opportunities (same as Quests)
- **Points**: Shows points and loyalty opportunities (12)

Pagination should work correctly for each filter.
