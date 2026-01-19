# Wallet Modal Cache Issue - Resolution Guide

## Issue Summary

**Error:** `ReferenceError: WalletModal is not defined at GlobalHeader (GlobalHeader.tsx:232:9)`

**Root Cause:** Browser/build cache containing outdated code that references a non-existent `WalletModal` component.

## Problem Analysis

1. **File Length Mismatch:** Error points to line 232, but current `GlobalHeader.tsx` only has 125 lines
2. **No Code References:** No actual `WalletModal` references found in current codebase
3. **Cache Issue:** Development server serving cached/outdated JavaScript bundles

## Solution Steps

### 1. Clear All Caches

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Clear Next.js cache (if applicable)
rm -rf .next

# Clear dist folder
rm -rf dist

# Clear browser cache (hard refresh)
# Chrome/Firefox: Ctrl+Shift+R (Cmd+Shift+R on Mac)
```

### 2. Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
# or
yarn dev
# or
bun dev
```

### 3. Clear Browser Cache

**Chrome/Edge:**
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

**Firefox:**
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

**Safari:**
1. Develop menu → Empty Caches
2. Hard refresh (Cmd+Shift+R)

### 4. Verify Fix

After clearing caches and restarting:

1. **Check Console:** Should see no `WalletModal is not defined` errors
2. **Check Header:** GlobalHeader should render properly
3. **Check Wallet Features:** WalletSwitcherBottomSheet should work
4. **Check Hot Reload:** Changes should reflect immediately

## Current Code Status

### ✅ Correct Imports in GlobalHeader.tsx
```typescript
import { WalletSwitcherBottomSheet } from '@/components/wallet/WalletSwitcherBottomSheet'
```

### ✅ Correct Usage
```typescript
<WalletSwitcherBottomSheet
  isOpen={showWalletSwitcher}
  onClose={() => setShowWalletSwitcher(false)}
/>
```

### ✅ No WalletModal References
- No `WalletModal` imports
- No `WalletModal` component usage
- No undefined variables

## Prevention

### 1. Regular Cache Clearing
```bash
# Add to package.json scripts
"clean": "rm -rf node_modules/.vite .next dist",
"dev:clean": "npm run clean && npm run dev"
```

### 2. Browser Settings
- Disable cache when DevTools open
- Use incognito/private mode for testing
- Regular hard refresh during development

### 3. Development Workflow
```bash
# When encountering cache issues:
1. Stop dev server (Ctrl+C)
2. npm run clean
3. npm run dev
4. Hard refresh browser (Ctrl+Shift+R)
```

## Troubleshooting

### If Error Persists

1. **Check for Hidden Files:**
```bash
find . -name "*.cache" -o -name ".cache*" | xargs rm -rf
```

2. **Check Node Modules:**
```bash
rm -rf node_modules
npm install
```

3. **Check Browser Extensions:**
- Disable all extensions
- Try incognito mode
- Clear all browser data

4. **Check Multiple Browsers:**
- Test in Chrome, Firefox, Safari
- If works in one browser, it's browser-specific cache

### If Still Not Working

1. **Check for Multiple Versions:**
```bash
# Look for duplicate files
find . -name "*GlobalHeader*" -type f
```

2. **Check Import Paths:**
```bash
# Search for any remaining WalletModal references
grep -r "WalletModal" src/ --exclude-dir=node_modules
```

3. **Check TypeScript Compilation:**
```bash
npx tsc --noEmit
```

## Expected Results After Fix

✅ **No Console Errors:** Clean console with no `WalletModal` references
✅ **Header Renders:** GlobalHeader displays properly
✅ **Wallet Chip Works:** WalletChip clickable and functional
✅ **Bottom Sheet Opens:** WalletSwitcherBottomSheet displays correctly
✅ **Hot Reload Works:** Changes reflect immediately
✅ **All Features Work:** Wallet switching, navigation, etc.

## Files Verified

- ✅ `src/components/header/GlobalHeader.tsx` - Clean, no WalletModal references
- ✅ `src/components/wallet/WalletSwitcherBottomSheet.tsx` - Proper exports
- ✅ `src/components/header/WalletChip.tsx` - No issues
- ✅ All import statements correct

## Status: 🔧 CACHE CLEARING REQUIRED

The code is correct, but cached files are causing the error. Follow the cache clearing steps above to resolve.

---

**Resolution Date:** January 19, 2025
**Issue Type:** Development cache issue
**Solution:** Clear all caches and restart development server