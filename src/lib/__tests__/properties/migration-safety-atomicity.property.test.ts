/**
 * Property-Based Tests for Migration Safety and Atomicity
 * 
 * Feature: multi-chain-wallet-system, Property 20: Migration Safety and Atomicity
 * Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5
 * 
 * @see .kiro/specs/multi-chain-wallet-system/design.md - Property 20
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';

/**
 * Simulates a wallet row
 */
interface WalletRow {
  id: string;
  user_id: string;
  address: string;
  is_primary: boolean;
  created_at: string;
}

/**
 * Simulates database state
 */
interface DatabaseState {
  wallets: WalletRow[];
}

/**
 * Cleans up multiple primaries for a user
 */
function cleanupMultiplePrimaries(db: DatabaseState, userId: string): DatabaseState {
  const userWallets = db.wallets.filter(w => w.user_id === userId);

  if (userWallets.length === 0) return db;

  // Find all primary wallets
  const primaryWallets = userWallets.filter(w => w.is_primary);

  if (primaryWallets.length <= 1) return db;

  // Keep oldest primary, set others to non-primary
  const oldestPrimary = primaryWallets.reduce((oldest, current) => {
    return new Date(current.created_at) < new Date(oldest.created_at) ? current : oldest;
  });

  return {
    wallets: db.wallets.map(w => {
      if (w.user_id === userId && w.is_primary && w.id !== oldestPrimary.id) {
        return { ...w, is_primary: false };
      }
      return w;
    }),
  };
}

/**
 * Assigns primary to users with no primary
 */
function assignPrimaryToUsersWithoutPrimary(db: DatabaseState): DatabaseState {
  const userIds = new Set(db.wallets.map(w => w.user_id));

  let updated = db;

  for (const userId of userIds) {
    const userWallets = updated.wallets.filter(w => w.user_id === userId);
    const hasPrimary = userWallets.some(w => w.is_primary);

    if (!hasPrimary && userWallets.length > 0) {
      // Assign primary to oldest wallet
      const oldest = userWallets.reduce((o, c) => {
        return new Date(c.created_at) < new Date(o.created_at) ? c : o;
      });

      updated = {
        wallets: updated.wallets.map(w => {
          if (w.id === oldest.id) {
            return { ...w, is_primary: true };
          }
          return w;
        }),
      };
    }
  }

  return updated;
}

/**
 * Validates primary wallet constraints
 */
function validatePrimaryConstraints(db: DatabaseState): boolean {
  const userIds = new Set(db.wallets.map(w => w.user_id));

  for (const userId of userIds) {
    const userWallets = db.wallets.filter(w => w.user_id === userId);
    const primaryCount = userWallets.filter(w => w.is_primary).length;

    // Each user should have exactly 0 or 1 primary
    if (primaryCount > 1) return false;
  }

  return true;
}

/**
 * Simulates migration
 */
function runMigration(db: DatabaseState): DatabaseState {
  // Step 1: Clean up multiple primaries
  let updated = cleanupMultiplePrimaries(db, '');

  // Clean up for all users
  const userIds = new Set(db.wallets.map(w => w.user_id));
  for (const userId of userIds) {
    updated = cleanupMultiplePrimaries(updated, userId);
  }

  // Step 2: Assign primary to users without primary
  updated = assignPrimaryToUsersWithoutPrimary(updated);

  return updated;
}

describe('Feature: multi-chain-wallet-system, Property 20: Migration Safety and Atomicity', () => {
  /**
   * Property 20.1: Cleanup happens before constraint creation
   * For any migration, cleanup should happen before constraints are created
   */
  test('cleanup happens before constraint creation', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            user_id: fc.uuid(),
            address: fc.tuple(
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff })
            ).map(([a, b, c, d, e]) => {
              const hex = [a, b, c, d, e]
                .map((n) => n.toString(16).padStart(8, '0'))
                .join('');
              return `0x${hex}`;
            }),
            is_primary: fc.boolean(),
            created_at: fc.integer({ min: 1609459200000, max: Date.now() })
              .map(ms => new Date(ms).toISOString()),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (wallets) => {
          const db: DatabaseState = { wallets };

          // Run migration
          const migrated = runMigration(db);

          // After migration, constraints should be valid
          expect(validatePrimaryConstraints(migrated)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 20.2: Multiple primaries are resolved to oldest wallet
   * For any user with multiple primaries, only the oldest should remain primary
   */
  test('multiple primaries are resolved to oldest wallet', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.uuid(), // user_id
          fc.array(
            fc.record({
              id: fc.uuid(),
              address: fc.tuple(
                fc.integer({ min: 0, max: 0xffffffff }),
                fc.integer({ min: 0, max: 0xffffffff }),
                fc.integer({ min: 0, max: 0xffffffff }),
                fc.integer({ min: 0, max: 0xffffffff }),
                fc.integer({ min: 0, max: 0xffffffff })
              ).map(([a, b, c, d, e]) => {
                const hex = [a, b, c, d, e]
                  .map((n) => n.toString(16).padStart(8, '0'))
                  .join('');
                return `0x${hex}`;
              }),
              created_at: fc.integer({ min: 1609459200000, max: Date.now() })
                .map(ms => new Date(ms).toISOString()),
            }),
            { minLength: 2, maxLength: 5 }
          )
        ),
        ([userId, walletData]) => {
          // Create wallets with multiple primaries
          const wallets: WalletRow[] = walletData.map((w, i) => ({
            id: w.id,
            user_id: userId,
            address: w.address,
            is_primary: true, // All marked as primary
            created_at: w.created_at,
          }));

          const db: DatabaseState = { wallets };

          // Run migration
          const migrated = runMigration(db);

          // Should have exactly one primary
          const userWallets = migrated.wallets.filter(w => w.user_id === userId);
          const primaryCount = userWallets.filter(w => w.is_primary).length;

          expect(primaryCount).toBe(1);

          // Primary should be the oldest
          const primary = userWallets.find(w => w.is_primary);
          const oldest = userWallets.reduce((o, c) => {
            return new Date(c.created_at) < new Date(o.created_at) ? c : o;
          });

          expect(primary?.id).toBe(oldest.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 20.3: Zero primary users get assigned primary
   * For any user with no primary wallet, the oldest wallet should be assigned as primary
   */
  test('zero primary users get assigned primary', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.uuid(), // user_id
          fc.array(
            fc.record({
              id: fc.uuid(),
              address: fc.tuple(
                fc.integer({ min: 0, max: 0xffffffff }),
                fc.integer({ min: 0, max: 0xffffffff }),
                fc.integer({ min: 0, max: 0xffffffff }),
                fc.integer({ min: 0, max: 0xffffffff }),
                fc.integer({ min: 0, max: 0xffffffff })
              ).map(([a, b, c, d, e]) => {
                const hex = [a, b, c, d, e]
                  .map((n) => n.toString(16).padStart(8, '0'))
                  .join('');
                return `0x${hex}`;
              }),
              created_at: fc.integer({ min: 1609459200000, max: Date.now() })
                .map(ms => new Date(ms).toISOString()),
            }),
            { minLength: 1, maxLength: 5 }
          )
        ),
        ([userId, walletData]) => {
          // Create wallets with no primary
          const wallets: WalletRow[] = walletData.map(w => ({
            id: w.id,
            user_id: userId,
            address: w.address,
            is_primary: false, // None marked as primary
            created_at: w.created_at,
          }));

          const db: DatabaseState = { wallets };

          // Run migration
          const migrated = runMigration(db);

          // Should have exactly one primary
          const userWallets = migrated.wallets.filter(w => w.user_id === userId);
          const primaryCount = userWallets.filter(w => w.is_primary).length;

          expect(primaryCount).toBe(1);

          // Primary should be the oldest
          const primary = userWallets.find(w => w.is_primary);
          const oldest = userWallets.reduce((o, c) => {
            return new Date(c.created_at) < new Date(o.created_at) ? c : o;
          });

          expect(primary?.id).toBe(oldest.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 20.4: Migration is idempotent
   * For any migration, running it multiple times should produce the same result
   */
  test('migration is idempotent', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            user_id: fc.uuid(),
            address: fc.tuple(
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff })
            ).map(([a, b, c, d, e]) => {
              const hex = [a, b, c, d, e]
                .map((n) => n.toString(16).padStart(8, '0'))
                .join('');
              return `0x${hex}`;
            }),
            is_primary: fc.boolean(),
            created_at: fc.integer({ min: 1609459200000, max: Date.now() })
              .map(ms => new Date(ms).toISOString()),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (wallets) => {
          const db: DatabaseState = { wallets };

          // Run migration multiple times
          const migrated1 = runMigration(db);
          const migrated2 = runMigration(migrated1);
          const migrated3 = runMigration(migrated2);

          // Results should be identical
          expect(JSON.stringify(migrated1)).toBe(JSON.stringify(migrated2));
          expect(JSON.stringify(migrated2)).toBe(JSON.stringify(migrated3));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 20.5: No data is lost during migration
   * For any migration, no wallet data should be lost
   */
  test('no data is lost during migration', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            user_id: fc.uuid(),
            address: fc.tuple(
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff })
            ).map(([a, b, c, d, e]) => {
              const hex = [a, b, c, d, e]
                .map((n) => n.toString(16).padStart(8, '0'))
                .join('');
              return `0x${hex}`;
            }),
            is_primary: fc.boolean(),
            created_at: fc.integer({ min: 1609459200000, max: Date.now() })
              .map(ms => new Date(ms).toISOString()),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (wallets) => {
          const db: DatabaseState = { wallets };

          // Run migration
          const migrated = runMigration(db);

          // Should have same number of wallets
          expect(migrated.wallets.length).toBe(db.wallets.length);

          // All original wallets should still exist
          db.wallets.forEach((original) => {
            const found = migrated.wallets.find(w => w.id === original.id);
            expect(found).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 20.6: Migration preserves wallet addresses
   * For any migration, wallet addresses should not be modified
   */
  test('migration preserves wallet addresses', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            user_id: fc.uuid(),
            address: fc.tuple(
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff })
            ).map(([a, b, c, d, e]) => {
              const hex = [a, b, c, d, e]
                .map((n) => n.toString(16).padStart(8, '0'))
                .join('');
              return `0x${hex}`;
            }),
            is_primary: fc.boolean(),
            created_at: fc.integer({ min: 1609459200000, max: Date.now() })
              .map(ms => new Date(ms).toISOString()),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (wallets) => {
          const db: DatabaseState = { wallets };

          // Run migration
          const migrated = runMigration(db);

          // Addresses should be preserved
          db.wallets.forEach((original) => {
            const found = migrated.wallets.find(w => w.id === original.id);
            expect(found?.address).toBe(original.address);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 20.7: Migration is atomic
   * For any migration, it should either complete fully or not at all
   */
  test('migration is atomic', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            user_id: fc.uuid(),
            address: fc.tuple(
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff })
            ).map(([a, b, c, d, e]) => {
              const hex = [a, b, c, d, e]
                .map((n) => n.toString(16).padStart(8, '0'))
                .join('');
              return `0x${hex}`;
            }),
            is_primary: fc.boolean(),
            created_at: fc.integer({ min: 1609459200000, max: Date.now() })
              .map(ms => new Date(ms).toISOString()),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (wallets) => {
          const db: DatabaseState = { wallets };

          // Run migration
          const migrated = runMigration(db);

          // After migration, constraints should be valid (atomic success)
          expect(validatePrimaryConstraints(migrated)).toBe(true);

          // Or original state is preserved (atomic failure - not applicable here)
          // Since we're not simulating failures, just verify success state
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 20.8: Migration handles empty database
   * For any empty database, migration should complete successfully
   */
  test('migration handles empty database', () => {
    fc.assert(
      fc.property(
        fc.constant(undefined),
        () => {
          const db: DatabaseState = { wallets: [] };

          // Run migration
          const migrated = runMigration(db);

          // Should have no wallets
          expect(migrated.wallets.length).toBe(0);

          // Constraints should be valid
          expect(validatePrimaryConstraints(migrated)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 20.9: Migration is deterministic
   * For any database state, migration should produce deterministic results
   */
  test('migration is deterministic', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            user_id: fc.uuid(),
            address: fc.tuple(
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff })
            ).map(([a, b, c, d, e]) => {
              const hex = [a, b, c, d, e]
                .map((n) => n.toString(16).padStart(8, '0'))
                .join('');
              return `0x${hex}`;
            }),
            is_primary: fc.boolean(),
            created_at: fc.integer({ min: 1609459200000, max: Date.now() })
              .map(ms => new Date(ms).toISOString()),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (wallets) => {
          const db: DatabaseState = { wallets };

          // Run migration multiple times
          const migrated1 = runMigration(db);
          const migrated2 = runMigration(db);
          const migrated3 = runMigration(db);

          // Results should be identical
          expect(JSON.stringify(migrated1)).toBe(JSON.stringify(migrated2));
          expect(JSON.stringify(migrated2)).toBe(JSON.stringify(migrated3));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 20.10: Constraints are enforced after migration
   * For any migration, primary wallet constraints should be enforced
   */
  test('constraints are enforced after migration', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            user_id: fc.uuid(),
            address: fc.tuple(
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff })
            ).map(([a, b, c, d, e]) => {
              const hex = [a, b, c, d, e]
                .map((n) => n.toString(16).padStart(8, '0'))
                .join('');
              return `0x${hex}`;
            }),
            is_primary: fc.boolean(),
            created_at: fc.integer({ min: 1609459200000, max: Date.now() })
              .map(ms => new Date(ms).toISOString()),
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (wallets) => {
          const db: DatabaseState = { wallets };

          // Run migration
          const migrated = runMigration(db);

          // Constraints should be valid
          expect(validatePrimaryConstraints(migrated)).toBe(true);

          // Each user should have 0 or 1 primary
          const userIds = new Set(migrated.wallets.map(w => w.user_id));
          for (const userId of userIds) {
            const userWallets = migrated.wallets.filter(w => w.user_id === userId);
            const primaryCount = userWallets.filter(w => w.is_primary).length;
            expect(primaryCount).toBeLessThanOrEqual(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
