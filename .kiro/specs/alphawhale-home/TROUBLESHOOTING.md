# AlphaWhale Home Page - Troubleshooting Guide

## Common Issues & Solutions

### 1. "process is not defined" Error

**Error Message:**
```
Uncaught ReferenceError: process is not defined
at node_modules/next/dist/client/has-base-path.js
```

**Solution:**
✅ **FIXED** - Added process polyfill to `vite.config.ts`

**Steps to Apply Fix:**
1. Stop dev server (Ctrl+C)
2. Restart: `npm run dev`
3. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
4. Navigate to: `http://localhost:5173/home`

**Why This Happened:**
- Project uses Vite (not Next.js)
- Some dependency expects Node.js `process` global
- Vite doesn't provide Node.js globals by default

---

### 2. Page Shows Whale Transactions Instead of New Home

**Symptom:**
You see whale alerts/transactions instead of the Hero Section and Feature Cards.

**Solution:**
You're on the wrong route!

**Correct Route:**
```
http://localhost:5173/home  ← New AlphaWhale Home
```

**Wrong Route:**
```
http://localhost:5173/whale-alerts  ← Old whale transactions page
```

---

### 3. Components Not Loading / Blank Page

**Symptom:**
Page is blank or components don't render.

**Solution:**

1. **Check Browser Console** (F12 → Console tab)
   - Look for import errors
   - Look for component errors

2. **Verify Components Exist:**
   ```bash
   ls src/components/home/
   ```
   
   Should show:
   - HeroSection.tsx
   - GuardianFeatureCard.tsx
   - HunterFeatureCard.tsx
   - HarvestProFeatureCard.tsx
   - TrustBuilders.tsx
   - OnboardingSection.tsx
   - FooterNav.tsx

3. **Rebuild:**
   ```bash
   npm run build
   ```

---

### 4. Demo Badges Not Showing

**Symptom:**
Purple "Demo" badges are missing from feature cards.

**Possible Causes:**

**A. Wallet is Connected**
- Demo badges only show when NOT authenticated
- **Solution:** Disconnect wallet or use incognito window

**B. Context Not Working**
- Check browser console for errors
- **Solution:** Verify `HomeAuthProvider` is wrapping the page

---

### 5. Contrast Issues / Text Hard to Read

**Symptom:**
Text is too light or hard to read.

**Solution:**
✅ **FIXED** - Contrast improvements applied in Task 13.2

**Verify Fix:**
- Text should be gray-400 (not gray-500)
- Buttons should be cyan-700 (not cyan-500)
- All text should meet WCAG AA standards (4.5:1 ratio)

**Test Contrast:**
1. Open browser DevTools (F12)
2. Inspect text element
3. Check contrast ratio in Accessibility panel

---

### 6. Routing Not Working / 404 Errors

**Symptom:**
Clicking links results in 404 or page not found.

**Solution:**

1. **Verify Dev Server is Running:**
   ```bash
   npm run dev
   ```

2. **Check Route Configuration:**
   Routes should be in `src/App.tsx`:
   ```typescript
   <Route path="/home" element={<AlphaWhaleHome />} />
   ```

3. **Use Browser Navigation:**
   Don't manually type URLs - use the app's navigation

---

### 7. Build Errors

**Symptom:**
`npm run build` fails with errors.

**Common Errors:**

**A. TypeScript Errors**
```bash
# Check for type errors
npm run build 2>&1 | grep "error TS"
```

**Solution:** Fix type errors in reported files

**B. Import Errors**
```
"X" is not exported by "Y"
```

**Solution:** Check import statements match exports

**C. Missing Dependencies**
```bash
npm install
```

---

### 8. Styling Issues / CSS Not Loading

**Symptom:**
Page looks unstyled or broken.

**Solution:**

1. **Verify Tailwind is Working:**
   - Check if any Tailwind classes work
   - Look for `tailwind.config.ts`

2. **Clear Build Cache:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

3. **Hard Refresh Browser:**
   ```bash
   Cmd+Shift+R (Mac)
   Ctrl+Shift+R (Windows/Linux)
   ```

---

### 9. Wallet Connection Not Working

**Symptom:**
"Connect Wallet" button doesn't work.

**Solution:**

1. **Check WalletConnect Project ID:**
   - Verify `.env` has `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - Get one from: https://cloud.walletconnect.com

2. **Check Browser Console:**
   - Look for wallet connection errors
   - Verify wallet extension is installed

3. **Try Different Wallet:**
   - MetaMask
   - WalletConnect
   - Coinbase Wallet

---

### 10. API Errors / Metrics Not Loading

**Symptom:**
Demo metrics show but live metrics don't load after wallet connection.

**Solution:**

1. **Check API Endpoint:**
   ```bash
   curl http://localhost:5173/api/home-metrics
   ```

2. **Verify Supabase Connection:**
   - Check `.env` for Supabase credentials
   - Verify Supabase project is running

3. **Check Network Tab:**
   - Open DevTools → Network tab
   - Look for failed API requests
   - Check response status codes

---

## Quick Diagnostic Commands

### Check if Dev Server is Running
```bash
curl http://localhost:5173
```

### Check Build Status
```bash
npm run build
```

### Check for TypeScript Errors
```bash
npx tsc --noEmit
```

### Check for Linting Errors
```bash
npm run lint
```

### Clear All Caches
```bash
rm -rf node_modules/.vite
rm -rf dist
npm run dev
```

---

## Emergency Reset

If nothing works, try a full reset:

```bash
# 1. Stop dev server
# Ctrl+C

# 2. Clear caches
rm -rf node_modules/.vite
rm -rf dist
rm -rf .next

# 3. Reinstall dependencies
rm -rf node_modules
npm install

# 4. Rebuild
npm run build

# 5. Start fresh
npm run dev
```

---

## Getting Help

### Check Documentation
- **Routing Fix:** `.kiro/specs/alphawhale-home/ROUTING_FIX_COMPLETE.md`
- **Testing Guide:** `.kiro/specs/alphawhale-home/TESTING_GUIDE.md`
- **Quick Access:** `.kiro/specs/alphawhale-home/QUICK_ACCESS_GUIDE.md`
- **Process Error:** `.kiro/specs/alphawhale-home/PROCESS_ERROR_FIX.md`

### Check Browser Console
Always check the browser console (F12) for errors - it's the first place to look!

### Check Terminal Output
Look at the dev server terminal for build errors or warnings.

---

## Success Checklist

When everything is working, you should see:

- ✅ No console errors
- ✅ Hero section with gradient background
- ✅ Three feature cards with purple "Demo" badges
- ✅ Trust builders section
- ✅ Onboarding section
- ✅ Footer navigation
- ✅ All text is readable (good contrast)
- ✅ Smooth hover animations
- ✅ "Connect Wallet" button works

---

## Still Having Issues?

1. **Read the error message carefully** - it usually tells you what's wrong
2. **Check browser console** - most errors show up there
3. **Try incognito mode** - rules out browser extension conflicts
4. **Clear all caches** - sometimes old cached files cause issues
5. **Restart everything** - dev server, browser, even your computer if needed

The most common issue is being on the wrong route. Make sure you're at:
```
http://localhost:5173/home
```

Not `/whale-alerts` or any other route!
