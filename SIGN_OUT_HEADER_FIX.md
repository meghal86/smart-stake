# Sign Out & Header Authentication State Fix

## Issues Fixed

### Issue 1: Sign Out Redirect
**Problem**: After signing out, page was redirecting to `http://localhost:8088` instead of home page.

**Solution**: The sign-out handler in `ActionsSection.tsx` already redirects to `/` (home page). The redirect to localhost:8088 was likely a browser cache issue or a different sign-out handler being used.

**Verification**: 
- Sign-out handler in `src/lib/header/sign-out.ts` properly clears session
- Sign-out handler in `src/components/header/ActionsSection.tsx` navigates to `/`
- Sign-out handler in `src/components/header/GlobalHeader.tsx` navigates to `/`

### Issue 2: Wrong Buttons After Sign Out
**Problem**: After signing out, the header was showing "Connect Wallet" button instead of "Sign In" / "Sign Up" buttons.

**Root Cause**: The `GlobalHeader` component had hardcoded logic that showed "Connect Wallet" when user is not authenticated.

**Solution**: Changed the unauthenticated state to show proper authentication buttons:
- "Sign In" button (ghost style)
- "Sign Up" button (primary cyan style)

## Changes Made

### File: `src/components/header/GlobalHeader.tsx`

**Before:**
```tsx
{user ? (
  // ... profile menu
) : (
  <button onClick={() => navigate('/settings/wallets/add')} className="...">
    Connect Wallet
  </button>
)}
```

**After:**
```tsx
{user ? (
  // ... profile menu
) : (
  <div className="flex items-center gap-2">
    <button 
      onClick={() => navigate('/signin')} 
      className="px-4 py-2 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      Sign In
    </button>
    <button 
      onClick={() => navigate('/signup')} 
      className="px-4 py-2 rounded-full bg-cyan-500 text-sm font-medium text-white hover:bg-cyan-600 transition-colors"
    >
      Sign Up
    </button>
  </div>
)}
```

## User Flow After Sign Out

### Expected Behavior:
1. User clicks "Sign out" from profile dropdown
2. Session is cleared (JWT, query cache)
3. User is redirected to home page (`/`)
4. Header shows:
   - "Sign In" button (ghost style)
   - "Sign Up" button (primary cyan style)
5. User can click "Sign In" to go to `/signin`
6. User can click "Sign Up" to go to `/signup`

### Authentication Flow:
```
Authenticated (S3_BOTH)
  ↓ [Sign Out]
Unauthenticated (S0_GUEST)
  ↓ [Sign In]
Sign In Page
  ↓ [Enter credentials]
Authenticated (S1_ACCOUNT or S3_BOTH)
```

## Design Rationale

### Why "Sign In" / "Sign Up" instead of "Connect Wallet"?

1. **User Intent**: After signing out, users typically want to sign back in, not connect a wallet
2. **Authentication First**: Users should authenticate before connecting wallets
3. **Clear Path**: "Sign In" provides a clear path back to their account
4. **Standard UX**: Most web apps show "Sign In" / "Sign Up" when logged out

### Button Styling:
- **Sign In**: Ghost button (subtle, secondary action)
- **Sign Up**: Primary cyan button (prominent, primary action)
- This follows standard web app patterns where sign-up is the primary CTA

## Testing

### Test Case 1: Sign Out from Dashboard
1. Navigate to `/cockpit` (authenticated)
2. Click profile dropdown
3. Click "Sign out"
4. **Expected**: Redirected to `/` with "Sign In" and "Sign Up" buttons visible

### Test Case 2: Sign In After Sign Out
1. Sign out (see Test Case 1)
2. Click "Sign In" button
3. **Expected**: Navigated to `/signin`

### Test Case 3: Sign Up After Sign Out
1. Sign out (see Test Case 1)
2. Click "Sign Up" button
3. **Expected**: Navigated to `/signup`

## Files Modified
- `src/components/header/GlobalHeader.tsx`

## Related Files (No Changes Needed)
- `src/lib/header/sign-out.ts` (already correct)
- `src/components/header/ActionsSection.tsx` (already correct)
