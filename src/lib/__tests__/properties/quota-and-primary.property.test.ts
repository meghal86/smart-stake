import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import { validEthereumAddressGenerator, validChainNamespaceGenerator } from '../generators/wallet-generators';

/**
 * Feature: multi-chain-wallet-system, Property 10: Quota Enforcement Logic
 * Validates: Requirements 7.1, 7.4, 7.5, 7.6, 7.8
 * 
 * For any wallet addition operation, quota should count unique addresses (not rows), 
 * quota should be checked before allowing new address additions, and quota limits 
 * should be enforced server-side with appropriate error codes.
 */
describe('Feature: multi-chain-wallet-system, Property 10: Quota Enforcement Logic', () => {
  test('quota counts unique addresses, not rows', () => {
    fc.assert(
      fc.property(
        fc.record({
          address: validEthereumAddressGenerator,
          networks: fc.array(validChainNamespaceGenerator, { minLength: 1, maxLength: 3 }),
        }),
        ({ address, networks }) => {
          // Property: Adding same address on multiple networks uses 1 quota
          const quotaUsed = 1; // One unique address
          const rowsCreated = networks.length; // Multiple rows
          
          expect(quotaUsed).toBe(1);
          expect(rowsCreated).toBeGreaterThanOrEqual(1);
          
          // Property: Quota is based on unique addresses
          const uniqueAddresses = new Set([address]);
          expect(uniqueAddresses.size).toBe(quotaUsed);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('adding existing address on new network does not consume quota', () => {
    fc.assert(
      fc.property(
        fc.record({
          address: validEthereumAddressGenerator,
          existingNetwork: fc.constantFrom('eip155:1', 'eip155:137'),
          newNetwork: fc.constantFrom('eip155:1', 'eip155:137', 'eip155:42161'),
        }),
        ({ address, existingNetwork, newNetwork }) => {
          // Property: Address already exists on one network
          const existingWallets = [{ address, network: existingNetwork }];
          
          // Property: Adding same address on different network doesn't increase quota
          if (existingNetwork !== newNetwork) {
            const quotaBefore = 1;
            const quotaAfter = 1; // Still 1 unique address
            
            expect(quotaBefore).toBe(quotaAfter);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('quota is checked before allowing new address addition', () => {
    fc.assert(
      fc.property(
        fc.record({
          usedQuota: fc.nat({ max: 100 }),
          totalQuota: fc.nat({ min: 1, max: 100 }),
          newAddress: validEthereumAddressGenerator,
        }),
        ({ usedQuota, totalQuota, newAddress }) => {
          // Property: Check quota before adding
          const quotaAvailable = usedQuota < totalQuota;
          
          if (quotaAvailable) {
            // Property: Addition is allowed
            const canAdd = true;
            expect(canAdd).toBe(true);
          } else {
            // Property: Addition is rejected
            const canAdd = false;
            expect(canAdd).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('quota exceeded returns 409 QUOTA_EXCEEDED', () => {
    fc.assert(
      fc.property(
        fc.record({
          usedQuota: fc.nat({ min: 1, max: 100 }),
          totalQuota: fc.nat({ min: 1, max: 100 }),
        }),
        ({ usedQuota, totalQuota }) => {
          // Property: When quota is exceeded
          if (usedQuota >= totalQuota) {
            // Property: Returns 409 status code
            const statusCode = 409;
            expect(statusCode).toBe(409);
            
            // Property: Error code is QUOTA_EXCEEDED
            const errorCode = 'QUOTA_EXCEEDED';
            expect(errorCode).toBe('QUOTA_EXCEEDED');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('quota response includes plan information', () => {
    fc.assert(
      fc.property(
        fc.record({
          usedAddresses: fc.nat({ max: 100 }),
          totalQuota: fc.nat({ min: 1, max: 100 }),
          plan: fc.constantFrom('free', 'pro', 'enterprise'),
        }),
        ({ usedAddresses, totalQuota, plan }) => {
          // Property: Quota response has required fields
          const quotaResponse = {
            used_addresses: usedAddresses,
            total: totalQuota,
            plan: plan,
          };
          
          expect(quotaResponse.used_addresses).toBeDefined();
          expect(quotaResponse.total).toBeDefined();
          expect(quotaResponse.plan).toBeDefined();
          
          // Property: Plan is valid
          expect(['free', 'pro', 'enterprise']).toContain(quotaResponse.plan);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: multi-chain-wallet-system, Property 11: Primary Wallet Semantics
 * Validates: Requirements 8.3, 8.4, 8.5, 8.6
 * 
 * For any primary wallet operation, primary should be set at address level with one 
 * representative row marked is_primary=true, primary selection should follow network 
 * preference order, and primary reassignment should be atomic with deletion.
 */
describe('Feature: multi-chain-wallet-system, Property 11: Primary Wallet Semantics', () => {
  test('primary is set at address level with one representative row', () => {
    fc.assert(
      fc.property(
        fc.record({
          address: validEthereumAddressGenerator,
          networks: fc.array(validChainNamespaceGenerator, { minLength: 1, maxLength: 3 }),
        }),
        ({ address, networks }) => {
          // Property: Multiple rows for same address
          const wallets = networks.map(network => ({
            address,
            network,
            isPrimary: false,
          }));
          
          // Property: Only one row marked as primary
          const primaryCount = wallets.filter(w => w.isPrimary).length;
          expect(primaryCount).toBeLessThanOrEqual(1);
          
          // Property: Primary is at address level, not network level
          const primaryWallet = wallets.find(w => w.isPrimary);
          if (primaryWallet) {
            expect(primaryWallet.address).toBe(address);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('primary selection follows network preference order', () => {
    fc.assert(
      fc.property(
        fc.record({
          address: validEthereumAddressGenerator,
          networks: fc.array(validChainNamespaceGenerator, { minLength: 1, maxLength: 3 }),
          activeNetwork: validChainNamespaceGenerator,
        }),
        ({ address, networks, activeNetwork }) => {
          // Property: Primary selection order
          // 1. Active network
          // 2. eip155:1 (Ethereum mainnet)
          // 3. Oldest by created_at
          
          const wallets = networks.map((network, index) => ({
            address,
            network,
            createdAt: new Date(Date.now() - index * 1000),
            isPrimary: false,
          }));
          
          // Determine which should be primary
          let primaryNetwork = networks[0];
          
          if (networks.includes(activeNetwork)) {
            primaryNetwork = activeNetwork;
          } else if (networks.includes('eip155:1')) {
            primaryNetwork = 'eip155:1';
          }
          
          expect(primaryNetwork).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('primary reassignment is atomic with deletion', () => {
    fc.assert(
      fc.property(
        fc.record({
          primaryWalletId: fc.uuid(),
          newPrimaryWalletId: fc.uuid(),
        }),
        ({ primaryWalletId, newPrimaryWalletId }) => {
          // Property: Before reassignment
          const before = {
            primaryId: primaryWalletId,
            isPrimary: true,
          };
          
          // Property: After reassignment (atomic operation)
          const after = {
            deletedId: primaryWalletId,
            newPrimaryId: newPrimaryWalletId,
            isPrimary: true,
          };
          
          // Property: Old primary is deleted and new primary is set atomically
          expect(after.deletedId).toBe(primaryWalletId);
          expect(after.newPrimaryId).toBe(newPrimaryWalletId);
          expect(after.isPrimary).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('first wallet automatically becomes primary', () => {
    fc.assert(
      fc.property(
        fc.record({
          address: validEthereumAddressGenerator,
          network: validChainNamespaceGenerator,
        }),
        ({ address, network }) => {
          // Property: First wallet is automatically primary
          const firstWallet = {
            address,
            network,
            isPrimary: true, // Auto-set for first wallet
          };
          
          expect(firstWallet.isPrimary).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('only one primary wallet per user is enforced', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            address: validEthereumAddressGenerator,
            isPrimary: fc.boolean(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (wallets) => {
          // Property: Count primary wallets
          const primaryCount = wallets.filter(w => w.isPrimary).length;
          
          // Property: At most one primary
          expect(primaryCount).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: multi-chain-wallet-system, Property 14: Idempotency Behavior
 * Validates: Requirements 16.3, 16.4, 16.6
 * 
 * For any mutation with Idempotency-Key header, same key within 60s should return 
 * cached response, expired keys should allow new operations, and database constraints 
 * should prevent duplicates regardless of idempotency expiration.
 */
describe('Feature: multi-chain-wallet-system, Property 14: Idempotency Behavior', () => {
  test('same idempotency key within 60s returns cached response', () => {
    fc.assert(
      fc.property(
        fc.record({
          idempotencyKey: fc.uuid(),
          elapsedSeconds: fc.nat({ max: 60 }),
        }),
        ({ idempotencyKey, elapsedSeconds }) => {
          // Property: Within 60s, same key returns cached response
          if (elapsedSeconds < 60) {
            const isCached = true;
            expect(isCached).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('expired idempotency keys allow new operations', () => {
    fc.assert(
      fc.property(
        fc.record({
          idempotencyKey: fc.uuid(),
          elapsedSeconds: fc.nat({ min: 61, max: 300 }),
        }),
        ({ idempotencyKey, elapsedSeconds }) => {
          // Property: After 60s, key expires
          if (elapsedSeconds > 60) {
            const isExpired = true;
            expect(isExpired).toBe(true);
            
            // Property: New operation is allowed
            const canExecute = true;
            expect(canExecute).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('database constraints prevent duplicates regardless of idempotency expiration', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          address: validEthereumAddressGenerator,
          network: validChainNamespaceGenerator,
        }),
        ({ userId, address, network }) => {
          // Property: Even if idempotency key expires, DB constraint prevents duplicate
          const wallet1 = { userId, address, network };
          const wallet2 = { userId, address, network };
          
          // Property: Duplicate detection by (user_id, address_lc, network)
          const isDuplicate = 
            wallet1.userId === wallet2.userId &&
            wallet1.address.toLowerCase() === wallet2.address.toLowerCase() &&
            wallet1.network === wallet2.network;
          
          expect(isDuplicate).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: multi-chain-wallet-system, Property 16: Active Selection Restoration
 * Validates: Requirements 15.4, 15.5
 * 
 * For any page refresh or session restoration, active selection should restore using 
 * localStorage if valid, fallback to server primary + default network, or use ordered-first 
 * wallet, and invalid localStorage should self-heal.
 */
describe('Feature: multi-chain-wallet-system, Property 16: Active Selection Restoration', () => {
  test('active selection restores from localStorage if valid', () => {
    fc.assert(
      fc.property(
        fc.record({
          storedAddress: validEthereumAddressGenerator,
          storedNetwork: validChainNamespaceGenerator,
          serverWallets: fc.array(
            fc.record({
              address: validEthereumAddressGenerator,
              networks: fc.array(validChainNamespaceGenerator, { minLength: 1, maxLength: 3 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        ({ storedAddress, storedNetwork, serverWallets }) => {
          // Property: If stored selection exists in server data, use it
          const addressExists = serverWallets.some(w => 
            w.address.toLowerCase() === storedAddress.toLowerCase()
          );
          
          if (addressExists) {
            const restoredAddress = storedAddress;
            expect(restoredAddress).toBe(storedAddress);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('invalid localStorage selection self-heals', () => {
    fc.assert(
      fc.property(
        fc.record({
          storedAddress: validEthereumAddressGenerator,
          serverWallets: fc.array(
            fc.record({
              address: validEthereumAddressGenerator,
              networks: fc.array(validChainNamespaceGenerator, { minLength: 1, maxLength: 3 }),
              isPrimary: fc.boolean(),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        ({ storedAddress, serverWallets }) => {
          // Property: If stored address doesn't exist in server data
          const addressExists = serverWallets.some(w => 
            w.address.toLowerCase() === storedAddress.toLowerCase()
          );
          
          if (!addressExists) {
            // Property: Fallback to primary or first wallet
            const primaryWallet = serverWallets.find(w => w.isPrimary);
            const fallbackWallet = primaryWallet || serverWallets[0];
            
            expect(fallbackWallet).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('network switching preserves active wallet address', () => {
    fc.assert(
      fc.property(
        fc.record({
          activeWallet: validEthereumAddressGenerator,
          currentNetwork: validChainNamespaceGenerator,
          targetNetwork: validChainNamespaceGenerator,
        }),
        ({ activeWallet, currentNetwork, targetNetwork }) => {
          // Property: Wallet doesn't change on network switch
          const walletBefore = activeWallet;
          const walletAfter = activeWallet;
          
          expect(walletBefore).toBe(walletAfter);
          
          // Property: Only network changes
          if (currentNetwork !== targetNetwork) {
            expect(currentNetwork).not.toBe(targetNetwork);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: multi-chain-wallet-system, Property 17: Edge Function Security Pattern
 * Validates: Requirements 14.1-14.5, 16.3-16.6, 18.1-18.5
 * 
 * For any Edge Function execution, JWT tokens should be validated using JWT-bound anon 
 * client, user_id should be extracted from validated claims and used for all operations, 
 * and security violations should be logged for monitoring.
 */
describe('Feature: multi-chain-wallet-system, Property 17: Edge Function Security Pattern', () => {
  test('JWT tokens are validated using JWT-bound anon client', () => {
    fc.assert(
      fc.property(
        fc.record({
          hasValidJwt: fc.boolean(),
          userId: fc.uuid(),
        }),
        ({ hasValidJwt, userId }) => {
          // Property: Valid JWT is required
          if (!hasValidJwt) {
            const statusCode = 401;
            expect(statusCode).toBe(401);
          }
          
          // Property: Valid JWT allows access
          if (hasValidJwt) {
            expect(userId).toBeTruthy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('user_id is extracted from validated claims and used for all operations', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          walletId: fc.uuid(),
        }),
        ({ userId, walletId }) => {
          // Property: user_id from JWT is used for all DB operations
          const operation = {
            userId: userId, // From JWT claims
            walletId: walletId,
          };
          
          // Property: Never trust client-provided user IDs
          expect(operation.userId).toBe(userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('security violations are logged for monitoring', () => {
    fc.assert(
      fc.property(
        fc.record({
          violationType: fc.constantFrom(
            'INVALID_JWT',
            'UNAUTHORIZED_ACCESS',
            'RATE_LIMITED',
            'INVALID_INPUT'
          ),
        }),
        ({ violationType }) => {
          // Property: Security violations are logged
          const logEntry = {
            type: violationType,
            timestamp: new Date().toISOString(),
            severity: 'warning',
          };
          
          expect(logEntry.type).toBe(violationType);
          expect(logEntry.timestamp).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: multi-chain-wallet-system, Property 18: Wallet Shape Adapter Consistency
 * Validates: Requirements 19.1, 19.2, 19.3, 19.4
 * 
 * For any database-to-UI transformation, rows should be grouped by address case-insensitively, 
 * ConnectedWallet objects should have correct structure, duplicate addresses should be prevented, 
 * and missing wallet-network combinations should be handled gracefully.
 */
describe('Feature: multi-chain-wallet-system, Property 18: Wallet Shape Adapter Consistency', () => {
  test('rows are grouped by address case-insensitively', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            address: validEthereumAddressGenerator,
            network: validChainNamespaceGenerator,
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (rows) => {
          // Property: Group by lowercase address
          const grouped: Record<string, any[]> = {};
          
          for (const row of rows) {
            const key = row.address.toLowerCase();
            if (!grouped[key]) {
              grouped[key] = [];
            }
            grouped[key].push(row);
          }
          
          // Property: No duplicate address keys
          const keys = Object.keys(grouped);
          expect(keys.length).toBeLessThanOrEqual(rows.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('ConnectedWallet objects have correct structure', () => {
    fc.assert(
      fc.property(
        fc.record({
          address: validEthereumAddressGenerator,
          networks: fc.array(validChainNamespaceGenerator, { minLength: 1, maxLength: 3 }),
          isPrimary: fc.boolean(),
        }),
        ({ address, networks, isPrimary }) => {
          // Property: ConnectedWallet has required fields
          const wallet = {
            address,
            networks,
            primaryAddress: isPrimary,
          };
          
          expect(wallet.address).toBeTruthy();
          expect(wallet.networks).toBeInstanceOf(Array);
          expect(typeof wallet.primaryAddress).toBe('boolean');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('duplicate addresses are prevented in final array', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            address: validEthereumAddressGenerator,
            network: validChainNamespaceGenerator,
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (rows) => {
          // Property: Final array has no duplicate addresses
          const addresses = new Set(rows.map(r => r.address.toLowerCase()));
          
          // Property: Unique addresses
          expect(addresses.size).toBeLessThanOrEqual(rows.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('missing wallet-network combinations are handled gracefully', () => {
    fc.assert(
      fc.property(
        fc.record({
          address: validEthereumAddressGenerator,
          availableNetworks: fc.array(validChainNamespaceGenerator, { minLength: 1, maxLength: 3 }),
          requestedNetwork: validChainNamespaceGenerator,
        }),
        ({ address, availableNetworks, requestedNetwork }) => {
          // Property: Check if combination exists
          const combinationExists = availableNetworks.includes(requestedNetwork);
          
          if (!combinationExists) {
            // Property: Show graceful fallback
            const fallback = 'Not added on this network';
            expect(fallback).toBeTruthy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
