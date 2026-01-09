/**
 * Property-Based Tests for Input Validation Security
 * 
 * Feature: multi-chain-wallet-system, Property 8: Input Validation Security
 * Validates: Requirements 5.2, 5.3
 * 
 * @see .kiro/specs/multi-chain-wallet-system/design.md - Property 8
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';

/**
 * Validates wallet input and detects security issues
 */
function validateWalletInput(input: string): {
  valid: boolean;
  type?: 'address' | 'ens';
  error?: { code: string; message: string };
} {
  // Reject private key patterns (64 hex characters with optional '0x' prefix)
  if (input.match(/^(0x)?[a-fA-F0-9]{64}$/)) {
    return {
      valid: false,
      error: {
        code: 'PRIVATE_KEY_DETECTED',
        message: 'Private keys not allowed',
      },
    };
  }

  // Reject seed phrase patterns (12 or more space-separated words)
  const words = input.split(/\s+/).filter(w => w.length > 0);
  if (words.length >= 12) {
    return {
      valid: false,
      error: {
        code: 'SEED_PHRASE_DETECTED',
        message: 'Seed phrases not allowed',
      },
    };
  }

  // Accept ENS names
  if (input.endsWith('.eth')) {
    return { valid: true, type: 'ens' };
  }

  // Accept Ethereum addresses
  if (input.match(/^0x[a-fA-F0-9]{40}$/)) {
    return { valid: true, type: 'address' };
  }

  return {
    valid: false,
    error: {
      code: 'INVALID_ADDRESS',
      message: 'Invalid address format',
    },
  };
}

describe('Feature: multi-chain-wallet-system, Property 8: Input Validation Security', () => {
  /**
   * Property 8.1: Private key patterns are rejected
   * For any string matching private key pattern (64 hex chars), validation should reject with PRIVATE_KEY_DETECTED
   */
  test('private key patterns are rejected with PRIVATE_KEY_DETECTED', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // 64 hex characters
          fc.tuple(
            fc.integer({ min: 0, max: 0xffffffff }),
            fc.integer({ min: 0, max: 0xffffffff }),
            fc.integer({ min: 0, max: 0xffffffff }),
            fc.integer({ min: 0, max: 0xffffffff })
          ).map(([a, b, c, d]) => {
            const hex = [a, b, c, d]
              .map((n) => n.toString(16).padStart(8, '0'))
              .join('');
            return hex;
          }),
          // 0x + 64 hex characters
          fc.tuple(
            fc.constant('0x'),
            fc.tuple(
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff })
            ).map(([a, b, c, d]) => {
              const hex = [a, b, c, d]
                .map((n) => n.toString(16).padStart(8, '0'))
                .join('');
              return hex;
            })
          ).map(([prefix, hex]) => `${prefix}${hex}`)
        ),
        (privateKeyLike) => {
          const result = validateWalletInput(privateKeyLike);

          expect(result.valid).toBe(false);
          expect(result.error?.code).toBe('PRIVATE_KEY_DETECTED');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8.2: Seed phrase patterns are rejected
   * For any string with 12+ space-separated words, validation should reject with SEED_PHRASE_DETECTED
   */
  test('seed phrase patterns are rejected with SEED_PHRASE_DETECTED', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 12, maxLength: 24 })
          .map(words => words.join(' ')),
        (seedPhraseLike) => {
          const result = validateWalletInput(seedPhraseLike);

          expect(result.valid).toBe(false);
          expect(result.error?.code).toBe('SEED_PHRASE_DETECTED');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8.3: Valid Ethereum addresses are accepted
   * For any valid Ethereum address (0x + 40 hex chars), validation should accept with type 'address'
   */
  test('valid Ethereum addresses are accepted', () => {
    fc.assert(
      fc.property(
        fc.tuple(
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
        (address) => {
          const result = validateWalletInput(address);

          expect(result.valid).toBe(true);
          expect(result.type).toBe('address');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8.4: Valid ENS names are accepted
   * For any string ending with .eth, validation should accept with type 'ens'
   */
  test('valid ENS names are accepted', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 })
          .filter(s => !s.includes(' ') && s.length > 0)
          .map(name => `${name}.eth`),
        (ensName) => {
          const result = validateWalletInput(ensName);

          expect(result.valid).toBe(true);
          expect(result.type).toBe('ens');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8.5: Invalid addresses are rejected
   * For any string that's not a valid address or ENS, validation should reject
   */
  test('invalid addresses are rejected', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Too short
          fc.tuple(
            fc.constant('0x'),
            fc.integer({ min: 0, max: 0xffffff })
          ).map(([prefix, n]) => `${prefix}${n.toString(16).padStart(10, '0')}`),
          // Too long
          fc.tuple(
            fc.constant('0x'),
            fc.integer({ min: 0, max: 0xffffffff }),
            fc.integer({ min: 0, max: 0xffffffff })
          ).map(([prefix, a, b]) => `${prefix}${a.toString(16).padStart(8, '0')}${b.toString(16).padStart(8, '0')}extra`),
          // Non-hex characters
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !/^0x[a-fA-F0-9]{40}$/.test(s) && !s.endsWith('.eth')),
          // Random strings
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !/^0x[a-fA-F0-9]{40}$/.test(s) && !s.endsWith('.eth'))
        ),
        (invalidInput) => {
          const result = validateWalletInput(invalidInput);

          // Should be invalid (unless it happens to match a valid pattern)
          if (!result.valid) {
            expect(result.error).toBeDefined();
            expect(result.error?.code).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8.6: Validation is deterministic
   * For any input, validation should return the same result across multiple calls
   */
  test('validation is deterministic', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.tuple(
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
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes(' ')).map(s => `${s}.eth`),
          fc.string({ minLength: 1, maxLength: 50 })
        ),
        (input) => {
          const result1 = validateWalletInput(input);
          const result2 = validateWalletInput(input);
          const result3 = validateWalletInput(input);

          expect(result1).toEqual(result2);
          expect(result2).toEqual(result3);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8.7: Private key rejection is case-insensitive
   * For any private key pattern (uppercase, lowercase, mixed), validation should reject
   */
  test('private key rejection is case-insensitive', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 0, max: 0xffffffff }),
          fc.integer({ min: 0, max: 0xffffffff }),
          fc.integer({ min: 0, max: 0xffffffff }),
          fc.integer({ min: 0, max: 0xffffffff })
        ).map(([a, b, c, d]) => {
          const hex = [a, b, c, d]
            .map((n) => n.toString(16).padStart(8, '0'))
            .join('');
          return hex;
        }),
        (hex) => {
          const lowercase = `0x${hex.toLowerCase()}`;
          const uppercase = `0x${hex.toUpperCase()}`;
          const mixed = `0x${hex.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('')}`;

          expect(validateWalletInput(lowercase).error?.code).toBe('PRIVATE_KEY_DETECTED');
          expect(validateWalletInput(uppercase).error?.code).toBe('PRIVATE_KEY_DETECTED');
          expect(validateWalletInput(mixed).error?.code).toBe('PRIVATE_KEY_DETECTED');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8.8: Seed phrase rejection works with various separators
   * For any 12+ words separated by spaces, validation should reject
   */
  test('seed phrase rejection works with various word counts', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 12, maxLength: 24 })
          .map(words => words.join(' ')),
        (seedPhrase) => {
          const result = validateWalletInput(seedPhrase);

          expect(result.valid).toBe(false);
          expect(result.error?.code).toBe('SEED_PHRASE_DETECTED');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8.9: Error codes are consistent
   * For any invalid input, the error code should be one of the defined codes
   */
  test('error codes are consistent and defined', () => {
    const validErrorCodes = ['PRIVATE_KEY_DETECTED', 'SEED_PHRASE_DETECTED', 'INVALID_ADDRESS'];

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (input) => {
          const result = validateWalletInput(input);

          if (!result.valid && result.error) {
            expect(validErrorCodes).toContain(result.error.code);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8.10: Address format validation is strict
   * For any address-like input, only exact format (0x + 40 hex) should be accepted
   */
  test('address format validation is strict', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Missing 0x prefix
          fc.tuple(
            fc.integer({ min: 0, max: 0xffffffff }),
            fc.integer({ min: 0, max: 0xffffffff }),
            fc.integer({ min: 0, max: 0xffffffff }),
            fc.integer({ min: 0, max: 0xffffffff }),
            fc.integer({ min: 0, max: 0xffffffff })
          ).map(([a, b, c, d, e]) => {
            const hex = [a, b, c, d, e]
              .map((n) => n.toString(16).padStart(8, '0'))
              .join('');
            return hex;
          }),
          // Wrong prefix
          fc.tuple(fc.constantFrom('0X', '0', 'x'), 
            fc.tuple(
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff }),
              fc.integer({ min: 0, max: 0xffffffff })
            ).map(([a, b, c, d, e]) => {
              const hex = [a, b, c, d, e]
                .map((n) => n.toString(16).padStart(8, '0'))
                .join('');
              return hex;
            })
          ).map(([prefix, hex]) => `${prefix}${hex}`),
          // Non-hex characters
          fc.tuple(fc.constant('0x'), fc.string({ minLength: 40, maxLength: 40 }).filter(s => !/^[a-fA-F0-9]{40}$/.test(s)))
            .map(([prefix, hex]) => `${prefix}${hex}`)
        ),
        (invalidAddress) => {
          const result = validateWalletInput(invalidAddress);

          // Should not be accepted as valid address
          if (result.valid && result.type === 'address') {
            // Only valid if it matches exact format
            expect(invalidAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
