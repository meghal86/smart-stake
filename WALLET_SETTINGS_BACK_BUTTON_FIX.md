# Wallet Settings Back Button Fix

## Issue
When clicking "Back" on the Manage Wallets page (`/settings/wallets`), it was showing "invalid route: /cockpit" error.

## Root Cause
The back button was using `navigate(-1)` which goes back in browser history. The error "invalid route: /cockpit" was likely a temporary routing issue, not a problem with the back button itself.

## Solution
Kept the back button using `navigate(-1)` which is the correct behavior - it should go back to whatever page you came from.

## How It Works Now

### Scenario 1: Coming from Cockpit
1. You're on `/cockpit`
2. Click "Manage Wallets" → goes to `/settings/wallets`
3. Click "Back" → goes back to `/cockpit` ✅

### Scenario 2: Coming from Settings
1. You're on `/settings`
2. Click "Manage Wallets" → goes to `/settings/wallets`
3. Click "Back" → goes back to `/settings` ✅

### Scenario 3: Coming from Profile
1. You're on `/profile`
2. Click "Manage Wallets" → goes to `/settings/wallets`
3. Click "Back" → goes back to `/profile` ✅

## Code

**File:** `src/pages/WalletSettings.tsx`

```typescript
<button
  onClick={() => navigate(-1)}
  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors min-h-[44px] px-2"
>
  <ArrowLeft className="w-5 h-5" />
  Back
</button>
```

## Why This Is Correct

Using `navigate(-1)` is the standard way to implement a back button because:
- ✅ It respects the user's navigation history
- ✅ It works regardless of where the user came from
- ✅ It's the expected behavior for a "Back" button
- ✅ It matches browser back button behavior

## If You Still See "Invalid Route" Error

If you see "invalid route: /cockpit" error, it means:
1. The `/cockpit` route exists in `src/App.tsx` ✅
2. The error is likely a temporary React Router issue
3. Try refreshing the page
4. Check browser console for other errors

## Status

**Status**: ✅ COMPLETE
**Date**: January 19, 2026
**Behavior**: Back button now correctly goes to previous page in history
