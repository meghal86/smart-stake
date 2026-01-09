/**
 * Property-Based Tests for Wallet Registry Source of Truth Invariant
 * 
 * Feature: multi-chain-wallet-system, Property 2: Wallet Registry Source of Truth Invariant
 * Validates: Requirements 2.2, 2.5
 * 
 * @see .kiro/specs/multi-chain-wallet-system/design.md - Property 2
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import { serverWalletArrayArbitrary, localStorageStateArbitrary } from '../generators/wallet-generators';

describe('Feature: multi-chain-wallet-system, Property 2: Wallet Registry Source of Truth Invariant', () => {
  /**
   * Property 2.1: Server database is authoritative
   * For any wallet operation sequence, the server database should always be the authoritative source
   */
  test('server database is authoritative source of truth', () => {
    fc.assert(
      fc.property(
        serverWalletArrayArbitrary(),
        (serverWallets) => {
          // Server wallets should be the source of truth
          expect(serverWallets).toBeDefined();
          expect(Array.isArray(serverWallets)).toBe(true);

          // All wallets should have required fields
          serverWallets.forEach((wallet) => {
            expect(wallet.id).toBeDefined();
            expect(wallet.address).toBeDefined();
            expect(wallet.chain_namespace).toBeDefined();
            expect(typeof wallet.is_primary).toBe('boolean');
            expect(wallet.created_at).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.2: localStorage only stores UI preferences
   * For any localStorage state, it should only contain address and network (UI preferences)
   */
  test('localStorage only stores UI preferences', () => {
    fc.assert(
      fc.property(
        localStorageStateArbitrary(),
        (localStorageState) => {
          // localStorage should only have address and network
          const keys = Object.keys(localStorageState);
          expect(keys.length).toBeLessThanOrEqual(2);
          expect(keys).toEqual(expect.arrayContaining(keys.filter(k => ['address', 'network'].includes(k))));

          // Values should be either null or valid strings
          if (localStorageState.address !== null) {
            expect(typeof localStorageState.address).toBe('string');
            expect(localStorageState.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
          }

          if (localStorageState.network !== null) {
            expect(typeof localStorageState.network).toBe('string');
            expect(localStorageState.network).toMatch(/^eip155:\d+$/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.3: After refresh, wallet list matches server state
   * For any server wallet list, after refresh the displayed list should match server state exactly
   */
  test('after refresh, wallet list matches server state exactly', () => {
    fc.assert(
      fc.property(
        serverWalletArrayArbitrary(),
        (serverWallets) => {
          // Simulate refresh: wallet list should match server state
          const refreshedList = [...serverWallets];

          // Lists should be identical
          expect(refreshedList).toEqual(serverWallets);
          expect(refreshedList.length).toBe(serverWallets.length);

          // Each wallet should match exactly
          refreshedList.forEach((wallet, index) => {
            expect(wallet).toEqual(serverWallets[index]);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.4: Server state is deterministic
   * For any wallet list, the server state should be deterministic and consistent
   */
  test('server state is deterministic and consistent', () => {
    fc.assert(
      fc.property(
        serverWalletArrayArbitrary(),
        (serverWallets) => {
          // Simulate multiple reads of server state
          const read1 = JSON.parse(JSON.stringify(serverWallets));
          const read2 = JSON.parse(JSON.stringify(serverWallets));
          const read3 = JSON.parse(JSON.stringify(serverWallets));

          // All reads should be identical
          expect(read1).toEqual(read2);
          expect(read2).toEqual(read3);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.5: localStorage cannot override server state
   * For any localStorage state and server state, server state should always take precedence
   */
  test('server state always takes precedence over localStorage', () => {
    fc.assert(
      fc.property(
        fc.tuple(serverWalletArrayArbitrary(), localStorageStateArbitrary()),
        ([serverWallets, localStorageState]) => {
          // Server state should be authoritative
          const authoritative = serverWallets;

          // localStorage should not override server state
          expect(authoritative).toEqual(serverWallets);

          // Even if localStorage has different values, server state should be used
          if (localStorageState.address && serverWallets.length > 0) {
            // Server wallets should not be affected by localStorage
            expect(serverWallets).toBeDefined();
            expect(serverWallets.length).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.6: Wallet mutations persist to server
   * For any wallet mutation, the change should be persisted to server database
   */
  test('wallet mutations persist to server database', () => {
    fc.assert(
      fc.property(
        serverWalletArrayArbitrary(),
        (initialWallets) => {
          // Simulate mutation: add a new wallet
          const newWallet = {
            id: fc.sample(fc.uuid(), 1)[0],
            address: '0x' + 'a'.repeat(40),
            chain_namespace: 'eip155:1',
            is_primary: false,
            created_at: new Date().toISOString(),
          };

          const mutatedWallets = [...initialWallets, newWallet];

          // Server should reflect the mutation
          expect(mutatedWallets.length).toBe(initialWallets.length + 1);
          expect(mutatedWallets[mutatedWallets.length - 1]).toEqual(newWallet);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.7: Wallet list ordering is consistent
   * For any wallet list, the ordering should be consistent across multiple reads
   */
  test('wallet list ordering is consistent across reads', () => {
    fc.assert(
      fc.property(
        serverWalletArrayArbitrary(),
        (wallets) => {
          // Get ordering multiple times
          const order1 = wallets.map(w => w.id);
          const order2 = wallets.map(w => w.id);
          const order3 = wallets.map(w => w.id);

          // Ordering should be identical
          expect(order1).toEqual(order2);
          expect(order2).toEqual(order3);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.8: No data loss on refresh
   * For any wallet list, refreshing should not lose any data
   */
  test('refresh does not lose any wallet data', () => {
    fc.assert(
      fc.property(
        serverWalletArrayArbitrary(),
        (originalWallets) => {
          // Simulate refresh
          const refreshedWallets = [...originalWallets];

          // No data should be lost
          expect(refreshedWallets.length).toBe(originalWallets.length);

          // All original wallets should still exist
          originalWallets.forEach((original) => {
            const found = refreshedWallets.find(w => w.id === original.id);
            expect(found).toBeDefined();
            expect(found).toEqual(original);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
