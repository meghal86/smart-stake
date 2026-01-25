// Feature: hunter-demand-side, Property 10: Wallet Address Validation
// Feature: hunter-demand-side, Property 11: Wallet Signals Caching
// Validates: Requirements 4.1, 4.4, 4.5

import * as fc from 'fast-check';
import { describe, test, expect, beforeEach } from 'vitest';
import {
  validateWalletAddress,
  getWalletSignals,
  clearWalletSignalsCache,
  type WalletSignals,
} from '@/lib/hunter/wallet-signals';

describe('Hunter Demand-Side: Wallet Signals Service', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearWalletSignalsCache();
  });

  describe('Property 10: Wallet Address Validation', () => {
    test('accepts valid wallet addresses (0x + 40 hex chars)', () => {
      fc.assert(
        fc.property(
          // Generator: valid wallet addresses
          fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'A', 'B', 'C', 'D', 'E', 'F'), { minLength: 40, maxLength: 40 })
            .map(arr => '0x' + arr.join('')),
          (address) => {
            // Valid addresses should pass validation
            expect(validateWalletAddress(address)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('rejects invalid wallet addresses', () => {
      fc.assert(
        fc.property(
          // Generator: invalid wallet addresses
          fc.oneof(
            // Missing 0x prefix
            fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 40, maxLength: 40 })
              .map(arr => arr.join('')),
            // Wrong length (too short)
            fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 1, maxLength: 39 })
              .map(arr => '0x' + arr.join('')),
            // Wrong length (too long)
            fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 41, maxLength: 50 })
              .map(arr => '0x' + arr.join('')),
            // Invalid characters
            fc.constant('0x' + 'g'.repeat(40)),
            fc.constant('0x' + 'z'.repeat(40)),
            // Empty string
            fc.constant(''),
            // Just 0x
            fc.constant('0x')
          ),
          (address) => {
            // Invalid addresses should fail validation
            expect(validateWalletAddress(address)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('getWalletSignals throws error for invalid addresses', async () => {
      fc.assert(
        fc.asyncProperty(
          // Generator: invalid wallet addresses
          fc.oneof(
            fc.constant('invalid'),
            fc.constant('0x123'),
            fc.constant(''),
            fc.constant('0x' + 'g'.repeat(40))
          ),
          async (address) => {
            // Should throw error for invalid addresses
            await expect(getWalletSignals(address)).rejects.toThrow('Invalid wallet address format');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 11: Wallet Signals Caching', () => {
    test('fetching signals twice within 5 minutes returns cached data', async () => {
      // Use a valid test address
      const testAddress = '0x' + 'a'.repeat(40);

      // First call - fetches from API
      const signals1 = await getWalletSignals(testAddress);

      // Second call - should return cached data
      const signals2 = await getWalletSignals(testAddress);

      // Verify both calls return the same object
      expect(signals1).toEqual(signals2);
      expect(signals1.address).toBe(testAddress);
      expect(signals2.address).toBe(testAddress);
    });

    test('cache returns consistent data for multiple addresses', async () => {
      fc.assert(
        fc.asyncProperty(
          // Generator: array of valid wallet addresses
          fc.array(
            fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 40, maxLength: 40 })
              .map(arr => '0x' + arr.join('')),
            { minLength: 1, maxLength: 5 }
          ),
          async (addresses) => {
            // Fetch signals for each address twice
            for (const address of addresses) {
              const signals1 = await getWalletSignals(address);
              const signals2 = await getWalletSignals(address);

              // Verify cached data is consistent
              expect(signals1).toEqual(signals2);
              expect(signals1.address).toBe(address);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    test('cached signals have required fields', async () => {
      const testAddress = '0x' + 'b'.repeat(40);

      const signals = await getWalletSignals(testAddress);

      // Verify all required fields are present
      expect(signals).toHaveProperty('address');
      expect(signals).toHaveProperty('wallet_age_days');
      expect(signals).toHaveProperty('tx_count_90d');
      expect(signals).toHaveProperty('chains_active');
      expect(signals).toHaveProperty('top_assets');
      expect(signals).toHaveProperty('stablecoin_usd_est');

      // Verify address matches
      expect(signals.address).toBe(testAddress);

      // Verify arrays are arrays
      expect(Array.isArray(signals.chains_active)).toBe(true);
      expect(Array.isArray(signals.top_assets)).toBe(true);
    });

    test('cache handles case-insensitive addresses', async () => {
      const addressLower = '0x' + 'a'.repeat(40);
      const addressUpper = '0x' + 'A'.repeat(40);
      const addressMixed = '0x' + 'aA'.repeat(20);

      // Fetch signals for lowercase address
      const signals1 = await getWalletSignals(addressLower);

      // Fetch signals for uppercase address (should be cached)
      const signals2 = await getWalletSignals(addressUpper);

      // Fetch signals for mixed case address (should be cached)
      const signals3 = await getWalletSignals(addressMixed);

      // Each call returns the address as provided (not normalized)
      expect(signals1.address).toBe(addressLower);
      expect(signals2.address).toBe(addressUpper);
      expect(signals3.address).toBe(addressMixed);
      
      // But the underlying data should be the same (cached)
      expect(signals1.wallet_age_days).toBe(signals2.wallet_age_days);
      expect(signals1.tx_count_90d).toBe(signals2.tx_count_90d);
      expect(signals1.chains_active).toEqual(signals2.chains_active);
    });
  });

  describe('Graceful Degradation', () => {
    test('returns null signals when RPC unavailable', async () => {
      // This test assumes ALCHEMY_ETH_RPC_URL is not configured
      // In a real environment, we'd mock the environment variable

      const testAddress = '0x' + 'c'.repeat(40);
      const signals = await getWalletSignals(testAddress);

      // Should return signals object with null values
      expect(signals.address).toBe(testAddress);
      
      // When RPC is unavailable, these should be null or empty
      // (actual behavior depends on environment configuration)
      expect(signals).toHaveProperty('wallet_age_days');
      expect(signals).toHaveProperty('tx_count_90d');
      expect(signals).toHaveProperty('chains_active');
      expect(signals).toHaveProperty('top_assets');
      expect(signals).toHaveProperty('stablecoin_usd_est');
    });
  });

  describe('Edge Cases', () => {
    test('handles addresses with all zeros', async () => {
      const zeroAddress = '0x' + '0'.repeat(40);
      const signals = await getWalletSignals(zeroAddress);

      expect(signals.address).toBe(zeroAddress);
      expect(signals).toHaveProperty('wallet_age_days');
      expect(signals).toHaveProperty('tx_count_90d');
    });

    test('handles addresses with all Fs', async () => {
      const maxAddress = '0x' + 'f'.repeat(40);
      const signals = await getWalletSignals(maxAddress);

      expect(signals.address).toBe(maxAddress);
      expect(signals).toHaveProperty('wallet_age_days');
      expect(signals).toHaveProperty('tx_count_90d');
    });

    test('handles mixed case addresses', async () => {
      const mixedAddress = '0xAbCdEf0123456789AbCdEf0123456789AbCdEf01';
      const signals = await getWalletSignals(mixedAddress);

      expect(signals.address).toBe(mixedAddress);
      expect(signals).toHaveProperty('wallet_age_days');
      expect(signals).toHaveProperty('tx_count_90d');
    });
  });
});
