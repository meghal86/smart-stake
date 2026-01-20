# Hunter Live Mode (Demo OFF) - Manual Testing Guide

## Step-by-Step Testing Instructions

### Prerequisites
1. Open Chrome/Edge DevTools (F12 or Cmd+Option+I)
2. Navigate to Console tab
3. Navigate to Network tab (keep both visible)
4. Go to `http://localhost:8088/hunter`

---

## Test 1: Verify Current Mode (Demo ON)

### What to Check:

**Visual (UX):**
- [ ] Blue banner visible: "🎭 Demo Mode — Showing simulated opportunities"
- [ ] Wallet chip shows: "Demo Wallet 0xd8dA...6045" with blue background
- [ ] DEMO badge visible on wallet chip
- [ ] 5 opportunities displayed (Ethereum Staking, LayerZero, etc.)

**Console:**
```javascript
// Paste this in console:
console.log('=== DEMO MODE CHECK ===');
console.log('Demo Mode:', localStorage.getItem('alphawhale_demo_mode'));
console.log('Should be: "true" or null (defaults to true)');
```

**Network Tab:**
- [ ] NO requests to `/api/hunter/opportunities`
- [ ] NO requests to `/api/guardian/scores`
- [ ] Only static asset loads

**Expected Console Output:**
```
Demo Mode: "true"
```

---

## Test 2: Switch to Live Mode

### Action:
1. Click profile icon (top right)
2. Find "Demo Mode" toggle
3. Click to turn OFF

### What Should Happen Immediately:

**Visual (UX):**
- [ ] Blue banner DISAPPEARS completely
- [ ] Wallet chip updates to real wallet OR "No Wallet Connected"
- [ ] Loading skeleton appears briefly
- [ ] Opportunities start loading

**Console Logging:**
```javascript
// Add this to useHunterFeed.ts temporarily for debugging:
console.log('🔄 useHunterFeed called with:', {
  isDemo,
  activeWallet,
  filter: props.filter,
  useRealAPI: !props.isDemo
});
```

**Network Tab:**
- [ ] NEW request appears: `GET /api/hunter/opportunities`
- [ ] Check request URL includes query params
- [ ] Status should be 200 (or 404 if no data)

---

## Test 3: Verify Live Data Fetch

### Console Commands to Run:

```javascript
// 1. Check demo mode state
console.log('=== LIVE MODE VERIFICATION ===');
console.log('Demo Mode:', localStorage.getItem('alphawhale_demo_mode'));
console.log('Expected: "false"');

// 2. Check React Query cache
console.log('\n=== REACT QUERY STATE ===');
// This will show if data is being fetched
window.localStorage.getItem('REACT_QUERY_OFFLINE_CACHE');

// 3. Monitor fetch calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('🌐 API Call:', args[0]);
  return originalFetch.apply(this, args);
};
console.log('✅ Fetch monitoring enabled');
```

### What to Look For:

**Console Output (Expected):**
```
=== LIVE MODE VERIFICATION ===
Demo Mode: "false"
Expected: "false"

🌐 API Call: /api/hunter/opportunities?walletAddress=0x379c...&types=&trustMin=80&sort=recommended&limit=12
```

**Network Tab Details:**
```
Request URL: http://localhost:8088/api/hunter/opportunities
Request Method: GET
Status Code: 200 OK (or 404 if no data)

Query Parameters:
- walletAddress: 0x379c...72e3 (your actual wallet)
- types: (empty or filtered)
- trustMin: 80
- sort: recommended
- limit: 12
```

---

## Test 4: Verify Data Transformation

### Console Commands:

```javascript
// Check what data is being displayed
console.log('=== OPPORTUNITY DATA CHECK ===');

// Get opportunities from React component state
// (This requires React DevTools)
// Or check the DOM:
const cards = document.querySelectorAll('[class*="opportunity"]');
console.log('Number of opportunity cards:', cards.length);
console.log('Expected: > 0 if API has data, 0 if empty');

// Check for demo data indicators
const hasDemoData = document.body.innerText.includes('Ethereum 2.0 Staking');
console.log('Contains demo data:', hasDemoData);
console.log('Expected: false (should be real data)');
```

**Expected Output:**
```
=== OPPORTUNITY DATA CHECK ===
Number of opportunity cards: 12 (or however many from API)
Expected: > 0 if API has data, 0 if empty
Contains demo data: false
Expected: false (should be real data)
```

---

## Test 5: Verify Empty States

### Scenario A: No Wallet Connected

**Visual (UX):**
- [ ] Wallet chip shows: "🔌 No Wallet Connected"
- [ ] Empty state message: "Connect Your Wallet"
- [ ] "Connect Wallet" button visible

**Console:**
```javascript
console.log('=== WALLET STATE ===');
console.log('Connected Wallets:', window.__WALLET_CONTEXT__?.connectedWallets?.length || 0);
console.log('Active Wallet:', window.__WALLET_CONTEXT__?.activeWallet || 'None');
console.log('Expected: 0 wallets, activeWallet = null');
```

### Scenario B: Wallet Connected, No Opportunities

**Visual (UX):**
- [ ] Wallet chip shows real address
- [ ] Empty state message: "No Opportunities Found"
- [ ] "Explore All Opportunities" button visible

**Network Tab:**
- [ ] API call made: `GET /api/hunter/opportunities`
- [ ] Response: `{ items: [], nextCursor: null, ts: "..." }`

---

## Test 6: Verify Real-Time Updates

### Action:
Wait 60 seconds (or change `refetchInterval` to 5000ms for testing)

**Console Monitoring:**
```javascript
// Monitor refetch calls
let fetchCount = 0;
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].includes('/api/hunter/opportunities')) {
    fetchCount++;
    console.log(`🔄 Refetch #${fetchCount} at ${new Date().toLocaleTimeString()}`);
  }
  return originalFetch.apply(this, args);
};
```

**Expected:**
- [ ] New API call every 60 seconds
- [ ] Console shows: `🔄 Refetch #2 at 10:35:45 AM`

---

## Test 7: Verify Infinite Scroll

### Action:
Scroll down to bottom of page (if more than 12 opportunities)

**Visual (UX):**
- [ ] Loading indicator appears: "Loading more opportunities..."
- [ ] New opportunities load
- [ ] Smooth scroll experience

**Network Tab:**
- [ ] New request: `GET /api/hunter/opportunities?cursor=eyJ...`
- [ ] Cursor parameter included in URL

**Console:**
```javascript
// Monitor pagination
window.addEventListener('scroll', () => {
  const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
  if (scrollPercent > 70) {
    console.log('📜 Scroll threshold reached:', scrollPercent.toFixed(0) + '%');
  }
});
```

---

## Test 8: Compare Demo vs Live Data

### Console Commands:

```javascript
console.log('=== DATA COMPARISON ===');

// Demo data check
const demoTitles = [
  'Ethereum 2.0 Staking',
  'LayerZero Airdrop',
  'Uniswap V4 Beta Testing',
  'Pudgy Penguins Mint',
  'Solana Liquid Staking'
];

const pageText = document.body.innerText;
const hasDemoTitles = demoTitles.some(title => pageText.includes(title));

console.log('Contains demo titles:', hasDemoTitles);
console.log('Expected in LIVE mode: false');
console.log('Expected in DEMO mode: true');

// Check for real data indicators
const hasRealData = pageText.includes('Pendle') || 
                    pageText.includes('Blast') || 
                    pageText.includes('Real opportunity');

console.log('Contains real data indicators:', hasRealData);
console.log('Expected in LIVE mode: true (if API has data)');
console.log('Expected in DEMO mode: false');
```

---

## Test 9: Verify Error Handling

### Scenario: API Failure

**Simulate Error:**
```javascript
// Block API calls temporarily
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].includes('/api/hunter/opportunities')) {
    console.log('❌ Simulating API error');
    return Promise.reject(new Error('Network error'));
  }
  return originalFetch.apply(this, args);
};

// Now toggle demo mode OFF
console.log('Toggle demo mode OFF now to test error handling');
```

**Expected Visual (UX):**
- [ ] Error state appears
- [ ] Message: "Unable to load opportunities"
- [ ] "Retry" button visible
- [ ] "Switch to Demo Mode" option

---

## Test 10: Full Cycle Test

### Complete Flow:

```javascript
console.log('=== FULL CYCLE TEST ===');

// 1. Start in Demo Mode
console.log('Step 1: Verify Demo Mode ON');
console.log('- Banner visible:', !!document.querySelector('[class*="banner"]'));
console.log('- Demo wallet visible:', document.body.innerText.includes('Demo Wallet'));

// 2. Toggle OFF
console.log('\nStep 2: Toggle Demo Mode OFF (do this manually)');
console.log('Wait for API call...');

// 3. Monitor transition
setTimeout(() => {
  console.log('\nStep 3: Verify Live Mode');
  console.log('- Banner hidden:', !document.querySelector('[class*="banner"]'));
  console.log('- Real wallet visible:', !document.body.innerText.includes('Demo Wallet'));
  console.log('- API called:', performance.getEntriesByType('resource')
    .some(r => r.name.includes('/api/hunter/opportunities')));
}, 2000);

// 4. Toggle back ON
console.log('\nStep 4: Toggle Demo Mode ON (do this manually after 5 seconds)');

setTimeout(() => {
  console.log('\nStep 5: Verify back to Demo Mode');
  console.log('- Banner visible:', !!document.querySelector('[class*="banner"]'));
  console.log('- Demo wallet visible:', document.body.innerText.includes('Demo Wallet'));
}, 7000);
```

---

## Quick Verification Checklist

### Demo Mode OFF (Live Mode) Checklist:

**Visual Indicators:**
- [ ] ❌ No blue banner
- [ ] ✅ Real wallet address (or "No Wallet Connected")
- [ ] ✅ Loading skeleton on initial load
- [ ] ✅ Real opportunity data (not demo titles)

**Network Activity:**
- [ ] ✅ API call to `/api/hunter/opportunities`
- [ ] ✅ Query params include `walletAddress`
- [ ] ✅ Response has real data structure
- [ ] ✅ Refetch every 60 seconds

**Console Verification:**
- [ ] ✅ `localStorage.getItem('alphawhale_demo_mode')` = "false"
- [ ] ✅ Fetch calls logged to console
- [ ] ✅ No demo data titles in page text

**Functionality:**
- [ ] ✅ Infinite scroll works (if >12 items)
- [ ] ✅ Filter tabs update API query
- [ ] ✅ Empty states show correctly
- [ ] ✅ Error states handle failures

---

## Troubleshooting

### Issue: API not being called

**Check:**
```javascript
console.log('Demo mode value:', localStorage.getItem('alphawhale_demo_mode'));
// Should be "false"

// Force set to false
localStorage.setItem('alphawhale_demo_mode', 'false');
location.reload();
```

### Issue: Still showing demo data

**Check:**
```javascript
// Check if useHunterFeed is using correct flag
console.log('Check useHunterFeed props');
// Look for isDemo: false in component props
```

### Issue: API returns 404

**This is EXPECTED if:**
- No opportunities in database
- Wallet has no eligible opportunities
- API endpoint not implemented yet

**Visual should show:**
- Empty state: "No Opportunities Found"

---

## Success Criteria

✅ **Demo Mode OFF is working correctly if:**

1. Banner disappears when toggled OFF
2. Wallet chip shows real address (not demo wallet)
3. API call appears in Network tab
4. Real data loads (or empty state if no data)
5. No demo opportunity titles visible
6. Infinite scroll works
7. Real-time refetch every 60 seconds
8. Error states handle API failures

---

## Additional Debug Commands

```javascript
// Complete diagnostic
console.log('=== HUNTER LIVE MODE DIAGNOSTIC ===');
console.log('1. Demo Mode:', localStorage.getItem('alphawhale_demo_mode'));
console.log('2. Current URL:', window.location.href);
console.log('3. Banner visible:', !!document.querySelector('[class*="bg-blue-600"]'));
console.log('4. Wallet text:', document.querySelector('[class*="wallet"]')?.textContent);
console.log('5. Opportunity count:', document.querySelectorAll('[class*="opportunity"]').length);
console.log('6. API calls made:', performance.getEntriesByType('resource')
  .filter(r => r.name.includes('/api/hunter')).length);
console.log('7. Demo data present:', document.body.innerText.includes('Ethereum 2.0 Staking'));
console.log('=== END DIAGNOSTIC ===');
```

Copy and paste this into console for instant verification!
