# Hunter Live Mode Verification

## Overview
This document verifies that when demo mode is disabled, the Hunter feature works with live data and live wallet connections.

## Demo Mode Logic

### Automatic Demo Mode Determination
The `useDemoMode()` hook automatically determines if the app should be in demo or live mode based on:

1. **Wallet Connection**: Is a wallet connected?
2. **Data Source Availability**: Are the APIs responding?

```typescript
// From DemoModeManager.ts
if (!isWalletConnected) {
  // Demo mode - wallet not connected
  isDemo = true;
  reason = 'wallet_not_connected';
} else {
  // Check data sources
  const dataSourceStatus = await validateDataSources();
  
  if (dataSourceStatus.overall) {
    // Live mode - all prerequisites met
    isDemo = false;
    reason = 'live_mode';
  } else {
    // Demo mode - data sources unavailable
    isDemo = true;
    reason = 'data_sources_unavailable';
  }
}
```

## Hunter Live Mode Flow

### 1. Demo Mode Detection (Hunter.tsx)
```typescript
// Use centralized demo mode management
const { isDemo } = useDemoMode();

// Wallet connection status
const { connectedWallets, activeWallet } = useWallet();
const isConnected = connectedWallets.length > 0 && !!activeWallet;

// Pass isDemo to useHunterFeed
const { opportunities, isLoading, ... } = useHunterFeed({
  filter: activeFilter,
  isDemo,  // ← Automatically false when wallet connected + APIs available
  copilotEnabled: false,
  realTimeEnabled,
  sort: 'recommended',
});
```

### 2. Data Fetching (useHunterFeed.ts)
```typescript
export function useHunterFeed(props: UseHunterFeedProps) {
  const { activeWallet, activeNetwork } = useWallet();
  
  // Use demo mode or real API
  const useRealAPI = !props.isDemo;  // ← When isDemo=false, useRealAPI=true
  
  const { data, isLoading, ... } = useInfiniteQuery({
    queryKey: hunterKeys.feed(activeWallet, activeNetwork),
    queryFn: async ({ pageParam }) => {
      if (!useRealAPI) {
        // Demo mode - return mock data
        return { items: mockOpportunities, nextCursor: null };
      }
      
      // ✅ LIVE MODE - Real API call with wallet address
      const result = await getFeedPage({
        ...queryParams,
        cursor: pageParam,
        walletAddress: activeWallet ?? undefined,  // ← Uses connected wallet
      });
      
      return {
        items: result.items,
        nextCursor: result.nextCursor,
        snapshotTs: result.snapshotTs,
      };
    },
    // ... other config
  });
  
  return { opportunities, isLoading, ... };
}
```

### 3. API Call (getFeedPage)
When `useRealAPI = true`, the hook calls:
```typescript
GET /api/hunter/opportunities?walletAddress=0x...&types=...&sort=recommended
```

This endpoint:
- Queries the database for real opportunities
- Uses the `mv_opportunity_rank` materialized view for ranking
- Personalizes results based on the connected wallet address
- Returns live blockchain data

## Verification Checklist

### ✅ When Demo Mode is DISABLED (Live Mode)

**Prerequisites:**
- [ ] Wallet is connected (MetaMask, WalletConnect, etc.)
- [ ] APIs are responding (gas oracle, core API, module APIs)
- [ ] `isDemo = false` in console logs

**Expected Behavior:**

1. **No Demo Banner**
   - [ ] Demo mode banner is NOT visible at top of page
   - [ ] Console shows: `isDemo: false`

2. **Live Data Fetching**
   - [ ] Console shows: `🌐 Live Mode: Fetching from API`
   - [ ] API endpoint called: `/api/hunter/opportunities`
   - [ ] Query includes `walletAddress` parameter
   - [ ] Console shows: `✅ API Response: { itemCount: X, hasMore: Y }`

3. **Wallet Integration**
   - [ ] Active wallet address is passed to API
   - [ ] Opportunities are personalized for connected wallet
   - [ ] Wallet balance is used for eligibility checks
   - [ ] Network-specific opportunities shown

4. **Real-Time Updates**
   - [ ] Data refreshes every 60 seconds (if `realTimeEnabled = true`)
   - [ ] Pull-to-refresh fetches new data from API
   - [ ] Infinite scroll loads more pages from API

5. **Opportunity Cards**
   - [ ] Display real opportunity data from database
   - [ ] Show actual reward amounts (not mock data)
   - [ ] Display real confidence scores
   - [ ] Show actual Guardian scores
   - [ ] Display real duration/time left

6. **Join Quest Button**
   - [ ] Opens modal with real opportunity details
   - [ ] Uses connected wallet for transaction
   - [ ] Shows actual gas estimates
   - [ ] Executes real blockchain transactions

### ✅ When Demo Mode is ENABLED

**Prerequisites:**
- [ ] Wallet is NOT connected OR APIs are unavailable
- [ ] `isDemo = true` in console logs

**Expected Behavior:**

1. **Demo Banner Visible**
   - [ ] Blue banner at top: "Demo Mode — Showing simulated opportunities"
   - [ ] Console shows: `isDemo: true`

2. **Mock Data**
   - [ ] Console shows: `📦 Demo Mode: Returning mock data (5 opportunities)`
   - [ ] Shows 5 hardcoded opportunities
   - [ ] No API calls made

## Manual Testing Steps

### Test 1: Verify Live Mode with Connected Wallet

1. **Connect Wallet**
   ```
   - Click "Connect Wallet" in header
   - Select MetaMask/WalletConnect
   - Approve connection
   ```

2. **Navigate to Hunter**
   ```
   - Go to /hunter route
   - Wait for page to load
   ```

3. **Check Console Logs**
   ```javascript
   // Should see:
   🎭 Hunter Page State: {
     isDemo: false,  // ← Should be false
     isConnected: true,
     activeWallet: "0x...",
     connectedWalletsCount: 1
   }
   
   🌐 Live Mode: Fetching from API {
     endpoint: '/api/hunter/opportunities',
     params: { walletAddress: "0x..." }
   }
   
   ✅ API Response: {
     itemCount: 12,
     hasMore: true
   }
   ```

4. **Verify UI**
   - [ ] No demo banner visible
   - [ ] Opportunity cards show real data
   - [ ] Rewards are not mock values
   - [ ] Can interact with opportunities

### Test 2: Verify Demo Mode without Wallet

1. **Disconnect Wallet**
   ```
   - Click profile dropdown
   - Click "Disconnect"
   ```

2. **Navigate to Hunter**
   ```
   - Go to /hunter route
   - Wait for page to load
   ```

3. **Check Console Logs**
   ```javascript
   // Should see:
   🎭 Hunter Page State: {
     isDemo: true,  // ← Should be true
     isConnected: false,
     activeWallet: null,
     connectedWalletsCount: 0
   }
   
   📦 Demo Mode: Returning mock data (5 opportunities)
   ```

4. **Verify UI**
   - [ ] Demo banner visible: "Demo Mode — Showing simulated opportunities"
   - [ ] Shows 5 mock opportunities
   - [ ] No API calls in Network tab

### Test 3: Verify Demo → Live Transition

1. **Start in Demo Mode**
   ```
   - Load /hunter without wallet connected
   - Verify demo banner is visible
   ```

2. **Connect Wallet**
   ```
   - Click "Connect Wallet"
   - Approve connection
   ```

3. **Verify Automatic Switch**
   ```javascript
   // Console should show:
   🎭 Hunter Page State: { isDemo: false, isConnected: true }
   🌐 Live Mode: Fetching from API
   ```

4. **Verify UI Updates**
   - [ ] Demo banner disappears
   - [ ] Opportunities refresh with live data
   - [ ] Loading state shows briefly
   - [ ] Real data appears

## Debug Commands

### Check Current Demo Mode State
```javascript
// In browser console
const manager = window.demoModeManager || require('@/lib/ux/DemoModeManager').demoModeManager;
console.log(manager.getCurrentState());
```

### Force Demo Mode (for testing)
```javascript
// In browser console
const manager = window.demoModeManager || require('@/lib/ux/DemoModeManager').demoModeManager;
manager.setDemoMode(true);  // Force demo mode
manager.setDemoMode(false); // Force live mode
```

### Check Data Source Status
```javascript
// In browser console
const manager = window.demoModeManager || require('@/lib/ux/DemoModeManager').demoModeManager;
manager.validateDataSources().then(status => console.log(status));
```

## API Endpoints Used in Live Mode

### Hunter Opportunities
```
GET /api/hunter/opportunities
Query Params:
  - walletAddress: string (connected wallet)
  - types: string[] (filter by type)
  - sort: 'recommended' | 'newest' | 'ending_soon'
  - cursor: string (pagination)
  - limit: number (default: 12)
```

### Response Format
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "airdrop",
      "title": "LayerZero Airdrop",
      "description": "...",
      "reward": { "min": 500, "max": 2000, "currency": "USD" },
      "trust": { "score": 78, "level": "amber" },
      "chains": ["ethereum", "arbitrum"],
      "protocol": { "name": "LayerZero" },
      "apr": null,
      "time_left_sec": 604800,
      "difficulty": "medium"
    }
  ],
  "nextCursor": "cursor_string",
  "snapshotTs": 1234567890
}
```

## Common Issues

### Issue 1: Stuck in Demo Mode with Wallet Connected
**Symptoms:** Demo banner visible even with wallet connected

**Diagnosis:**
```javascript
// Check data source status
const manager = window.demoModeManager;
const status = await manager.validateDataSources();
console.log(status);
```

**Possible Causes:**
- APIs are not responding (check Network tab)
- Gas oracle is down
- Database is not accessible
- CORS issues

**Solution:**
- Check API health: `GET /api/health`
- Verify environment variables are set
- Check Supabase connection
- Restart development server

### Issue 2: API Returns Empty Array
**Symptoms:** Live mode active but no opportunities shown

**Diagnosis:**
```javascript
// Check API response
fetch('/api/hunter/opportunities?walletAddress=0x...')
  .then(r => r.json())
  .then(console.log);
```

**Possible Causes:**
- Database has no opportunities
- RLS policies blocking access
- Wallet address not in correct format

**Solution:**
- Seed database with test data
- Check RLS policies in Supabase
- Verify wallet address format

## Summary

✅ **When demo mode is DISABLED:**
- Hunter uses **live API calls** to `/api/hunter/opportunities`
- Passes **connected wallet address** for personalization
- Fetches **real opportunities** from database
- Uses **actual blockchain data** for rewards and eligibility
- Enables **real transactions** via connected wallet

✅ **The system automatically switches** between demo and live mode based on:
- Wallet connection status
- API availability
- Data source health

✅ **No manual configuration needed** - the `useDemoMode()` hook handles everything automatically.
