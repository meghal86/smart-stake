/**
 * Property-Based Tests for Credential Encryption
 * Feature: harvestpro, Property 17: Credential Encryption
 * Validates: Requirements 1.4
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { encryptCredential, decryptCredential } from '../cex-integration';

describe('Credential Encryption - Property Tests', () => {
  /**
   * Property 17: Credential Encryption
   * Feature: harvestpro, Property 17: Credential Encryption
   * Validates: Requirements 1.4
   * 
   * For any API credential (wallet or CEX), the stored value SHALL be encrypted
   * and SHALL NOT match the plaintext value.
   */
  it('Property 17: Encrypted credentials do not match plaintext', () => {
    fc.assert(
      fc.property(
        // Generate random API credentials (strings of various lengths and characters)
        fc.string({ minLength: 1, maxLength: 200 }),
        (plaintext) => {
          const encrypted = encryptCredential(plaintext);
          
          // Part 1: Encrypted value should not match plaintext
          expect(encrypted).not.toBe(plaintext);
          
          // Part 2: Encrypted value should be a string
          expect(typeof encrypted).toBe('string');
          
          // Part 3: Encrypted value should have the expected format (iv:authTag:encrypted)
          const parts = encrypted.split(':');
          expect(parts.length).toBe(3);
          
          // Part 4: Each part should be valid hex
          parts.forEach(part => {
            expect(part).toMatch(/^[0-9a-f]+$/);
          });
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Encryption/Decryption Round-Trip
   * 
   * For any plaintext credential, encrypting then decrypting should return
   * the original plaintext value.
   */
  it('Property: Encryption/decryption round-trip preserves plaintext', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (plaintext) => {
          const encrypted = encryptCredential(plaintext);
          const decrypted = decryptCredential(encrypted);
          
          expect(decrypted).toBe(plaintext);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Different plaintexts produce different ciphertexts
   * 
   * For any two different plaintext credentials, their encrypted values
   * should be different.
   */
  it('Property: Different plaintexts produce different ciphertexts', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        (plaintext1, plaintext2) => {
          // Skip if plaintexts are the same
          fc.pre(plaintext1 !== plaintext2);
          
          const encrypted1 = encryptCredential(plaintext1);
          const encrypted2 = encryptCredential(plaintext2);
          
          expect(encrypted1).not.toBe(encrypted2);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Same plaintext produces different ciphertexts (due to random IV)
   * 
   * For the same plaintext encrypted multiple times, the ciphertexts should
   * be different due to the random initialization vector (IV).
   */
  it('Property: Same plaintext produces different ciphertexts (random IV)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (plaintext) => {
          const encrypted1 = encryptCredential(plaintext);
          const encrypted2 = encryptCredential(plaintext);
          
          // The ciphertexts should be different due to random IV
          expect(encrypted1).not.toBe(encrypted2);
          
          // But both should decrypt to the same plaintext
          expect(decryptCredential(encrypted1)).toBe(plaintext);
          expect(decryptCredential(encrypted2)).toBe(plaintext);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Encrypted credentials are longer than short plaintexts
   * 
   * Due to the IV, auth tag, and encoding, encrypted credentials should
   * be longer than very short plaintexts.
   */
  it('Property: Encrypted credentials have minimum length', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (plaintext) => {
          const encrypted = encryptCredential(plaintext);
          
          // IV (16 bytes = 32 hex chars) + authTag (16 bytes = 32 hex chars) + 2 colons = minimum 66 chars
          // Plus the encrypted data itself
          expect(encrypted.length).toBeGreaterThan(66);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Decryption fails with tampered ciphertext
   * 
   * If the ciphertext is tampered with, decryption should fail.
   */
  it('Property: Decryption fails with tampered ciphertext', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (plaintext) => {
          const encrypted = encryptCredential(plaintext);
          
          // Tamper with the ciphertext by changing one character
          const parts = encrypted.split(':');
          if (parts[2].length > 0) {
            // Change the last character of the encrypted data
            const lastChar = parts[2][parts[2].length - 1];
            const newChar = lastChar === 'a' ? 'b' : 'a';
            parts[2] = parts[2].slice(0, -1) + newChar;
            const tampered = parts.join(':');
            
            // Decryption should throw an error
            expect(() => decryptCredential(tampered)).toThrow();
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty string can be encrypted and decrypted
   * 
   * Edge case: empty strings should be handled correctly.
   */
  it('Property: Empty string encryption/decryption', () => {
    const plaintext = '';
    const encrypted = encryptCredential(plaintext);
    const decrypted = decryptCredential(encrypted);
    
    expect(decrypted).toBe(plaintext);
    expect(encrypted).not.toBe(plaintext);
  });

  /**
   * Property: Special characters are preserved
   * 
   * API keys often contain special characters. These should be preserved
   * through encryption/decryption.
   */
  it('Property: Special characters are preserved', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (plaintext) => {
          // Add some special characters
          const specialPlaintext = `${plaintext}!@#$%^&*()_+-=[]{}|;:',.<>?/~\``;
          
          const encrypted = encryptCredential(specialPlaintext);
          const decrypted = decryptCredential(encrypted);
          
          expect(decrypted).toBe(specialPlaintext);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Unicode characters are preserved
   * 
   * API keys might contain unicode characters. These should be preserved.
   */
  it('Property: Unicode characters are preserved', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (plaintext) => {
          // Add some unicode characters
          const unicodePlaintext = `${plaintext}🔐🔑✅❌`;
          
          const encrypted = encryptCredential(unicodePlaintext);
          const decrypted = decryptCredential(encrypted);
          
          expect(decrypted).toBe(unicodePlaintext);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Long credentials are handled correctly
   * 
   * Some API keys can be quite long. Test with longer strings.
   */
  it('Property: Long credentials are handled correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 100, maxLength: 500 }),
        (plaintext) => {
          const encrypted = encryptCredential(plaintext);
          const decrypted = decryptCredential(encrypted);
          
          expect(decrypted).toBe(plaintext);
          expect(encrypted).not.toBe(plaintext);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
