# Wallet Scope Header Testing Guide

## How to Test Task 10: Guardian Wallet Scope Clarity

### Prerequisites
1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000` (or your dev server URL)

### Test Scenarios

#### Test 1: Guardian Main Page (/guardian)
1. **Navigate to Guardian**: Go to `/guardian` or click Guardian in navigation
2. **Without Wallet Connected**:
   - Should see onboarding screen with "Connect Wallet" and "Demo Mode" buttons
   - Click "Demo Mode" button
   - **Expected**: Wallet scope header should appear showing "Analyzing: Demo Wallet (0xd8dA...6045)"

3. **With Demo Mode Active**:
   - Should see the wallet scope header at the top of the scan results
   - Header should show: "Analyzing: Demo Wallet" with wallet icon
   - Should display truncated address: "0xd8dA...6045"

#### Test 2: Guardian Enhanced (/guardian-enhanced)
1. **Navigate to Enhanced Guardian**: Go to `/guardian-enhanced`
2. **Connect Wallet or Use Demo**:
   - Click "Connect Wallet" or use demo mode
   - **Expected**: Wallet scope header appears in the Scan tab
   - Should show "Analyzing: [Wallet Label/Address]"

#### Test 3: Guardian UX2 (/guardian-ux2)
1. **Navigate to Guardian UX2**: Go to `/guardian-ux2`
2. **Connect Wallet**:
   - Click "Connect Wallet" button
   - **Expected**: Wallet scope header appears showing "Analyzing: Connected Wallet"
   - Should display the connected wallet address

#### Test 4: Guardian Tabs (Risks/Alerts/History)
1. **In Guardian Enhanced**, switch between tabs:
   - Click "Risks" tab
   - **Expected**: Wallet scope header appears at top of risks content
   - Click "Alerts" tab  
   - **Expected**: Wallet scope header appears at top of alerts content
   - Click "History" tab
   - **Expected**: Wallet scope header appears at top of history content

### Visual Verification Checklist

For each screen, verify the wallet scope header:
- ✅ Shows "Analyzing:" prefix
- ✅ Displays wallet name/label when available
- ✅ Shows truncated address (0x1234...5678 format)
- ✅ Has Shield icon (emerald color)
- ✅ Has Wallet icon (gray color)
- ✅ Uses glassmorphism styling (semi-transparent background)
- ✅ Appears consistently across all Guardian screens

### Expected Header Format
```
🛡️ Analyzing: 🔗 [Wallet Name] 0x1234...5678
```

### Browser Testing
Test in multiple browsers:
- Chrome/Chromium
- Firefox
- Safari (if on macOS)
- Mobile browsers (responsive design)

### Error Cases to Test
1. **No Wallet Connected**: Header should not appear or show appropriate message
2. **Wallet Disconnected**: Header should disappear or update accordingly
3. **Network Switch**: Header should update with new network context

## Quick Test Commands

```bash
# Start development server
npm run dev

# Run component tests
npm test -- WalletScopeHeader

# Run E2E tests (if available)
npm run test:e2e
```

## Test Results Documentation

Create a simple test log:
```
✅ Guardian main page - Demo mode shows wallet scope header
✅ Guardian Enhanced - Scan tab shows wallet scope header  
✅ Guardian UX2 - Connected wallet shows wallet scope header
✅ Risks tab - Shows wallet scope header
✅ Alerts tab - Shows wallet scope header
✅ History tab - Shows wallet scope header
```

## Troubleshooting

If wallet scope header doesn't appear:
1. Check browser console for errors
2. Verify wallet connection state
3. Check if component is imported correctly
4. Ensure walletAddress prop is being passed