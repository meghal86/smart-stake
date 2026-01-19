# Wallet Chip Not Showing on First Login Fix

## Issue
After logging in for the first time, the WalletChip in the GlobalHeader was not showing even though the user had wallets in the database. The chip would only appear after a page refresh.

## Root Cause
The `GlobalHeader` component was checking `connectedWallets.length > 0` to decide whether to show the WalletChip, but it wasn't waiting for the wallets to finish loading from the database.

The flow was:
1. User logs in
2. Page redirects to `/cockpit`
3. `GlobalHeader` renders immediately
4. `useWallet()` hook starts fetching wallets from database
5. `connectedWallets` is initially an empty array `[]`
6. Header checks `connectedWallets.length > 0` → `false` → WalletChip not shown
7. Wallets finish loading (too late, component already rendered)

## Solution
Added a check for the `isLoading` state from `useWallet()` hook. The WalletChip now only renders when:
1. User is authenticated (`user` exists)
2. Wallets have finished loading (`!walletsLoading`)
3. User has at least one wallet (`connectedWallets.length > 0`)

## Changes Made

### File: `src/components/header/GlobalHeader.tsx`

**Before:**
```tsx
const { connectedWallets } = useWallet()

// ...

{user && connectedWallets.length > 0 && (
  <WalletChip 
    onClick={handleWalletChipClick}
    className="mr-2"
  />
)}
```

**After:**
```tsx
const { connectedWallets, isLoading: walletsLoading } = useWallet()

// ...

{user && !walletsLoading && connectedWallets.length > 0 && (
  <WalletChip 
    onClick={handleWalletChipClick}
    className="mr-2"
  />
)}
```

## User Flow After Fix

### Expected Behavior:
1. User logs in with email/password
2. Page redirects to `/cockpit`
3. `GlobalHeader` renders
4. Wallets start loading from database
5. While loading: WalletChip is hidden (waiting for data)
6. After loading completes:
   - If user has wallets → WalletChip appears
   - If user has no wallets → WalletChip stays hidden

### Loading States:
```
Initial State (walletsLoading = true):
- Show: Profile dropdown
- Hide: WalletChip (waiting for data)

After Loading (walletsLoading = false):
- If connectedWallets.length > 0:
  - Show: WalletChip + Profile dropdown
- If connectedWallets.length === 0:
  - Show: Profile dropdown only
```

## Why This Matters

1. **Better UX**: Users see their wallet immediately after login
2. **Prevents confusion**: Users don't think their wallet is missing
3. **Consistent state**: Header reflects actual database state
4. **No refresh needed**: Everything works on first load

## Testing

### Test Case 1: Login with Existing Wallets
1. User has wallets in database
2. Sign in with email/password
3. **Expected**: After redirect to `/cockpit`, WalletChip appears in header (may take 1-2 seconds to load)

### Test Case 2: Login with No Wallets
1. User has no wallets in database
2. Sign in with email/password
3. **Expected**: After redirect to `/cockpit`, no WalletChip in header (only profile dropdown)

### Test Case 3: Add Wallet After Login
1. User logs in with no wallets
2. Navigate to `/settings/wallets`
3. Add a wallet
4. Navigate back to `/cockpit`
5. **Expected**: WalletChip now appears in header

## Technical Details

### WalletContext Loading Flow:
```typescript
useWallet() {
  // Uses useWalletRegistry() internally
  const { wallets, isLoading } = useWalletRegistry()
  
  // isLoading is true while fetching from database
  // isLoading becomes false when query completes
  
  return {
    connectedWallets: wallets,
    isLoading
  }
}
```

### Query Configuration:
```typescript
useQuery({
  queryKey: walletKeys.registry(),
  queryFn: async () => {
    // Fetch from user_wallets table
  },
  enabled: !!userId,
  staleTime: 30_000, // 30 seconds
})
```

## Files Modified
- `src/components/header/GlobalHeader.tsx`

## Related Components (No Changes Needed)
- `src/contexts/WalletContext.tsx` (already provides isLoading)
- `src/hooks/useWalletRegistry.ts` (already provides isLoading)
- `src/components/header/WalletChip.tsx` (display component)
