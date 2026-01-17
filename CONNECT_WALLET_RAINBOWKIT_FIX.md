# Connect Wallet RainbowKit Fix

## Problem Statement

When users clicked the "Connect Wallet" button in the GlobalHeader, they received an error message:

```
Error: No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.
    at WalletContext.tsx:508:15
    at onClick (GlobalHeader.tsx:117:58)
```

The button should open the RainbowKit wallet selection modal (same as Guardian header), not throw an error.

## Root Cause

The ActionsSection component was calling `connectWallet()` from WalletContext, which throws an error if no Ethereum wallet is detected. This is the wrong approach - it should use RainbowKit's `openConnectModal()` instead, which gracefully opens a modal showing all available wallet options.

### Wrong Implementation

```typescript
// ❌ WRONG - throws error if no wallet detected
import { useWallet } from '@/contexts/WalletContext'
import { useToast } from '@/hooks/use-toast'

const { connectWallet, activeWallet } = useWallet()
const { toast } = useToast()

const handleConnectWallet = async () => {
  try {
    await connectWallet() // Throws error!
  } catch (error: any) {
    toast({
      title: 'Connection Failed',
      description: error.message,
      variant: 'destructive',
    })
  }
}
```

## Solution

Updated ActionsSection to use RainbowKit's `useConnectModal` hook, which is the standard way to open wallet connection modals throughout the app.

### Correct Implementation

```typescript
// ✅ CORRECT - opens RainbowKit modal
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'

const { address: activeWallet } = useAccount()
const { openConnectModal } = useConnectModal()

const handleConnectWallet = () => {
  if (openConnectModal) {
    openConnectModal() // Opens modal gracefully
  } else {
    console.error('RainbowKit connect modal not available')
  }
}
```

## Implementation Details

### Files Modified

**`src/components/header/ActionsSection.tsx`**

### Changes Made

#### 1. Updated Imports

```typescript
// Removed
- import { useWallet } from '@/contexts/WalletContext'
- import { useToast } from '@/hooks/use-toast'

// Added
+ import { useAccount } from 'wagmi'
+ import { useConnectModal } from '@rainbow-me/rainbowkit'
```

#### 2. Updated Hooks

```typescript
// Removed
- const { connectWallet, activeWallet, connectedWallets } = useWallet()
- const { toast } = useToast()

// Added
+ const { address: activeWallet } = useAccount()
+ const { openConnectModal } = useConnectModal()
```

#### 3. Updated Connect Wallet Handler

```typescript
const handleConnectWallet = () => {
  // Open RainbowKit wallet connection modal
  if (openConnectModal) {
    openConnectModal()
  } else {
    console.error('RainbowKit connect modal not available')
  }
}
```

#### 4. Updated Add Wallet Handler

```typescript
const handleAddWallet = () => {
  // Open RainbowKit wallet connection modal
  if (openConnectModal) {
    openConnectModal()
  } else {
    console.error('RainbowKit connect modal not available')
  }
}
```

## Why This Works

### RainbowKit Modal Flow

1. User clicks "Connect Wallet" button
2. `handleConnectWallet()` is called
3. `openConnectModal()` opens RainbowKit modal
4. User sees wallet options (MetaMask, WalletConnect, Coinbase Wallet, etc.)
5. User selects wallet and connects
6. Wallet connection is saved to user profile (if authenticated)
7. Header updates to show wallet pill

### Consistency with Guardian Header

This implementation now matches how Guardian and other pages handle wallet connections:

- ✅ Uses RainbowKit's `useConnectModal` hook
- ✅ Opens the same wallet selection modal
- ✅ No error thrown if wallet not detected
- ✅ Wallet connection persists across sessions
- ✅ Same UX as rest of the app

## Testing

### Test 1: Connect Wallet (No Wallet Installed)
1. Open app in browser without MetaMask
2. Click "Connect Wallet" in header
3. **Expected:** RainbowKit modal opens showing wallet options
4. **Expected:** No error message

### Test 2: Connect Wallet (MetaMask Installed)
1. Install MetaMask extension
2. Click "Connect Wallet" in header
3. **Expected:** RainbowKit modal opens
4. Click "MetaMask" option
5. **Expected:** MetaMask popup opens
6. Approve connection in MetaMask
7. **Expected:** Wallet connected, header shows wallet pill

### Test 3: Add Wallet (Authenticated User)
1. Sign in to the app
2. Click "Add Wallet" button
3. **Expected:** RainbowKit modal opens
4. Connect wallet
5. **Expected:** Wallet saved to user profile
6. Refresh page
7. **Expected:** Wallet still connected

### Test 4: Session State Transitions
- **S0_GUEST:** Click "Connect Wallet" → Modal opens
- **S1_ACCOUNT:** Click "Add Wallet" → Modal opens
- **S2_WALLET:** Wallet pill shows, "Save" button works
- **S3_BOTH:** Wallet pill + Profile dropdown both work

## Benefits

### User Experience
- ✅ No more confusing error messages
- ✅ Consistent wallet connection flow across app
- ✅ Same modal as Guardian and other pages
- ✅ Users see all wallet options immediately
- ✅ Better onboarding for new users

### Technical
- ✅ Simpler code (no async/await, no error handling)
- ✅ Uses standard RainbowKit patterns
- ✅ Consistent with rest of codebase
- ✅ Wallet connection persists across sessions
- ✅ Automatic wallet state management via wagmi

## Related Components

Other components using RainbowKit correctly:

- `src/pages/GuardianEnhanced.tsx`
- `src/components/home/HeroSection.tsx`
- `src/components/home/DashboardHeader.tsx`
- `src/components/wallet/ActiveWalletIndicator.tsx`
- `src/components/ux/DemoBanner.tsx`
- `src/components/guardian/AddWalletModal.tsx`

### Standard Pattern

```typescript
import { useConnectModal } from '@rainbow-me/rainbowkit'

const { openConnectModal } = useConnectModal()

const handleConnect = () => {
  if (openConnectModal) {
    openConnectModal()
  }
}
```

## Conclusion

The GlobalHeader Connect Wallet button now works correctly by using RainbowKit's `openConnectModal()` instead of WalletContext's `connectWallet()`. This provides a consistent, error-free wallet connection experience across the entire application.

---

**Status:** ✅ COMPLETE
**Date:** 2026-01-15
**Task:** Fix Connect Wallet RainbowKit Integration (Task 10)
