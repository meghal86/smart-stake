import * as fc from 'fast-check';

/**
 * Generators for wallet-related property-based tests
 * These generators constrain to valid input spaces for the multi-chain wallet system
 */

// Supported networks in CAIP-2 format
export const SUPPORTED_NETWORKS = [
  'eip155:1',      // Ethereum Mainnet
  'eip155:137',    // Polygon
  'eip155:42161',  // Arbitrum
  'eip155:10',     // Optimism
  'eip155:8453',   // Base
] as const;

/**
 * Generate valid Ethereum addresses (40 hex characters)
 */
export const validEthereumAddressGenerator = fc.string({
  minLength: 40,
  maxLength: 40,
  unit: fc.integer({ min: 0, max: 15 }).map(n => '0123456789abcdef'[n])
}).map(hex => `0x${hex}`);

/**
 * Generate valid CAIP-2 chain namespaces
 */
export const validChainNamespaceGenerator = fc.constantFrom(...SUPPORTED_NETWORKS);

/**
 * Generate invalid CAIP-2 chain namespaces
 */
export const invalidChainNamespaceGenerator = fc.string().filter(
  s => !s.match(/^eip155:\d+$/) || !SUPPORTED_NETWORKS.includes(s as any)
);

/**
 * Generate valid UUIDs
 */
export const validUuidGenerator = fc.uuid();

/**
 * Generate wallet data objects
 */
export const walletDataGenerator = fc.record({
  userId: validUuidGenerator,
  address: validEthereumAddressGenerator,
  chainNamespace: validChainNamespaceGenerator,
  label: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  isPrimary: fc.boolean(),
});

/**
 * Generate arrays of wallet data (for testing multiple wallets)
 */
export const walletArrayGenerator = fc.array(walletDataGenerator, {
  minLength: 0,
  maxLength: 10,
});

/**
 * Generate private key-like patterns (should be rejected)
 */
export const privateKeyPatternGenerator = fc.string({
  minLength: 64,
  maxLength: 64,
  unit: fc.integer({ min: 0, max: 15 }).map(n => '0123456789abcdef'[n])
}).map(hex => `0x${hex}`);

/**
 * Generate seed phrase-like patterns (should be rejected)
 */
export const seedPhrasePatternGenerator = fc.array(
  fc.string({ minLength: 3, maxLength: 10 }),
  { minLength: 12, maxLength: 24 }
).map(words => words.join(' '));

/**
 * Generate valid ENS names
 */
export const validEnsNameGenerator = fc.string({
  minLength: 3,
  maxLength: 20,
}).map(name => `${name}.eth`);

/**
 * Generate case variations of addresses (for testing case-insensitivity)
 */
export const addressCaseVariationGenerator = validEthereumAddressGenerator.chain(addr => {
  const lowerAddr = addr.toLowerCase();
  const upperAddr = addr.toUpperCase();
  const mixedAddr = addr.substring(0, 2) + 
    addr.substring(2).split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('');
  
  return fc.constantFrom(lowerAddr, upperAddr, mixedAddr);
});

/**
 * Generate valid idempotency keys (UUID format)
 */
export const idempotencyKeyGenerator = validUuidGenerator;

/**
 * Generate quota scenarios
 */
export const quotaScenarioGenerator = fc.record({
  usedAddresses: fc.nat({ max: 100 }),
  totalQuota: fc.nat({ min: 1, max: 100 }),
  planType: fc.constantFrom('free', 'pro', 'enterprise'),
});

/**
 * Generate active selection scenarios
 */
export const activeSelectionScenarioGenerator = fc.record({
  availableWallets: fc.array(
    fc.record({
      address: validEthereumAddressGenerator,
      networks: fc.array(validChainNamespaceGenerator, { minLength: 1, maxLength: 3 }),
      isPrimary: fc.boolean(),
    }),
    { minLength: 1, maxLength: 5 }
  ),
  storedAddress: fc.option(validEthereumAddressGenerator),
  storedNetwork: fc.option(validChainNamespaceGenerator),
});

/**
 * Generate network switching scenarios
 */
export const networkSwitchScenarioGenerator = fc.record({
  currentNetwork: validChainNamespaceGenerator,
  targetNetwork: validChainNamespaceGenerator,
  activeWallet: validEthereumAddressGenerator,
  walletNetworks: fc.array(validChainNamespaceGenerator, { minLength: 1, maxLength: 5 }),
});

/**
 * Generate error scenarios
 */
export const errorScenarioGenerator = fc.constantFrom(
  'NETWORK_ERROR',
  'TIMEOUT',
  'INVALID_ADDRESS',
  'ENS_RESOLUTION_FAILED',
  'RATE_LIMITED',
  'QUOTA_EXCEEDED',
  'WALLET_DUPLICATE',
  'UNAUTHORIZED',
  'FORBIDDEN'
);
