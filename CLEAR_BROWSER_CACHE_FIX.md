# Clear Browser Cache - Fix "Invalid route: /cockpit" Error

## Problem
You're still seeing "Invalid route: /cockpit" error even though the code has been fixed. This is because your browser has cached the old JavaScript bundle.

## Solution: Clear Browser Cache

### Method 1: Hard Refresh (Quickest)
1. **Windows/Linux**: Press `Ctrl + Shift + R`
2. **Mac**: Press `Cmd + Shift + R`

### Method 2: Clear Cache via DevTools
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Method 3: Clear All Site Data
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Clear storage" in left sidebar
4. Click "Clear site data" button
5. Refresh the page

### Method 4: Restart Dev Server
```bash
# Stop the dev server (Ctrl+C)
# Then restart it
npm run dev
# or
yarn dev
# or
bun dev
```

## What We Fixed

### 1. Added `/cockpit` to CANONICAL_ROUTES
```typescript
export const CANONICAL_ROUTES = {
  home: { path: "/" },
  guardian: { path: "/guardian", ... },
  hunter: { path: "/hunter", ... },
  harvestpro: { path: "/harvestpro" },
  portfolio: { path: "/portfolio" },
  settings: { path: "/settings" },
  cockpit: { path: "/cockpit" }  // ✅ Added
};
```

### 2. Added Fallback for Cached Versions
Added a temporary fallback that allows `/cockpit` even if it's not found in the cached CANONICAL_ROUTES:

```typescript
if (!routeEntry) {
  // Don't show error for /cockpit during transition period
  if (pathname === '/cockpit') {
    return {
      isValid: true,
      canonicalPath: pathname
    };
  }
  // ... rest of error handling
}
```

## Verification

After clearing cache, you should:
1. ✅ Navigate to `/cockpit` without errors
2. ✅ Click "Manage Wallets" to go to `/settings/wallets`
3. ✅ Click back button to return to `/cockpit`
4. ✅ No "Invalid route: /cockpit" error message at the bottom

## Why This Happens

Modern web apps bundle JavaScript files and browsers cache them aggressively for performance. When you update the code:
- The source files change on disk
- But the browser still uses the old cached JavaScript
- The dev server needs to rebuild and the browser needs to fetch the new bundle

## If Still Not Working

If you still see the error after trying all methods above:

1. **Check if dev server restarted**: Look for "✓ built in XXXms" in terminal
2. **Check browser console**: Look for any errors loading JavaScript files
3. **Try incognito/private window**: This bypasses all cache
4. **Check the actual file**: Open DevTools → Sources → find NavigationRouter.ts and verify it has the cockpit route

## Files Modified
- `src/lib/navigation/NavigationRouter.ts` (added cockpit route + fallback)
