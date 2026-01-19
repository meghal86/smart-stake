# Wallet Balance Debug Guide

## Issue Identified

**Problem:** Wallet balances showing deterministic/fallback values like `$5.5K • 1.7000 ETH` instead of real blockchain data.

**Root Cause:** The Etherscan API calls are likely failing and falling back to deterministic mock data based on address hash.

## Debugging Tools Created

### 1. Updated EthBalanceProvider
**File:** `src/services/EthBalanceProvider_Etherscan.ts`

**Changes:**
- Removed invalid API key `YourApiKeyToken`
- Added proper error handling and logging
- Uses Etherscan API without API key (limited requests allowed)
- Enhanced debugging output

### 2. Enhanced useWalletBalances Hook
**File:** `src/hooks/useWalletBalances.ts`

**Changes:**
- Added comprehensive console logging
- Better error handling and debugging
- Enhanced ETH price fetching with logging

### 3. Debug Test Page
**File:** `test-live-balance-debug.html`

**Features:**
- Test Etherscan API directly
- Test CoinGecko API for ETH prices
- Test full balance fetching flow
- Test known addresses with expected balances
- Real-time debugging in browser

### 4. React Debug Component
**File:** `src/components/debug/BalanceDebugger.tsx`

**Features:**
- Shows only in development mode
- Tests API calls directly from React
- Compares direct API calls vs balance provider
- Visual debugging interface

## How to Debug

### Step 1: Open Browser Console
1. Go to Wallet Settings page (`/settings/wallets`)
2. Open browser DevTools (F12)
3. Check Console tab for debug messages

**Expected Console Output:**
```
Fetching ETH price from CoinGecko...
ETH price fetched: 3456.78
Fetching balance for address: 0x1234...
Etherscan API response for 0x1234... {status: "1", result: "1234567890123456789"}
Balance fetched: {address: "0x1234...", balance: 1.2345, ethPrice: 3456.78, usdValue: 4267.89}
```

### Step 2: Use Debug Test Page
1. Open `test-live-balance-debug.html` in browser
2. Enter your wallet address
3. Click "Test Full Flow" button
4. Check results for API failures

### Step 3: Use React Debug Component
1. In development mode, debug component appears on Wallet Settings page
2. Click "Run Debug Test" button
3. Compare direct API calls vs balance provider results

## Common Issues & Solutions

### Issue 1: CORS Errors
**Symptoms:** Console shows CORS policy errors
**Solution:** APIs should work from browser, but may need proxy in production

### Issue 2: Rate Limiting
**Symptoms:** Etherscan returns error about rate limits
**Solution:** Add delays between requests or get API key

### Issue 3: Invalid Addresses
**Symptoms:** Etherscan returns "Invalid address format"
**Solution:** Ensure addresses are valid Ethereum addresses (0x + 40 hex chars)

### Issue 4: Network Errors
**Symptoms:** Fetch fails with network errors
**Solution:** Check internet connection and API availability

## Expected vs Actual Behavior

### ❌ Current (Wrong)
```
MetaMask • $5.5K • 1.7000 ETH
```
This shows deterministic fallback data based on address hash.

### ✅ Expected (Correct)
```
MetaMask • $4,267.89 • 1.2345 ETH
```
This shows real blockchain balance converted to current USD.

## API Endpoints Used

### Etherscan API (Balance)
```
GET https://api.etherscan.io/api?module=account&action=balance&address={ADDRESS}&tag=latest
```

**Response:**
```json
{
  "status": "1",
  "message": "OK",
  "result": "1234567890123456789"
}
```

### CoinGecko API (Price)
```
GET https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd
```

**Response:**
```json
{
  "ethereum": {
    "usd": 3456.78
  }
}
```

## Debugging Checklist

- [ ] Check browser console for error messages
- [ ] Verify wallet addresses are valid Ethereum addresses
- [ ] Test API endpoints directly using debug page
- [ ] Check network connectivity
- [ ] Verify no CORS issues
- [ ] Check if APIs are returning expected data format
- [ ] Compare direct API calls vs balance provider results

## Next Steps

1. **Run Debug Tests**: Use the debugging tools to identify the exact failure point
2. **Check Console Logs**: Look for specific error messages
3. **Test Known Addresses**: Use addresses with known balances (like Vitalik's)
4. **Fix Root Cause**: Based on debug results, fix the specific issue

## Files to Check

1. **`src/services/EthBalanceProvider_Etherscan.ts`** - Balance fetching service
2. **`src/hooks/useWalletBalances.ts`** - React hook for balances
3. **`src/pages/WalletSettings.tsx`** - UI component using balances
4. **Browser Console** - Real-time debugging output

---

**Debug Date:** January 19, 2025
**Issue:** Fallback balance data instead of real blockchain data
**Tools:** Enhanced logging, debug components, test pages