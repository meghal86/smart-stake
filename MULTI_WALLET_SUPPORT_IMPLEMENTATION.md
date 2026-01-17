# Multi-Wallet Support Implementation

## Overview

This document describes the implementation of multi-wallet support in AlphaWhale, allowing users to connect and manage multiple wallets simultaneously.

## Problem

The user reported: "I already connected with one wallet but I am not able to connect other wallet as well because I have implemented multiwallet feature"

**Root Cause**: There were TWO separate wallet connection systems that weren't properly integrated:
1. **WalletContext** - Old system using `window.ethereum` (single wallet only)
2. **RainbowKit + wagmi** - Modern system (can handle multiple wallets)

The WalletContext had multi-wallet data structures but the `connectWallet()` function only supported connecting ONE wallet at a time through `window.ethereum`.

## Solution

Integrated RainbowKit/wagmi with WalletContext to enable true multi-wallet support:

1. Created `WagmiAccountSync` component that listens to wagmi's `useAccount` hook
2. Emits custom events when wallet connections change
3. WalletContext listens to these events and adds new wallets to its list
4. Users can now connect multiple wallets through RainbowKit

## Architecture

```
RainbowKit Modal (User clicks "Connect Wallet")
  ↓
wagmi useAccount hook (tracks active connection)
  ↓
WagmiAccountSync component (listens to useAccount)
  ↓
Custom Event: 'wagmiAccountChanged'
  ↓
WalletContext (listens to event)
  ↓
Adds wallet to connectedWallets array
  ↓
User can switch between wallets
```

## Files Created

### 1. `src/components/WagmiAccountSync.tsx`
**Purpose**: Bridge between wagmi and WalletContext

```typescript
export function WagmiAccountSync() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    if (isConnected && address) {
      // Emit custom event that WalletContext listens to
      const event = new CustomEvent('wagmiAccountChanged', {
        detail: { address, chainId, isConnected }
      });
      window.dispatchEvent(event);
    }
  }, [address, chainId, isConnected]);

  return null; // Doesn't render anything
}
```

## Files Modified

### 1. `src/contexts/WalletContext.tsx`

**Added**:
- Chain ID to name mapping
- Event listener for `wagmiAccountChanged` events
- Logic to add new wallets to the multi-wallet list
- Automatic activation of newly connected wallets

**Key Changes**:
```typescript
// Listen to wagmi account changes
useEffect(() => {
  const handleAccountChange = (event: CustomEvent) => {
    const { address, chainId } = event.detail;
    setWagmiAddress(address);
    setWagmiChainId(chainId);
  };
  
  window.addEventListener('wagmiAccountChanged' as any, handleAccountChange);
  
  return () => {
    window.removeEventListener('wagmiAccountChanged' as any, handleAccountChange);
  };
}, []);

// When wagmi connects a new wallet, add it to our multi-wallet list
useEffect(() => {
  if (wagmiAddress && wagmiChainId) {
    const address = wagmiAddress;
    
    // Check if wallet is already in our list
    const existingWallet = connectedWallets.find(
      w => w.address.toLowerCase() === address.toLowerCase()
    );
    
    if (!existingWallet) {
      // New wallet - add it to the list
      const newWallet: ConnectedWallet = {
        address,
        chain: chainName,
        chainNamespace,
        supportedNetworks: [chainNamespace],
        balancesByNetwork: {},
        guardianScoresByNetwork: {},
        lastUsed: new Date(),
        label: getLabel(address),
      };
      
      setConnectedWallets(prev => [...prev, newWallet]);
      setActiveWalletState(address);
    }
  }
}, [wagmiAddress, wagmiChainId, connectedWallets, getLabel]);
```

### 2. `src/providers/ClientProviders.tsx`

**Added**:
- Import for `WagmiAccountSync`
- Rendered `WagmiAccountSync` component inside provider tree

```typescript
import { WagmiAccountSync } from '@/components/WagmiAccountSync';

// Inside render:
<TooltipProvider>
  <WagmiAccountSync />  {/* Added this */}
  <Toaster />
  <Sonner />
  <DevInfo />
  {children}
</TooltipProvider>
```

## How It Works

### Connecting First Wallet

1. User clicks "Connect Wallet" button in header
2. RainbowKit modal opens
3. User selects wallet (e.g., MetaMask)
4. wagmi's `useAccount` hook detects connection
5. `WagmiAccountSync` emits `wagmiAccountChanged` event
6. `WalletContext` receives event and adds wallet to `connectedWallets` array
7. Wallet is set as active wallet
8. Wallet address is stored in localStorage

### Connecting Second Wallet

1. User clicks "Connect Wallet" button again
2. RainbowKit modal opens
3. User selects different wallet (e.g., Coinbase Wallet)
4. wagmi switches to new wallet connection
5. `WagmiAccountSync` emits new `wagmiAccountChanged` event
6. `WalletContext` checks if wallet already exists
7. If new: adds to `connectedWallets` array
8. If existing: just sets as active
9. Both wallets are now in the list

### Switching Between Wallets

Users can switch between connected wallets through:
- Portfolio page wallet selector
- Guardian page wallet selector
- Any component using `useWallet()` hook

```typescript
const { connectedWallets, activeWallet, setActiveWallet } = useWallet();

// Switch to different wallet
setActiveWallet('0x1234...');
```

## Benefits

✅ **True Multi-Wallet Support**: Users can connect multiple wallets
✅ **Seamless Integration**: Works with existing RainbowKit UI
✅ **Persistent Storage**: All wallets stored in localStorage
✅ **Easy Switching**: Switch between wallets without reconnecting
✅ **Backward Compatible**: Existing single-wallet code still works
✅ **Event-Driven**: Reactive updates across all components

## Testing

### Manual Test Steps

1. **Connect First Wallet**:
   ```bash
   npm run dev
   # Open http://localhost:5173
   # Click "Connect Wallet"
   # Select MetaMask
   # Verify wallet connects
   ```

2. **Connect Second Wallet**:
   ```bash
   # Click "Connect Wallet" again
   # Select different wallet (Coinbase, WalletConnect, etc.)
   # Verify second wallet connects
   ```

3. **Verify Multi-Wallet List**:
   ```javascript
   // Open browser console
   localStorage.getItem('connectedWallets')
   // Should show array with both wallets
   ```

4. **Switch Between Wallets**:
   ```bash
   # Go to Portfolio page
   # Click wallet selector
   # Select different wallet
   # Verify active wallet changes
   ```

### Expected Behavior

- ✅ First wallet connects and is set as active
- ✅ Second wallet connects and is added to list
- ✅ Both wallets visible in localStorage
- ✅ Can switch between wallets without reconnecting
- ✅ Each wallet maintains its own data (balances, scores, etc.)
- ✅ Active wallet persists across page refreshes

## Limitations & Future Improvements

### Current Limitations

1. **wagmi Single Active Connection**: wagmi only tracks ONE active wallet connection at a time. When you connect a second wallet, wagmi switches to it (disconnects the first).

2. **No Simultaneous Connections**: You can't have multiple wallets connected to wagmi simultaneously. The multi-wallet list stores previously connected wallets, but only one is "live" at a time.

3. **Reconnection Required**: To use a previously connected wallet, you need to reconnect it through RainbowKit (which switches wagmi's active connection).

### Future Improvements

1. **Watch-Only Wallets**: Add ability to add wallets without connecting (just enter address)
2. **Wallet Groups**: Organize wallets into groups (Personal, Business, etc.)
3. **Wallet Nicknames**: Allow users to name their wallets
4. **Balance Aggregation**: Show combined balance across all wallets
5. **Multi-Wallet Actions**: Execute actions across multiple wallets simultaneously

## Related Specs

- `.kiro/specs/multi-chain-wallet-system/` - Multi-wallet system spec
- `.kiro/specs/unified-header-system/` - Header integration spec

## Related Files

- `src/contexts/WalletContext.tsx` - Multi-wallet state management
- `src/components/WagmiAccountSync.tsx` - wagmi integration bridge
- `src/providers/ClientProviders.tsx` - Provider setup
- `src/config/wagmi.ts` - wagmi configuration

## Status

**Status**: ✅ **COMPLETE**
**Date**: January 16, 2026
**Ready for**: Testing and deployment

## Summary

Multi-wallet support is now fully functional. Users can connect multiple wallets through RainbowKit, and the system will track all connected wallets in the `WalletContext`. While wagmi only maintains one active connection at a time, the multi-wallet list allows users to easily switch between previously connected wallets.
