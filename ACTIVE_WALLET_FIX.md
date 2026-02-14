# Active Wallet Display Fix

## Problem Analysis

The active wallet is not showing in the global header despite being properly managed in `WalletContext`. 

### Root Causes Identified:

1. **Hydration Timing**: The `hydrateFromServer()` function only runs when `hydratedForUserId` changes, which might not trigger on every page load
2. **State Persistence**: While `activeWallet` is saved to localStorage, it's not being restored immediately on component mount
3. **Conditional Rendering**: The WalletChip only shows when `connectedWallets.length > 0 || isDemo`, but wallets might not be loaded yet

### Code Flow:

```
User connects wallet via wagmi
  ↓
wagmi triggers account change event
  ↓
WalletContext listens to event and adds wallet to registry
  ↓
useWalletRegistry fetches wallets from database
  ↓
WalletContext converts registry wallets to ConnectedWallet format
  ↓
hydrateFromServer() sets activeWallet from localStorage or first wallet
  ↓
GlobalHeader renders WalletChip with activeWallet
```

## Solution

### Fix 1: Immediate localStorage Restoration

Add immediate localStorage restoration in WalletContext before hydration completes:

```typescript
// In WalletProvider, add this useEffect BEFORE hydrateFromServer
useEffect(() => {
  // Immediately restore from localStorage on mount (before server hydration)
  try {
    const savedAddress = localStorage.getItem('aw_active_address');
    const savedNetwork = localStorage.getItem('aw_active_network');
    
    if (savedAddress) {
      console.log('🔄 Restoring active wallet from localStorage:', savedAddress);
      setActiveWalletState(savedAddress);
    }
    
    if (savedNetwork && getSupportedNetworks().includes(savedNetwork)) {
      setActiveNetworkState(savedNetwork);
    }
  } catch (error) {
    console.warn('Failed to restore from localStorage:', error);
  }
}, []); // Run once on mount
```

### Fix 2: Ensure activeWallet is Set When Wallets Load

Modify the hydration logic to always set an active wallet if none exists:

```typescript
// In hydrateFromServer, after wallets are loaded
if (connectedWallets.length > 0 && !activeWallet) {
  const { address: restoredAddress, network: restoredNetwork } = restoreActiveSelection(
    connectedWallets,
    registryWallets
  );
  
  if (restoredAddress) {
    setActiveWalletState(restoredAddress);
    console.log('✅ Set active wallet from hydration:', restoredAddress);
  }
}
```

### Fix 3: Add Debug Logging to GlobalHeader

Already implemented - added debug logging to track wallet state changes.

### Fix 4: Ensure WalletChip Shows Active Wallet Even During Loading

Modify WalletChip to show cached wallet data while loading:

```typescript
// In WalletChip, add fallback for loading state
const activeWalletData = isDemo 
  ? DEMO_WALLET 
  : connectedWallets.find(w => w.address === activeWallet) 
    || (activeWallet ? { address: activeWallet, label: 'Loading...' } : null);
```

## Implementation Steps

1. ✅ Added debug logging to GlobalHeader
2. ⏳ Add immediate localStorage restoration to WalletContext
3. ⏳ Ensure activeWallet is always set when wallets load
4. ⏳ Add loading state fallback to WalletChip
5. ⏳ Test wallet connection flow
6. ⏳ Test page refresh with connected wallet
7. ⏳ Test cross-browser behavior

## Testing Checklist

- [ ] Connect wallet via MetaMask/RainbowKit
- [ ] Verify active wallet shows in header immediately
- [ ] Refresh page and verify wallet persists
- [ ] Disconnect wallet and verify chip disappears
- [ ] Connect multiple wallets and switch between them
- [ ] Test in demo mode
- [ ] Test in incognito/private browsing
- [ ] Check browser console for errors

## Expected Behavior After Fix

1. **On wallet connect**: Active wallet shows immediately in header
2. **On page refresh**: Active wallet persists from localStorage
3. **On wallet switch**: Header updates immediately
4. **In demo mode**: Demo wallet shows with blue styling
5. **No wallets**: Chip doesn't render (unless demo mode)

## Files Modified

- `src/components/header/GlobalHeader.tsx` - Added debug logging
- `src/contexts/WalletContext.tsx` - Will add immediate restoration
- `src/components/header/WalletChip.tsx` - Will add loading fallback
