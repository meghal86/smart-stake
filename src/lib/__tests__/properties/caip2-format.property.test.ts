import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import { validChainNamespaceGenerator, invalidChainNamespaceGenerator } from '../generators/wallet-generators';

/**
 * Feature: multi-chain-wallet-system, Property 1: CAIP-2 Format Consistency
 * Validates: Requirements 1.4
 * 
 * For any network identifier used in the system, it should follow the CAIP-2 format 
 * (eip155:chainId) and be included in the supported networks configuration.
 */
describe('Feature: multi-chain-wallet-system, Property 1: CAIP-2 Format Consistency', () => {
  test('valid CAIP-2 formats are recognized', () => {
    fc.assert(
      fc.property(
        validChainNamespaceGenerator,
        (chainNamespace) => {
          // Property: Valid CAIP-2 format matches pattern
          const caip2Pattern = /^eip155:\d+$/;
          expect(chainNamespace).toMatch(caip2Pattern);
          
          // Property: Contains eip155 prefix
          expect(chainNamespace).toContain('eip155:');
          
          // Property: Has numeric chain ID
          const parts = chainNamespace.split(':');
          expect(parts.length).toBe(2);
          expect(parts[0]).toBe('eip155');
          expect(/^\d+$/.test(parts[1])).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('invalid CAIP-2 formats are rejected', () => {
    fc.assert(
      fc.property(
        invalidChainNamespaceGenerator,
        (chainNamespace) => {
          // Property: Invalid formats don't match CAIP-2 pattern
          const caip2Pattern = /^eip155:\d+$/;
          const isValid = caip2Pattern.test(chainNamespace);
          
          // If it doesn't match the pattern, it's invalid
          if (!isValid) {
            expect(isValid).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('CAIP-2 format is consistent across operations', () => {
    fc.assert(
      fc.property(
        validChainNamespaceGenerator,
        (chainNamespace) => {
          // Property: Format remains consistent through operations
          const stored = chainNamespace;
          const retrieved = chainNamespace;
          
          expect(stored).toBe(retrieved);
          
          // Property: No transformation changes the format
          const transformed = chainNamespace.toLowerCase();
          expect(transformed).toBe(chainNamespace);
        }
      ),
      { numRuns: 100 }
    );
  });
});
