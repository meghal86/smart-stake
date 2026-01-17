# Vite Dependency Cache Fix

## Problem
You're seeing this error:
```
GET http://localhost:8080/node_modules/.vite/deps/basic-3DJADJTK.js?v=07467266 net::ERR_ABORTED 504 (Outdated Optimize Dep)
```

This is a **Vite dependency cache corruption** issue that happens when dependencies change or get out of sync.

## Solution

**STOP the development server and run these commands:**

```bash
# 1. Stop the dev server (Ctrl+C)

# 2. Clear Vite cache
rm -rf node_modules/.vite

# 3. Clear npm cache (optional but recommended)
npm cache clean --force

# 4. Reinstall dependencies (optional)
rm -rf node_modules
npm install

# 5. Restart dev server
npm run dev
```

## Quick Fix (Try This First)

If you want to try the minimal fix first:

```bash
# Stop dev server (Ctrl+C)
rm -rf node_modules/.vite
npm run dev
```

## Why This Happens

- Vite pre-bundles dependencies for faster loading
- When dependencies change or get corrupted, the cache becomes invalid
- The `basic-3DJADJTK.js` file is a pre-bundled dependency that's now outdated
- Clearing the cache forces Vite to rebuild the dependency bundle

## Prevention

- Clear Vite cache when switching branches with different dependencies
- Clear cache after updating packages
- Add `node_modules/.vite` to your `.gitignore` (already done)

## After Fix

Once you clear the cache and restart:
1. Wallet connection should work properly
2. RainbowKit modal should appear correctly
3. No more 504 errors on dependency files

The hybrid wallet modal system will then work as intended:
- Try RainbowKit first (preferred UI)
- Fall back to CustomWalletModal if RainbowKit fails