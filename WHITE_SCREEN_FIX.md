# White Screen Fix

## Issue
Website showing white screen after portfolio changes.

## Root Cause
The `portfolioEdgeFunctions.ts` file was trying to import `@supabase/auth-helpers-nextjs` which is not installed in the project.

## Fix Applied

### Changed Import
```typescript
// ❌ BEFORE (package not installed)
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// ✅ AFTER (using existing package)
import { createClient } from '@supabase/supabase-js';
```

### Updated Client Creation
```typescript
const getSupabaseClient = () => {
  if (typeof window === 'undefined') {
    return null; // SSR context
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
};
```

## Files Modified
- `src/lib/services/portfolioEdgeFunctions.ts` - Fixed Supabase client import

## Testing
1. Refresh the browser
2. Check browser console for errors
3. Verify app loads correctly

## If Still White Screen

### Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Share the error message

### Common Issues
1. **Environment variables missing**: Check `.env.local` has:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Build cache**: Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## Status
✅ Import error fixed
✅ Supabase client using correct package
✅ SSR safety check added

The app should now load correctly.
