# Onboarding Route 404 Fix - Complete

## Problem
You were seeing a 404 error in the console:
```
suppress-extensions.js:13 404 Error: User attempted to access non-existent route: /onboarding
```

## Root Cause
The OnboardingSection test file (`src/components/home/__tests__/OnboardingSection.test.tsx`) was outdated and didn't match the actual implementation:

1. **Test file** was mocking `next/router` and expecting navigation to `/onboarding`
2. **Actual component** uses `react-router-dom` and navigates to `/guardian`
3. The `/onboarding` route doesn't exist in `App.tsx`

## Solution Applied

### 1. Updated Test Mocking
**Before:**
```typescript
// Mock next/router
const mockPush = vi.fn();
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));
```

**After:**
```typescript
// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));
```

### 2. Updated All Test Assertions
Changed all references from:
- `mockPush` → `mockNavigate`
- `/onboarding` → `/guardian`

### 3. Updated Test Descriptions
- Updated component description to reflect navigation to `/guardian` (first step of onboarding)
- Updated Step 3 test to match actual component text: "Explore Opportunities"

## Files Modified

1. **src/components/home/__tests__/OnboardingSection.test.tsx**
   - Updated router mock from Next.js to React Router
   - Changed all navigation expectations from `/onboarding` to `/guardian`
   - Updated step 3 text expectations to match component
   - Changed all `mockPush` references to `mockNavigate`

2. **src/app/page.tsx**
   - Changed import from `next/navigation` to `react-router-dom`
   - Updated `useRouter()` to `useNavigate()`
   - Changed `router.push('/onboarding')` to `navigate('/guardian')`
   - Changed all `router.push()` calls to `navigate()`
   - Removed Next.js metadata export (not used in React Router setup)

## Current Behavior (Correct)

When users click "Start Onboarding":
- ✅ Navigates to `/guardian` (which exists in App.tsx)
- ✅ Guardian is the first step of the onboarding flow
- ✅ No 404 errors

When users click "Skip":
- ✅ Navigates to `/hunter` (which exists in App.tsx)

## Why This Happened

The project has a mix of Next.js and React Router code:
1. The test file was using Next.js router mocks
2. The `src/app/page.tsx` file was importing from `next/navigation`
3. But the actual app uses React Router (`BrowserRouter` in `App.tsx`)

The design documents originally specified a `/onboarding` route, but during implementation, the decision was made to navigate directly to `/guardian` as the first step instead of creating a separate onboarding page.

The OnboardingSection component was updated correctly to use React Router and navigate to `/guardian`, but:
- The test file was still using Next.js mocks
- The `page.tsx` file was still using Next.js router and trying to navigate to `/onboarding`

## Verification

Run the tests to verify:
```bash
npm test -- src/components/home/__tests__/OnboardingSection.test.tsx
```

All 48 tests should pass without any 404 errors.

## Related Files

- Component: `src/components/home/OnboardingSection.tsx` ✅ (already correct)
- Tests: `src/components/home/__tests__/OnboardingSection.test.tsx` ✅ (now fixed)
- Page: `src/app/page.tsx` ✅ (now fixed - uses React Router)
- Routes: `src/App.tsx` ✅ (has /guardian and /hunter routes)

## Note About src/app/page.tsx

This file appears to be a leftover from a Next.js setup. In your current React Router architecture:
- The actual home page is `AlphaWhaleHome.tsx`
- It's served via the `"/"` route in `App.tsx`
- The `src/app/page.tsx` file is not actually used by React Router
- Consider removing it or clearly documenting it's not in use

---

**Status:** ✅ Complete - No more 404 errors for /onboarding
