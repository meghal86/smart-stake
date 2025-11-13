# Multi-Wallet Troubleshooting Guide

## Overview

This guide helps you diagnose and resolve common issues with the Multi-Wallet feature in AlphaWhale Hunter Screen.

## Quick Diagnostics

### Health Check Checklist

Before diving into specific issues, verify these basics:

- [ ] Browser is up to date (Chrome 90+, Firefox 88+, Safari 14+)
- [ ] Wallet extension is installed and unlocked
- [ ] JavaScript is enabled
- [ ] localStorage is enabled (not in private/incognito mode)
- [ ] No ad blockers interfering with wallet connections
- [ ] Network connection is stable
- [ ] Supabase services are operational

### Browser Console

Open browser console to check for errors:
- **Chrome/Edge:** Press `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
- **Firefox:** Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
- **Safari:** Enable Developer menu, then press `Cmd+Option+C`

Look for errors related to:
- `WalletContext`
- `useWalletLabels`
- `eligibility`
- `localStorage`

## Common Issues

### 1. Wallet Not Connecting

**Symptoms:**
- "Connect Wallet" button doesn't respond
- Wallet popup doesn't appear
- Connection fails with error message

**Possible Causes:**

#### A. Wallet Extension Not Installed

**Solution:**
1. Install the wallet extension:
   - MetaMask: [metamask.io](https://metamask.io)
   - Coinbase Wallet: [wallet.coinbase.com](https://wallet.coinbase.com)
   - WalletConnect: Use mobile app
2. Refresh the page
3. Try connecting again

#### B. Wallet Extension Locked

**Solution:**
1. Click the wallet extension icon in your browser
2. Enter your password to unlock
3. Return to AlphaWhale and try again

#### C. Wrong Network

**Solution:**
1. Open your wallet extension
2. Switch to a supported network (Ethereum, Base, Arbitrum, etc.)
3. Try connecting again

#### D. Browser Extension Conflict

**Solution:**
1. Disable other wallet extensions temporarily
2. Disable ad blockers (uBlock Origin, AdBlock Plus)
3. Try connecting again
4. Re-enable extensions one by one to identify conflict

#### E. Popup Blocked

**Solution:**
1. Check for popup blocker notification in address bar
2. Allow popups for alphawhale.com
3. Try connecting again

**Debug Steps:**

```javascript
// Open browser console and run:
console.log('Ethereum provider:', window.ethereum);
console.log('Wallet providers:', {
  metamask: window.ethereum?.isMetaMask,
  coinbase: window.ethereum?.isCoinbaseWallet,
  walletconnect: window.ethereum?.isWalletConnect
});
```

Expected output: Should show wallet provider details

### 2. Wallet Selector Not Appearing

**Symptoms:**
- No wallet selector in header
- "Connect Wallet" button shows instead
- Selector disappeared after refresh

**Possible Causes:**

#### A. No Wallets Connected

**Solution:**
1. Connect at least one wallet
2. Wallet selector will appear automatically

#### B. Session Expired

**Solution:**
1. Refresh the page
2. Reconnect your wallet(s)
3. Selector should reappear

#### C. localStorage Cleared

**Solution:**
1. Check if browser cleared localStorage
2. Reconnect wallets
3. Avoid using private/incognito mode for persistent connections

**Debug Steps:**

```javascript
// Check localStorage for wallet data
console.log('Wallet labels:', localStorage.getItem('wallet_labels'));
console.log('Active wallet:', sessionStorage.getItem('active_wallet'));
```

### 3. Wallet Switching Not Working

**Symptoms:**
- Clicking wallet in dropdown doesn't switch
- Feed doesn't refresh after switch
- Eligibility doesn't update

**Possible Causes:**

#### A. Network Request Failed

**Solution:**
1. Check internet connection
2. Check browser console for network errors
3. Retry the switch
4. Refresh page if issue persists

#### B. API Rate Limit

**Solution:**
1. Wait 60 seconds
2. Try switching again
3. Reduce frequency of switches

#### C. Wallet Disconnected

**Solution:**
1. Check if wallet is still connected in extension
2. Reconnect the wallet
3. Try switching again

**Debug Steps:**

```javascript
// Check WalletContext state
// In React DevTools, find WalletContext.Provider
// Inspect state:
{
  wallets: [...],
  activeWallet: "0x...",
  isSwitching: false
}
```

### 4. Eligibility Not Showing

**Symptoms:**
- "Unknown" eligibility on all cards
- Eligibility preview missing
- Stale eligibility data

**Possible Causes:**

#### A. Wallet Not Selected

**Solution:**
1. Ensure a wallet is selected in the Wallet Selector
2. Eligibility only shows for connected wallets

#### B. Blockchain Data Unavailable

**Solution:**
1. Wait 30-60 seconds for data to load
2. Check if wallet has any on-chain activity
3. Try a different wallet with more history

#### C. Cache Expired

**Solution:**
1. Scroll down and back up to trigger refresh
2. Switch to another wallet and back
3. Refresh the page

#### D. API Error

**Solution:**
1. Check browser console for errors
2. Check network tab for failed requests
3. Report issue if persistent

**Debug Steps:**

```javascript
// Check eligibility cache
fetch('/api/eligibility/preview?wallet=0x...&opportunity_id=uuid')
  .then(r => r.json())
  .then(console.log);
```

Expected response:
```json
{
  "status": "likely",
  "score": 0.85,
  "reasons": [...]
}
```

### 5. Labels Not Saving

**Symptoms:**
- Custom labels disappear after refresh
- Edit button doesn't work
- Labels revert to default

**Possible Causes:**

#### A. localStorage Disabled

**Solution:**
1. Check if browser allows localStorage
2. Exit private/incognito mode
3. Check browser settings for site data permissions

#### B. Storage Quota Exceeded

**Solution:**
1. Clear browser cache and cookies
2. Remove unused data from localStorage
3. Try setting label again

#### C. Browser Extension Interference

**Solution:**
1. Disable privacy extensions temporarily
2. Try setting label again
3. Re-enable extensions one by one

**Debug Steps:**

```javascript
// Test localStorage
try {
  localStorage.setItem('test', 'value');
  console.log('localStorage works:', localStorage.getItem('test'));
  localStorage.removeItem('test');
} catch (e) {
  console.error('localStorage error:', e);
}

// Check wallet labels
const labels = JSON.parse(localStorage.getItem('wallet_labels') || '{}');
console.log('Current labels:', labels);
```

### 6. ENS Names Not Resolving

**Symptoms:**
- ENS name shows as "Loading..."
- Truncated address shown instead of ENS
- ENS resolution fails

**Possible Causes:**

#### A. No ENS Set

**Solution:**
1. Verify ENS is set on Ethereum mainnet
2. Check on [app.ens.domains](https://app.ens.domains)
3. Set reverse record if missing

#### B. Resolution Timeout

**Solution:**
1. Wait 1-2 minutes for resolution
2. Refresh the page
3. Set a custom label as workaround

#### C. Network Issue

**Solution:**
1. Check internet connection
2. Check if Ethereum RPC is accessible
3. Try again later

**Debug Steps:**

```javascript
// Check ENS resolution
import { resolveENS } from '@/lib/name-resolution';

resolveENS('0x...').then(console.log);
// Expected: "vitalik.eth" or null
```

### 7. Slow Performance

**Symptoms:**
- Wallet switching takes >5 seconds
- Dropdown lags when opening
- Feed refresh is slow

**Possible Causes:**

#### A. Too Many Connected Wallets

**Solution:**
1. Disconnect unused wallets
2. Keep only 3-5 active wallets
3. Performance improves with fewer wallets

#### B. Network Latency

**Solution:**
1. Check internet speed
2. Try during off-peak hours
3. Use wired connection if possible

#### C. Cache Miss

**Solution:**
1. First switch is always slower (cache warming)
2. Subsequent switches should be faster
3. Wait for cache to populate

#### D. Browser Performance

**Solution:**
1. Close unused tabs
2. Restart browser
3. Clear browser cache
4. Update browser to latest version

**Debug Steps:**

```javascript
// Measure switch performance
const start = performance.now();
// Switch wallet
const end = performance.now();
console.log('Switch duration:', end - start, 'ms');
// Target: <500ms
```

### 8. Feed Not Personalizing

**Symptoms:**
- Same opportunities for all wallets
- No ranking changes when switching
- Generic feed shown

**Possible Causes:**

#### A. Wallet Not Passed to API

**Solution:**
1. Check network tab for API requests
2. Verify `wallet` parameter is included
3. Report bug if parameter is missing

#### B. Insufficient Wallet History

**Solution:**
1. Wallet needs on-chain activity for personalization
2. Try a wallet with more transaction history
3. New wallets show generic feed

#### C. Feature Flag Disabled

**Solution:**
1. Check if personalization is enabled
2. Contact support to verify feature status

**Debug Steps:**

```javascript
// Check API request
// In Network tab, find request to /api/hunter/opportunities
// Check query parameters:
{
  wallet: "0x...",
  sort: "recommended"
}

// Check response for personalized ranking
// Items should have different order for different wallets
```

### 9. Dropdown Not Closing

**Symptoms:**
- Clicking outside doesn't close dropdown
- ESC key doesn't work
- Dropdown stuck open

**Possible Causes:**

#### A. Event Listener Issue

**Solution:**
1. Refresh the page
2. Try ESC key
3. Click the selector button again

#### B. Browser Extension Conflict

**Solution:**
1. Disable extensions temporarily
2. Try closing dropdown
3. Re-enable extensions

**Debug Steps:**

```javascript
// Check if click-outside handler is attached
// In React DevTools, find WalletSelector component
// Check props for onClose handler
```

### 10. Mobile Issues

**Symptoms:**
- Dropdown doesn't open on mobile
- Touch targets too small
- Layout broken on mobile

**Possible Causes:**

#### A. Viewport Too Small

**Solution:**
1. Rotate device to landscape
2. Zoom out if needed
3. Use tablet or desktop for better experience

#### B. Touch Event Not Registered

**Solution:**
1. Tap firmly on selector
2. Avoid swiping
3. Try different area of button

#### C. Mobile Browser Issue

**Solution:**
1. Try different mobile browser (Chrome, Safari, Firefox)
2. Update browser to latest version
3. Clear browser cache

## Advanced Debugging

### Enable Debug Mode

Add to localStorage to enable debug logging:

```javascript
localStorage.setItem('debug_multi_wallet', 'true');
```

This will log:
- Wallet connections/disconnections
- Active wallet changes
- API requests/responses
- Cache hits/misses
- Performance metrics

### Check Network Requests

1. Open DevTools Network tab
2. Filter by "hunter" or "eligibility"
3. Check request/response for each wallet switch
4. Look for:
   - Status codes (200 = success, 429 = rate limit, 500 = error)
   - Response times (should be <500ms)
   - Request parameters (wallet address included?)

### Inspect React State

1. Install React DevTools extension
2. Find `WalletContext.Provider` in component tree
3. Inspect state:
   ```javascript
   {
     wallets: [
       { address: "0x...", provider: "metamask", chainId: 1 }
     ],
     activeWallet: "0x...",
     labels: { "0x...": "Trading Wallet" },
     ensNames: { "0x...": "vitalik.eth" },
     isConnecting: false,
     isSwitching: false
   }
   ```

### Check Database

For server-side issues, check database:

```sql
-- Check eligibility cache
SELECT * FROM eligibility_cache 
WHERE wallet_address = '0x...' 
ORDER BY cached_at DESC 
LIMIT 10;

-- Check saved opportunities
SELECT * FROM saved_opportunities 
WHERE user_id = 'uuid' 
ORDER BY saved_at DESC;

-- Check analytics events
SELECT * FROM analytics_events 
WHERE event_type LIKE 'wallet_%' 
ORDER BY created_at DESC 
LIMIT 20;
```

## Error Messages

### Common Error Messages and Solutions

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Failed to connect wallet" | Wallet extension issue | Unlock wallet, refresh page |
| "Wallet not found" | Wallet disconnected | Reconnect wallet |
| "Unable to fetch eligibility" | Blockchain data unavailable | Wait and retry |
| "Rate limit exceeded" | Too many requests | Wait 60 seconds |
| "Invalid wallet address" | Malformed address | Check wallet connection |
| "Session expired" | Auth token expired | Refresh page, reconnect |
| "Network error" | Internet connection | Check connection, retry |
| "Storage quota exceeded" | localStorage full | Clear browser data |

## Performance Benchmarks

### Expected Performance

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Wallet Switch | <500ms | <1s | >2s |
| Dropdown Open | <100ms | <200ms | >500ms |
| ENS Resolution | <1s | <3s | >5s |
| Eligibility Load | <500ms | <1s | >2s |
| Feed Refresh | <1s | <2s | >3s |

### Measuring Performance

```javascript
// Add to browser console
const measurePerformance = () => {
  const metrics = {
    walletSwitch: [],
    dropdownOpen: [],
    feedRefresh: []
  };
  
  // Measure wallet switch
  const originalSetActive = window.walletContext.setActiveWallet;
  window.walletContext.setActiveWallet = (address) => {
    const start = performance.now();
    originalSetActive(address);
    const duration = performance.now() - start;
    metrics.walletSwitch.push(duration);
    console.log('Wallet switch:', duration, 'ms');
  };
  
  return metrics;
};

const metrics = measurePerformance();
```

## Reporting Issues

### Information to Include

When reporting a multi-wallet issue, include:

1. **Browser & Version:** Chrome 120, Firefox 115, etc.
2. **Operating System:** Windows 11, macOS 14, etc.
3. **Wallet Provider:** MetaMask, Coinbase Wallet, etc.
4. **Steps to Reproduce:**
   - What you did
   - What you expected
   - What actually happened
5. **Screenshots:** Visual evidence of the issue
6. **Console Errors:** Copy from browser console
7. **Network Logs:** Export HAR file if possible

### Where to Report

- **GitHub Issues:** [github.com/alphawhale/issues](https://github.com/alphawhale/issues)
- **Discord:** [discord.gg/alphawhale](https://discord.gg/alphawhale) #support channel
- **Email:** support@alphawhale.com

### Bug Report Template

```markdown
**Bug Description:**
Brief description of the issue

**Steps to Reproduce:**
1. Go to Hunter Screen
2. Connect wallet
3. Click wallet selector
4. ...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- Wallet: MetaMask 11.0
- Network: Ethereum Mainnet

**Console Errors:**
```
[Paste console errors here]
```

**Screenshots:**
[Attach screenshots]

**Additional Context:**
Any other relevant information
```

## Known Issues

### Current Known Issues

1. **ENS Resolution Slow on First Load**
   - **Status:** Known limitation
   - **Workaround:** Set custom labels
   - **ETA:** Optimization in v1.1

2. **Dropdown Flickers on Mobile Safari**
   - **Status:** Under investigation
   - **Workaround:** Use Chrome on mobile
   - **ETA:** Fix in v1.0.1

3. **Rate Limit Too Aggressive for Power Users**
   - **Status:** Being reviewed
   - **Workaround:** Wait between switches
   - **ETA:** Adjustment in v1.1

### Recently Fixed

- ✅ Labels not persisting (Fixed in v1.0.0)
- ✅ Eligibility cache not invalidating (Fixed in v1.0.0)
- ✅ Dropdown not closing on click outside (Fixed in v1.0.0)

## FAQ

**Q: Why can't I connect more than 10 wallets?**
A: This is a performance limitation. We may increase this in the future.

**Q: Why do labels disappear in incognito mode?**
A: Labels are stored in localStorage, which is cleared when incognito session ends.

**Q: Can I sync labels across devices?**
A: Not yet, but this feature is planned for v1.1.

**Q: Why is eligibility "Unknown" for my wallet?**
A: Your wallet may not have enough on-chain activity, or blockchain data is temporarily unavailable.

**Q: How often does eligibility update?**
A: Eligibility is cached for 60 minutes, then recalculated.

**Q: Can I export my wallet list?**
A: Not currently, but this feature is planned.

## Additional Resources

- [Multi-Wallet User Guide](../user-guides/multi-wallet-feature.md)
- [Multi-Wallet API Documentation](../api/multi-wallet-api.md)
- [WalletSelector Component README](../../src/components/hunter/WalletSelector.README.md)
- [WalletContext Documentation](../../src/contexts/WalletContext.tsx)
- [Hunter Screen Documentation](../user-guides/hunter-screen.md)

## Support

If you can't resolve your issue using this guide:

1. Check [Known Issues](#known-issues) section
2. Search [GitHub Issues](https://github.com/alphawhale/issues)
3. Ask in [Discord](https://discord.gg/alphawhale) #support
4. Email support@alphawhale.com with details

**Response Times:**
- Discord: Usually <1 hour during business hours
- Email: Within 24 hours
- GitHub: Within 48 hours
