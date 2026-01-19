# Hunter Demo Mode Implementation - Complete Fix

## Issue Summary

The Hunter screen was crashing when switching from demo mode to live data due to missing null safety checks in the data transformation layer and UI components.

### Error Messages
1. `Cannot read properties of undefined (reading 'score')` at `useHunterFeed.ts:155`
2. `Cannot read properties of undefined (reading 'toUpperCase')` at `OpportunityCard.tsx:151`

## Root Cause

The API response format from the live backend doesn't always include all properties that the demo data has:
- `trust` object might be undefined
- `trust.score` and `trust.level` might be missing
- `chains` array might be empty or undefined
- `protocol` object might be undefined
- `type` and `riskLevel` might be undefined in edge cases

## Fixes Applied

### 1. Data Transformation Layer (`src/hooks/useHunterFeed.ts`)

**Fixed `transformToLegacyOpportunity()` function:**

```typescript
// Before (unsafe)
const trustScore = opp.trust?.score ?? 80;
const trustLevel = opp.trust?.level ?? 'amber';

// After (safe)
const trustScore = (opp.trust && typeof opp.trust.score === 'number') 
  ? opp.trust.score 
  : 80;
const trustLevel = (opp.trust && opp.trust.level) 
  ? opp.trust.level 
  : 'amber';
```

**Added comprehensive null checks:**
- `chains`: `(opp.chains && opp.chains.length > 0) ? opp.chains[0] : 'Multi-chain'`
- `protocol`: `(opp.protocol && opp.protocol.name) ? opp.protocol.name : 'Unknown'`

**Removed invalid property:**
- Removed `featured` from `FeedQueryParams` (not supported by API)

**Removed unused import:**
- Removed `hashWalletAddress` import

### 2. UI Component Layer (`src/components/hunter/OpportunityCard.tsx`)

**Added fallbacks for icon lookups:**

```typescript
// Before (unsafe)
const TypeIcon = typeIcons[opportunity.type];
const RiskIcon = riskIcons[opportunity.riskLevel];

// After (safe)
const TypeIcon = opportunity.type ? typeIcons[opportunity.type] : typeIcons.Quest;
const RiskIcon = opportunity.riskLevel ? riskIcons[opportunity.riskLevel] : riskIcons.Medium;
```

**Added null-safe string operations:**

```typescript
// Type badge
{opportunity.type?.toUpperCase() || 'QUEST'}

// Risk badge
{opportunity.riskLevel?.toUpperCase() || 'UNKNOWN'} RISK
```

**Added null-safe className lookups:**

```typescript
// Type color
className={`p-3 rounded-xl ${opportunity.type ? typeColors[opportunity.type] : typeColors.Quest} shadow-lg`}
```

**Added conditional rendering:**

```typescript
// Protocol/chain display
{(opportunity.protocol || opportunity.chain) && (
  <p className={...}>
    {opportunity.protocol} {opportunity.chain && `• ${opportunity.chain}`}
  </p>
)}
```

**Added `isConnected` prop:**
- Added to `OpportunityCardProps` interface
- Added default value: `isConnected = false`

### 3. Demo Mode Integration (`src/pages/Hunter.tsx`)

**Centralized demo mode management:**
- Uses `useDemoMode()` hook from `DemoModeManager`
- Passes `isDemo` flag to `useHunterFeed()`

**Visual demo mode indicator:**
- Blue banner at top of page when demo mode is active
- Shows "Demo Mode — Showing simulated opportunities"

**Data switching:**
- Demo mode: Returns mock data instantly (no API calls)
- Live mode: Fetches from API with proper error handling

## Testing Checklist

- [x] Demo mode loads instantly with mock data
- [x] Live mode fetches from API without crashing
- [x] Switching between demo/live modes works smoothly
- [x] Missing properties don't cause crashes
- [x] Type badges display correctly
- [x] Risk badges display correctly
- [x] Protocol/chain info displays when available
- [x] Graceful fallbacks for missing data

## Demo Mode Behavior

### When Demo Mode is ON:
1. Global header shows "Demo Wallet" with Vitalik's address
2. Hunter page shows blue demo mode banner
3. Feed displays 5 hardcoded opportunities
4. No API calls are made
5. Data loads instantly (< 200ms)

### When Demo Mode is OFF:
1. Global header shows real connected wallet
2. Hunter page hides demo mode banner
3. Feed fetches from `/api/hunter/opportunities`
4. Infinite scroll pagination works
5. Real-time updates enabled (60s interval)

## Files Modified

1. `src/hooks/useHunterFeed.ts` - Data transformation with null safety
2. `src/components/hunter/OpportunityCard.tsx` - UI null safety and fallbacks
3. `src/pages/Hunter.tsx` - Demo mode integration (already done)

## Performance Impact

- Demo mode: 0 API calls, instant load
- Live mode: Same performance as before, but more resilient to API variations

## Next Steps

If API response format issues persist:
1. Add TypeScript interface validation at API boundary
2. Add Zod schema validation for API responses
3. Add error boundary around OpportunityCard for graceful degradation
4. Log malformed responses to Sentry for backend team

## Success Criteria

✅ No crashes when switching between demo and live modes
✅ Graceful handling of missing API properties
✅ Clear visual distinction between demo and live data
✅ All null/undefined edge cases handled
✅ TypeScript errors resolved
