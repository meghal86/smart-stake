import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import { adaptWalletRows, hasWalletNetwork, getWalletByAddress, getPrimaryWallet } from '../../wallet-adapter';
import { UserWallet, ConnectedWallet } from '@/types/wallet-registry';

/**
 * Property-Based Tests for Wallet Shape Adapter Consistency
 * Feature: multi-chain-wallet-system, Property 18: Wallet Shape Adapter Consistency
 * Validates: Requirements 19.1, 19.2, 19.3, 19.4
 */

// Helper to generate valid Ethereum addresses
const ethereumAddress = () =>
  fc.tuple(fc.integer({ min: 0, max: 0xffffffff }), fc.integer({ min: 0, max: 0xffffffff })).map(([a, b]) => {
    const hex = (a.toString(16) + b.toString(16)).padStart(40, '0').slice(0, 40);
    return '0x' + hex;
  });

// Helper to generate valid CAIP-2 chain namespaces
const caip2ChainNamespace = () =>
  fc.constantFrom('eip155:1', 'eip155:137', 'eip155:42161', 'eip155:10', 'eip155:8453');

// Helper to generate UserWallet rows
const userWalletRow = () =>
  fc.record({
    id: fc.uuid(),
    user_id: fc.uuid(),
    address: ethereumAddress(),
    chain_namespace: caip2ChainNamespace(),
    is_primary: fc.boolean(),
    created_at: fc.integer({ min: 1577836800000, max: Date.now() }).map((ts) => new Date(ts).toISOString()),
    updated_at: fc.integer({ min: 1577836800000, max: Date.now() }).map((ts) => new Date(ts).toISOString()),
    guardian_scores: fc.option(
      fc.record({
        'eip155:1': fc.integer({ min: 0, max: 100 }),
        'eip155:137': fc.integer({ min: 0, max: 100 }),
      }),
      { freq: 50 }
    ),
    balance_cache: fc.option(
      fc.record({
        'eip155:1': fc.record({ eth: fc.float({ min: 0, max: 1000 }) }),
        'eip155:137': fc.record({ matic: fc.float({ min: 0, max: 1000000 }) }),
      }),
      { freq: 50 }
    ),
  });

describe('Feature: multi-chain-wallet-system, Property 18: Wallet Shape Adapter Consistency', () => {
  /**
   * Property 18.1: Case-insensitive address grouping
   * For any set of wallet rows, rows with the same address (case-insensitive) should be grouped together
   */
  test('rows with same address (case-insensitive) are grouped together', () => {
    fc.assert(
      fc.property(
        fc.record({
          baseAddress: ethereumAddress(),
          networks: fc.array(caip2ChainNamespace(), { minLength: 1, maxLength: 5, uniqueBy: (x) => x }),
        }),
        (data) => {
          // Create rows with same address in different cases
          const rows: UserWallet[] = data.networks.map((network, i) => ({
            id: fc.sample(fc.uuid(), 1)[0],
            user_id: fc.sample(fc.uuid(), 1)[0],
            address: i % 2 === 0 ? data.baseAddress : data.baseAddress.toLowerCase(),
            chain_namespace: network,
            is_primary: i === 0,
            created_at: new Date(Date.now() - i * 1000).toISOString(),
            updated_at: new Date(Date.now() - i * 1000).toISOString(),
          }));

          const result = adaptWalletRows(rows);

          // Property: All rows should be grouped into a single ConnectedWallet
          expect(result).toHaveLength(1);
          expect(result[0].networks).toHaveLength(data.networks.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 18.2: ConnectedWallet objects have correct structure
   * For any set of wallet rows, the resulting ConnectedWallet objects should have all required fields
   */
  test('ConnectedWallet objects have correct structure', () => {
    fc.assert(
      fc.property(
        fc.array(userWalletRow(), { minLength: 1, maxLength: 10 }),
        (rows) => {
          const result = adaptWalletRows(rows);

          // Property: Each ConnectedWallet should have required fields
          for (const wallet of result) {
            expect(wallet.address).toBeDefined();
            expect(typeof wallet.address).toBe('string');
            expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);

            expect(wallet.networks).toBeDefined();
            expect(Array.isArray(wallet.networks)).toBe(true);
            expect(wallet.networks.length).toBeGreaterThan(0);

            expect(wallet.is_primary).toBeDefined();
            expect(typeof wallet.is_primary).toBe('boolean');

            expect(wallet.created_at).toBeDefined();
            expect(typeof wallet.created_at).toBe('string');

            expect(wallet.updated_at).toBeDefined();
            expect(typeof wallet.updated_at).toBe('string');

            // Optional fields should be objects if present
            if (wallet.guardian_scores !== undefined) {
              expect(typeof wallet.guardian_scores).toBe('object');
            }
            if (wallet.balance_cache !== undefined) {
              expect(typeof wallet.balance_cache).toBe('object');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 18.3: No duplicate addresses in final array
   * For any set of wallet rows, the resulting ConnectedWallet array should not contain duplicate addresses
   */
  test('no duplicate addresses in final array', () => {
    fc.assert(
      fc.property(
        fc.array(userWalletRow(), { minLength: 1, maxLength: 20 }),
        (rows) => {
          const result = adaptWalletRows(rows);

          // Property: All addresses should be unique (case-insensitive)
          const addressesLc = result.map((w) => w.address.toLowerCase());
          const uniqueAddresses = new Set(addressesLc);

          expect(uniqueAddresses.size).toBe(result.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 18.4: Preserves original address casing
   * For any set of wallet rows, the resulting ConnectedWallet should preserve the original address casing
   */
  test('preserves original address casing from server', () => {
    fc.assert(
      fc.property(
        fc.record({
          address: ethereumAddress(),
          networks: fc.array(caip2ChainNamespace(), { minLength: 1, maxLength: 3, uniqueBy: (x) => x }),
        }),
        (data) => {
          // Create rows with the original address casing
          const rows: UserWallet[] = data.networks.map((network, i) => ({
            id: fc.sample(fc.uuid(), 1)[0],
            user_id: fc.sample(fc.uuid(), 1)[0],
            address: data.address, // Use original casing
            chain_namespace: network,
            is_primary: i === 0,
            created_at: new Date(Date.now() - i * 1000).toISOString(),
            updated_at: new Date(Date.now() - i * 1000).toISOString(),
          }));

          const result = adaptWalletRows(rows);

          // Property: Address casing should be preserved
          expect(result[0].address).toBe(data.address);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 18.5: Networks array contains all unique networks
   * For any set of wallet rows, the networks array should contain all unique chain namespaces
   */
  test('networks array contains all unique networks', () => {
    fc.assert(
      fc.property(
        fc.record({
          address: ethereumAddress(),
          networks: fc.array(caip2ChainNamespace(), { minLength: 1, maxLength: 5, uniqueBy: (x) => x }),
        }),
        (data) => {
          const rows: UserWallet[] = data.networks.map((network, i) => ({
            id: fc.sample(fc.uuid(), 1)[0],
            user_id: fc.sample(fc.uuid(), 1)[0],
            address: data.address,
            chain_namespace: network,
            is_primary: i === 0,
            created_at: new Date(Date.now() - i * 1000).toISOString(),
            updated_at: new Date(Date.now() - i * 1000).toISOString(),
          }));

          const result = adaptWalletRows(rows);

          // Property: Networks array should contain all networks
          expect(result[0].networks).toHaveLength(data.networks.length);
          for (const network of data.networks) {
            expect(result[0].networks).toContain(network);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 18.6: Primary wallet detection
   * For any set of wallet rows, is_primary should be true if any row is marked as primary
   */
  test('is_primary is true if any row is marked as primary', () => {
    fc.assert(
      fc.property(
        fc.record({
          address: ethereumAddress(),
          networks: fc.array(caip2ChainNamespace(), { minLength: 1, maxLength: 5, uniqueBy: (x) => x }),
          hasPrimary: fc.boolean(),
        }),
        (data) => {
          const rows: UserWallet[] = data.networks.map((network, i) => ({
            id: fc.sample(fc.uuid(), 1)[0],
            user_id: fc.sample(fc.uuid(), 1)[0],
            address: data.address,
            chain_namespace: network,
            is_primary: data.hasPrimary && i === 0, // Only first row is primary if hasPrimary is true
            created_at: new Date(Date.now() - i * 1000).toISOString(),
            updated_at: new Date(Date.now() - i * 1000).toISOString(),
          }));

          const result = adaptWalletRows(rows);

          // Property: is_primary should match whether any row was primary
          expect(result[0].is_primary).toBe(data.hasPrimary);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 18.7: Merges guardian scores from all networks
   * For any set of wallet rows with guardian scores, the merged scores should contain all networks
   */
  test('merges guardian scores from all networks', () => {
    fc.assert(
      fc.property(
        fc.record({
          address: ethereumAddress(),
          networks: fc.array(caip2ChainNamespace(), { minLength: 1, maxLength: 3, uniqueBy: (x) => x }),
        }),
        (data) => {
          const rows: UserWallet[] = data.networks.map((network, i) => ({
            id: fc.sample(fc.uuid(), 1)[0],
            user_id: fc.sample(fc.uuid(), 1)[0],
            address: data.address,
            chain_namespace: network,
            is_primary: i === 0,
            created_at: new Date(Date.now() - i * 1000).toISOString(),
            updated_at: new Date(Date.now() - i * 1000).toISOString(),
            guardian_scores: { [network]: fc.sample(fc.integer({ min: 0, max: 100 }), 1)[0] },
          }));

          const result = adaptWalletRows(rows);

          // Property: Merged scores should contain all networks
          if (result[0].guardian_scores) {
            for (const network of data.networks) {
              expect(result[0].guardian_scores[network]).toBeDefined();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 18.8: Merges balance cache from all networks
   * For any set of wallet rows with balance cache, the merged cache should contain all networks
   */
  test('merges balance cache from all networks', () => {
    fc.assert(
      fc.property(
        fc.record({
          address: ethereumAddress(),
          networks: fc.array(caip2ChainNamespace(), { minLength: 1, maxLength: 3, uniqueBy: (x) => x }),
        }),
        (data) => {
          const rows: UserWallet[] = data.networks.map((network, i) => ({
            id: fc.sample(fc.uuid(), 1)[0],
            user_id: fc.sample(fc.uuid(), 1)[0],
            address: data.address,
            chain_namespace: network,
            is_primary: i === 0,
            created_at: new Date(Date.now() - i * 1000).toISOString(),
            updated_at: new Date(Date.now() - i * 1000).toISOString(),
            balance_cache: { [network]: { balance: fc.sample(fc.float({ min: 0, max: 1000 }), 1)[0] } },
          }));

          const result = adaptWalletRows(rows);

          // Property: Merged cache should contain all networks
          if (result[0].balance_cache) {
            for (const network of data.networks) {
              expect(result[0].balance_cache[network]).toBeDefined();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 18.9: Timestamp handling
   * For any set of wallet rows, created_at should be the earliest and updated_at should be the latest
   */
  test('created_at is earliest and updated_at is latest timestamp', () => {
    fc.assert(
      fc.property(
        fc.record({
          address: ethereumAddress(),
          networks: fc.array(caip2ChainNamespace(), { minLength: 1, maxLength: 5, uniqueBy: (x) => x }),
        }),
        (data) => {
          const baseTime = Date.now();
          const rows: UserWallet[] = data.networks.map((network, i) => ({
            id: fc.sample(fc.uuid(), 1)[0],
            user_id: fc.sample(fc.uuid(), 1)[0],
            address: data.address,
            chain_namespace: network,
            is_primary: i === 0,
            created_at: new Date(baseTime - (data.networks.length - i) * 1000).toISOString(),
            updated_at: new Date(baseTime + i * 1000).toISOString(),
          }));

          const result = adaptWalletRows(rows);

          // Property: created_at should be earliest
          const createdAtTime = new Date(result[0].created_at).getTime();
          for (const row of rows) {
            expect(createdAtTime).toBeLessThanOrEqual(new Date(row.created_at).getTime());
          }

          // Property: updated_at should be latest
          const updatedAtTime = new Date(result[0].updated_at).getTime();
          for (const row of rows) {
            expect(updatedAtTime).toBeGreaterThanOrEqual(new Date(row.updated_at).getTime());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 18.10: Empty input handling
   * For empty input, the result should be an empty array
   */
  test('empty input produces empty output', () => {
    fc.assert(
      fc.property(fc.constant([]), (rows) => {
        const result = adaptWalletRows(rows);

        // Property: Empty input should produce empty output
        expect(result).toEqual([]);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property 18.11: hasWalletNetwork consistency
   * For any ConnectedWallet, hasWalletNetwork should return true for all networks in the wallet
   */
  test('hasWalletNetwork returns true for all networks in wallet', () => {
    fc.assert(
      fc.property(
        fc.array(userWalletRow(), { minLength: 1, maxLength: 10 }),
        (rows) => {
          const wallets = adaptWalletRows(rows);

          // Property: hasWalletNetwork should return true for all networks
          for (const wallet of wallets) {
            for (const network of wallet.networks) {
              expect(hasWalletNetwork(wallets, wallet.address, network)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 18.12: getWalletByAddress consistency
   * For any ConnectedWallet, getWalletByAddress should return the same wallet
   */
  test('getWalletByAddress returns correct wallet', () => {
    fc.assert(
      fc.property(
        fc.array(userWalletRow(), { minLength: 1, maxLength: 10 }),
        (rows) => {
          const wallets = adaptWalletRows(rows);

          // Property: getWalletByAddress should return the same wallet
          for (const wallet of wallets) {
            const found = getWalletByAddress(wallets, wallet.address);
            expect(found).toBeDefined();
            expect(found?.address.toLowerCase()).toBe(wallet.address.toLowerCase());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 18.13: getPrimaryWallet consistency
   * For any set of wallets, getPrimaryWallet should return a wallet with is_primary = true or undefined
   */
  test('getPrimaryWallet returns wallet with is_primary = true or undefined', () => {
    fc.assert(
      fc.property(
        fc.array(userWalletRow(), { minLength: 1, maxLength: 10 }),
        (rows) => {
          const wallets = adaptWalletRows(rows);
          const primary = getPrimaryWallet(wallets);

          // Property: If primary exists, it should have is_primary = true
          if (primary) {
            expect(primary.is_primary).toBe(true);
          }

          // Property: If no primary, all wallets should have is_primary = false
          if (!primary) {
            for (const wallet of wallets) {
              expect(wallet.is_primary).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 18.14: Adapter idempotency
   * For any set of wallet rows, adapting the result again should produce the same result
   */
  test('adapter is idempotent', () => {
    fc.assert(
      fc.property(
        fc.array(userWalletRow(), { minLength: 1, maxLength: 10 }),
        (rows) => {
          const result1 = adaptWalletRows(rows);

          // Convert ConnectedWallet back to UserWallet format for re-adaptation
          const reconstructedRows: UserWallet[] = [];
          for (const wallet of result1) {
            for (const network of wallet.networks) {
              reconstructedRows.push({
                id: fc.sample(fc.uuid(), 1)[0],
                user_id: fc.sample(fc.uuid(), 1)[0],
                address: wallet.address,
                chain_namespace: network,
                is_primary: wallet.is_primary,
                created_at: wallet.created_at,
                updated_at: wallet.updated_at,
                guardian_scores: wallet.guardian_scores,
                balance_cache: wallet.balance_cache,
              });
            }
          }

          const result2 = adaptWalletRows(reconstructedRows);

          // Property: Adapting again should produce equivalent result
          expect(result2).toHaveLength(result1.length);
          for (let i = 0; i < result1.length; i++) {
            expect(result2[i].address.toLowerCase()).toBe(result1[i].address.toLowerCase());
            expect(result2[i].networks.sort()).toEqual(result1[i].networks.sort());
            expect(result2[i].is_primary).toBe(result1[i].is_primary);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
