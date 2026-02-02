/**
 * Property-Based Tests for Security and Privacy Protection
 * Feature: unified-portfolio, Property 29: Security and Privacy Protection
 * 
 * Validates: Requirements 12.5, 14.4, 14.5
 * 
 * Property 29: Security and Privacy Protection
 * For any system operation, private keys should never be stored, wallet-user linkage
 * should be protected with RLS and encryption, and structured logging should minimize
 * exposure of sensitive data
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  encryptWalletAddress,
  decryptWalletAddress,
  hashWalletAddress,
  normalizeWalletAddress,
  sanitizeAddress,
  sanitizeUserId,
  createWalletLinkage,
  verifyWalletLinkage,
  logPortfolioEvent,
} from '../security-privacy';

// ============================================================================
// GENERATORS
// ============================================================================

// Generate valid hex characters for wallet addresses
const hexCharGen = fc.constantFrom(...'0123456789abcdef'.split(''));

const walletAddressGen = fc.array(hexCharGen, { minLength: 40, maxLength: 40 })
  .map(chars => `0x${chars.join('')}`);

const userIdGen = fc.uuid();

const mixedCaseAddressGen = fc.array(hexCharGen, { minLength: 40, maxLength: 40 })
  .chain(chars => 
    fc.record({
      address: fc.constant(chars.join('')),
      shouldUpperCase: fc.boolean(),
    }).map(({ address, shouldUpperCase }) => 
      `0x${shouldUpperCase ? address.toUpperCase() : address}`
    )
  );

// ============================================================================
// PROPERTY 29: SECURITY AND PRIVACY PROTECTION
// ============================================================================

describe('Feature: unified-portfolio, Property 29: Security and Privacy Protection', () => {
  describe('Wallet Address Encryption', () => {
    // Property 29.1: Encryption should be reversible
    test('encrypted addresses can be decrypted to original value', async () => {
      await fc.assert(
        fc.asyncProperty(
          walletAddressGen,
          async (address) => {
            const encrypted = await encryptWalletAddress(address);
            const decrypted = await decryptWalletAddress(encrypted);
            
            // Should decrypt to normalized (lowercase) version
            expect(decrypted).toBe(address.toLowerCase());
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 29.2: Encryption should produce different ciphertexts for same input
    test('encryption produces different ciphertexts due to random IV', async () => {
      await fc.assert(
        fc.asyncProperty(
          walletAddressGen,
          async (address) => {
            const encrypted1 = await encryptWalletAddress(address);
            const encrypted2 = await encryptWalletAddress(address);
            
            // Different IVs should produce different ciphertexts
            expect(encrypted1).not.toBe(encrypted2);
            
            // But both should decrypt to same value
            const decrypted1 = await decryptWalletAddress(encrypted1);
            const decrypted2 = await decryptWalletAddress(encrypted2);
            expect(decrypted1).toBe(decrypted2);
          }
        ),
        { numRuns: 50 }
      );
    });

    // Property 29.3: Encryption normalizes addresses to lowercase
    test('encryption normalizes mixed-case addresses', async () => {
      await fc.assert(
        fc.asyncProperty(
          mixedCaseAddressGen,
          async (address) => {
            const encrypted = await encryptWalletAddress(address);
            const decrypted = await decryptWalletAddress(encrypted);
            
            // Should always be lowercase
            expect(decrypted).toBe(address.toLowerCase());
            expect(decrypted).toMatch(/^0x[0-9a-f]{40}$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Wallet Address Hashing', () => {
    // Property 29.4: Hash should be deterministic
    test('hashing produces same hash for same address', async () => {
      await fc.assert(
        fc.asyncProperty(
          walletAddressGen,
          async (address) => {
            const hash1 = await hashWalletAddress(address);
            const hash2 = await hashWalletAddress(address);
            
            expect(hash1).toBe(hash2);
            expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 29.5: Hash should normalize addresses
    test('hashing produces same hash for different cases', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(hexCharGen, { minLength: 40, maxLength: 40 }),
          async (chars) => {
            const hex = chars.join('');
            const lowerAddress = `0x${hex.toLowerCase()}`;
            const upperAddress = `0x${hex.toUpperCase()}`;
            const mixedAddress = `0x${hex}`;
            
            const hash1 = await hashWalletAddress(lowerAddress);
            const hash2 = await hashWalletAddress(upperAddress);
            const hash3 = await hashWalletAddress(mixedAddress);
            
            expect(hash1).toBe(hash2);
            expect(hash2).toBe(hash3);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 29.6: Different addresses produce different hashes
    test('different addresses produce different hashes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(walletAddressGen, walletAddressGen).filter(([a, b]) => a !== b),
          async ([address1, address2]) => {
            const hash1 = await hashWalletAddress(address1);
            const hash2 = await hashWalletAddress(address2);
            
            expect(hash1).not.toBe(hash2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Address Normalization', () => {
    // Property 29.7: Normalization always produces lowercase
    test('normalization always produces lowercase addresses', () => {
      fc.assert(
        fc.property(
          mixedCaseAddressGen,
          (address) => {
            const normalized = normalizeWalletAddress(address);
            
            expect(normalized).toBe(address.toLowerCase());
            expect(normalized).toMatch(/^0x[0-9a-f]{40}$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('PII Sanitization', () => {
    // Property 29.8: Address sanitization hides middle characters
    test('address sanitization shows only first 6 and last 4 characters', () => {
      fc.assert(
        fc.property(
          walletAddressGen,
          (address) => {
            const sanitized = sanitizeAddress(address, false);
            
            // Should show 0x + 4 chars + ... + 4 chars = 6 + 3 + 4 = 13 chars
            expect(sanitized).toHaveLength(13);
            expect(sanitized).toMatch(/^0x[0-9a-fA-F]{4}\.\.\.[0-9a-fA-F]{4}$/);
            
            // Should start with first 6 chars of address
            expect(sanitized.substring(0, 6)).toBe(address.substring(0, 6));
            
            // Should end with last 4 chars of address
            expect(sanitized.substring(9)).toBe(address.substring(address.length - 4));
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 29.9: Debug mode shows full address in development
    test('debug mode shows full address only in development', () => {
      fc.assert(
        fc.property(
          walletAddressGen,
          (address) => {
            const originalEnv = process.env.NODE_ENV;
            
            try {
              // In development with debug mode
              process.env.NODE_ENV = 'development';
              const debugSanitized = sanitizeAddress(address, true);
              expect(debugSanitized).toBe(address);
              
              // In production, debug mode should still sanitize
              process.env.NODE_ENV = 'production';
              const prodSanitized = sanitizeAddress(address, true);
              expect(prodSanitized).not.toBe(address);
              expect(prodSanitized).toHaveLength(13);
            } finally {
              process.env.NODE_ENV = originalEnv;
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    // Property 29.10: User ID sanitization shows only first 8 characters
    test('user ID sanitization shows only first 8 characters', () => {
      fc.assert(
        fc.property(
          userIdGen,
          (userId) => {
            const sanitized = sanitizeUserId(userId, false);
            
            // Should show first 8 chars + ...
            expect(sanitized).toHaveLength(11);
            expect(sanitized).toMatch(/^[0-9a-f]{8}\.\.\.$/);
            expect(sanitized.substring(0, 8)).toBe(userId.substring(0, 8));
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 29.11: Short addresses/IDs are fully redacted
    test('short addresses and IDs are fully redacted', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 9 }),
          (shortString) => {
            const sanitizedAddress = sanitizeAddress(shortString, false);
            const sanitizedUserId = sanitizeUserId(shortString, false);
            
            expect(sanitizedAddress).toBe('[REDACTED]');
            expect(sanitizedUserId).toBe('[REDACTED]');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Wallet Linkage Creation', () => {
    // Property 29.12: Wallet linkage includes all required fields
    test('wallet linkage includes userId, address, hash, and optional encryption', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(userIdGen, walletAddressGen, fc.boolean()),
          async ([userId, address, shouldEncrypt]) => {
            const linkage = await createWalletLinkage(userId, address, shouldEncrypt);
            
            expect(linkage.userId).toBe(userId);
            expect(linkage.walletAddress).toBe(address.toLowerCase());
            expect(linkage.addressHash).toHaveLength(64);
            expect(linkage.createdAt).toBeInstanceOf(Date);
            
            if (shouldEncrypt) {
              expect(linkage.addressEnc).toBeDefined();
              expect(linkage.addressEnc).toContain(':'); // IV:ciphertext format
            } else {
              expect(linkage.addressEnc).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 29.13: Wallet linkage hash is verifiable
    test('wallet linkage hash can be verified', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(userIdGen, walletAddressGen),
          async ([userId, address]) => {
            const linkage = await createWalletLinkage(userId, address, false);
            
            // Should verify with same address
            const isValid = await verifyWalletLinkage(address, linkage.addressHash);
            expect(isValid).toBe(true);
            
            // Should verify with different case
            const isValidUpper = await verifyWalletLinkage(
              address.toUpperCase(),
              linkage.addressHash
            );
            expect(isValidUpper).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property 29.14: Wallet linkage verification fails for different addresses
    test('wallet linkage verification fails for different addresses', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(userIdGen, walletAddressGen, walletAddressGen)
            .filter(([, addr1, addr2]) => addr1.toLowerCase() !== addr2.toLowerCase()),
          async ([userId, address1, address2]) => {
            const linkage = await createWalletLinkage(userId, address1, false);
            
            // Should not verify with different address
            const isValid = await verifyWalletLinkage(address2, linkage.addressHash);
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Structured Logging with PII Minimization', () => {
    // Property 29.15: Log events sanitize wallet addresses
    test('log events automatically sanitize wallet addresses', () => {
      fc.assert(
        fc.property(
          fc.tuple(walletAddressGen, userIdGen, fc.string({ minLength: 1 }))
            .filter(([, , eventName]) => eventName.trim().length > 0),
          ([address, userId, eventName]) => {
            // Capture console output
            const originalLog = console.log;
            const originalInfo = console.info;
            let loggedMessage = '';
            let loggedData: unknown = null;
            
            console.log = (msg: string, data?: unknown) => {
              loggedMessage = msg;
              loggedData = data;
            };
            console.info = (msg: string, data?: unknown) => {
              loggedMessage = msg;
              loggedData = data;
            };
            
            try {
              logPortfolioEvent(eventName, {
                walletAddress: address,
                userId,
                someOtherData: 'test',
              });
              
              // Verify log was called
              expect(loggedData).toBeDefined();
              
              // In test mode, Logger outputs an object with data field
              const logEntry = loggedData as { data?: Record<string, unknown> };
              
              // Wallet address should be sanitized
              expect(logEntry.data?.walletAddress).not.toBe(address);
              expect(typeof logEntry.data?.walletAddress).toBe('string');
              
              // User ID should be sanitized
              expect(logEntry.data?.userId).not.toBe(userId);
              expect(typeof logEntry.data?.userId).toBe('string');
              
              // Other data should be preserved
              expect(logEntry.data?.someOtherData).toBe('test');
            } finally {
              console.log = originalLog;
              console.info = originalInfo;
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    // Property 29.16: Log events remove sensitive fields
    test('log events remove private keys and credentials', () => {
      fc.assert(
        fc.property(
          fc.tuple(fc.string({ minLength: 1 }), fc.string(), fc.string(), fc.string())
            .filter(([eventName]) => eventName.trim().length > 0),
          ([eventName, privateKey, apiKey, password]) => {
            // Capture console output
            const originalLog = console.log;
            const originalInfo = console.info;
            let loggedData: unknown = null;
            
            console.log = (msg: string, data?: unknown) => {
              loggedData = data;
            };
            console.info = (msg: string, data?: unknown) => {
              loggedData = data;
            };
            
            try {
              logPortfolioEvent(eventName, {
                privateKey,
                apiKey,
                apiSecret: 'secret',
                password,
                safeData: 'this is ok',
              });
              
              // Verify log was called
              expect(loggedData).toBeDefined();
              
              // In test mode, Logger outputs an object with data field
              const logEntry = loggedData as { data?: Record<string, unknown> };
              
              // Sensitive fields should be removed
              expect(logEntry.data?.privateKey).toBeUndefined();
              expect(logEntry.data?.apiKey).toBeUndefined();
              expect(logEntry.data?.apiSecret).toBeUndefined();
              expect(logEntry.data?.password).toBeUndefined();
              
              // Safe data should be preserved
              expect(logEntry.data?.safeData).toBe('this is ok');
            } finally {
              console.log = originalLog;
              console.info = originalInfo;
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('No Private Key Storage', () => {
    // Property 29.17: System never stores private keys
    test('wallet linkage never includes private key field', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(userIdGen, walletAddressGen),
          async ([userId, address]) => {
            const linkage = await createWalletLinkage(userId, address, true);
            
            // Verify no private key field exists
            expect(linkage).not.toHaveProperty('privateKey');
            expect(linkage).not.toHaveProperty('private_key');
            expect(linkage).not.toHaveProperty('secretKey');
            expect(linkage).not.toHaveProperty('secret_key');
            
            // Verify only expected fields exist
            const allowedFields = ['userId', 'walletAddress', 'addressHash', 'addressEnc', 'createdAt'];
            const actualFields = Object.keys(linkage);
            
            for (const field of actualFields) {
              expect(allowedFields).toContain(field);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
