import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import {
  validateChainNamespace,
  isSupportedNetwork,
  getNetworkName,
  SUPPORTED_NETWORKS,
} from '../../wallet-validation';

/**
 * Property-Based Tests for CAIP-2 Format Validation
 * Feature: multi-chain-wallet-system, Property 1: CAIP-2 Format Consistency
 * Validates: Requirements 1.4
 *
 * CAIP-2 (Chain Agnostic Improvement Proposal 2) defines a standard format for
 * identifying blockchain networks: namespace:reference
 * For EVM networks: eip155:chainId
 *
 * Examples:
 * - eip155:1 (Ethereum Mainnet)
 * - eip155:137 (Polygon)
 * - eip155:42161 (Arbitrum One)
 * - eip155:10 (Optimism)
 * - eip155:8453 (Base)
 */

describe('Feature: multi-chain-wallet-system, Property 1: CAIP-2 Format Consistency', () => {
  /**
   * Property 1.1: Valid CAIP-2 format acceptance
   * For any valid CAIP-2 namespace (eip155:chainId), validateChainNamespace should return true
   */
  test('all valid CAIP-2 namespaces are accepted', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constant('eip155:'),
          fc.integer({ min: 1, max: 999999 })
        ).map(([prefix, chainId]) => `${prefix}${chainId}`),
        (namespace) => {
          const result = validateChainNamespace(namespace);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.2: Invalid CAIP-2 format rejection
   * For any string that doesn't follow eip155:chainId format, validateChainNamespace should return false
   */
  test('invalid CAIP-2 formats are rejected', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Missing eip155 prefix
          fc.integer({ min: 1, max: 999999 }).map(id => id.toString()),
          // Missing colon
          fc.tuple(fc.constant('eip155'), fc.integer({ min: 1, max: 999999 }))
            .map(([prefix, id]) => `${prefix}${id}`),
          // Non-numeric chain ID
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => !/^\d+$/.test(s))
            .map(s => `eip155:${s}`),
          // Wrong namespace prefix
          fc.tuple(
            fc.constantFrom('eth', 'polygon', 'arbitrum', 'optimism', 'base'),
            fc.integer({ min: 1, max: 999999 })
          ).map(([prefix, id]) => `${prefix}:${id}`),
          // Empty string
          fc.constant(''),
          // Just colon
          fc.constant(':'),
          // Malformed variations
          fc.string({ minLength: 1, maxLength: 50 }).filter(
            s => !s.match(/^eip155:\d+$/)
          )
        ),
        (namespace) => {
          const result = validateChainNamespace(namespace);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.3: Supported networks are valid CAIP-2
   * For any supported network in SUPPORTED_NETWORKS, the key should be a valid CAIP-2 namespace
   */
  test('all supported networks follow CAIP-2 format', () => {
    Object.keys(SUPPORTED_NETWORKS).forEach((namespace) => {
      const result = validateChainNamespace(namespace);
      expect(result).toBe(true);
      // Verify format: eip155:chainId
      expect(namespace).toMatch(/^eip155:\d+$/);
    });
  });

  /**
   * Property 1.4: Supported network validation consistency
   * For any supported network, isSupportedNetwork should return true
   */
  test('all supported networks are recognized by isSupportedNetwork', () => {
    Object.keys(SUPPORTED_NETWORKS).forEach((namespace) => {
      const result = isSupportedNetwork(namespace);
      expect(result).toBe(true);
    });
  });

  /**
   * Property 1.5: Unsupported networks are rejected
   * For any CAIP-2 formatted namespace that's not in SUPPORTED_NETWORKS, isSupportedNetwork should return false
   */
  test('unsupported CAIP-2 namespaces are rejected', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constant('eip155:'),
          fc.integer({ min: 1, max: 999999 })
        )
          .map(([prefix, chainId]) => `${prefix}${chainId}`)
          .filter(ns => !(ns in SUPPORTED_NETWORKS)),
        (namespace) => {
          const result = isSupportedNetwork(namespace);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.6: Network name retrieval consistency
   * For any supported network, getNetworkName should return a non-null string
   */
  test('supported networks have retrievable names', () => {
    Object.keys(SUPPORTED_NETWORKS).forEach((namespace) => {
      const name = getNetworkName(namespace);
      expect(name).not.toBeNull();
      expect(typeof name).toBe('string');
      expect(name!.length).toBeGreaterThan(0);
    });
  });

  /**
   * Property 1.7: Unsupported network name retrieval
   * For any unsupported network, getNetworkName should return null
   */
  test('unsupported networks return null for getNetworkName', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constant('eip155:'),
          fc.integer({ min: 1, max: 999999 })
        )
          .map(([prefix, chainId]) => `${prefix}${chainId}`)
          .filter(ns => !(ns in SUPPORTED_NETWORKS)),
        (namespace) => {
          const name = getNetworkName(namespace);
          expect(name).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.8: Chain ID extraction from CAIP-2
   * For any valid CAIP-2 namespace, the chain ID should be extractable and numeric
   */
  test('chain IDs are correctly extracted from CAIP-2 namespaces', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constant('eip155:'),
          fc.integer({ min: 1, max: 999999 })
        ).map(([prefix, chainId]) => ({ namespace: `${prefix}${chainId}`, expectedChainId: chainId })),
        ({ namespace, expectedChainId }) => {
          // Extract chain ID from namespace
          const match = namespace.match(/^eip155:(\d+)$/);
          expect(match).not.toBeNull();
          expect(match![1]).toBe(expectedChainId.toString());
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.9: CAIP-2 format is deterministic
   * For any valid CAIP-2 namespace, validating it multiple times should always return the same result
   */
  test('CAIP-2 validation is deterministic', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constant('eip155:'),
          fc.integer({ min: 1, max: 999999 })
        ).map(([prefix, chainId]) => `${prefix}${chainId}`),
        (namespace) => {
          const result1 = validateChainNamespace(namespace);
          const result2 = validateChainNamespace(namespace);
          const result3 = validateChainNamespace(namespace);
          
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1.10: Supported networks have correct chain IDs
   * For each supported network, the chain ID in the namespace should match the chainId property
   */
  test('supported networks have consistent chain IDs', () => {
    Object.entries(SUPPORTED_NETWORKS).forEach(([namespace, config]) => {
      // Extract chain ID from namespace
      const match = namespace.match(/^eip155:(\d+)$/);
      expect(match).not.toBeNull();
      const extractedChainId = parseInt(match![1], 10);
      
      // Should match the chainId property
      expect(extractedChainId).toBe(config.chainId);
    });
  });
});
