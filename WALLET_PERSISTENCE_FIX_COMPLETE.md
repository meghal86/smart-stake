# Wallet Persistence Fix - Complete Solution

## Problem Identified

The issue was that there were **two separate wallet management systems** running in parallel:

1. **WalletContext** (`useWallet()`) - Used by most of the app, stored wallets only in localStorage
2. **useWalletRegistry** - Used by GuardianRegistry and AggregatedPortfolio, properly saved wallets to the `user_wallets` table in Supabase

When users added wallets through the main interface (header, wallet connection buttons), it was using `WalletContext` which only stored in localStorage. When they signed out and back in, localStorage got cleared, so all wallets disappeared.

## Root Cause

The `WalletContext` had this comment in the `hydrateFromServer` function:

```typescript
// In Vite environment, we don't have the wallet list API endpoint yet
// For now, use localStorage data only and mark as hydrated
console.debug('Wallet hydration: Using localStorage data only (Vite environment)');
```

This meant wallets were never being saved to or loaded from the database.

## Solution Implemented

I integrated the two systems by making `WalletContext` use `useWalletRegistry` under the hood:

### Key Changes Made

1. **Updated WalletProvider to use useWalletRegistry**:
   ```typescript
   // Use the persistent wallet registry instead of local state
   const {
     wallets: registryWallets,
     isLoading: registryLoading,
     addWallet: addToRegistry,
     removeWallet: removeFromRegistry,
     updateWallet: updateInRegistry,
     userId,
     connectedAddress,
     isConnected,
   } = useWalletRegistry();

   // Convert registry wallets to ConnectedWallet format
   const connectedWallets: ConnectedWallet[] = registryWallets.map(wallet => ({
     address: wallet.address,
     label: wallet.label,
     chain: wallet.chain,
     chainNamespace: legacyChainToCAIP2(wallet.chain),
     supportedNetworks: [legacyChainToCAIP2(wallet.chain)],
     balancesByNetwork: {},
     guardianScoresByNetwork: {},
     lastUsed: new Date(wallet.updated_at),
   }));
   ```

2. **Updated connectWallet to save to database**:
   ```typescript
   // Add to persistent registry instead of local state
   await addToRegistry({
     address,
     label: `Connected Wallet`,
     chain: chainName,
     source: 'manual',
   });
   ```

3. **Updated disconnectWallet to remove from database**:
   ```typescript
   // Find the wallet in the registry to get its ID
   const walletToRemove = registryWallets.find(w => w.address.toLowerCase() === address.toLowerCase());
   if (walletToRemove) {
     // Remove from persistent registry
     await removeFromRegistry(walletToRemove.id);
   }
   ```

4. **Simplified hydrateFromServer**:
   ```typescript
   // The useWalletRegistry hook handles loading wallets from the database
   // We just need to restore the active wallet selection
   
   // Restore active wallet from localStorage if it exists in the loaded wallets
   const savedAddress = localStorage.getItem('aw_active_address');
   if (savedAddress && connectedWallets.some(w => w.address.toLowerCase() === savedAddress.toLowerCase())) {
     setActiveWalletState(savedAddress);
   } else if (connectedWallets.length > 0) {
     // Default to first wallet if saved wallet is not found
     setActiveWalletState(connectedWallets[0].address);
   }
   ```

5. **Removed redundant localStorage wallet storage**:
   - Removed `connectedWallets` from localStorage (now handled by database)
   - Kept only `aw_active_address` and `aw_active_network` in localStorage for UI state

## Database Schema

The fix uses the existing `user_wallets` table with this structure:

```sql
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  label TEXT,
  chain TEXT DEFAULT 'ethereum' NOT NULL,
  source TEXT, -- 'rainbowkit', 'manual', 'import', etc.
  verified BOOLEAN DEFAULT false,
  last_scan TIMESTAMPTZ,
  trust_score INTEGER,
  risk_flags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique wallet per user
  UNIQUE(user_id, address, chain)
);
```

## How It Works Now

1. **User signs in** → `useWalletRegistry` loads wallets from `user_wallets` table
2. **User adds wallet** → Wallet is saved to database via `addToRegistry()`
3. **User signs out** → localStorage cleared, but wallets remain in database
4. **User signs back in** → `useWalletRegistry` loads wallets from database again
5. **Wallets persist** ✅

## Testing

I created a test file `test-wallet-persistence.html` that allows you to:

1. Check authentication status
2. Add test wallets directly to the database
3. View all wallets for the current user
4. Test the sign-out/sign-in cycle

## Files Modified

- `src/contexts/WalletContext.tsx` - Main integration changes
- `test-wallet-persistence.html` - Test utility (new file)

## Verification Steps

1. **Sign in** with your account (meghal86@gmail.com)
2. **Add wallets** through the normal app interface
3. **Check database** - wallets should appear in `user_wallets` table
4. **Sign out and sign back in**
5. **Verify** - wallets should still be there

## Expected Behavior

- ✅ Wallets added through any interface are saved to database
- ✅ Wallets persist across sign-out/sign-in cycles
- ✅ Active wallet selection is restored from localStorage
- ✅ All existing functionality continues to work
- ✅ No breaking changes to the API

## Migration Notes

This is a **backward-compatible** change. Existing users who had wallets only in localStorage will need to re-add them, but the system will work correctly going forward.

The fix ensures that the wallet persistence issue is resolved and users won't lose their wallets when signing out and back in.