# Wallet Switching Integration Tests

## Overview

This test suite validates the complete wallet switching flow in the Hunter Screen, ensuring that all dependent systems update correctly when users switch between wallets.

## Test Coverage

### 1. Feed Refresh on Wallet Change
- **Refetch feed data**: Verifies that the feed refetches when wallet changes
- **Loading state**: Ensures loading indicators appear during refresh
- **Scroll position**: Confirms scroll position is maintained during wallet switch

### 2. Eligibility Update on Wallet Change
- **Eligibility previews**: Validates that eligibility status updates for new wallet
- **Cache clearing**: Ensures eligibility cache is cleared on wallet change
- **Error handling**: Tests graceful degradation when eligibility checks fail

### 3. Personalized Ranking with Different Wallets
- **Different rankings**: Verifies that different wallets get different personalized rankings
- **Wallet history**: Confirms wallet history is used for personalization
- **Default ranking**: Tests fallback to default ranking when no wallet connected

### 4. Wallet Persistence Across Page Reloads
- **LocalStorage restoration**: Validates wallet selection is restored from localStorage
- **Persistence on change**: Ensures wallet selection is saved to localStorage
- **Invalid wallet handling**: Tests graceful handling of invalid wallet in storage
- **Cleanup on disconnect**: Verifies localStorage is cleared when all wallets disconnected

### 5. Wallet Disconnection Handling
- **Wallet removal**: Tests that disconnected wallet is removed from selector
- **Auto-switch**: Validates automatic switch to next available wallet
- **Last wallet**: Ensures proper handling when last wallet is disconnected
- **Eligibility cleanup**: Confirms eligibility data is cleared on disconnect

### 6. ENS + Label Combination Restoration
- **ENS restoration**: Tests ENS name is restored on reconnection
- **Label restoration**: Validates custom labels are restored
- **Priority**: Confirms labels take priority over ENS names
- **Fallback**: Tests fallback to truncated address when no ENS/label
- **Mixed wallets**: Validates multiple wallets with different name types

### 7. Error Handling
- **Wallet history errors**: Tests handling of wallet history fetch failures
- **ENS resolution errors**: Validates graceful handling of ENS resolution failures
- **Ranking errors**: Ensures personalized ranking errors don't break the app

## Running the Tests

```bash
# Run all wallet switching integration tests
npm test -- src/__tests__/integration/WalletSwitching.integration.test.tsx

# Run with coverage
npm test -- src/__tests__/integration/WalletSwitching.integration.test.tsx --coverage

# Run in watch mode
npm test -- src/__tests__/integration/WalletSwitching.integration.test.tsx --watch
```

## Test Architecture

### Mocked Dependencies
- `@/lib/name-resolution`: ENS and label resolution
- `@/lib/wallet-history`: Wallet activity history
- `@/lib/feed/personalized-ranking`: Personalized ranking algorithm
- `@/hooks/useWalletLabels`: Custom wallet labels
- `@/lib/supabase/client`: Database client

### Test Wallets
```typescript
const wallet1 = '0x1234567890123456789012345678901234567890';
const wallet2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
const wallet3 = '0x9876543210987654321098765432109876543210';
```

## Requirements Covered

This test suite validates the following requirements from the Hunter Screen spec:

- **Requirement 17**: Wallet Connection & Management
- **Requirement 18**: Multi-Wallet Selection & Switching
- **Requirement 3**: Personalized Feed Ranking
- **Requirement 6**: Eligibility Preview

## Key Test Scenarios

### Scenario 1: User Switches Wallets
1. User has wallet1 connected and selected
2. User switches to wallet2
3. Feed refetches with wallet2's personalized ranking
4. Eligibility previews update for wallet2
5. Selection persists to localStorage

### Scenario 2: Page Reload
1. User has wallet1 selected
2. Page reloads
3. Wallet1 is restored from localStorage
4. ENS name or label is resolved and displayed
5. Feed loads with wallet1's personalized ranking

### Scenario 3: Wallet Disconnection
1. User has wallet1 and wallet2 connected
2. Wallet1 is active
3. User disconnects wallet1
4. System automatically switches to wallet2
5. Feed refetches with wallet2's data

### Scenario 4: ENS + Label Priority
1. Wallet has both ENS name and custom label
2. Custom label is displayed (takes priority)
3. ENS name is available in tooltip
4. On reconnection, both are restored correctly

## Maintenance Notes

- Tests use Vitest mocking (`vi.mock`, `vi.mocked`)
- All tests are isolated with `beforeEach` cleanup
- LocalStorage and sessionStorage are cleared between tests
- QueryClient is reset after each test
- WalletProvider is included in test wrapper

## Future Enhancements

- Add tests for concurrent wallet switches
- Test wallet switching during active transactions
- Add performance benchmarks for wallet switching
- Test wallet switching with slow network conditions
- Add tests for wallet switching analytics events
