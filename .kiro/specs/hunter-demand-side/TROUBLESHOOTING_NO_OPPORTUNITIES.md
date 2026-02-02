# Troubleshooting: No Opportunities Displayed

## Current Status

User reports seeing "No opportunities" in Hunter screen despite:
- ✅ Database has 51 opportunities (verified)
- ✅ Live mode is active (console confirms)
- ✅ Supabase query succeeds (console shows "✅ Supabase Response: Object")
- ❓ **UNKNOWN**: Actual itemCount in response (user needs to expand console object)

## Console Logs Analysis

```
useHunterFeed.ts:259 🔴 LIVE MODE ACTIVE - Will fetch from API
useHunterFeed.ts:301 🌐 Live Mode: Fetching from Supabase Object
useHunterFeed.ts:370 ✅ Supabase Response: Object
```

**CRITICAL**: The "Object" at line 370 needs to be expanded to see `itemCount`.

## Possible Root Causes

### 1. Query Returns 0 Results (Most Likely)
**Symptoms**: `itemCount: 0` in console
**Causes**:
- Filter mismatch (e.g., filtering by wrong type)
- Status filter excluding all opportunities
- Data transformation issue
- RLS policy blocking results

**Fix**: Check actual query and filters

### 2. Data Transformation Failing Silently
**Symptoms**: `itemCount: 12` but no UI display
**Causes**:
- `transformToLegacyOpportunity` throwing errors
- Missing required fields in database
- Type mismatch between DB schema and TypeScript interface

**Fix**: Add try-catch in transformation

### 3. React Query Cache Issue
**Symptoms**: Old empty data cached
**Causes**:
- Query key not updating on mode change
- Stale data persisting

**Fix**: Clear cache or update query key

### 4. UI Rendering Issue
**Symptoms**: Data exists but not rendered
**Causes**:
- `filteredOpportunities` filtering out all items
- Component render logic issue

**Fix**: Check Hunter.tsx filtering logic

## Diagnostic Steps

### Step 1: Check Actual Item Count
**User Action**: In browser console, click the arrow next to "✅ Supabase Response: Object" to expand it.

**Expected Output**:
```javascript
{
  itemCount: 12,  // <-- This is the key value
  timestamp: "2026-02-01T21:15:51.101Z"
}
```

**If itemCount is 0**: Go to Step 2 (Query Issue)
**If itemCount is > 0**: Go to Step 3 (Transformation Issue)

### Step 2: Debug Query (If itemCount = 0)

Add this temporary logging to `src/hooks/useHunterFeed.ts` at line 310:

```typescript
// Build query
let query = supabase
  .from('opportunities')
  .select('*')
  .eq('status', 'published');

console.log('🔍 Query Debug:', {
  filter: props.filter,
  sort: props.sort,
  activeWallet
});
```

Then check:
1. What is `props.filter` value? (Should be 'All', 'Airdrops', etc.)
2. Are there opportunities with `status = 'published'` in database?

**Database Check**:
```sql
-- Run in Supabase SQL Editor
SELECT type, status, COUNT(*) 
FROM opportunities 
GROUP BY type, status;
```

### Step 3: Debug Transformation (If itemCount > 0)

Add this temporary logging to `src/hooks/useHunterFeed.ts` at line 375:

```typescript
console.log('✅ Supabase Response:', {
  itemCount: result?.length || 0,
  firstItem: result?.[0],  // <-- Add this
  timestamp: new Date().toISOString()
});
```

Then check:
1. What does `firstItem` look like?
2. Does it have all required fields (id, type, title, etc.)?

### Step 4: Debug Transformation Function

Add this to `transformToLegacyOpportunity` function at line 130:

```typescript
function transformToLegacyOpportunity(opp: NewOpportunity): LegacyOpportunity {
  console.log('🔄 Transforming opportunity:', {
    id: opp.id,
    type: opp.type,
    title: opp.title,
    hasProtocol: !!opp.protocol,
    hasChains: !!opp.chains
  });
  
  // ... rest of function
}
```

Check if transformation is being called and if it's throwing errors.

### Step 5: Debug Final Opportunities Array

Add this to `src/hooks/useHunterFeed.ts` at line 420:

```typescript
const opportunities = useRealAPI
  ? (data?.pages.flatMap(page => page.items.map(transformToLegacyOpportunity)) ?? [])
  : (data?.pages[0]?.items ?? []);

console.log('📊 Final opportunities array:', {
  count: opportunities.length,
  firstOpportunity: opportunities[0]
});
```

### Step 6: Debug Hunter.tsx Filtering

Add this to `src/pages/Hunter.tsx` at line 100:

```typescript
const filteredOpportunities = opportunities.filter((opp: Opportunity) => {
  if (activeFilter === 'All') return true;
  
  const filterMap: Record<string, string> = {
    'Airdrops': 'Airdrop',
    'Quests': 'Quest',
    'Staking': 'Staking',
    'NFT': 'NFT',
    'Points': 'Points'
  };
  
  const mappedFilter = filterMap[activeFilter] || activeFilter;
  const matches = opp.type === mappedFilter;
  
  console.log('🔍 Filter check:', {
    oppType: opp.type,
    activeFilter,
    mappedFilter,
    matches
  });
  
  return matches;
});

console.log('📊 Filtered opportunities:', {
  total: opportunities.length,
  filtered: filteredOpportunities.length,
  activeFilter
});
```

## Quick Fix: Add Enhanced Logging

Replace the console.log at line 370 in `src/hooks/useHunterFeed.ts`:

```typescript
console.log('✅ Supabase Response:', {
  itemCount: result?.length || 0,
  items: result,  // Log full array
  timestamp: new Date().toISOString()
});
```

## Expected Database Schema

The `opportunities` table should have these columns:
- `id` (uuid)
- `type` (text) - values: 'airdrop', 'quest', 'staking', 'yield', 'points', 'rwa', 'strategy'
- `title` (text)
- `description` (text)
- `status` (text) - should be 'published' for visible opportunities
- `trust_score` (numeric)
- `reward_min` (numeric)
- `reward_max` (numeric)
- `reward_currency` (text)
- `chains` (text[])
- `protocol` (jsonb) - format: `{"name": "Protocol Name"}`

## Common Issues

### Issue 1: Status Not Set to 'published'
**Symptom**: Query returns 0 results
**Fix**: Update opportunities:
```sql
UPDATE opportunities SET status = 'published' WHERE status IS NULL;
```

### Issue 2: Type Mismatch
**Symptom**: Transformation fails
**Fix**: Check that database `type` values match the typeMap in `transformToLegacyOpportunity`:
```sql
SELECT DISTINCT type FROM opportunities;
-- Should return: airdrop, quest, staking, yield, points, rwa, strategy
```

### Issue 3: Missing Required Fields
**Symptom**: Transformation throws errors
**Fix**: Check for NULL values:
```sql
SELECT id, title, type, description 
FROM opportunities 
WHERE title IS NULL OR type IS NULL;
```

## Next Steps for User

1. **Expand the console object** to see `itemCount`
2. **Report back** with the actual itemCount value
3. **If itemCount = 0**: Run the database check query
4. **If itemCount > 0**: Add the transformation logging

## Files to Check

- `src/hooks/useHunterFeed.ts` - Data fetching and transformation
- `src/pages/Hunter.tsx` - UI rendering and filtering
- `supabase/migrations/20260125000000_hunter_demand_side_shared_schema.sql` - Database schema
