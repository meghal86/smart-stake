# Troubleshooting White Screen

## Quick Fix Steps

### Step 1: Check Browser Console
1. Open browser DevTools (F12 or Right-click → Inspect)
2. Go to **Console** tab
3. Look for **red error messages**
4. Take a screenshot or copy the error

### Step 2: Hard Refresh
```bash
# Windows/Linux
Ctrl + Shift + R

# Mac
Cmd + Shift + R
```

### Step 3: Clear Build Cache
```bash
# Stop the dev server (Ctrl+C)
# Then run:
rm -rf .next
npm run dev
```

### Step 4: Check Environment Variables
Verify `.env.local` exists and has:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

---

## What Was Fixed

### Issue 1: Missing Package Import
**File**: `src/lib/services/portfolioEdgeFunctions.ts`

**Problem**: Tried to import `@supabase/auth-helpers-nextjs` (not installed)

**Solution**: Changed to use `@supabase/supabase-js` (already installed)

```typescript
// ✅ Fixed
import { createClient } from '@supabase/supabase-js';
```

### Issue 2: SSR Safety
Added check to prevent server-side execution:
```typescript
const getSupabaseClient = () => {
  if (typeof window === 'undefined') {
    return null; // SSR context - don't create client
  }
  return createClient(...);
};
```

---

## Common White Screen Causes

### 1. JavaScript Runtime Error
**Symptoms**: White screen, error in console

**Check**:
- Open Console (F12)
- Look for red errors
- Common errors:
  - `Cannot read property 'X' of undefined`
  - `X is not a function`
  - `Failed to resolve import`

**Fix**: Share the error message for specific help

### 2. Missing Environment Variables
**Symptoms**: White screen, no errors (or auth errors)

**Check**:
```bash
# Verify .env.local exists
ls -la .env.local

# Check contents (don't share actual values!)
cat .env.local
```

**Fix**: Copy from `.env.example` and fill in real values

### 3. Build Cache Issues
**Symptoms**: White screen after code changes

**Fix**:
```bash
# Stop dev server
Ctrl+C

# Clear cache
rm -rf .next
rm -rf node_modules/.vite

# Restart
npm run dev
```

### 4. Port Already in Use
**Symptoms**: Dev server won't start or shows old version

**Check**:
```bash
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000
```

**Fix**:
```bash
# Kill the process or use different port
npm run dev -- --port 3001
```

### 5. React Hydration Mismatch
**Symptoms**: White screen, hydration error in console

**Common Causes**:
- Server-rendered HTML doesn't match client
- Using `window` or `document` during SSR
- Date/time rendering differences

**Fix**: Wrap client-only code:
```typescript
if (typeof window !== 'undefined') {
  // Client-only code here
}
```

---

## Debugging Steps

### 1. Check Network Tab
1. Open DevTools (F12)
2. Go to **Network** tab
3. Refresh page
4. Look for:
   - Failed requests (red)
   - 404 errors
   - 500 errors

### 2. Check React DevTools
1. Install React DevTools extension
2. Open DevTools
3. Go to **Components** tab
4. See if components are rendering

### 3. Check Source Maps
1. Open DevTools
2. Go to **Sources** tab
3. Find your component file
4. Set breakpoints
5. Refresh and debug

### 4. Simplify the Page
Temporarily comment out sections to isolate the issue:

```typescript
export function MyPage() {
  return (
    <div>
      <h1>Test</h1>
      {/* <ComplexComponent /> */}
    </div>
  );
}
```

---

## Specific Fixes Applied

### File: `src/lib/services/portfolioEdgeFunctions.ts`

**Changes**:
1. ✅ Fixed import to use installed package
2. ✅ Added SSR safety check
3. ✅ Added null checks in all functions
4. ✅ Added error handling with fallbacks

### File: `src/components/portfolio/tabs/OverviewTab.tsx`

**Changes**:
1. ✅ Removed mock whale interactions
2. ✅ Using real data from snapshot
3. ✅ Added loading states
4. ✅ Added empty states

### File: `src/components/portfolio/tabs/AuditTab.tsx`

**Changes**:
1. ✅ Removed mock transactions
2. ✅ Using real data from database
3. ✅ Added demo mode support
4. ✅ Added error handling

---

## If Still Not Working

### Collect Debug Info

1. **Browser Console Errors**:
   ```
   [Copy all red errors here]
   ```

2. **Network Errors**:
   ```
   [Copy failed requests here]
   ```

3. **Dev Server Output**:
   ```bash
   npm run dev
   [Copy any errors from terminal]
   ```

4. **Environment Check**:
   ```bash
   # Check if variables are set (don't share values!)
   echo $NEXT_PUBLIC_SUPABASE_URL
   ```

### Share This Info
- Browser and version
- Operating system
- Node version: `node --version`
- npm version: `npm --version`
- Console errors (screenshot or text)
- Network tab errors
- Dev server errors

---

## Emergency Rollback

If you need to undo the changes:

```bash
# Revert the files
git checkout src/lib/services/portfolioEdgeFunctions.ts
git checkout src/components/portfolio/tabs/OverviewTab.tsx
git checkout src/components/portfolio/tabs/AuditTab.tsx

# Restart dev server
npm run dev
```

---

## Expected Behavior After Fix

### Demo Mode (No Wallet)
- ✅ Page loads instantly
- ✅ Shows demo data
- ✅ "Demo Mode" badges visible
- ✅ No console errors

### Live Mode (Wallet Connected)
- ✅ Page loads
- ✅ Shows real data for wallet
- ✅ Loading skeletons during fetch
- ✅ Empty states if no data

---

## Status

✅ **Import error fixed** - Using correct Supabase package
✅ **SSR safety added** - Won't crash during server rendering
✅ **Error handling added** - Graceful fallbacks on errors
✅ **Mock data removed** - Using real data in live mode

**The white screen should be resolved. Please refresh your browser.**

If still seeing white screen, check browser console and share the error message.
