# Sign In Redirect to Cockpit Fix

## Issue
After signing in, users were being redirected to `/guardian` instead of `/cockpit` (the authenticated home page).

## Root Cause
The `Login.tsx` component had hardcoded default redirect paths set to `/guardian`:
- Line 42: `if (!path) return '/guardian';`
- Line 48: `return '/guardian';`
- Comment on line 72: "Redirect to next parameter or default to /guardian"

## Solution
Changed all default redirect paths from `/guardian` to `/cockpit`.

## Changes Made

### File: `src/pages/Login.tsx`

**Before:**
```typescript
const getValidRedirectPath = (path: string | null): string => {
  if (!path) return '/guardian';
  
  // Must start with / and must not start with //
  if (path.startsWith('/') && !path.startsWith('//')) {
    return path;
  }
  
  return '/guardian';
};
```

**After:**
```typescript
const getValidRedirectPath = (path: string | null): string => {
  if (!path) return '/cockpit';
  
  // Must start with / and must not start with //
  if (path.startsWith('/') && !path.startsWith('//')) {
    return path;
  }
  
  return '/cockpit';
};
```

**Comment Update:**
```typescript
// Before:
// Redirect to next parameter or default to /guardian
// Both zero wallets and ≥1 wallet go to /guardian
// Guardian component handles empty state vs. main interface

// After:
// Redirect to next parameter or default to /cockpit
// Cockpit is the authenticated home page
```

## User Flow After Sign In

### Expected Behavior:
1. User enters email and password on `/signin` (or `/login`)
2. Credentials are validated
3. User is redirected to `/cockpit` (authenticated home page)
4. Cockpit displays personalized dashboard with:
   - Today's pulse
   - Action preview
   - Insights

### With Next Parameter:
If user was redirected to sign-in from a protected page, they'll be returned to that page:
- User tries to access `/settings/wallets` (protected)
- Redirected to `/signin?next=/settings/wallets`
- After sign-in, redirected back to `/settings/wallets`

## Why Cockpit Instead of Guardian?

1. **Cockpit is the authenticated home**: It's designed to be the first page users see after logging in
2. **Better UX**: Cockpit provides an overview of all features, not just Guardian
3. **Consistent with navigation**: The AlphaWhale logo in the header navigates to `/cockpit` when authenticated
4. **Matches user expectations**: Users expect to see a dashboard/home page after logging in

## Testing

### Test Case 1: Sign In Without Next Parameter
1. Navigate to `/signin`
2. Enter valid credentials
3. Click "Sign In"
4. **Expected**: Redirected to `/cockpit`

### Test Case 2: Sign In With Next Parameter
1. Navigate to `/signin?next=/settings/wallets`
2. Enter valid credentials
3. Click "Sign In"
4. **Expected**: Redirected to `/settings/wallets`

### Test Case 3: OAuth Sign In (Google/Apple)
1. Click "Continue with Google" on `/signin`
2. Complete OAuth flow
3. **Expected**: Redirected to `/cockpit`

### Test Case 4: Invalid Next Parameter (Security)
1. Navigate to `/signin?next=//evil.com`
2. Enter valid credentials
3. Click "Sign In"
4. **Expected**: Redirected to `/cockpit` (not evil.com)

## Files Modified
- `src/pages/Login.tsx`

## Related Components (No Changes Needed)
- `src/pages/Signin.tsx` (alias that redirects to Login)
- `src/components/header/GlobalHeader.tsx` (already navigates to /cockpit when authenticated)
