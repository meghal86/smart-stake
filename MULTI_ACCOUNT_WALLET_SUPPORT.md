# Multi-Account Wallet Support Implementation

## Problem Solved

**User Issue**: "Can I add multiple MetaMask IDs? Right now it is only showing 1 MetaMask I can add or 1 Base account or 1 Rainbow but not multiple at a time."

**Root Cause**: The existing wallet connection system only added the first account (`accounts[0]`) from each wallet provider, preventing users from adding multiple accounts from the same wallet (e.g., MetaMask Account 1, MetaMask Account 2, etc.).

## Solution Overview

I've implemented a comprehensive multi-account wallet system that allows users to:

1. **Add multiple accounts from the same wallet provider** (MetaMask, Base, Rainbow, etc.)
2. **Select which accounts to add** from a visual interface
3. **Add watch-only wallets** by entering addresses manually
4. **Properly label accounts** (MetaMask Account 1, MetaMask Account 2, etc.)

## New Components Created

### 1. `MultiAccountSelector.tsx`
**Purpose**: Shows all available accounts from a wallet provider and lets users select which ones to add.

**Features**:
- Fetches all accounts from the wallet (not just the first one)
- Shows which accounts are already added
- Allows bulk selection and addition
- Proper labeling (MetaMask Account 1, MetaMask Account 2, etc.)
- Prevents duplicate additions

**Usage**:
```typescript
<MultiAccountSelector
  isOpen={isOpen}
  onClose={handleClose}
  walletName="MetaMask"
  onAccountsAdded={handleAccountsAdded}
/>
```

### 2. `AddWalletButton.tsx`
**Purpose**: Enhanced dropdown button that provides multiple wallet connection options.

**Features**:
- Dropdown with wallet provider options
- Separates "Connect & Sign" vs "Watch-Only" options
- Shows current wallet count
- Integrates with both MultiAccountSelector and ManualWalletInput

**Wallet Providers Supported**:
- 🦊 MetaMask (multiple accounts)
- 🔵 Base Wallet (multiple accounts)
- 🌈 Rainbow (multiple accounts)
- 🔷 Coinbase Wallet (multiple accounts)
- 🔗 WalletConnect (single connection)

### 3. `ManualWalletInput.tsx`
**Purpose**: Allows adding any wallet address for watch-only monitoring.

**Features**:
- Manual address input with validation
- Support for ENS names (.eth), Lens handles (.lens)
- Custom labeling
- Chain selection (Ethereum, Polygon, Arbitrum, Base, Optimism)
- Watch-only mode indicator

## How It Works

### Multi-Account Flow

1. **User clicks "Add Wallet"** → Dropdown opens
2. **User selects wallet provider** (e.g., MetaMask) → MultiAccountSelector opens
3. **System fetches all accounts** from the wallet using `eth_requestAccounts`
4. **User sees all available accounts** with checkboxes
5. **User selects desired accounts** → Accounts are added with proper labels
6. **System stores each account separately** in the database

### Watch-Only Flow

1. **User clicks "Manual Address"** → ManualWalletInput opens
2. **User enters wallet address** (0x..., name.eth, name.lens)
3. **User adds custom label** (optional)
4. **User selects primary chain**
5. **System adds as watch-only wallet** (no signing capability)

## Database Schema

The existing `user_wallets` table supports this perfectly:

```sql
CREATE TABLE user_wallets (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    address text NOT NULL,                    -- Each account gets its own row
    label text,                              -- "MetaMask Account 1", "MetaMask Account 2"
    chain_namespace text DEFAULT 'eip155:1', -- Primary chain
    is_primary boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    
    UNIQUE(user_id, address, chain_namespace) -- Prevents duplicates
);
```

**Key Points**:
- Each account gets its own database row
- Unique constraint prevents duplicate addresses per user/chain
- Labels distinguish between accounts from the same provider

## Integration Points

### With Existing WalletContext

The new components integrate seamlessly with the existing `WalletContext`:

```typescript
// WalletContext already supports multiple wallets
const { connectedWallets, addWallet } = useWallet();

// Each account appears as a separate wallet
connectedWallets = [
  { address: '0x123...', label: 'MetaMask Account 1' },
  { address: '0xabc...', label: 'MetaMask Account 2' },
  { address: '0x456...', label: 'Base Account 1' },
  // ...
];
```

### With useWalletRegistry

The `useWalletRegistry` hook handles the persistence:

```typescript
const { addWallet } = useWalletRegistry();

// Add each account separately
await addWallet({
  address: '0x123...',
  label: 'MetaMask Account 1',
  chain_namespace: 'eip155:1'
});

await addWallet({
  address: '0xabc...',
  label: 'MetaMask Account 2', 
  chain_namespace: 'eip155:1'
});
```

## Usage Examples

### Adding Multiple MetaMask Accounts

```typescript
// User clicks "MetaMask" in dropdown
// System calls window.ethereum.request({ method: 'eth_requestAccounts' })
// Returns: ['0x123...', '0xabc...', '0x456...']

// User sees:
// ☐ MetaMask Account 1 (0x123...)
// ☐ MetaMask Account 2 (0xabc...)  
// ☑ MetaMask Account 3 (0x456...) [Already Added]

// User selects first two accounts
// System adds both with proper labels
```

### Adding Watch-Only Wallet

```typescript
// User enters: vitalik.eth
// System validates format
// User adds label: "Vitalik's Wallet"
// System stores as watch-only wallet
```

## Testing

Use the test file to verify functionality:

```bash
# Open in browser
open test-multi-account-wallet-support.html
```

**Test Scenarios**:
1. Select MetaMask → See multiple accounts → Add selected accounts
2. Select Base Wallet → See multiple accounts → Add selected accounts  
3. Add manual address → Enter 0x address → Add as watch-only
4. Verify all wallets appear in connected wallets list
5. Verify proper labeling (MetaMask Account 1, etc.)

## Benefits

### For Users
- ✅ **Add multiple accounts** from the same wallet provider
- ✅ **Organize accounts** with clear labels
- ✅ **Watch any address** without needing to connect
- ✅ **Bulk selection** for efficiency
- ✅ **Visual feedback** on what's already added

### For Developers
- ✅ **Backward compatible** with existing wallet system
- ✅ **Reuses existing database schema** and RLS policies
- ✅ **Integrates with existing hooks** and contexts
- ✅ **Proper error handling** and duplicate prevention
- ✅ **Type-safe** with TypeScript interfaces

## File Structure

```
src/
├── components/
│   └── wallet/
│       ├── MultiAccountSelector.tsx     # Multi-account selection UI
│       ├── AddWalletButton.tsx         # Enhanced add wallet dropdown
│       └── ManualWalletInput.tsx       # Manual address input
├── hooks/
│   └── useWalletRegistry.ts            # Already supports multiple wallets
└── contexts/
    └── WalletContext.tsx               # Already supports multiple wallets
```

## Next Steps

1. **Apply the database fix** (if not already done):
   ```bash
   psql -f fix_wallet_persistence_final.sql
   ```

2. **Import the new components** in your app:
   ```typescript
   import { AddWalletButton } from '@/components/wallet/AddWalletButton';
   
   // Replace existing "Add Wallet" button with:
   <AddWalletButton />
   ```

3. **Test the functionality**:
   - Open the test file in browser
   - Try adding multiple MetaMask accounts
   - Try adding watch-only wallets
   - Verify persistence across sign-out/sign-in

## Result

Users can now add multiple accounts from the same wallet provider:
- **Multiple MetaMask accounts** ✅
- **Multiple Base accounts** ✅  
- **Multiple Rainbow accounts** ✅
- **Multiple Coinbase accounts** ✅
- **Watch-only addresses** ✅

Each account is properly labeled and stored separately, solving the original limitation.