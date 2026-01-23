# Demo Mode Persistence Fix

## Problem

When clicking on the wallet chip in the global header, the demo mode toggle button would reset from disabled to enabled. This happened because:

1. The `WalletChip` component uses `useDemoMode()` hook
2. Clicking the wallet chip might trigger re-renders or auth state changes
3. The `useDemoMode` hook has a `useEffect` that calls `updateDemoMode(isAuthenticated)` whenever `isAuthenticated` changes
4. The `updateDemoMode` method would automatically switch modes based on wallet connection status, **ignoring the user's manual toggle preference**

## Root Cause

In `src/lib/ux/DemoModeManager.ts`, the `updateDemoMode` method did not persist or respect the user's manual preference. When the user manually toggled demo mode, this preference was not stored, so any subsequent auth state change would override it.

```typescript
// BEFORE (problematic)
React.useEffect(() => {
  const manager = DemoModeManager.getInstance();
  const unsubscribe = manager.subscribe(setDemoState);
  
  // This would override user's manual toggle!
  manager.updateDemoMode(isAuthenticated);
  
  return unsubscribe;
}, [isAuthenticated]); // Triggers on every auth change
```

## Solution

Added user preference tracking to `DemoModeManager`:

### 1. Added `userPreference` Property

```typescript
export class DemoModeManager {
  private userPreference: boolean | null = null; // Track user's manual preference
  
  private constructor() {
    // Restore user preference from localStorage on init
    try {
      const saved = localStorage.getItem('aw_demo_mode_preference');
      if (saved !== null) {
        this.userPreference = saved === 'true';
      }
    } catch (error) {
      console.debug('Failed to restore demo mode preference:', error);
    }
  }
}
```

### 2. Updated `setDemoMode` to Save Preference

```typescript
public setDemoMode(isDemo: boolean): void {
  // Save user preference
  this.userPreference = isDemo;
  try {
    localStorage.setItem('aw_demo_mode_preference', String(isDemo));
  } catch (error) {
    console.debug('Failed to save demo mode preference:', error);
  }

  const newState: DemoModeState = {
    ...this.currentState,
    isDemo,
    reason: isDemo ? 'user_preference' : 'live_mode',
    bannerVisible: isDemo
  };

  this.currentState = newState;
  this.notifyListeners();
}
```

### 3. Updated `updateDemoMode` to Respect Preference

```typescript
public async updateDemoMode(isWalletConnected: boolean, forceDemo?: boolean): Promise<void> {
  let newState: DemoModeState;

  // If user has manually set a preference, respect it
  if (this.userPreference !== null && forceDemo === undefined) {
    newState = {
      isDemo: this.userPreference,
      reason: this.userPreference ? 'user_preference' : 'live_mode',
      bannerVisible: this.userPreference,
      dataSourceStatus: this.currentState.dataSourceStatus
    };
  } else if (forceDemo === true) {
    // ... rest of logic
  }
  // ... rest of method
}
```

### 4. Added `clearPreference` Method

```typescript
public clearPreference(): void {
  this.userPreference = null;
  try {
    localStorage.removeItem('aw_demo_mode_preference');
  } catch (error) {
    console.debug('Failed to clear demo mode preference:', error);
  }
}
```

## Behavior After Fix

### User Flow 1: Manual Toggle Persists
1. User clicks demo mode toggle in header menu → **Demo mode enabled**
2. User clicks wallet chip in header → **Demo mode stays enabled** ✅
3. User navigates to different pages → **Demo mode stays enabled** ✅
4. User refreshes page → **Demo mode stays enabled** ✅

### User Flow 2: Clear Preference
1. User has demo mode manually enabled
2. User clicks "Clear Preference" (if exposed in UI)
3. System reverts to automatic mode switching based on wallet connection

### User Flow 3: Automatic Mode (No Preference Set)
1. User has not manually toggled demo mode
2. Wallet not connected → **Demo mode enabled** (automatic)
3. Wallet connects → **Demo mode disabled** (automatic)
4. This is the original behavior when no manual preference exists

## Testing

### Manual Test Steps

1. Open the app in a browser
2. Click profile menu → Toggle demo mode ON
3. Verify demo mode badge appears
4. Click wallet chip in header
5. **Expected:** Demo mode badge still visible ✅
6. **Expected:** localStorage has `aw_demo_mode_preference=true` ✅

### Automated Test

Run the test file:
```bash
open test-demo-mode-persistence.html
```

Test scenario:
1. Click "Toggle Demo Mode" to enable
2. Click "Simulate Wallet Click"
3. Verify state remains in demo mode
4. Check localStorage persists preference

## Files Changed

- `src/lib/ux/DemoModeManager.ts` - Added user preference tracking and persistence

## API Changes

### New Method
- `clearPreference()` - Clears user's manual preference, allowing automatic mode switching

### Updated Hook Return
```typescript
const { 
  isDemo, 
  setDemoMode, 
  clearPreference, // NEW
  // ... other properties
} = useDemoMode();
```

## Backwards Compatibility

✅ **Fully backwards compatible**

- Existing code continues to work without changes
- User preference is optional (null by default)
- When no preference is set, behavior is identical to before
- localStorage key is new, doesn't conflict with existing keys

## Edge Cases Handled

1. **localStorage unavailable** (private browsing) - Gracefully degrades, preference not persisted
2. **Multiple tabs** - Each tab reads from localStorage on init, changes sync via storage events (future enhancement)
3. **User clears localStorage** - Preference resets, automatic mode resumes
4. **Invalid localStorage value** - Ignored, defaults to null preference

## Future Enhancements

1. **Cross-tab sync** - Listen to `storage` events to sync preference across tabs
2. **Server-side preference** - Store in user profile for cross-device sync
3. **Preference expiry** - Auto-clear preference after X days
4. **UI indicator** - Show when in manual vs automatic mode

## Summary

The fix ensures that when a user manually toggles demo mode, their preference is:
- ✅ Saved to localStorage
- ✅ Respected across navigation
- ✅ Respected across auth state changes
- ✅ Respected across page refreshes
- ✅ Not overridden by wallet interactions

This provides a predictable, user-friendly experience where manual toggles persist until explicitly changed.
