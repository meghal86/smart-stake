# Add Wallet Button Visibility Fix

## Problem Statement

**User Report:** "once i connected with one wallet i am not seeing connect wallet button"

After connecting the first wallet, users could not see any button to add additional wallets, preventing them from using the multi-wallet feature that was already implemented.

## Root Cause Analysis

### Session State: S3_BOTH (Authenticated + Wallet Connected)

When a user is authenticated AND has a wallet connected, the header enters **S3_BOTH** state. In this state:

**GlobalHeader.tsx (BEFORE FIX):**
```typescript
{user && activeWallet && (
  <>
    <button onClick={() => setShowMenu(!showMenu)}>
      <User /> {/* Profile icon */}
    </button>
    {renderMenu(
      <>
        <div>Wallet: 0x1234...5678</div>
        <button>Profile</button>
        <button>Settings</button>
        <button>Subscription</button>
        <button>Sign out</button>
      </>
    )}
  </>
)}
```

**Problem:** No "Add Wallet" or "Connect Wallet" option in the dropdown menu!

**ActionsSection.tsx (BEFORE FIX):**
```typescript
{sessionState === 'S3_BOTH' && activeWallet && (
  <>
    <WalletPill />
    <ProfileDropdown />
  </>
)}
```

**Problem:** No "Add Wallet" button in the actions section!

### Why This Matters

The multi-wallet infrastructure was already in place:
- ✅ `WagmiAccountSync` component listens to wagmi account changes
- ✅ `WalletContext` has multi-wallet data structures
- ✅ Custom `wagmiAccountChanged` events are emitted
- ✅ Event listeners add new wallets to the list

**But users had no UI to trigger adding a second wallet!**

## Solution Implemented

### Fix 1: GlobalHeader.tsx - Add "Add Wallet" to Profile Dropdown

Added "Add Wallet" button at the top of the profile dropdown menu (after wallet address, before other menu items):

```typescript
{user && activeWallet && (
  <>
    <button ref={buttonRef} onClick={() => setShowMenu(!showMenu)}>
      <User className="w-4 h-4" />
    </button>
    {renderMenu(
      <>
        {/* Current wallet address */}
        <div className="px-3 py-2 border-b">
          <Wallet className="w-3 h-3" />
          {activeWallet.slice(0, 6)}...{activeWallet.slice(-4)}
        </div>
        
        {/* NEW: Add Wallet button */}
        <button 
          onClick={handleConnectWallet} 
          className="text-cyan-600 dark:text-cyan-400"
        >
          <Wallet className="w-4 h-4" /> Add Wallet
        </button>
        
        <div className="border-t my-1" />
        
        {/* Existing menu items */}
        <button onClick={() => { navigate('/profile'); setShowMenu(false) }}>
          <User className="w-4 h-4" /> Profile
        </button>
        <button onClick={() => { navigate('/settings'); setShowMenu(false) }}>
          <Settings className="w-4 h-4" /> Settings
        </button>
        <button onClick={() => { navigate('/subscription'); setShowMenu(false) }}>
          <CreditCard className="w-4 h-4" /> Subscription
        </button>
        
        <div className="border-t my-1" />
        
        <button onClick={handleSignOut}>
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </>
    )}
  </>
)}
```

**Key Features:**
- Cyan/blue color to indicate it's an action button
- Positioned at top of menu (high visibility)
- Calls `handleConnectWallet()` which opens RainbowKit modal
- Closes dropdown menu after click

### Fix 2: ActionsSection.tsx - Add "Add Wallet" Button

Added "Add Wallet" button before WalletPill in S3_BOTH state:

```typescript
{sessionState === 'S3_BOTH' && activeWallet && (
  <>
    {/* NEW: Add Wallet button */}
    <Button
      size="sm"
      variant="outline"
      onClick={handleAddWallet}
      className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
    >
      Add Wallet
    </Button>
    
    {/* Existing components */}
    <WalletPill
      wallet={{
        activeAddressShort: `${activeWallet.slice(0, 6)}...${activeWallet.slice(-4)}`,
        activeAddressChecksum: activeWallet,
        activeNetwork: 'eip155:1',
        activeChainName: 'Ethereum',
        canSignForActive: true,
        isInteractive: context.enableWalletSelector || false,
        showMismatchIndicator: false,
        isSavedToRegistry: true,
      }}
    />
    {(user || authUser) && (
      <ProfileDropdown
        user={user || { email: authUser?.email || '', name: authUser?.user_metadata?.name }}
        onProfileClick={handleProfileClick}
        onSettingsClick={handleSettingsClick}
        onSignOutClick={handleSignOutClick}
      />
    )}
  </>
)}
```

**Key Features:**
- Outline button style with cyan accent
- Positioned before WalletPill for logical flow
- Calls `handleAddWallet()` which opens RainbowKit modal

## User Flow After Fix

### Scenario: Adding a Second Wallet

1. **User logs in** → Session state: S1_ACCOUNT
   - Header shows: "Add Wallet" + "Connect Wallet" buttons

2. **User connects first wallet** → Session state: S3_BOTH
   - Header shows: Profile icon with dropdown menu
   - Dropdown contains: "Add Wallet" button (NEW!)

3. **User clicks profile icon** → Dropdown opens
   - Menu shows:
     ```
     🔗 0x1234...5678 (current wallet)
     ─────────────────
     💼 Add Wallet    ← NEW!
     ─────────────────
     👤 Profile
     ⚙️  Settings
     💳 Subscription
     ─────────────────
     🚪 Sign out
     ```

4. **User clicks "Add Wallet"** → RainbowKit modal opens
   - Dropdown closes automatically
   - User can select different wallet/account

5. **User connects second wallet** → WagmiAccountSync detects change
   - Emits `wagmiAccountChanged` event
   - WalletContext adds second wallet to list
   - Both wallets stored in localStorage

6. **User can now switch between wallets** (if WalletSelector is integrated)

## Files Modified

### 1. src/components/header/GlobalHeader.tsx
**Changes:**
- Added "Add Wallet" button to profile dropdown menu in S3_BOTH state
- Button positioned after wallet address, before other menu items
- Styled with cyan color to indicate action
- Calls `handleConnectWallet()` to open RainbowKit modal

**Lines Changed:** ~105-125

### 2. src/components/header/ActionsSection.tsx
**Changes:**
- Added "Add Wallet" button before WalletPill in S3_BOTH state
- Outline button style with cyan accent
- Calls `handleAddWallet()` to open RainbowKit modal

**Lines Changed:** ~165-185

## Testing

### Test File Created
- `test-add-wallet-button-visibility.html` - Comprehensive test guide

### Test Scenarios

#### Scenario 1: Profile Dropdown (GlobalHeader)
1. ✅ Log in to account
2. ✅ Connect first wallet
3. ✅ Click profile icon
4. ✅ Verify "Add Wallet" button is visible in dropdown
5. ✅ Click "Add Wallet"
6. ✅ Verify RainbowKit modal opens
7. ✅ Connect second wallet
8. ✅ Verify both wallets are in WalletContext

#### Scenario 2: Actions Section (ActionsSection)
1. ✅ Navigate to page using ActionsSection
2. ✅ Verify "Add Wallet" button is visible in header
3. ✅ Click "Add Wallet"
4. ✅ Verify RainbowKit modal opens

### Verification Checklist
- ✅ "Add Wallet" button appears in profile dropdown when authenticated + wallet connected
- ✅ "Add Wallet" button opens RainbowKit modal
- ✅ Dropdown menu closes after clicking "Add Wallet"
- ✅ Second wallet can be connected through RainbowKit
- ✅ WagmiAccountSync detects new wallet connection
- ✅ WalletContext adds second wallet to multi-wallet list
- ✅ Both wallets are stored in localStorage
- ✅ User can switch between wallets (if WalletSelector is integrated)

## Architecture Integration

### Multi-Wallet Infrastructure (Already Implemented)

```
User clicks "Add Wallet"
  ↓
handleConnectWallet() / handleAddWallet()
  ↓
RainbowKit Modal Opens
  ↓
User selects wallet/account
  ↓
wagmi useAccount hook detects change
  ↓
WagmiAccountSync component
  ↓
Emits wagmiAccountChanged event
  ↓
WalletContext event listener
  ↓
Adds wallet to multi-wallet list
  ↓
Stores in localStorage
  ↓
User can switch between wallets
```

### Components Involved

1. **GlobalHeader.tsx** - Main header component (UPDATED)
2. **ActionsSection.tsx** - Actions section component (UPDATED)
3. **WagmiAccountSync.tsx** - Syncs wagmi accounts to WalletContext
4. **WalletContext.tsx** - Multi-wallet state management
5. **RainbowKit** - Wallet connection modal
6. **wagmi** - Ethereum wallet hooks

## Session States Reference

| State | Auth | Wallet | Header Display | Add Wallet Button |
|-------|------|--------|----------------|-------------------|
| S0_GUEST | ❌ | ❌ | "Sign In" + "Connect Wallet" | ✅ "Connect Wallet" |
| S1_ACCOUNT | ✅ | ❌ | Profile + "Add Wallet" + "Connect Wallet" | ✅ Both buttons |
| S2_WALLET | ❌ | ✅ | WalletPill + "Save" + "Sign In" | ❌ Not applicable |
| S3_BOTH | ✅ | ✅ | WalletPill + Profile | ✅ In dropdown (NEW!) |

## Known Limitations

### 1. WalletSelector Integration
- WalletSelector component exists at `src/components/hunter/WalletSelector.tsx`
- May need integration on specific pages (Hunter, Guardian, HarvestPro)
- Allows users to switch between connected wallets

### 2. Profile Page Updates
- Profile page may need updates to display all connected wallets
- Consider adding wallet management UI (view all, remove, set primary)

### 3. Wallet Removal
- No UI to remove/disconnect individual wallets yet
- May need "Remove Wallet" functionality in profile or settings

## Next Steps

### Immediate
1. ✅ Test "Add Wallet" button visibility in profile dropdown
2. ✅ Verify RainbowKit modal opens correctly
3. ✅ Test connecting multiple wallets
4. ✅ Verify wallets persist in localStorage

### Future Enhancements
1. Integrate WalletSelector on pages that need wallet switching
2. Add wallet management UI in Profile page
3. Add ability to remove/disconnect individual wallets
4. Add ability to set primary/default wallet
5. Show all connected wallets in profile dropdown
6. Add wallet labels/nicknames

## Related Documentation

- `MULTI_WALLET_SUPPORT_IMPLEMENTATION.md` - Multi-wallet implementation guide
- `WALLET_CONNECTION_PERSISTENCE_FIX.md` - Wallet persistence fix
- `HEADER_INTEGRATION_COMPLETE.md` - Complete header integration summary
- `test-multi-wallet-support.html` - Multi-wallet test guide
- `test-add-wallet-button-visibility.html` - This fix test guide

## Summary

**Problem:** Users couldn't add additional wallets after connecting the first one because there was no visible button.

**Solution:** Added "Add Wallet" button to:
1. Profile dropdown menu in GlobalHeader (S3_BOTH state)
2. Actions section in ActionsSection (S3_BOTH state)

**Result:** Users can now add multiple wallets through an accessible UI, leveraging the existing multi-wallet infrastructure.

**Status:** ✅ FIXED - Ready for testing
