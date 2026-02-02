/**
 * Property-Based Tests for Portfolio Security and Privacy Controls
 * 
 * Feature: unified-portfolio, Property 29: Security and Privacy Protection
 * Feature: unified-portfolio, Property 30: Safety Mode Enforcement
 * Feature: unified-portfolio, Property 31: Mandatory Simulation Coverage
 * 
 * Validates: Requirements 12.5, 14.1, 14.2, 14.4, 14.5
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  encryptWalletAddress,
  decryptWalletAddress,
  hashWalletAddressForIndex,
  sanitizeLogData,
  checkContractSafety,
  checkApprovalSafety,
  requiresSimulation,
  checkSimulationRequirement,
} from '@/lib/portfolio/security';

// ============================================================================
// PROPERTY 29: Security and Privacy Protection
// ============================================================================

describe('Feature: unified-portfolio, Property 29: Security and Privacy Protection', () => {
  // Helper to generate valid Ethereum addresses
  const ethAddressArb = fc.string({ minLength: 40, maxLength: 40 })
    .filter(s => /^[0-9a-fA-F]{40}$/.test(s))
    .map(s => `0x${s}`);

  test('wallet address encryption is reversible', () => {
    fc.assert(
      fc.property(
        ethAddressArb,
        (address) => {
          const encrypted = encryptWalletAddress(address);
          const decrypted = decryptWalletAddress(encrypted);
          
          // Decrypted address should match original (lowercase)
          expect(decrypted).toBe(address.toLowerCase());
        }
      ),
      { numRuns: 100 }
    );
  });

  test('wallet address encryption produces different ciphertexts for same input', () => {
    fc.assert(
      fc.property(
        ethAddressArb,
        (address) => {
          const encrypted1 = encryptWalletAddress(address);
          const encrypted2 = encryptWalletAddress(address);
          
          // Different IVs should produce different ciphertexts
          expect(encrypted1).not.toBe(encrypted2);
          
          // But both should decrypt to same address
          expect(decryptWalletAddress(encrypted1)).toBe(decryptWalletAddress(encrypted2));
        }
      ),
      { numRuns: 100 }
    );
  });

  test('wallet address hash is deterministic', () => {
    fc.assert(
      fc.property(
        ethAddressArb,
        (address) => {
          const hash1 = hashWalletAddressForIndex(address);
          const hash2 = hashWalletAddressForIndex(address);
          
          // Same address should always produce same hash
          expect(hash1).toBe(hash2);
          
          // Hash should be 64 hex characters (SHA-256)
          expect(hash1).toMatch(/^[a-f0-9]{64}$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('wallet address hash is case-insensitive', () => {
    fc.assert(
      fc.property(
        ethAddressArb,
        (address) => {
          const lowerHash = hashWalletAddressForIndex(address.toLowerCase());
          const upperHash = hashWalletAddressForIndex(address.toUpperCase());
          const mixedHash = hashWalletAddressForIndex(address);
          
          // All variations should produce same hash
          expect(lowerHash).toBe(upperHash);
          expect(lowerHash).toBe(mixedHash);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('log sanitization removes plain wallet addresses', () => {
    fc.assert(
      fc.property(
        ethAddressArb,
        fc.string({ minLength: 1, maxLength: 20 }),
        (address, otherData) => {
          const logData = {
            walletAddress: address,
            userAddress: address,
            otherField: otherData,
          };
          
          const sanitized = sanitizeLogData(logData, false);
          
          // Plain addresses should be redacted
          expect(sanitized.walletAddress).toBe('[REDACTED]');
          expect(sanitized.userAddress).toBe('[REDACTED]');
          
          // Hashes should be present
          expect(sanitized.walletAddress_hash).toBeDefined();
          expect(sanitized.userAddress_hash).toBeDefined();
          
          // Other data should be preserved
          expect(sanitized.otherField).toBe(otherData);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('log sanitization removes private keys and secrets', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 64, maxLength: 64 }),
        fc.string({ minLength: 32, maxLength: 32 }),
        (privateKey, apiSecret) => {
          const logData = {
            privateKey,
            apiSecret,
            secretKey: apiSecret,
          };
          
          const sanitized = sanitizeLogData(logData, false);
          
          // All sensitive fields should be redacted
          expect(sanitized.privateKey).toBe('[REDACTED]');
          expect(sanitized.apiSecret).toBe('[REDACTED]');
          expect(sanitized.secretKey).toBe('[REDACTED]');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('log sanitization handles nested objects', () => {
    fc.assert(
      fc.property(
        fc.hexaString().filter(hex => hex.length === 40).map(hex => `0x${hex}`),
        fc.string({ minLength: 1, maxLength: 20 }),
        (address, otherData) => {
          const logData = {
            user: {
              walletAddress: address,
              name: otherData,
            },
            transaction: {
              from: address,
              to: address,
              value: '1000',
            },
          };
          
          const sanitized = sanitizeLogData(logData, false);
          
          // Nested addresses should be redacted
          expect((sanitized.user as any).walletAddress).toBe('[REDACTED]');
          expect((sanitized.transaction as any).from).toBe('[REDACTED]');
          expect((sanitized.transaction as any).to).toBe('[REDACTED]');
          
          // Other nested data should be preserved
          expect((sanitized.user as any).name).toBe(otherData);
          expect((sanitized.transaction as any).value).toBe('1000');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// PROPERTY 30: Safety Mode Enforcement
// ============================================================================

describe('Feature: unified-portfolio, Property 30: Safety Mode Enforcement', () => {
  test('unverified contracts always trigger high severity warning', () => {
    fc.assert(
      fc.property(
        fc.hexaString().filter(hex => hex.length === 40).map(hex => `0x${hex}`),
        fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date() })),
        (contractAddress, deployedAt) => {
          const warning = checkContractSafety(contractAddress, deployedAt, false, 7);
          
          // Unverified contracts should always produce warning
          expect(warning).not.toBeNull();
          expect(warning?.severity).toBe('high');
          expect(warning?.code).toBe('UNVERIFIED_CONTRACT');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('new contracts trigger medium severity warning', () => {
    fc.assert(
      fc.property(
        fc.hexaString().filter(hex => hex.length === 40).map(hex => `0x${hex}`),
        fc.integer({ min: 0, max: 6 }), // Days since deployment (less than 7)
        (contractAddress, daysAgo) => {
          const deployedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
          const warning = checkContractSafety(contractAddress, deployedAt, true, 7);
          
          // New verified contracts should produce medium warning
          expect(warning).not.toBeNull();
          expect(warning?.severity).toBe('medium');
          expect(warning?.code).toBe('NEW_CONTRACT');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('old verified contracts produce no warning', () => {
    fc.assert(
      fc.property(
        fc.hexaString().filter(hex => hex.length === 40).map(hex => `0x${hex}`),
        fc.integer({ min: 8, max: 365 }), // Days since deployment (more than 7)
        (contractAddress, daysAgo) => {
          const deployedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
          const warning = checkContractSafety(contractAddress, deployedAt, true, 7);
          
          // Old verified contracts should be safe
          expect(warning).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('unlimited approval to unknown spender triggers critical warning', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('unlimited', 'max', '115792089237316195423570985008687907853269984665640564039457584007913129639935'),
        fc.double({ min: 0, max: 0.49 }), // Low trust score
        (amount, spenderTrust) => {
          const warning = checkApprovalSafety(amount, spenderTrust, false);
          
          // Unlimited approval to unknown spender should be critical
          expect(warning).not.toBeNull();
          expect(warning?.severity).toBe('critical');
          expect(warning?.code).toBe('UNLIMITED_APPROVAL_UNKNOWN_SPENDER');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('unlimited approval to low-trust spender triggers high warning', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('unlimited', 'max'),
        fc.double({ min: 0.5, max: 0.69 }), // Low but not critical trust
        (amount, spenderTrust) => {
          const warning = checkApprovalSafety(amount, spenderTrust, true);
          
          // Unlimited approval to low-trust spender should be high risk
          expect(warning).not.toBeNull();
          expect(warning?.severity).toBe('high');
          expect(warning?.code).toBe('UNLIMITED_APPROVAL_LOW_TRUST');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('limited approval to trusted spender produces no warning', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000000 }).map(n => n.toString()),
        fc.double({ min: 0.7, max: 1.0 }), // High trust score
        (amount, spenderTrust) => {
          const warning = checkApprovalSafety(amount, spenderTrust, true);
          
          // Limited approval to trusted spender should be safe
          expect(warning).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// PROPERTY 31: Mandatory Simulation Coverage
// ============================================================================

describe('Feature: unified-portfolio, Property 31: Mandatory Simulation Coverage', () => {
  test('spend operations always require simulation', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1000000 }),
        (valueUsd) => {
          const required = requiresSimulation('spend', valueUsd, 250);
          
          // Spend operations should always require simulation
          expect(required).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('approve operations always require simulation', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1000000 }),
        (valueUsd) => {
          const required = requiresSimulation('approve', valueUsd, 250);
          
          // Approve operations should always require simulation
          expect(required).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('revoke operations always require simulation', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1000000 }),
        (valueUsd) => {
          const required = requiresSimulation('revoke', valueUsd, 250);
          
          // Revoke operations should always require simulation
          expect(required).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('high-value operations require simulation', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('swap', 'transfer'),
        fc.float({ min: 250, max: 1000000 }),
        (operationType, valueUsd) => {
          const required = requiresSimulation(operationType as any, valueUsd, 250);
          
          // High-value operations should require simulation
          expect(required).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('low-value swap/transfer operations do not require simulation', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('swap', 'transfer'),
        fc.float({ min: 0, max: 249 }),
        (operationType, valueUsd) => {
          const required = requiresSimulation(operationType as any, valueUsd, 250);
          
          // Low-value swap/transfer should not require simulation
          expect(required).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('simulation unavailability triggers critical warning for required operations', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('spend', 'approve', 'revoke'),
        (operationType) => {
          const warning = checkSimulationRequirement(operationType as any, false);
          
          // Missing simulation for required operations should be critical
          expect(warning).not.toBeNull();
          expect(warning?.severity).toBe('critical');
          expect(warning?.code).toBe('SIMULATION_UNAVAILABLE');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('simulation availability produces no warning', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('spend', 'approve', 'revoke', 'swap', 'transfer'),
        (operationType) => {
          const warning = checkSimulationRequirement(operationType as any, true);
          
          // Available simulation should produce no warning
          expect(warning).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
