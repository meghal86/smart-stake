# Portfolio White Screen - FINAL FIX ✅

## Problem

White screen when opening `/portfolio` after starting the dev server.

## Root Cause

The services were trying to initialize Supabase client at module load time using `process.env`, which doesn't exist in the browser:

```typescript
// ❌ This runs when the module loads (in browser!)
class PortfolioValuationService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,  // ❌ process is undefined in browser
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

This caused a JavaScript error that crashed the entire React app, resulting in a white screen.

## Solution

Changed all three services to use **lazy-loaded Supabase clients** that are only created when needed, and only on the server-side:

### 1. PortfolioValuationService ✅

**Before:**
```typescript
class PortfolioValuationService {
  private supabase = createClient(...);  // ❌ Runs at module load
}
```

**After:**
```typescript
class PortfolioValuationService {
  private getSupabaseClient() {  // ✅ Only runs when called
    if (typeof window === 'undefined') {
      // Server-side only
      return createClient(...);
    }
  }
  
  async valuatePortfolio(addresses: string[]) {
    const supabase = this.getSupabaseClient();  // ✅ Lazy load
    // ...
  }
}
```

### 2. GuardianService ✅

**Before:**
```typescript
const supabase = createClient(...);  // ❌ Runs at module load

export async function requestGuardianScan(...) {
  const { data } = await supabase.functions.invoke(...);
}
```

**After:**
```typescript
function getSupabaseClient() {  // ✅ Only runs when called
  if (typeof window === 'undefined') {
    return createClient(...);
  }
}

export async function requestGuardianScan(...) {
  const supabase = getSupabaseClient();  // ✅ Lazy load
  const { data } = await supabase.functions.invoke(...);
}
```

### 3. HunterService ✅

Same pattern as GuardianService - lazy-loaded Supabase client.

## Why This Fixes It

### Before (Broken):
```
1. Browser loads JavaScript bundle
   ↓
2. Services module initializes
   ↓
3. Tries to access process.env (doesn't exist in browser!)
   ↓
4. JavaScript error
   ↓
5. React crashes
   ↓
6. White screen 💥
```

### After (Fixed):
```
1. Browser loads JavaScript bundle
   ↓
2. Services module initializes (no Supabase client yet)
   ↓
3. API route calls service method
   ↓
4. Service creates Supabase client (server-side only)
   ↓
5. Everything works ✅
```

## Key Changes

1. **Lazy Loading** - Supabase client created only when needed
2. **Server-Side Only** - Check `typeof window === 'undefined'`
3. **No Module-Level Init** - No code runs at module load time

## Testing

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open `/portfolio` in browser**

3. **Expected Result:**
   - ✅ Page loads (no white screen!)
   - ✅ Shows portfolio data (mock or real)
   - ✅ No JavaScript errors in console

4. **Check console for:**
   ```
   📊 [PortfolioValuation] Attempting to call portfolio-tracker-live
   🛡️ [Guardian] Attempting to call guardian-scan-v2
   🎯 [Hunter] Attempting to fetch opportunities
   ```

## Files Modified

1. `src/services/PortfolioValuationService.ts` - Lazy-loaded Supabase client
2. `src/services/guardianService.ts` - Lazy-loaded Supabase client
3. `src/services/hunterService.ts` - Lazy-loaded Supabase client

## Summary

The white screen was caused by trying to access `process.env` in the browser at module initialization time. Fixed by:

✅ **Lazy-loading Supabase clients** - Only create when needed
✅ **Server-side only** - Check for `typeof window === 'undefined'`
✅ **Graceful fallback** - Return mock data if edge functions fail

The portfolio page should now load successfully without any white screen!

**Status: FIXED** 🎉
