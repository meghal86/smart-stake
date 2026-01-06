/**
 * Property-Based Tests for Wallet Shape Adapter
 * 
 * Feature: multi-chain-wallet-system, Property 18: Wallet Shape Adapter Consistency
 * Validates: Requirements 19.1, 19.2, 19.3, 19.4
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import {
  adaptWalletRows,
  hasWalletNetwork,
  getMissingNetworks,
  isWalletNetworkMissing,
} from '../wallet-adapter';
import { UserWallet, ConnectedWallet } from '@/types/wallet-registry';

// Generators for valid input spaces
const addressGenerator = fc
  .array(fc.integer({ min: 0, max: 255 }), { minLength: 20, maxLength: 20 })
  .map((bytes) => `0x${bytes.map((b) => b.toString(16).padStart(2, '0')).join('')}`);

const chainNamespaceGenerator = fc.constantFrom(
  'eip155:1',
  'eip155:137',
  'eip155:42161',
  'eip155:10',
  'eip155:8453'
);

const userIdGenerator = fc.uuid();

const walletRowGenerator = fc.record({
  id: fc.uuid(),
  user_id: userIdGenerator,
  address: addressGenerator,
  chain_namespace: chainNamespaceGenerator,
  is_primary: fc.boolean(),
  created_at: fc
    .integer({ min: 1577836800000, max: 1767225600000 }) // 2020-2026 in ms
    .map((ms) => new Date(ms).toISOString()),
  updated_at: fc
    .integer({ min: 1577836800000, max: 1767225600000 })
    .map((ms) => new Date(ms).toISOString()),
  guardian_scores: fc.option(
    fc.record({
      'eip155:1': fc.integer({ min: 0, max: 100 }),
      'eip155:137': fc.integer({ min: 0, max: 100 }),
    })
  ),
  balance_cache: fc.option(
    fc.record({
      'eip155:1': fc.record({ eth: fc.float({ min: 0, max: 1000 }) }),
      'eip155:137': fc.record({ matic: fc.float({ min: 0, max: 1000000 }) }),
    })
  ),
});

describe('Feature: multi-chain-wallet-system, Property 18: Wallet Shape Adapter Consistency', () => {
  // Property 18.1: No duplicate addresses in output
  test('output contains no duplicate addresses (case-insensitive)', () => {
    fc.assert(
      fc.property(fc.array(walletRowGenerator, { minLength: 1, maxLength: 50 }), (rows) => {
        const result = adaptWalletRows(rows);

        // Check for duplicates by comparing lowercase addresses
        const addressesLc = result.map((w) => w.address.toLowerCase());
        const uniqueAddresses = new Set(addressesLc);

        expect(uniqueAddresses.size).toBe(result.length);
      }),
      { numRuns: 100 }
    );
  });

  // Property 18.2: All networks from input rows are preserved in output
  test('all networks from input rows are preserved in output', () => {
    fc.assert(
      fc.property(fc.array(walletRowGenerator, { minLength: 1, maxLength: 50 }), (rows) => {
        const result = adaptWalletRows(rows);

        // For each unique address in input, verify all its networks are in output
        const inputNetworksByAddressLc = new Map<string, Set<string>>();

        for (const row of rows) {
          const addressLc = row.address.toLowerCase();
          if (!inputNetworksByAddressLc.has(addressLc)) {
            inputNetworksByAddressLc.set(addressLc, new Set());
          }
          inputNetworksByAddressLc.get(addressLc)!.add(row.chain_namespace);
        }

        for (const wallet of result) {
          const addressLc = wallet.address.toLowerCase();
          const expectedNetworks = inputNetworksByAddressLc.get(addressLc);

          expect(expectedNetworks).toBeDefined();
          expect(wallet.networks.length).toBe(expectedNetworks!.size);

          for (const network of expectedNetworks!) {
            expect(wallet.networks).toContain(network);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  // Property 18.3: Original address casing is preserved
  test('original address casing from first occurrence is preserved', () => {
    fc.assert(
      fc.property(fc.array(walletRowGenerator, { minLength: 1, maxLength: 50 }), (rows) => {
        if (rows.length === 0) return;

        const result = adaptWalletRows(rows);

        // For each output wallet, verify its address matches the first input row's casing
        for (const wallet of result) {
          const matchingInputRow = rows.find(
            (r) => r.address.toLowerCase() === wallet.address.toLowerCase()
          );

          expect(matchingInputRow).toBeDefined();
          // The output should preserve the original casing from the first matching row
          expect(wallet.address).toBe(matchingInputRow!.address);
        }
      }),
      { numRuns: 100 }
    );
  });

  // Property 18.4: Primary status is correctly determined
  test('is_primary is true if any row for address is primary', () => {
    fc.assert(
      fc.property(fc.array(walletRowGenerator, { minLength: 1, maxLength: 50 }), (rows) => {
        const result = adaptWalletRows(rows);

        // For each output wallet, verify is_primary matches input
        for (const wallet of result) {
          const inputRowsForAddress = rows.filter(
            (r) => r.address.toLowerCase() === wallet.address.toLowerCase()
          );

          const anyRowIsPrimary = inputRowsForAddress.some((r) => r.is_primary === true);

          expect(wallet.is_primary).toBe(anyRowIsPrimary);
        }
      }),
      { numRuns: 100 }
    );
  });

  // Property 18.5: hasWalletNetwork is consistent with output
  test('hasWalletNetwork returns true iff network is in output', () => {
    fc.assert(
      fc.property(
        fc.array(walletRowGenerator, { minLength: 1, maxLength: 50 }),
        chainNamespaceGenerator,
        (rows, testNetwork) => {
          const result = adaptWalletRows(rows);

          for (const wallet of result) {
            const hasNetwork = hasWalletNetwork(result, wallet.address, testNetwork);
            const networkInOutput = wallet.networks.includes(testNetwork);

            expect(hasNetwork).toBe(networkInOutput);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 18.6: getMissingNetworks returns correct missing networks
  test('getMissingNetworks returns only networks not in wallet.networks', () => {
    fc.assert(
      fc.property(
        fc.array(walletRowGenerator, { minLength: 1, maxLength: 50 }),
        fc.array(chainNamespaceGenerator, { minLength: 1, maxLength: 5, uniqueBy: (x) => x }),
        (rows, supportedNetworks) => {
          const result = adaptWalletRows(rows);

          for (const wallet of result) {
            const missing = getMissingNetworks(wallet, supportedNetworks);

            // All missing networks should NOT be in wallet.networks
            for (const network of missing) {
              expect(wallet.networks).not.toContain(network);
            }

            // All networks in wallet.networks that are in supportedNetworks should NOT be in missing
            for (const network of wallet.networks) {
              if (supportedNetworks.includes(network)) {
                expect(missing).not.toContain(network);
              }
            }

            // Missing + wallet.networks (filtered to supported) should equal supportedNetworks
            const walletNetworksInSupported = wallet.networks.filter((n) =>
              supportedNetworks.includes(n)
            );
            const combined = new Set([...walletNetworksInSupported, ...missing]);
            const supportedSet = new Set(supportedNetworks);

            expect(combined).toEqual(supportedSet);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 18.7: isWalletNetworkMissing is inverse of hasWalletNetwork
  test('isWalletNetworkMissing is inverse of hasWalletNetwork', () => {
    fc.assert(
      fc.property(
        fc.array(walletRowGenerator, { minLength: 1, maxLength: 50 }),
        chainNamespaceGenerator,
        (rows, testNetwork) => {
          const result = adaptWalletRows(rows);

          for (const wallet of result) {
            const isMissing = isWalletNetworkMissing(wallet, testNetwork);
            const hasNetwork = hasWalletNetwork(result, wallet.address, testNetwork);

            // They should be inverses
            expect(isMissing).toBe(!hasNetwork);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 18.8: Empty input produces empty output
  test('empty input produces empty output', () => {
    fc.assert(
      fc.property(fc.constant([]), (rows) => {
        const result = adaptWalletRows(rows);
        expect(result).toEqual([]);
      })
    );
  });

  // Property 18.9: Output length equals unique addresses in input
  test('output length equals number of unique addresses (case-insensitive)', () => {
    fc.assert(
      fc.property(fc.array(walletRowGenerator, { minLength: 1, maxLength: 50 }), (rows) => {
        const result = adaptWalletRows(rows);

        // Count unique addresses in input (case-insensitive)
        const uniqueAddressesLc = new Set(rows.map((r) => r.address.toLowerCase()));

        expect(result.length).toBe(uniqueAddressesLc.size);
      }),
      { numRuns: 100 }
    );
  });

  // Property 18.10: Timestamps are correctly merged
  test('created_at is earliest and updated_at is latest from input rows', () => {
    fc.assert(
      fc.property(fc.array(walletRowGenerator, { minLength: 1, maxLength: 50 }), (rows) => {
        const result = adaptWalletRows(rows);

        for (const wallet of result) {
          const inputRowsForAddress = rows.filter(
            (r) => r.address.toLowerCase() === wallet.address.toLowerCase()
          );

          const timestamps = inputRowsForAddress.map((r) => new Date(r.created_at).getTime());
          const minCreatedAt = Math.min(...timestamps);
          const expectedCreatedAt = new Date(minCreatedAt).toISOString();

          // Check that created_at is the earliest
          expect(new Date(wallet.created_at).getTime()).toBe(minCreatedAt);

          const updatedTimestamps = inputRowsForAddress.map((r) => new Date(r.updated_at).getTime());
          const maxUpdatedAt = Math.max(...updatedTimestamps);

          // Check that updated_at is the latest
          expect(new Date(wallet.updated_at).getTime()).toBe(maxUpdatedAt);
        }
      }),
      { numRuns: 100 }
    );
  });
});
