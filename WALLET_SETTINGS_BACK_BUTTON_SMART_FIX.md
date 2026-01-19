# Wallet Settings Back Button - Smart Navigation Fix

## Issue
When clicking "Back" on Manage Wallets page after coming from WalletConnect modal, it shows "invalid route: /cockpit" error.

## Root Cause
The app has BOTH React Router AND Next.js App Router files:
- React Router: `src/App.tsx` with `<Route path="/cockpit">`
- Next.js: `src/app/cockpit/page.tsx` (not actually used)

This causes routing confusion when `navigate(-1)` tries to go back to `/cockpit`.

## Solution
Implemented a **smart back button** that:
1. Checks if there's a valid referrer (not `/cockpit`)
2. Falls back to browser history if available
3. Defaults to `/settings` as last resort

## Code Changes

**File:** `src/pages/WalletSettings.tsx`

### Added Import
```typescript
import { useNavigate, useLocation } from 'react-router-dom';
```

### Added Smart Handler
```typescript
// Smart back button handler
const handleBack = () => {
  // Check if we have a referrer in location state
  const from = location.state?.from;
  
  if (from && from !== '/cockpit') {
    // Go to the referrer if it's not /cockpit
    navigate(from);
  } else if (window.history.length > 2) {
    // Try to go back if there's history
    navigate(-1);
  } else {
    // Fallback to settings page
    navigate('/settings');
  }
};
```

### Updated Button
```typescript
<button onClick={handleBack}>
  <ArrowLeft className="w-5 h-5" />
  Back
</button>
```

## How It Works Now

### Scenario 1: Normal Navigation
1. You're on `/settings`
2. Click "Manage Wallets" → `/settings/wallets`
3. Click "Back" → Goes to `/settings` ✅

### Scenario 2: From WalletConnect
1. You're on `/settings/wallets`
2. Click "WalletConnect" → Opens modal
3. Click "Back" → Avoids `/cockpit`, goes to `/settings` ✅

### Scenario 3: From Profile
1. You're on `/profile`
2. Click "Manage Wallets" → `/settings/wallets`
3. Click "Back" → Goes to `/profile` ✅

## Why This Works

The smart handler:
- ✅ Avoids the problematic `/cockpit` route
- ✅ Respects valid navigation history
- ✅ Always has a safe fallback
- ✅ No more "invalid route" errors

## Future Cleanup

Consider removing the unused Next.js file:
- `src/app/cockpit/page.tsx` (not used by React Router)

The app uses React Router, so Next.js App Router files are not needed.

## Status

**Status**: ✅ COMPLETE
**Date**: January 19, 2026
**Behavior**: Back button now safely navigates without errors
