# Multi-Wallet System Validation Checklist

## Overview

This checklist validates the multi-wallet switching functionality that has been implemented. Use this to verify that all components work together correctly before proceeding to server-side integration.

## Pre-Validation Setup

### Environment Requirements
- [ ] React app running on `http://localhost:8080` or similar
- [ ] DevTools Console open (F12 → Console tab)
- [ ] At least 2 different wallet addresses available for testing
- [ ] MetaMask or compatible wallet extension installed

### Test Data Preparation
- [ ] Clear existing wallet state: `localStorage.removeItem('connectedWallets')`
- [ ] Clear active wallet: `localStorage.removeItem('aw_active_address')`
- [ ] Refresh the application

## Phase 1: Wallet Connection Testing

### Test 1.1: First Wallet Connection
**Objective**: Verify initial wallet connection works

**Steps**:
1. [ ] Navigate to the application
2. [ ] Click "Connect Wallet" or profile icon → "Connect Wallet"
3. [ ] **Expected**: RainbowKit modal appears OR CustomWalletModal appears
4. [ ] Connect first wallet (e.g., MetaMask)
5. [ ] **Expected**: Wallet appears in header, profile icon shows

**Success Criteria**:
- [ ] Modal appears visually within 500ms
- [ ] Wallet connection succeeds
- [ ] Header shows connected wallet address
- [ ] Console shows: `Added new wallet to multi-wallet list: 0x...`

### Test 1.2: Second Wallet Connection
**Objective**: Verify multi-wallet support

**Steps**:
1. [ ] Click profile icon → "Add Wallet"
2. [ ] **Expected**: Modal appears (RainbowKit or Custom)
3. [ ] Connect second wallet (different address)
4. [ ] **Expected**: Both wallets appear in dropdown

**Success Criteria**:
- [ ] Second wallet added to multi-wallet list
- [ ] Profile dropdown shows both wallets
- [ ] Console shows: `Added new wallet to multi-wallet list: 0x...`

## Phase 2: Wallet Switching Testing

### Test 2.1: Basic Wallet Switching
**Objective**: Verify wallet switching functionality

**Steps**:
1. [ ] Click profile icon to open dropdown
2. [ ] **Expected**: See "Switch Wallet" section with both wallets
3. [ ] Click on the non-active wallet
4. [ ] **Expected**: Check mark moves to selected wallet
5. [ ] **Expected**: Dropdown closes automatically

**Success Criteria**:
- [ ] Console shows wallet switch debug logs:
  ```
  🔘 Wallet button clicked: 0x...
  === WALLET SWITCH DEBUG ===
  🔄 setActiveWallet called with: 0x...
  ✅ Wallet found, proceeding with switch...
  ✅ Active wallet state updated
  ```
- [ ] Check mark moves to selected wallet
- [ ] Active wallet in header updates

### Test 2.2: State Persistence
**Objective**: Verify wallet selection persists

**Steps**:
1. [ ] Switch to a specific wallet (note the address)
2. [ ] Check localStorage: `localStorage.getItem('aw_active_address')`
3. [ ] **Expected**: Should match selected wallet address
4. [ ] Refresh the page (F5)
5. [ ] **Expected**: Same wallet should be active after refresh

**Success Criteria**:
- [ ] localStorage updates immediately after switch
- [ ] Page refresh maintains wallet selection
- [ ] No "wallet not found" errors after refresh

### Test 2.3: Visual Feedback
**Objective**: Verify UI provides clear feedback

**Steps**:
1. [ ] Open profile dropdown
2. [ ] Observe current active wallet (should have check mark)
3. [ ] Click different wallet
4. [ ] **Expected**: Check mark moves immediately
5. [ ] **Expected**: Wallet address in header updates

**Success Criteria**:
- [ ] Check mark (✓) appears next to active wallet
- [ ] Active wallet has cyan/blue highlighting
- [ ] Header shows correct wallet address
- [ ] Dropdown closes after selection

## Phase 3: Error Handling Testing

### Test 3.1: Case Sensitivity Handling
**Objective**: Verify case-insensitive wallet matching

**Steps**:
1. [ ] Open DevTools Console
2. [ ] Manually test case sensitivity:
   ```javascript
   // Get current wallets
   const wallets = JSON.parse(localStorage.getItem('connectedWallets') || '[]');
   console.log('Wallets:', wallets.map(w => w.address));
   
   // Try switching with different case
   const address = wallets[0]?.address;
   if (address) {
     // This should work regardless of case
     window.dispatchEvent(new CustomEvent('testWalletSwitch', {
       detail: { address: address.toUpperCase() }
     }));
   }
   ```

**Success Criteria**:
- [ ] Wallet switching works with uppercase addresses
- [ ] Wallet switching works with lowercase addresses
- [ ] No "wallet not found" errors due to case differences

### Test 3.2: Modal Fallback Testing
**Objective**: Verify hybrid modal approach works

**Steps**:
1. [ ] Click "Add Wallet" button
2. [ ] If RainbowKit modal appears: **Success**
3. [ ] If CustomWalletModal appears: **Also Success** (fallback working)
4. [ ] Check console for modal debug logs

**Success Criteria**:
- [ ] Some modal always appears (RainbowKit OR Custom)
- [ ] Console shows modal selection logic:
  ```
  ✅ Using RainbowKit modal...
  OR
  ⚠️ RainbowKit not available, using custom modal...
  ```

## Phase 4: Integration Testing

### Test 4.1: Cross-Module Consistency
**Objective**: Verify wallet changes affect other parts of app

**Steps**:
1. [ ] Switch to Wallet A
2. [ ] Navigate to different pages (Guardian, Hunter, etc.)
3. [ ] **Expected**: All pages show Wallet A as active
4. [ ] Switch to Wallet B
5. [ ] **Expected**: All pages update to show Wallet B

**Success Criteria**:
- [ ] Wallet changes propagate across all pages
- [ ] No pages show stale wallet information
- [ ] React Query invalidation triggers data refetch

### Test 4.2: Event System Testing
**Objective**: Verify wallet switch events are emitted

**Steps**:
1. [ ] Open DevTools Console
2. [ ] Add event listener:
   ```javascript
   window.addEventListener('walletConnected', (e) => {
     console.log('Wallet event received:', e.detail);
   });
   ```
3. [ ] Switch wallets
4. [ ] **Expected**: Event logged to console

**Success Criteria**:
- [ ] `walletConnected` events emitted on wallet switch
- [ ] Event contains correct wallet address and timestamp

## Phase 5: Performance Testing

### Test 5.1: Switch Speed
**Objective**: Verify wallet switching is fast

**Steps**:
1. [ ] Open DevTools Console
2. [ ] Time wallet switches:
   ```javascript
   const startTime = performance.now();
   // Click wallet switch button
   // Wait for completion
   const endTime = performance.now();
   console.log('Switch time:', endTime - startTime, 'ms');
   ```

**Success Criteria**:
- [ ] Wallet switches complete in < 1000ms (1 second)
- [ ] UI updates appear immediately (< 100ms)
- [ ] No noticeable lag or freezing

### Test 5.2: Memory Leaks
**Objective**: Verify no memory leaks from wallet switching

**Steps**:
1. [ ] Open DevTools → Performance tab
2. [ ] Start recording
3. [ ] Switch wallets 10-20 times rapidly
4. [ ] Stop recording and analyze

**Success Criteria**:
- [ ] Memory usage remains stable
- [ ] No excessive object creation
- [ ] Event listeners properly cleaned up

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: "Wallet not found in connected wallets"
**Symptoms**: Console error when clicking wallet switch button
**Solution**: Check address case sensitivity and wallet list consistency
**Debug**: 
```javascript
const wallets = JSON.parse(localStorage.getItem('connectedWallets') || '[]');
console.log('Available wallets:', wallets.map(w => w.address));
```

#### Issue: Check mark doesn't move
**Symptoms**: Visual feedback not updating
**Solution**: Verify React state updates and re-rendering
**Debug**: Check `contextActiveWallet` in console logs

#### Issue: Modal doesn't appear
**Symptoms**: "Add Wallet" button doesn't show modal
**Solution**: Check hybrid modal implementation and z-index
**Debug**: 
```javascript
console.log('RainbowKit elements:', document.querySelectorAll('[data-rk]'));
```

#### Issue: Selection doesn't persist
**Symptoms**: Wallet resets after page refresh
**Solution**: Check localStorage updates and restoration logic
**Debug**:
```javascript
console.log('Stored address:', localStorage.getItem('aw_active_address'));
```

## Validation Completion

### Phase 1: Connection ✅/❌
- [ ] First wallet connection works
- [ ] Second wallet connection works
- [ ] Multi-wallet dropdown appears

### Phase 2: Switching ✅/❌
- [ ] Basic wallet switching works
- [ ] State persistence works
- [ ] Visual feedback works

### Phase 3: Error Handling ✅/❌
- [ ] Case sensitivity handled correctly
- [ ] Modal fallback works

### Phase 4: Integration ✅/❌
- [ ] Cross-module consistency works
- [ ] Event system works

### Phase 5: Performance ✅/❌
- [ ] Switch speed acceptable
- [ ] No memory leaks

## Final Validation

**Overall Status**: ✅ PASS / ❌ FAIL

**Notes**:
_Record any issues found during validation and their resolution status_

**Next Steps**:
- [ ] If all tests pass: Proceed to server-side integration (Edge Functions)
- [ ] If tests fail: Address issues before continuing
- [ ] Document any workarounds or known limitations

---

**Validation Date**: ___________
**Validated By**: ___________
**Environment**: ___________
**Browser**: ___________