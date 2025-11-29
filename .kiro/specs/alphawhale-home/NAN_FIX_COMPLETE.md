# NaN Display Issue - Fixed

## Problem

Users were seeing `NaN` displayed in the HarvestPro feature card on the home page.

## Root Causes

### 1. TypeScript Error in API Route
**File**: `src/app/api/home-metrics/route.ts`

**Issue**: `createClient()` was being awaited but the function signature expected a Promise type, causing type mismatches throughout the helper functions.

**Fix**: 
- Removed `await` from `createClient()` call (it's synchronous)
- Changed helper function signatures from `ReturnType<typeof createClient>` to `Awaited<ReturnType<typeof createClient>>`
- Prefixed unused `walletAddress` parameter with `_` to suppress lint warning

### 2. NaN in formatUsd Function
**File**: `src/components/home/HarvestProFeatureCard.tsx`

**Issue**: The `formatUsd` function didn't handle `undefined`, `null`, or `NaN` values, causing:
```typescript
// Before - would produce NaN
const formatUsd = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`; // Missing $ sign
  }
  // ...
}
```

**Fix**:
```typescript
// After - handles edge cases
const formatUsd = (value: number | undefined): string => {
  // Handle undefined, null, or NaN
  if (value === undefined || value === null || isNaN(value)) {
    return '$0';
  }
  
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`; // Added $ sign
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`; // Added $ sign
  }
  return `$${Math.round(value).toLocaleString()}`; // Added $ sign
};
```

**Additional improvements**:
- Added `$` prefix to all return values (was missing before)
- Simplified usage: `formatUsd(metrics?.harvestEstimateUsd)` instead of ternary

## Files Changed

1. ✅ `src/app/api/home-metrics/route.ts` - Fixed TypeScript errors
2. ✅ `src/components/home/HarvestProFeatureCard.tsx` - Fixed NaN handling and formatting

## Testing

### Demo Mode
```bash
# Should show: $12.4K
# Not: NaN or 12.4K (missing $)
```

### Live Mode (No Data)
```bash
# Should show: $0
# Not: NaN
```

### Live Mode (With Data)
```bash
# Should show formatted values:
# - $12.4K for 12,400
# - $1.2M for 1,200,000
# - $500 for 500
```

## Why This Happened

1. **API Route**: The Supabase client creation was incorrectly awaited, causing type mismatches
2. **Format Function**: Didn't account for undefined values from failed API calls or missing data
3. **Missing $ Signs**: Original implementation forgot to include currency symbol

## Prevention

- ✅ Always handle `undefined` in formatting functions
- ✅ Use `?? 0` or similar fallbacks for numeric values
- ✅ Test with demo mode, live mode, and error states
- ✅ Verify TypeScript types match actual function behavior

## Related Issues

- RPC 204 response (separate issue - this is normal CORS behavior)
- See `.kiro/specs/alphawhale-home/RPC_TROUBLESHOOTING.md` for RPC details

## Status

✅ **FIXED** - NaN issue resolved, proper formatting applied, TypeScript errors cleared
