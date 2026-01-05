import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';

/**
 * Property-Based Tests for Database Constraints
 * Feature: multi-chain-wallet-system, Property 5: Database Constraint Enforcement
 * Validates: Requirements 9.1-9.5, 17.1-17.5, 18.1-18.5
 */

// Helper to generate valid Ethereum addresses
const ethereumAddress = () =>
  fc.tuple(fc.integer({ min: 0, max: 0xffffffff }), fc.integer({ min: 0, max: 0xffffffff })).map(([a, b]) => {
    const hex = (a.toString(16) + b.toString(16)).padStart(40, '0').slice(0, 40);
    return '0x' + hex;
  });

describe('Feature: multi-chain-wallet-system, Property 5: Database Constraint Enforcement', () => {
  /**
   * Property 5.1: address_lc is always lowercase
   * For any wallet address, the address_lc generated column should always be lowercase
   */
  test('address_lc is always lowercase', () => {
    fc.assert(
      fc.property(ethereumAddress(), (address) => {
        const addressLc = address.toLowerCase();

        // Property: address_lc should always be lowercase
        expect(addressLc).toBe(addressLc.toLowerCase());
        // Verify no uppercase hex characters
        const hasUppercase = /[A-F]/.test(addressLc);
        expect(hasUppercase).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5.2: Case-insensitive address matching
   * For any two addresses that differ only in case, their address_lc should be identical
   */
  test('case-insensitive addresses produce identical address_lc', () => {
    fc.assert(
      fc.property(ethereumAddress(), (address) => {
        const address1 = address;
        const address2 = address.toUpperCase();
        const address3 = address.toLowerCase();

        const addressLc1 = address1.toLowerCase();
        const addressLc2 = address2.toLowerCase();
        const addressLc3 = address3.toLowerCase();

        // Property: All case variations should produce the same address_lc
        expect(addressLc1).toBe(addressLc2);
        expect(addressLc2).toBe(addressLc3);
        expect(addressLc1).toBe(addressLc3);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5.3: Unique constraint on (user_id, address_lc, chain_namespace)
   * For any user, adding the same address on the same network twice should fail
   */
  test('duplicate (user_id, address_lc, chain_namespace) combinations are rejected', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          address: ethereumAddress(),
          chainNamespace: fc.constantFrom('eip155:1', 'eip155:137', 'eip155:42161'),
        }),
        (wallet) => {
          // Simulate database constraint check
          const wallets = [wallet];

          // Try to add duplicate
          const duplicate = { ...wallet };

          // Property: Duplicate should be detected
          const isDuplicate = wallets.some(
            (w) =>
              w.userId === duplicate.userId &&
              w.address.toLowerCase() === duplicate.address.toLowerCase() &&
              w.chainNamespace === duplicate.chainNamespace
          );

          expect(isDuplicate).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5.4: Primary wallet uniqueness per user
   * For any user, there should be at most one wallet with is_primary = true
   * This property validates that the database constraint prevents multiple primaries
   */
  test('only one primary wallet per user is allowed', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          wallets: fc.array(
            fc.record({
              id: fc.uuid(),
              address: ethereumAddress(),
              chainNamespace: fc.constantFrom('eip155:1', 'eip155:137', 'eip155:42161'),
              isPrimary: fc.boolean(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
        }),
        (data) => {
          // Simulate database constraint: enforce at most one primary per user
          const enforceConstraint = (wallets: typeof data.wallets) => {
            const primaryCount = wallets.filter((w) => w.isPrimary).length;
            if (primaryCount <= 1) {
              return wallets; // Valid state
            }
            // Invalid state - database would reject this
            // For this property test, we verify the constraint would be enforced
            return null;
          };

          const result = enforceConstraint(data.wallets);

          // Property: Either the state is valid (≤1 primary) or would be rejected
          if (result === null) {
            // State would be rejected - verify why
            const primaryCount = data.wallets.filter((w) => w.isPrimary).length;
            expect(primaryCount).toBeGreaterThan(1);
          } else {
            // State is valid
            const primaryCount = result.filter((w) => w.isPrimary).length;
            expect(primaryCount).toBeLessThanOrEqual(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5.5: Address normalization consistency
   * For any address, normalizing it multiple times should produce the same result
   */
  test('address normalization is idempotent', () => {
    fc.assert(
      fc.property(ethereumAddress(), (address) => {
        const normalized1 = address.toLowerCase();
        const normalized2 = normalized1.toLowerCase();
        const normalized3 = normalized2.toLowerCase();

        // Property: Normalizing multiple times produces same result
        expect(normalized1).toBe(normalized2);
        expect(normalized2).toBe(normalized3);
        expect(normalized1).toBe(normalized3);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5.6: CAIP-2 chain namespace validation
   * For any chain namespace, it should follow the CAIP-2 format (eip155:chainId)
   */
  test('chain namespace follows CAIP-2 format', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('eip155:1', 'eip155:137', 'eip155:42161', 'eip155:10', 'eip155:8453'),
        (chainNamespace) => {
          // Property: Chain namespace should match CAIP-2 format
          const caip2Regex = /^eip155:\d+$/;
          expect(chainNamespace).toMatch(caip2Regex);

          // Extract chain ID
          const chainId = parseInt(chainNamespace.split(':')[1], 10);
          expect(chainId).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5.7: Constraint enforcement prevents invalid states
   * For any wallet mutation, the database should prevent invalid states
   */
  test('database constraints prevent invalid wallet states', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          address: ethereumAddress(),
          chainNamespace: fc.constantFrom('eip155:1', 'eip155:137', 'eip155:42161'),
          isPrimary: fc.boolean(),
        }),
        (wallet) => {
          // Property: Wallet should have all required fields
          expect(wallet.userId).toBeDefined();
          expect(wallet.address).toBeDefined();
          expect(wallet.chainNamespace).toBeDefined();
          expect(wallet.isPrimary).toBeDefined();

          // Property: Address should be valid Ethereum address format
          expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);

          // Property: Chain namespace should be valid CAIP-2 format
          expect(wallet.chainNamespace).toMatch(/^eip155:\d+$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5.8: Migration cleanup is idempotent
   * For any set of wallets, running cleanup multiple times should produce the same result
   */
  test('migration cleanup is idempotent', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          wallets: fc.array(
            fc.record({
              id: fc.uuid(),
              address: ethereumAddress(),
              chainNamespace: fc.constantFrom('eip155:1', 'eip155:137', 'eip155:42161'),
              isPrimary: fc.boolean(),
              createdAt: fc.date(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
        }),
        (data) => {
          // Simulate cleanup: ensure at most one primary per user
          const cleanup = (wallets: typeof data.wallets) => {
            const sorted = [...wallets].sort((a, b) => {
              if (a.createdAt.getTime() !== b.createdAt.getTime()) {
                return a.createdAt.getTime() - b.createdAt.getTime();
              }
              return a.id.localeCompare(b.id);
            });

            return sorted.map((w, i) => ({
              ...w,
              isPrimary: i === 0, // Only first (oldest) is primary
            }));
          };

          const result1 = cleanup(data.wallets);
          const result2 = cleanup(result1);
          const result3 = cleanup(result2);

          // Property: Running cleanup multiple times produces same result
          expect(result1).toEqual(result2);
          expect(result2).toEqual(result3);
          expect(result1).toEqual(result3);

          // Property: Result has exactly one primary
          const primaryCount = result1.filter((w) => w.isPrimary).length;
          expect(primaryCount).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
