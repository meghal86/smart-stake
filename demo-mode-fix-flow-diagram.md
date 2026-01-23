# Demo Mode Fix - Flow Diagram

## Before Fix (Problematic) ❌

```
User Action: Toggle Demo Mode ON
    ↓
DemoModeManager.setDemoMode(true)
    ↓
State: isDemo = true ✓
    ↓
User Action: Click Wallet Chip
    ↓
WalletChip component re-renders
    ↓
useDemoMode() hook useEffect triggers
    ↓
updateDemoMode(isAuthenticated=true) called
    ↓
Logic: "Wallet connected → Live Mode"
    ↓
State: isDemo = false ✗ (RESET!)
    ↓
User frustrated: "I just toggled it ON!"
```

## After Fix (Working) ✅

```
User Action: Toggle Demo Mode ON
    ↓
DemoModeManager.setDemoMode(true)
    ↓
userPreference = true (saved to localStorage)
    ↓
State: isDemo = true ✓
    ↓
User Action: Click Wallet Chip
    ↓
WalletChip component re-renders
    ↓
useDemoMode() hook useEffect triggers
    ↓
updateDemoMode(isAuthenticated=true) called
    ↓
Logic Check:
  ┌─────────────────────────────────┐
  │ if (userPreference !== null) {  │
  │   return userPreference;  ← YES │
  │ }                               │
  └─────────────────────────────────┘
    ↓
State: isDemo = true ✓ (PERSISTED!)
    ↓
User happy: "It stayed ON as expected!"
```

## Decision Tree

```
updateDemoMode(isWalletConnected) called
    │
    ├─ Has user preference? (userPreference !== null)
    │   │
    │   ├─ YES → Use userPreference value
    │   │         Reason: 'user_preference'
    │   │         ✅ RESPECTS USER CHOICE
    │   │
    │   └─ NO → Automatic mode
    │       │
    │       ├─ Wallet connected?
    │       │   │
    │       │   ├─ YES → Check data sources
    │       │   │         ├─ Available → Live mode
    │       │   │         └─ Unavailable → Demo mode
    │       │   │
    │       │   └─ NO → Demo mode
    │       │             Reason: 'wallet_not_connected'
    │       │
    │       └─ Result: Automatic switching based on conditions
```

## State Transitions

### With User Preference Set

```
┌─────────────────────────────────────────────┐
│  User Preference = true (Demo Mode)         │
│  ┌─────────────────────────────────────┐   │
│  │ Any trigger (wallet, auth, nav)     │   │
│  │         ↓                            │   │
│  │   Always returns: isDemo = true     │   │
│  │   Reason: 'user_preference'         │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  User Preference = false (Live Mode)        │
│  ┌─────────────────────────────────────┐   │
│  │ Any trigger (wallet, auth, nav)     │   │
│  │         ↓                            │   │
│  │   Always returns: isDemo = false    │   │
│  │   Reason: 'user_preference'         │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Without User Preference (Automatic)

```
┌─────────────────────────────────────────────┐
│  User Preference = null (Automatic)         │
│  ┌─────────────────────────────────────┐   │
│  │ Wallet disconnected                 │   │
│  │         ↓                            │   │
│  │   Returns: isDemo = true            │   │
│  │   Reason: 'wallet_not_connected'    │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ Wallet connected + data available   │   │
│  │         ↓                            │   │
│  │   Returns: isDemo = false           │   │
│  │   Reason: 'live_mode'               │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ Wallet connected + data unavailable │   │
│  │         ↓                            │   │
│  │   Returns: isDemo = true            │   │
│  │   Reason: 'data_sources_unavailable'│   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## localStorage Persistence

```
┌──────────────────────────────────────────────┐
│  Browser localStorage                        │
│  ┌────────────────────────────────────────┐ │
│  │ Key: 'aw_demo_mode_preference'         │ │
│  │ Value: 'true' | 'false' | null         │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Persists across:                            │
│  ✓ Page refreshes                            │
│  ✓ Navigation                                │
│  ✓ Auth state changes                        │
│  ✓ Wallet interactions                       │
│  ✓ Browser restarts (until cleared)          │
└──────────────────────────────────────────────┘
```

## User Journey Example

```
Timeline:
─────────────────────────────────────────────────────────────

T0: User opens app
    └─ No preference → Automatic mode
    └─ Wallet not connected → Demo mode

T1: User connects wallet
    └─ No preference → Automatic mode
    └─ Wallet connected → Live mode ✓

T2: User toggles Demo Mode ON (manual)
    └─ userPreference = true
    └─ localStorage saved
    └─ Demo mode ✓

T3: User clicks wallet chip
    └─ userPreference = true (still set)
    └─ Demo mode ✓ (PERSISTED!)

T4: User navigates to different page
    └─ userPreference = true (still set)
    └─ Demo mode ✓ (PERSISTED!)

T5: User refreshes page
    └─ userPreference restored from localStorage
    └─ Demo mode ✓ (PERSISTED!)

T6: User toggles Demo Mode OFF (manual)
    └─ userPreference = false
    └─ localStorage updated
    └─ Live mode ✓

T7: User disconnects wallet
    └─ userPreference = false (still set)
    └─ Live mode ✓ (PERSISTED!)
    └─ (Would normally force demo, but preference overrides)
```

## Summary

**Key Insight:** User manual toggles now have **highest priority** in the decision logic, ensuring predictable behavior that respects user intent.

**Before:** Automatic mode switching could override user choice
**After:** User choice always wins (until explicitly changed or cleared)
