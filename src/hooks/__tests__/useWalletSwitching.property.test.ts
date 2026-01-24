import * as fc from 'fast-check';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWalletSwitching } from '../useWalletSwitching';
import { useUserAddresses } from '../useUserAddresses';

// Mock the useUserAddresses hook
vi.mock('../useUserAddresses');
const mockUseUserAddresses = vi.mocked(useUserAddresses);

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Generators for property-based testing
const addressGenerator = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  address: fc.string({ minLength: 42, maxLength: 42 }).map(s => `0x${s.slice(2)}`),
  label: fc.string({ minLength: 1, maxLength: 50 }),
  group: fc.option(fc.string({ minLength: 1, maxLength: 20 }))
});

const addressListGenerator = fc.array(addressGenerator, { minLength: 1, maxLength: 10 });

describe('Feature: unified-portfolio, Property S3: Wallet switch data isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  test('wallet switching clears previous wallet data to prevent leakage', () => {
    fc.assert(
      fc.property(
        addressListGenerator,
        fc.integer({ min: 0, max: 9 }),
        fc.integer({ min: 0, max: 9 }),
        (addresses, fromIndex, toIndex) => {
          // Ensure we have valid indices
          const validFromIndex = fromIndex % addresses.length;
          const validToIndex = toIndex % addresses.length;
          
          if (validFromIndex === validToIndex) return; // Skip same wallet
          
          // Mock the addresses hook
          mockUseUserAddresses.mockReturnValue({
            addresses,
            loading: false,
            addAddress: vi.fn(),
            removeAddress: vi.fn(),
            updateAddress: vi.fn(),
            refetch: vi.fn()
          });

          const { result } = renderHook(() => useWalletSwitching());

          // Wait for initial wallet to be set
          expect(result.current.activeWallet).toBe(addresses[0].id);

          // Simulate cached data for the first wallet
          const walletSpecificKey = `portfolio-${addresses[validFromIndex].id}`;
          mockLocalStorage.getItem.mockReturnValue('cached-data');

          // Switch to another wallet
          act(() => {
            result.current.switchWallet(addresses[validToIndex].id);
          });

          // Property: After wallet switch, previous wallet's cache should be cleared
          expect(mockLocalStorage.removeItem).toHaveBeenCalled();
          
          // Property: Active wallet should change to the new wallet
          expect(result.current.activeWallet).toBe(addresses[validToIndex].id);
          
          // Property: Previous wallet should be tracked
          expect(result.current.previousWallet).toBe(addresses[0].id);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('wallet scope validation ensures data isolation', () => {
    fc.assert(
      fc.property(
        addressListGenerator,
        fc.string({ minLength: 42, maxLength: 42 }).map(s => `0x${s.slice(2)}`),
        (addresses, randomAddress) => {
          mockUseUserAddresses.mockReturnValue({
            addresses,
            loading: false,
            addAddress: vi.fn(),
            removeAddress: vi.fn(),
            updateAddress: vi.fn(),
            refetch: vi.fn()
          });

          const { result } = renderHook(() => useWalletSwitching());

          // Property: Valid addresses should pass validation
          const validAddress = addresses[0].address as `0x${string}`;
          const validScope = { mode: 'active_wallet' as const, address: validAddress };
          expect(result.current.validateWalletScope(validScope)).toBe(true);

          // Property: Invalid addresses should fail validation (unless it happens to match)
          const invalidScope = { mode: 'active_wallet' as const, address: randomAddress as `0x${string}` };
          const shouldBeValid = addresses.some(addr => 
            addr.address.toLowerCase() === randomAddress.toLowerCase()
          );
          expect(result.current.validateWalletScope(invalidScope)).toBe(shouldBeValid);

          // Property: All wallets mode should always be valid
          const allWalletsScope = { mode: 'all_wallets' as const };
          expect(result.current.validateWalletScope(allWalletsScope)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('wallet switching maintains state consistency', () => {
    fc.assert(
      fc.property(
        addressListGenerator,
        (addresses) => {
          mockUseUserAddresses.mockReturnValue({
            addresses,
            loading: false,
            addAddress: vi.fn(),
            removeAddress: vi.fn(),
            updateAddress: vi.fn(),
            refetch: vi.fn()
          });

          const { result } = renderHook(() => useWalletSwitching());

          // Property: Initial state should be consistent
          expect(result.current.activeWallet).toBe(addresses[0].id);
          expect(result.current.previousWallet).toBe(null);
          expect(result.current.isLoading).toBe(false);
          expect(result.current.error).toBe(null);

          // Property: Available wallets should match input addresses
          expect(result.current.availableWallets).toEqual(addresses);

          // Property: Current wallet scope should reflect active wallet
          const currentScope = result.current.getCurrentWalletScope();
          expect(currentScope).toEqual({
            mode: 'active_wallet',
            address: addresses[0].address
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('clear wallet data removes all traces', () => {
    fc.assert(
      fc.property(
        addressListGenerator,
        (addresses) => {
          mockUseUserAddresses.mockReturnValue({
            addresses,
            loading: false,
            addAddress: vi.fn(),
            removeAddress: vi.fn(),
            updateAddress: vi.fn(),
            refetch: vi.fn()
          });

          const { result } = renderHook(() => useWalletSwitching());

          // Set up some state
          act(() => {
            result.current.switchWallet(addresses[0].id);
          });

          // Clear all wallet data
          act(() => {
            result.current.clearWalletData();
          });

          // Property: All wallet state should be cleared
          expect(result.current.activeWallet).toBe(null);
          expect(result.current.previousWallet).toBe(null);
          expect(result.current.isLoading).toBe(false);
          expect(result.current.error).toBe(null);

          // Property: Current scope should default to all wallets
          const currentScope = result.current.getCurrentWalletScope();
          expect(currentScope).toEqual({ mode: 'all_wallets' });

          // Property: Local storage should be cleared
          expect(mockLocalStorage.removeItem).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('invalid wallet switch attempts are handled safely', () => {
    fc.assert(
      fc.property(
        addressListGenerator,
        fc.string({ minLength: 1, maxLength: 50 }),
        (addresses, invalidWalletId) => {
          // Ensure the invalid ID doesn't accidentally match a real one
          const isActuallyValid = addresses.some(addr => addr.id === invalidWalletId);
          if (isActuallyValid) return; // Skip this test case

          mockUseUserAddresses.mockReturnValue({
            addresses,
            loading: false,
            addAddress: vi.fn(),
            removeAddress: vi.fn(),
            updateAddress: vi.fn(),
            refetch: vi.fn()
          });

          const { result } = renderHook(() => useWalletSwitching());

          // Attempt to switch to invalid wallet
          act(() => {
            result.current.switchWallet(invalidWalletId);
          });

          // Property: Invalid switch should result in error state
          expect(result.current.error).toBeTruthy();
          expect(result.current.error).toContain('not found');

          // Property: Active wallet should remain unchanged
          expect(result.current.activeWallet).toBe(addresses[0].id);

          // Property: Loading should be false after error
          expect(result.current.isLoading).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// **Validates: Requirements 12.5**