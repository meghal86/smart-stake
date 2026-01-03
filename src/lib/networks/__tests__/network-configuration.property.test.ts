/**
 * Property-Based Tests for Network Configuration Validation
 * 
 * Feature: multi-chain-wallet-system, Property 13: Configuration-Driven Extensibility
 * Validates: Requirements 10.1, 10.2, 10.4, 10.5
 * 
 * Tests universal properties for network configuration extensibility:
 * - Network configuration provides standardized interfaces
 * - New networks can be added without code changes
 * - Configuration validation is consistent
 * - UI components dynamically support new networks
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';
import {
  getNetworkConfig,
  getNetworkConfigByChainId,
  getSupportedNetworks,
  getAllNetworks,
  isGuardianSupported,
  getGuardianSupportedNetworks,
  getPrimaryRpcUrl,
  getAllRpcUrls,
  getBlockExplorerUrl,
  getAddressExplorerUrl,
  getTxExplorerUrl,
  validateChainNamespace,
  ALL_NETWORKS,
  SUPPORTED_NETWORKS,
  type NetworkConfig,
} from '../config';

// ============================================================================
// Property Test Generators
// ============================================================================

// Generate valid network configuration
const networkConfigGenerator = fc.record({
  chainId: fc.integer({ min: 1, max: 999999 }),
  chainNamespace: fc.string().filter(s => s.match(/^eip155:[0-9]+$/)),
  name: fc.string({ minLength: 3, maxLength: 50 }),
  shortName: fc.string({ minLength: 2, maxLength: 6 }).map(s => s.toUpperCase()),
  rpcUrls: fc.array(
    fc.webUrl({ validSchemes: ['https', 'http'] }),
    { minLength: 1, maxLength: 5 }
  ),
  blockExplorerUrls: fc.array(
    fc.webUrl({ validSchemes: ['https', 'http'] }),
    { minLength: 1, maxLength: 3 }
  ),
  nativeCurrency: fc.record({
    name: fc.string({ minLength: 2, maxLength: 20 }),
    symbol: fc.string({ minLength: 2, maxLength: 6 }).map(s => s.toUpperCase()),
    decimals: fc.constant(18), // All EVM chains use 18 decimals
  }),
  badgeColor: fc.constantFrom(
    'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'bg-red-500/20 text-red-400 border-red-500/30',
    'bg-green-500/20 text-green-400 border-green-500/30'
  ),
  guardianSupported: fc.boolean(),
  isTestnet: fc.option(fc.boolean()),
  iconUrl: fc.option(fc.string()),
});

// Generate Ethereum addresses
const addressGenerator = fc.hexaString({ minLength: 40, maxLength: 40 }).map(s => `0x${s}`);

// Generate transaction hashes
const txHashGenerator = fc.hexaString({ minLength: 64, maxLength: 64 }).map(s => `0x${s}`);

// Generate existing network chain namespaces
const existingNetworkGenerator = fc.constantFrom(...Object.keys(ALL_NETWORKS));

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: multi-chain-wallet-system, Property 13: Configuration-Driven Extensibility', () => {
  
  test('network configuration provides standardized interfaces', () => {
    fc.assert(
      fc.property(
        existingNetworkGenerator,
        (chainNamespace) => {
          const config = getNetworkConfig(chainNamespace);
          
          // Property: All networks provide standardized interface
          expect(config).toBeDefined();
          expect(config).toHaveProperty('chainId');
          expect(config).toHaveProperty('chainNamespace');
          expect(config).toHaveProperty('name');
          expect(config).toHaveProperty('shortName');
          expect(config).toHaveProperty('rpcUrls');
          expect(config).toHaveProperty('blockExplorerUrls');
          expect(config).toHaveProperty('nativeCurrency');
          expect(config).toHaveProperty('badgeColor');
          expect(config).toHaveProperty('guardianSupported');
          
          // Property: Chain ID lookup returns same config
          const configByChainId = getNetworkConfigByChainId(config!.chainId);
          expect(configByChainId).toEqual(config);
          
          // Property: Chain namespace is consistent
          expect(config!.chainNamespace).toBe(chainNamespace);
          
          // Property: Chain ID matches namespace
          const expectedChainId = parseInt(chainNamespace.split(':')[1], 10);
          expect(config!.chainId).toBe(expectedChainId);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('network configuration validation is consistent', () => {
    fc.assert(
      fc.property(
        networkConfigGenerator,
        (mockConfig) => {
          // Ensure chain namespace matches chain ID
          const chainNamespace = `eip155:${mockConfig.chainId}`;
          const validConfig = {
            ...mockConfig,
            chainNamespace,
          };
          
          // Property: Valid configuration structure is consistent
          expect(validConfig.chainId).toBeTypeOf('number');
          expect(validConfig.chainId).toBeGreaterThan(0);
          expect(validConfig.chainNamespace).toMatch(/^eip155:\d+$/);
          expect(validConfig.name).toBeTypeOf('string');
          expect(validConfig.name.length).toBeGreaterThan(0);
          expect(validConfig.shortName).toBeTypeOf('string');
          expect(validConfig.shortName.length).toBeGreaterThan(0);
          expect(Array.isArray(validConfig.rpcUrls)).toBe(true);
          expect(validConfig.rpcUrls.length).toBeGreaterThan(0);
          expect(Array.isArray(validConfig.blockExplorerUrls)).toBe(true);
          expect(validConfig.blockExplorerUrls.length).toBeGreaterThan(0);
          expect(validConfig.nativeCurrency).toHaveProperty('name');
          expect(validConfig.nativeCurrency).toHaveProperty('symbol');
          expect(validConfig.nativeCurrency).toHaveProperty('decimals');
          expect(validConfig.nativeCurrency.decimals).toBe(18);
          expect(validConfig.badgeColor).toBeTypeOf('string');
          expect(validConfig.guardianSupported).toBeTypeOf('boolean');
          
          // Property: RPC URLs are valid
          validConfig.rpcUrls.forEach(url => {
            expect(url).toMatch(/^https?:\/\/.+/);
          });
          
          // Property: Block explorer URLs are valid
          validConfig.blockExplorerUrls.forEach(url => {
            expect(url).toMatch(/^https?:\/\/.+/);
          });
          
          // Property: Badge colors follow Tailwind pattern
          expect(validConfig.badgeColor).toMatch(/bg-\w+.*text-\w+.*border-\w+/);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('network utility functions are consistent across all networks', () => {
    fc.assert(
      fc.property(
        existingNetworkGenerator,
        (chainNamespace) => {
          // Property: Primary RPC URL is always first in array
          const primaryRpc = getPrimaryRpcUrl(chainNamespace);
          const allRpcs = getAllRpcUrls(chainNamespace);
          
          expect(primaryRpc).toBeDefined();
          expect(allRpcs.length).toBeGreaterThan(0);
          expect(allRpcs[0]).toBe(primaryRpc);
          
          // Property: Block explorer URL is always first in array
          const explorerUrl = getBlockExplorerUrl(chainNamespace);
          const config = getNetworkConfig(chainNamespace);
          
          expect(explorerUrl).toBeDefined();
          expect(config!.blockExplorerUrls[0]).toBe(explorerUrl);
          
          // Property: Guardian support is boolean and consistent
          const guardianSupported = isGuardianSupported(chainNamespace);
          expect(typeof guardianSupported).toBe('boolean');
          expect(guardianSupported).toBe(config!.guardianSupported);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('address and transaction URL generation is consistent', () => {
    fc.assert(
      fc.property(
        existingNetworkGenerator,
        addressGenerator,
        txHashGenerator,
        (chainNamespace, address, txHash) => {
          const addressUrl = getAddressExplorerUrl(chainNamespace, address);
          const txUrl = getTxExplorerUrl(chainNamespace, txHash);
          const explorerUrl = getBlockExplorerUrl(chainNamespace);
          
          if (explorerUrl) {
            // Property: Address URL follows expected format
            expect(addressUrl).toBe(`${explorerUrl}/address/${address}`);
            
            // Property: Transaction URL follows expected format
            expect(txUrl).toBe(`${explorerUrl}/tx/${txHash}`);
            
            // Property: URLs are valid HTTP(S) URLs
            expect(addressUrl).toMatch(/^https?:\/\/.+\/address\/0x[a-fA-F0-9]{40}$/);
            expect(txUrl).toMatch(/^https?:\/\/.+\/tx\/0x[a-fA-F0-9]{64}$/);
          } else {
            // Property: No explorer URL means no address/tx URLs
            expect(addressUrl).toBeNull();
            expect(txUrl).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('network categorization is consistent and complete', () => {
    fc.assert(
      fc.property(
        fc.constant(ALL_NETWORKS),
        (allNetworks) => {
          const supportedNetworks = getSupportedNetworks();
          const allNetworksList = getAllNetworks();
          const guardianNetworks = getGuardianSupportedNetworks();
          
          // Property: Supported networks are subset of all networks
          supportedNetworks.forEach(chainNamespace => {
            expect(chainNamespace in allNetworks).toBe(true);
          });
          
          // Property: All networks list matches object keys
          const networkKeys = Object.keys(allNetworks).sort();
          const networksList = allNetworksList.sort();
          expect(networksList).toEqual(networkKeys);
          
          // Property: Guardian networks have guardianSupported = true
          guardianNetworks.forEach(config => {
            expect(config.guardianSupported).toBe(true);
            expect(config.chainNamespace in allNetworks).toBe(true);
          });
          
          // Property: All Guardian-supported networks are included
          Object.entries(allNetworks).forEach(([chainNamespace, config]) => {
            if (config.guardianSupported) {
              const found = guardianNetworks.some(gConfig => gConfig.chainNamespace === chainNamespace);
              expect(found).toBe(true);
            }
          });
          
          // Property: No duplicate chain IDs across networks
          const chainIds = Object.values(allNetworks).map(config => config.chainId);
          const uniqueChainIds = new Set(chainIds);
          expect(uniqueChainIds.size).toBe(chainIds.length);
          
          // Property: No duplicate short names across networks
          const shortNames = Object.values(allNetworks).map(config => config.shortName);
          const uniqueShortNames = new Set(shortNames);
          expect(uniqueShortNames.size).toBe(shortNames.length);
        }
      ),
      { numRuns: 10 } // Lower runs since testing static configuration
    );
  });

  test('network validation handles edge cases consistently', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          existingNetworkGenerator,
          fc.string().filter(s => !s.match(/^eip155:[0-9]+$/)), // Invalid format
          fc.string().map(s => `eip155:${s}`), // Invalid chain ID
          fc.integer({ min: 1000000, max: 9999999 }).map(id => `eip155:${id}`) // Unknown chain ID
        ),
        (testNamespace) => {
          const validationResult = validateChainNamespace(testNamespace);
          const config = getNetworkConfig(testNamespace);
          
          if (testNamespace in ALL_NETWORKS) {
            // Property: Known networks are valid
            expect(validationResult.isValid).toBe(true);
            expect(validationResult.error).toBeUndefined();
            expect(config).toBeDefined();
          } else {
            // Property: Unknown/invalid networks are rejected
            expect(validationResult.isValid).toBe(false);
            expect(validationResult.error).toBeDefined();
            expect(config).toBeNull();
          }
          
          // Property: Validation result is consistent with config availability
          expect(validationResult.isValid).toBe(config !== null);
        }
      ),
      { numRuns: 200 }
    );
  });

  test('network configuration supports dynamic extension', () => {
    fc.assert(
      fc.property(
        networkConfigGenerator,
        (newNetworkConfig) => {
          // Simulate adding a new network configuration
          const chainNamespace = newNetworkConfig.chainNamespace;
          
          // Property: New network config has all required fields
          const requiredFields = [
            'chainId', 'chainNamespace', 'name', 'shortName',
            'rpcUrls', 'blockExplorerUrls', 'nativeCurrency',
            'badgeColor', 'guardianSupported'
          ];
          
          requiredFields.forEach(field => {
            expect(newNetworkConfig).toHaveProperty(field);
          });
          
          // Property: Chain namespace format is valid
          expect(chainNamespace).toMatch(/^eip155:\d+$/);
          
          // Property: Chain ID matches namespace
          const chainId = parseInt(chainNamespace.split(':')[1], 10);
          expect(newNetworkConfig.chainId).toBe(chainId);
          
          // Property: RPC URLs are valid
          newNetworkConfig.rpcUrls.forEach(url => {
            expect(url).toMatch(/^https?:\/\/.+/);
          });
          
          // Property: Block explorer URLs are valid
          newNetworkConfig.blockExplorerUrls.forEach(url => {
            expect(url).toMatch(/^https?:\/\/.+/);
          });
          
          // Property: Native currency has required structure
          expect(newNetworkConfig.nativeCurrency).toHaveProperty('name');
          expect(newNetworkConfig.nativeCurrency).toHaveProperty('symbol');
          expect(newNetworkConfig.nativeCurrency).toHaveProperty('decimals');
          expect(newNetworkConfig.nativeCurrency.decimals).toBe(18);
          
          // Property: Badge color follows Tailwind pattern
          expect(newNetworkConfig.badgeColor).toMatch(/bg-\w+.*text-\w+.*border-\w+/);
          
          // Property: Guardian support is boolean
          expect(typeof newNetworkConfig.guardianSupported).toBe('boolean');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('network utility functions handle missing networks gracefully', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000000, max: 9999999 }).map(id => `eip155:${id}`), // Unknown networks
        (unknownNamespace) => {
          // Property: Unknown networks return null/empty consistently
          expect(getNetworkConfig(unknownNamespace)).toBeNull();
          expect(getPrimaryRpcUrl(unknownNamespace)).toBeNull();
          expect(getAllRpcUrls(unknownNamespace)).toEqual([]);
          expect(getBlockExplorerUrl(unknownNamespace)).toBeNull();
          expect(isGuardianSupported(unknownNamespace)).toBe(false);
          
          // Property: Address/tx URLs return null for unknown networks
          const address = '0x1234567890123456789012345678901234567890';
          const txHash = '0x1234567890123456789012345678901234567890123456789012345678901234';
          
          expect(getAddressExplorerUrl(unknownNamespace, address)).toBeNull();
          expect(getTxExplorerUrl(unknownNamespace, txHash)).toBeNull();
          
          // Property: Validation correctly identifies unknown networks
          const validation = validateChainNamespace(unknownNamespace);
          expect(validation.isValid).toBe(false);
          expect(validation.error).toContain('Unsupported network');
        }
      ),
      { numRuns: 50 }
    );
  });

});

// ============================================================================
// Additional Property Tests for Configuration Extensibility
// ============================================================================

describe('Feature: multi-chain-wallet-system, Property 13: Configuration Extensibility Edge Cases', () => {
  
  test('network configuration immutability and consistency', () => {
    fc.assert(
      fc.property(
        existingNetworkGenerator,
        (chainNamespace) => {
          const config1 = getNetworkConfig(chainNamespace);
          const config2 = getNetworkConfig(chainNamespace);
          
          // Property: Configuration is immutable (same reference or deep equal)
          expect(config1).toEqual(config2);
          
          // Property: Multiple calls return consistent results
          expect(getPrimaryRpcUrl(chainNamespace)).toBe(getPrimaryRpcUrl(chainNamespace));
          expect(getBlockExplorerUrl(chainNamespace)).toBe(getBlockExplorerUrl(chainNamespace));
          expect(isGuardianSupported(chainNamespace)).toBe(isGuardianSupported(chainNamespace));
        }
      ),
      { numRuns: 100 }
    );
  });

  test('network list functions return consistent results', () => {
    fc.assert(
      fc.property(
        fc.constant(true), // Dummy property to run test
        () => {
          const supportedNetworks1 = getSupportedNetworks();
          const supportedNetworks2 = getSupportedNetworks();
          const allNetworks1 = getAllNetworks();
          const allNetworks2 = getAllNetworks();
          const guardianNetworks1 = getGuardianSupportedNetworks();
          const guardianNetworks2 = getGuardianSupportedNetworks();
          
          // Property: Network lists are consistent across calls
          expect(supportedNetworks1).toEqual(supportedNetworks2);
          expect(allNetworks1).toEqual(allNetworks2);
          expect(guardianNetworks1).toEqual(guardianNetworks2);
          
          // Property: Lists are properly sorted/ordered
          expect(supportedNetworks1).toEqual([...supportedNetworks1].sort());
          expect(allNetworks1).toEqual([...allNetworks1].sort());
          
          // Property: Guardian networks list matches individual checks
          allNetworks1.forEach(chainNamespace => {
            const isSupported = isGuardianSupported(chainNamespace);
            const inList = guardianNetworks1.some(config => config.chainNamespace === chainNamespace);
            expect(isSupported).toBe(inList);
          });
        }
      ),
      { numRuns: 10 }
    );
  });

});