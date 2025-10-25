# 🧪 Guardian Testing Guide — Three Access Modes

## Quick Start Testing

### Prerequisites:
```bash
npm run dev
# Navigate to: http://localhost:8080/guardian
```

---

## 🦊 **Test 1: Wallet Connection (Full Features)**

### Steps:
1. Open Guardian at `/guardian`
2. Click **"🦊 Connect Wallet"** (primary green button)
3. Select wallet:
   - **MetaMask** (if installed)
   - **Coinbase Wallet** (if installed)
   - **WalletConnect** (scan QR with mobile wallet)

### Expected Behavior:
✅ RainbowKit modal appears with wallet options  
✅ After connection approval, modal closes  
✅ Scanning animation plays for ~3 seconds  
✅ Results screen shows **"🔒 Wallet Connected"** badge (green)  
✅ Trust Score displays (e.g., 87%)  
✅ "Fix Risks" button is **enabled** and clickable  
✅ Address displays in top badge (if UI shows it)  

### Test Variations:
- **Switch Theme:** Toggle light/dark mode during scan
- **Disconnect:** Use wallet extension to disconnect mid-scan
- **Rescan:** Click "Scan Again" button

---

## 🔍 **Test 2: Manual Address Input (Read-Only)**

### Steps:
1. Open Guardian at `/guardian`
2. Click **"🔍 Scan Any Address"** (outline button)
3. Input field appears with placeholder `0x...`
4. Paste a valid Ethereum address:
   ```
   0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
   ```
5. Click **"Scan Address"**

### Expected Behavior:
✅ Input field appears when button clicked  
✅ "Scan Address" button is **disabled** until valid address entered  
✅ Green focus ring appears on input focus  
✅ After clicking "Scan Address", scanning animation plays  
✅ Results screen shows **"👁️ Read-Only Scan"** badge (blue)  
✅ Trust Score displays  
✅ "Fix Risks" button is **disabled** with tooltip "Connect wallet to fix risks"  

### Test Variations:
- **Invalid Address:** Try `0x123` (should keep button disabled)
- **Cancel:** Click Cancel to close input form
- **Multiple Addresses:** Scan different addresses back-to-back

### Test Addresses:
```
Vitalik: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
Uniswap Router: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
USDC Contract: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
Random Wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

---

## ✨ **Test 3: Demo Mode (Instant Preview)**

### Steps:
1. Open Guardian at `/guardian`
2. Click **"✨ Try Demo Mode"** (outline button)
3. Wait for auto-scan

### Expected Behavior:
✅ Scanning animation triggers immediately (no input needed)  
✅ Address auto-fills to `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` (Vitalik)  
✅ Results screen shows **"👁️ Read-Only Scan"** badge (blue)  
✅ Trust Score displays with real data  
✅ Risk cards show actual findings from Vitalik's wallet  
✅ "Fix Risks" button is **disabled**  

### Test Variations:
- **Speed:** Confirm loads in ~3 seconds
- **Analytics:** Check console for `guardian_demo_mode_activated` event

---

## 🎨 **Test 4: Theme Consistency**

### Dark Theme (`theme: 'dark'`):
1. Set theme to dark
2. Visit Guardian
3. Check:
   - ✅ Background: Dark radial gradient
   - ✅ Shield: Emerald glow visible
   - ✅ Text: White/light gray
   - ✅ Buttons: Emerald glow on primary
   - ✅ Input: Dark with emerald focus ring

### Light Theme (`theme: 'light'`):
1. Set theme to light
2. Visit Guardian
3. Check:
   - ✅ Background: Light radial gradient
   - ✅ Shield: Slate gray visible (not too light)
   - ✅ Text: Dark gray/black
   - ✅ Buttons: Emerald with shadow
   - ✅ Input: White with emerald focus ring

### Toggle Test:
- Start on welcome screen → Switch theme → Confirm no visual breaks
- Start on results screen → Switch theme → Confirm colors update smoothly

---

## 📱 **Test 5: Mobile Responsiveness**

### Mobile View (`< 640px width`):
1. Open Chrome DevTools
2. Switch to mobile view (iPhone SE or similar)
3. Test all three modes

### Expected Mobile Behavior:
✅ Buttons stack vertically (full width)  
✅ Trust Score gauge shrinks proportionally  
✅ Input field is touch-friendly (min 44px height)  
✅ Text remains readable (uses `clamp()` for fluid sizing)  
✅ Navigation buttons wrap or scroll  
✅ No horizontal overflow  

### Devices to Test:
- iPhone SE (375px)
- iPhone 12 Pro (390px)
- iPad Mini (768px)
- Android (360px, 412px)

---

## 🔄 **Test 6: Mode Switching**

### Flow: Manual → Wallet Connect
1. Start in manual mode, scan an address
2. Click "Connect Wallet" from results
3. Connect wallet
4. Badge should change from "👁️ Read-Only Scan" to "🔒 Wallet Connected"
5. "Fix Risks" button should become enabled

### Flow: Demo → Wallet Connect
1. Start in demo mode
2. From results, connect wallet
3. Confirm badge updates
4. Rescan to use connected wallet address

### Flow: Wallet → Disconnect → Manual
1. Connect wallet, view results
2. Disconnect wallet via extension
3. Page should return to welcome screen
4. Switch to manual input
5. Scan a different address

---

## 🐛 **Edge Cases to Test**

### Invalid Inputs:
- Empty string: Button disabled ✅
- `0x` only: Button disabled ✅
- Short address `0x123`: Button disabled ✅
- Non-hex characters `0xGGGG...`: Button disabled ✅
- Correct length but invalid checksum: Should still scan (backend validates)

### Network Errors:
- Disconnect internet mid-scan
- Should show error state (check console)

### Slow Backend:
- If scan takes > 10 seconds
- Should not freeze UI
- Timeout should trigger gracefully

### Multiple Clicks:
- Click "Scan Address" rapidly 5 times
- Should not trigger multiple scans
- Loading state should prevent double-submit

---

## 📊 **Analytics Verification**

Open browser console and check for these events:

### Wallet Connection:
```javascript
guardian_wallet_connect_clicked: {}
guardian_scan_started: { address: '0x...', network: 'ethereum', auto: true }
```

### Manual Input:
```javascript
guardian_manual_input_opened: {}
guardian_scan_started: { address: '0x...', network: 'ethereum', auto: false }
```

### Demo Mode:
```javascript
guardian_demo_mode_activated: { demo_address: '0xd8d...' }
guardian_scan_started: { address: '0xd8d...', network: 'ethereum', auto: false }
```

### Rescan:
```javascript
guardian_rescan_requested: { wallet_address: '0x...' }
```

---

## ✅ **Acceptance Criteria**

All three modes must:
- ✅ Display correct badge (🔒 Wallet vs 👁️ Read-Only)
- ✅ Show trust score and risk cards
- ✅ Handle light/dark theme correctly
- ✅ Work on mobile (<640px)
- ✅ Disable "Fix Risks" in read-only modes
- ✅ Log analytics events
- ✅ Show smooth animations
- ✅ Handle errors gracefully

---

## 🚀 **Performance Benchmarks**

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Time to Interactive** | < 1s | Chrome DevTools Performance tab |
| **Scan Duration** | 3-5s | Time from click to results |
| **Input Validation** | < 50ms | Type delay |
| **Theme Switch** | < 100ms | Visual jank check |
| **Modal Open** | < 200ms | RainbowKit modal |

---

## 🔐 **Security Checks**

- [ ] Manual input sanitizes address (regex validation)
- [ ] Demo mode cannot sign transactions
- [ ] Read-only scans cannot access private keys
- [ ] Wallet connection requests explicit approval
- [ ] No sensitive data logged to console in production

---

## 📸 **Screenshot Checklist**

Capture these for documentation/marketing:

1. **Welcome Screen** (dark theme)
2. **Welcome Screen** (light theme)
3. **Manual Input Form** (expanded)
4. **Scanning Animation** (radar sweep visible)
5. **Results Screen** — Wallet Connected badge
6. **Results Screen** — Read-Only badge
7. **Mobile View** (iPhone SE)
8. **Modal** — RainbowKit wallet selection

---

## 🎯 **Success Metrics**

After testing, confirm:
- ✅ **Zero crashes** across all modes
- ✅ **Zero console errors** (warnings OK)
- ✅ **Smooth animations** (60fps)
- ✅ **Accessible** (keyboard navigation works)
- ✅ **Beautiful** (matches design spec)

---

## 🏁 **Quick Test Script**

Run this 5-minute checklist before shipping:

```bash
# 1. Start dev server
npm run dev

# 2. Open Guardian
open http://localhost:8080/guardian

# 3. Test wallet mode
→ Connect MetaMask
→ Confirm scan works
→ Check badge: 🔒 Wallet Connected

# 4. Disconnect wallet
→ Back to welcome screen

# 5. Test manual mode
→ Click "Scan Any Address"
→ Paste: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
→ Click "Scan Address"
→ Check badge: 👁️ Read-Only Scan
→ Confirm "Fix Risks" is disabled

# 6. Test demo mode
→ Refresh page
→ Click "Try Demo Mode"
→ Confirm Vitalik's address loads
→ Check badge: 👁️ Read-Only Scan

# 7. Toggle theme
→ Switch to light mode
→ Confirm visuals look good
→ Switch back to dark mode

# 8. Test mobile
→ Open DevTools
→ iPhone SE view
→ Confirm buttons stack vertically
→ Confirm no overflow

# Done! ✅
```

---

## 🆘 **Troubleshooting**

### Issue: "Not what you are looking for?" in wallet modal
**Fix:** Check `VITE_WALLETCONNECT_PROJECT_ID` in `.env`

### Issue: Scan always fails
**Fix:** Check Supabase Edge Function is deployed and secrets are set

### Issue: Input validation not working
**Fix:** Check regex pattern: `/^0x[a-fA-F0-9]{40}$/`

### Issue: Theme not switching
**Fix:** Check `useTheme()` hook and `ThemeContext` provider

### Issue: Analytics events not logging
**Fix:** Open console, check for event names and payloads

---

🎉 **Happy Testing!**  
All three modes should work flawlessly. If something breaks, check the console first! 🔍


