# HarvestPro Vite API Connection Fix - COMPLETE

## Problem Identified

The project is a **Vite/React app** (not Next.js), but the hook was trying to call Next.js API routes at `/api/harvest/opportunities` which don't exist in Vite.

### Root Cause
- Vite runs on port 8080 (configured in `vite.config.ts`)
- Next.js API routes in `src/app/api/` don't work with Vite
- The hook needs to call Supabase Edge Functions **directly**

## Solution Applied

### 1. Fixed `src/hooks/useHarvestOpportunities.ts`

**Before (WRONG):**
```typescript
// Tried to call Next.js API route (doesn't exist in Vite)
const response = await fetch(`/api/harvest/opportunities?${params}`);
```

**After (CORRECT):**
```typescript
// Calls Supabase Edge Function directly
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();

const { data, error } = await supabase.functions.invoke(
  'harvest-recompute-opportunities',
  {
    body: {
      userId: user.id,
      taxRate,
      minLossThreshold,
      maxRiskLevel,
      excludeWashSale,
    },
  }
);
```

### 2. Fixed TypeScript Errors in `src/pages/HarvestPro.tsx`

**Fixed:**
- Removed unused `error` variable (was causing "never read" warning)
- Removed `console.log()` in JSX (was causing "Type 'void' is not assignable to type 'ReactNode'" error)

## Files Modified

1. ✅ `src/hooks/useHarvestOpportunities.ts` - Now calls Edge Function directly
2. ✅ `src/pages/HarvestPro.tsx` - Fixed TypeScript errors

## How It Works Now

```
User Interface (HarvestPro.tsx)
  ↓
useHarvestOpportunities() hook
  ↓
Supabase Client
  ↓
Edge Function: harvest-recompute-opportunities
  ↓
Returns opportunities data
  ↓
Hook formats response
  ↓
UI displays opportunities
```

## Testing

1. **Start Vite dev server:**
```bash
npm run dev
```

2. **Open browser:**
```
http://localhost:8080/harvest
```

3. **Toggle Demo Mode OFF** - Should now successfully call Edge Function

4. **Check Network tab:**
- Should see POST request to Supabase Edge Function
- Should NOT see failed request to `/api/harvest/opportunities`

## Why This Happened

The project has **both** Next.js and Vite dependencies:
- `package.json` has both `next` and `vite`
- `src/app/api/` contains Next.js API routes
- But `npm run dev` runs Vite, not Next.js
- Vite doesn't support Next.js API routes

## Architecture Clarification

**For Vite/React apps:**
- ✅ Call Supabase Edge Functions directly from hooks
- ❌ Don't use Next.js API routes

**For Next.js apps:**
- ✅ Use Next.js API routes as thin wrappers
- ✅ API routes call Edge Functions
- ✅ Provides rate limiting, auth, etc.

This project is **Vite**, so we use the direct approach.

## Next Steps

The connection should now work. If you still see issues:

1. Check Supabase Edge Function is deployed:
```bash
supabase functions list
```

2. Check Edge Function logs:
```bash
supabase functions logs harvest-recompute-opportunities
```

3. Verify authentication is working (user must be logged in)

## Summary

**Fixed the root cause:** Changed from trying to call non-existent Next.js API routes to calling Supabase Edge Functions directly, which is the correct approach for Vite apps.
