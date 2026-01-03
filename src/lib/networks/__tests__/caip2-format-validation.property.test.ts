/**
 * Property-Based Tests for CAIP-2 Format Validation
 * 
 * Feature: multi-chain-wallet-system, Property 1: CAIP-2 Format Consistency
 * Validates: Requirements 1.1, 6.2, 10.3
 * 
 * Tests universal properties that should hold for ALL valid CAIP-2 inputs:
 * - All stored wallets use valid CAIP-2 format
 * - Chain namespace maps to valid network configuration
 * - Migration preserves existing wallet data
 * - Network configuration is consistent across all supported chains
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import {
  validateChainNamespace,
  getNetworkConfig,
  legacyChainToCAIP2,
  caip2ToLegacyChain,
  ALL_NETWORKS,
  SUPPORTED_NETWORKS,
  LEGACY_NETWORKS,
  type NetworkConfig,
} from '../config';

// ============================================================================
// Property Test Generators
// ============================================================================

// Generate valid CAIP-2 chain namespaces
const validChainNamespaceGenerator = fc.constantFrom(
  ...Object.keys(ALL_NETWORKS)
);

// Generate valid chain IDs
const validChainIdGenerator = fc.constantFrom(
  ...Object.values(ALL_NETWORKS).map(config => config.chainId)
);

// Generate invalid CAIP-2 formats
const invalidChainNamespaceGenerator = fc.oneof(
  fc.string().filter(s => !s.match(/^eip155:[0-9]+$/)), // Invalid format
  fc.constant(''), // Empty string
  fc.constant('eip155:'), // Missing chain ID
  fc.constant('eip155:abc'), // Non-numeric chain ID
  fc.constant('bitcoin:1'), // Wrong namespace
  fc.constant('eip155:-1'), // Negative chain ID
);

// Generate wallet-like objects for testing
const walletGenerator = fc.record({
  address: fc.string({ minLength: 40, maxLength: 40 })
    .filter(s => /^[0-9a-fA-F]{40}$/.test(s))
    .map(s => `0x${s.toLowerCase()}`),
  chainNamespace: validChainNamespaceGenerator,
  label: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  verified: fc.boolean(),
});

// Generate legacy chain names
const legacyChainGenerator = fc.constantFrom(
  'ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'bsc', 'avalanche', 'fantom'
);

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: multi-chain-wallet-system, Property 1: CAIP-2 Format Consistency', () => {
  
  test('all configured networks use valid CAIP-2 format', () => {
    fc.assert(
      fc.property(
        validChainNamespaceGenerator,
        (chainNamespace) => {
          // Property: All chain namespaces follow CAIP-2 format
          expect(chainNamespace).toMatch(/^eip155:\d+$/);
          
          // Property: Chain namespace maps to valid network configuration
          const config = getNetworkConfig(chainNamespace);
          expect(config).toBeDefined();
          expect(config).toHaveProperty('chainId');
          expect(config).toHaveProperty('name');
          expect(config).toHaveProperty('shortName');
          expect(config).toHaveProperty('rpcUrls');
          expect(config).toHaveProperty('blockExplorerUrls');
          expect(config).toHaveProperty('nativeCurrency');
          expect(config).toHaveProperty('badgeColor');
          expect(config).toHaveProperty('guardianSupported');
          
          // Property: Chain ID in namespace matches config chain ID
          const chainId = parseInt(chainNamespace.split(':')[1], 10);
          expect(config!.chainId).toBe(chainId);
          
          // Property: Chain namespace in config matches input
          expect(config!.chainNamespace).toBe(chainNamespace);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('CAIP-2 validation is consistent and deterministic', () => {
    fc.assert(
      fc.property(
        fc.oneof(validChainNamespaceGenerator, invalidChainNamespaceGenerator),
        (chainNamespace) => {
          const result1 = validateChainNamespace(chainNamespace);
          const result2 = validateChainNamespace(chainNamespace);
          
          // Property: Validation is deterministic
          expect(result1.isValid).toBe(result2.isValid);
          expect(result1.error).toBe(result2.error);
          expect(result1.chainNamespace).toBe(result2.chainNamespace);
          
          // Property: Valid namespaces have no error
          if (result1.isValid) {
            expect(result1.error).toBeUndefined();
            expect(result1.chainNamespace).toBe(chainNamespace);
          }
          
          // Property: Invalid namespaces have error message
          if (!result1.isValid) {
            expect(result1.error).toBeDefined();
            expect(typeof result1.error).toBe('string');
            expect(result1.error!.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  test('legacy chain conversion preserves data integrity', () => {
    fc.assert(
      fc.property(
        legacyChainGenerator,
        (legacyChain) => {
          const caip2 = legacyChainToCAIP2(legacyChain);
          const backToLegacy = caip2ToLegacyChain(caip2);
          
          // Property: Round-trip conversion preserves original value
          expect(backToLegacy).toBe(legacyChain);
          
          // Property: CAIP-2 result is valid format
          expect(caip2).toMatch(/^eip155:\d+$/);
          
          // Property: CAIP-2 result maps to valid network
          const config = getNetworkConfig(caip2);
          expect(config).toBeDefined();
          
          // Property: Network configuration is consistent
          expect(config!.chainNamespace).toBe(caip2);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('wallet data structure consistency across all networks', () => {
    fc.assert(
      fc.property(
        fc.array(walletGenerator, { minLength: 1, maxLength: 20 }),
        (wallets) => {
          wallets.forEach((wallet, index) => {
            // Property: All wallet addresses are valid Ethereum format
            expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
            
            // Property: All chain namespaces are valid CAIP-2
            expect(wallet.chainNamespace).toMatch(/^eip155:\d+$/);
            
            // Property: Chain namespace maps to valid configuration
            const config = getNetworkConfig(wallet.chainNamespace);
            expect(config).toBeDefined();
            
            // Property: Network configuration has required fields
            expect(config!.chainId).toBeTypeOf('number');
            expect(config!.chainId).toBeGreaterThan(0);
            expect(config!.name).toBeTypeOf('string');
            expect(config!.name.length).toBeGreaterThan(0);
            expect(config!.shortName).toBeTypeOf('string');
            expect(config!.shortName.length).toBeGreaterThan(0);
            expect(Array.isArray(config!.rpcUrls)).toBe(true);
            expect(config!.rpcUrls.length).toBeGreaterThan(0);
            expect(Array.isArray(config!.blockExplorerUrls)).toBe(true);
            expect(config!.blockExplorerUrls.length).toBeGreaterThan(0);
            expect(config!.nativeCurrency).toHaveProperty('name');
            expect(config!.nativeCurrency).toHaveProperty('symbol');
            expect(config!.nativeCurrency).toHaveProperty('decimals');
            expect(config!.nativeCurrency.decimals).toBe(18); // All EVM chains use 18 decimals
            expect(config!.badgeColor).toBeTypeOf('string');
            expect(config!.badgeColor.length).toBeGreaterThan(0);
            expect(config!.guardianSupported).toBeTypeOf('boolean');
            
            // Property: Labels are optional but if present, non-empty
            if (wallet.label) {
              expect(wallet.label.length).toBeGreaterThan(0);
            }
            
            // Property: Verified status is boolean
            expect(typeof wallet.verified).toBe('boolean');
          });
          
          // Property: No duplicate wallet addresses per network
          const addressNetworkPairs = wallets.map(w => `${w.address.toLowerCase()}-${w.chainNamespace}`);
          const uniquePairs = new Set(addressNetworkPairs);
          expect(uniquePairs.size).toBe(addressNetworkPairs.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('network configuration completeness and consistency', () => {
    fc.assert(
      fc.property(
        fc.constant(ALL_NETWORKS),
        (networks) => {
          const networkEntries = Object.entries(networks);
          
          networkEntries.forEach(([chainNamespace, config]) => {
            // Property: Chain namespace key matches config chainNamespace
            expect(config.chainNamespace).toBe(chainNamespace);
            
            // Property: Chain namespace follows CAIP-2 format
            expect(chainNamespace).toMatch(/^eip155:\d+$/);
            
            // Property: Chain ID in namespace matches config
            const chainId = parseInt(chainNamespace.split(':')[1], 10);
            expect(config.chainId).toBe(chainId);
            
            // Property: RPC URLs are valid HTTP(S) URLs
            config.rpcUrls.forEach(url => {
              expect(url).toMatch(/^https?:\/\/.+/);
            });
            
            // Property: Block explorer URLs are valid HTTP(S) URLs
            config.blockExplorerUrls.forEach(url => {
              expect(url).toMatch(/^https?:\/\/.+/);
            });
            
            // Property: Badge colors use Tailwind CSS classes
            expect(config.badgeColor).toMatch(/bg-\w+/);
            expect(config.badgeColor).toMatch(/text-\w+/);
            expect(config.badgeColor).toMatch(/border-\w+/);
            
            // Property: Native currency has valid decimals
            expect(config.nativeCurrency.decimals).toBe(18);
            
            // Property: Short names are uppercase and concise
            expect(config.shortName).toMatch(/^[A-Z]{2,6}$/);
          });
          
          // Property: No duplicate chain IDs
          const chainIds = networkEntries.map(([, config]) => config.chainId);
          const uniqueChainIds = new Set(chainIds);
          expect(uniqueChainIds.size).toBe(chainIds.length);
          
          // Property: No duplicate short names
          const shortNames = networkEntries.map(([, config]) => config.shortName);
          const uniqueShortNames = new Set(shortNames);
          expect(uniqueShortNames.size).toBe(shortNames.length);
          
          // Property: Supported networks are subset of all networks
          Object.keys(SUPPORTED_NETWORKS).forEach(chainNamespace => {
            expect(chainNamespace in networks).toBe(true);
          });
          
          // Property: Legacy networks are subset of all networks
          Object.keys(LEGACY_NETWORKS).forEach(chainNamespace => {
            expect(chainNamespace in networks).toBe(true);
          });
        }
      ),
      { numRuns: 10 } // Lower runs since this tests the static configuration
    );
  });

  test('network detection and validation error handling', () => {
    fc.assert(
      fc.property(
        invalidChainNamespaceGenerator,
        (invalidNamespace) => {
          const result = validateChainNamespace(invalidNamespace);
          
          // Property: Invalid namespaces are consistently rejected
          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();
          expect(typeof result.error).toBe('string');
          expect(result.error!.length).toBeGreaterThan(0);
          
          // Property: Error messages are descriptive
          if (!invalidNamespace.match(/^eip155:[0-9]+$/)) {
            expect(result.error).toContain('Invalid CAIP-2 format');
          }
          
          // Property: Network config returns null for invalid namespaces
          const config = getNetworkConfig(invalidNamespace);
          expect(config).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('migration data preservation properties', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            address: fc.string({ minLength: 40, maxLength: 40 })
              .filter(s => /^[0-9a-fA-F]{40}$/.test(s))
              .map(s => `0x${s.toLowerCase()}`),
            legacyChain: legacyChainGenerator,
            label: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
            trustScore: fc.option(fc.integer({ min: 0, max: 100 })),
            verified: fc.boolean(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (legacyWallets) => {
          // Simulate migration process
          const migratedWallets = legacyWallets.map(wallet => ({
            ...wallet,
            chainNamespace: legacyChainToCAIP2(wallet.legacyChain),
          }));
          
          migratedWallets.forEach((migratedWallet, index) => {
            const originalWallet = legacyWallets[index];
            
            // Property: Address is preserved during migration
            expect(migratedWallet.address).toBe(originalWallet.address);
            
            // Property: Label is preserved during migration
            expect(migratedWallet.label).toBe(originalWallet.label);
            
            // Property: Trust score is preserved during migration
            expect(migratedWallet.trustScore).toBe(originalWallet.trustScore);
            
            // Property: Verified status is preserved during migration
            expect(migratedWallet.verified).toBe(originalWallet.verified);
            
            // Property: Chain namespace is valid CAIP-2 format
            expect(migratedWallet.chainNamespace).toMatch(/^eip155:\d+$/);
            
            // Property: Chain namespace maps to valid network
            const config = getNetworkConfig(migratedWallet.chainNamespace);
            expect(config).toBeDefined();
            
            // Property: Legacy chain can be recovered from CAIP-2
            const recoveredLegacyChain = caip2ToLegacyChain(migratedWallet.chainNamespace);
            expect(recoveredLegacyChain).toBe(originalWallet.legacyChain);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

});

// ============================================================================
// Additional Property Tests for Edge Cases
// ============================================================================

describe('Feature: multi-chain-wallet-system, Property 1: CAIP-2 Edge Cases', () => {
  
  test('boundary conditions for chain IDs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 999999 }), // Reasonable chain ID range
        (chainId) => {
          const chainNamespace = `eip155:${chainId}`;
          
          // Property: Valid CAIP-2 format is always recognized as such
          expect(chainNamespace).toMatch(/^eip155:\d+$/);
          
          // Property: Validation handles unknown networks gracefully
          const result = validateChainNamespace(chainNamespace);
          if (chainNamespace in ALL_NETWORKS) {
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
          } else {
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Unsupported network');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('case sensitivity and normalization', () => {
    fc.assert(
      fc.property(
        validChainNamespaceGenerator,
        fc.constantFrom('upper', 'lower', 'mixed'),
        (chainNamespace, caseType) => {
          let testNamespace = chainNamespace;
          
          // Apply case transformation
          switch (caseType) {
            case 'upper':
              testNamespace = chainNamespace.toUpperCase();
              break;
            case 'lower':
              testNamespace = chainNamespace.toLowerCase();
              break;
            case 'mixed':
              testNamespace = chainNamespace
                .split('')
                .map((char, i) => i % 2 === 0 ? char.toUpperCase() : char.toLowerCase())
                .join('');
              break;
          }
          
          // Property: Only exact case matches are valid (CAIP-2 is case-sensitive)
          const result = validateChainNamespace(testNamespace);
          if (testNamespace === chainNamespace) {
            expect(result.isValid).toBe(true);
          } else {
            // Case-insensitive matches should be invalid
            expect(result.isValid).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

});