# Multi-Wallet Flow E2E Tests

Comprehensive end-to-end tests for the multi-wallet functionality in the Hunter Screen.

## Test Coverage

### Core Functionality
- ✅ Connecting multiple wallets
- ✅ Switching between wallets
- ✅ Feed personalization per wallet
- ✅ Eligibility updates per wallet
- ✅ Wallet disconnection handling

### UI/UX
- ✅ Mobile wallet selector (responsive design)
- ✅ Keyboard navigation (Tab, Enter, Arrow keys, Escape)
- ✅ Loading states during wallet switching
- ✅ No layout shift when switching
- ✅ Click outside to close dropdown

### Accessibility
- ✅ Screen reader support (ARIA attributes)
- ✅ Proper focus management
- ✅ Keyboard-only navigation
- ✅ Descriptive labels and roles
- ✅ Touch target sizes (44px minimum)

### Advanced Features
- ✅ ENS name resolution and display
- ✅ Wallet label editing and persistence
- ✅ Label restoration on page reload
- ✅ Chain icon display
- ✅ Active wallet restoration

### Edge Cases
- ✅ Rapid wallet switching
- ✅ Very long wallet labels
- ✅ ENS resolution failure
- ✅ Wallet with no transaction history
- ✅ All wallets disconnected

## Running the Tests

### Run all multi-wallet E2E tests
```bash
npx playwright test tests/e2e/multi-wallet-flow.spec.ts
```

### Run specific test
```bash
npx playwright test tests/e2e/multi-wallet-flow.spec.ts -g "should connect multiple wallets"
```

### Run in headed mode (see browser)
```bash
npx playwright test tests/e2e/multi-wallet-flow.spec.ts --headed
```

### Run with debug mode
```bash
npx playwright test tests/e2e/multi-wallet-flow.spec.ts --debug
```

### Run on specific browser
```bash
npx playwright test tests/e2e/multi-wallet-flow.spec.ts --project=chromium
npx playwright test tests/e2e/multi-wallet-flow.spec.ts --project=firefox
npx playwright test tests/e2e/multi-wallet-flow.spec.ts --project=webkit
```

### Generate test report
```bash
npx playwright test tests/e2e/multi-wallet-flow.spec.ts --reporter=html
```

## Test Structure

### Helper Functions

#### `mockWalletConnection(page, address)`
Mocks the Web3 wallet connection for testing.

```typescript
await mockWalletConnection(page, '0x1234...');
```

#### `mockENSResolution(page, address, ensName)`
Mocks ENS name resolution for testing.

```typescript
await mockENSResolution(page, '0xd8dA...', 'vitalik.eth');
```

### Test Data

```typescript
const WALLET_1 = '0x1234567890123456789012345678901234567890';
const WALLET_2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
const WALLET_3 = '0x9876543210987654321098765432109876543210';
const ENS_NAME = 'vitalik.eth';
const ENS_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
```

## Test Scenarios

### 1. Connect Multiple Wallets
Tests the ability to connect and display multiple wallets in the selector.

**Steps:**
1. Connect first wallet
2. Verify wallet selector appears
3. Connect second wallet
4. Open dropdown
5. Verify both wallets are listed

**Expected:** Both wallets appear in dropdown with truncated addresses.

### 2. Switch Between Wallets
Tests wallet switching functionality and active state indication.

**Steps:**
1. Connect multiple wallets
2. Open wallet selector
3. Click on different wallet
4. Verify active wallet changes
5. Verify checkmark on active wallet

**Expected:** Active wallet updates, checkmark moves to selected wallet.

### 3. Feed Personalization
Tests that feed content updates based on selected wallet.

**Steps:**
1. Connect wallet 1
2. Verify personalized content for wallet 1
3. Switch to wallet 2
4. Verify personalized content for wallet 2

**Expected:** Feed content changes based on active wallet.

### 4. Eligibility Updates
Tests that eligibility status updates when switching wallets.

**Steps:**
1. Connect wallet with high eligibility
2. Verify "Likely Eligible" status
3. Switch to wallet with low eligibility
4. Verify "Unlikely Eligible" status

**Expected:** Eligibility status reflects active wallet's history.

### 5. Mobile Responsiveness
Tests wallet selector on mobile viewport.

**Steps:**
1. Set mobile viewport (375x667)
2. Connect wallet
3. Verify selector is visible
4. Verify touch target size ≥44px
5. Open dropdown
6. Verify dropdown positioning

**Expected:** All elements are properly sized and positioned for mobile.

### 6. Keyboard Navigation
Tests complete keyboard-only navigation flow.

**Steps:**
1. Connect multiple wallets
2. Tab to wallet selector
3. Press Enter to open
4. Use Arrow keys to navigate
5. Press Enter to select
6. Press Escape to close

**Expected:** All interactions work with keyboard only.

### 7. Screen Reader Accessibility
Tests ARIA attributes and screen reader support.

**Steps:**
1. Connect wallet
2. Verify role="button" on selector
3. Verify aria-haspopup="true"
4. Open dropdown
5. Verify aria-expanded="true"
6. Verify role="menu" on dropdown
7. Verify role="menuitem" on options
8. Verify aria-current on active wallet

**Expected:** All ARIA attributes are properly set.

### 8. ENS Name Display
Tests ENS name resolution and display.

**Steps:**
1. Mock ENS resolution
2. Connect wallet with ENS
3. Verify ENS name displays instead of address
4. Open dropdown
5. Hover to see full address in tooltip

**Expected:** ENS name displays, tooltip shows full address.

### 9. Wallet Label Persistence
Tests wallet label editing and restoration.

**Steps:**
1. Connect wallet
2. Open selector
3. Edit label
4. Save label
5. Reload page
6. Verify label persisted

**Expected:** Label persists across page reloads.

### 10. Wallet Restoration
Tests that last selected wallet is restored on page load.

**Steps:**
1. Connect multiple wallets
2. Switch to second wallet
3. Reload page
4. Verify second wallet is still active

**Expected:** Last selected wallet is restored from localStorage.

## Accessibility Requirements

All tests verify compliance with:
- WCAG 2.1 Level AA
- Keyboard navigation support
- Screen reader compatibility
- Minimum touch target size (44px)
- Proper focus management
- ARIA attributes and roles

## Performance Considerations

Tests verify:
- No layout shift when switching wallets (CLS < 0.1)
- Loading states during async operations
- Smooth transitions (no flickering)
- Responsive interactions (<150ms)

## Browser Compatibility

Tests run on:
- Chromium (Chrome, Edge)
- Firefox
- WebKit (Safari)

## CI/CD Integration

These tests are part of the CI/CD pipeline and run on:
- Pull request creation
- Merge to main branch
- Pre-deployment checks

## Troubleshooting

### Tests failing locally
1. Ensure Playwright is installed: `npx playwright install`
2. Check that dev server is running
3. Clear browser cache: `npx playwright test --clear-cache`

### Flaky tests
1. Increase timeout for slow operations
2. Add explicit waits for async operations
3. Check for race conditions in wallet switching

### Mock not working
1. Verify route patterns match actual API calls
2. Check that mocks are set up before navigation
3. Ensure mock responses match expected schema

## Related Documentation

- [WalletContext Tests](../../src/__tests__/contexts/WalletContext.test.tsx)
- [WalletSelector Component Tests](../../src/__tests__/components/hunter/WalletSelector.test.tsx)
- [Multi-Wallet Integration Tests](../../src/__tests__/integration/WalletSwitching.integration.test.tsx)
- [Requirements Document](../../.kiro/specs/hunter-screen-feed/requirements.md)
- [Design Document](../../.kiro/specs/hunter-screen-feed/design.md)

## Requirements Coverage

This test suite covers:
- **Requirement 17**: Wallet Connection & Management (17.1-17.9)
- **Requirement 18**: Multi-Wallet Selection & Switching (18.1-18.20)
- **Requirement 9**: Accessibility (9.1-9.12)
- **Requirement 6**: Eligibility Preview (6.1-6.8)
- **Requirement 3**: Personalized Feed Ranking (3.1-3.7)
