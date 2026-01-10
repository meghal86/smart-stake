import * as fc from 'fast-check';

/**
 * Generators for wallet-related property-based tests
 * These generators constrain to valid input spaces for the multi-chain wallet system
 * 
 * Smart generators follow these principles:
 * 1. Constrain to valid input space (no invalid data by default)
 * 2. Generate realistic data distributions
 * 3. Support edge cases through explicit generators
 * 4. Provide factory functions for complex scenarios
 */

// Supported networks in CAIP-2 format
export const SUPPORTED_NETWORKS = [
  'eip155:1',      // Ethereum Mainnet
  'eip155:137',    // Polygon
  'eip155:42161',  // Arbitrum
  'eip155:10',     // Optimism
  'eip155:8453',   // Base
] as const;

// ============================================================================
// BASIC GENERATORS (Constrained to Valid Input Space)
// ============================================================================

/**
 * Generate valid Ethereum addresses (40 hex characters)
 * Constraint: Always produces valid 0x-prefixed hex strings
 */
export const ethereumAddressArbitrary = () => fc.string({
  minLength: 40,
  maxLength: 40,
  unit: fc.integer({ min: 0, max: 15 }).map(n => '0123456789abcdef'[n])
}).map(hex => `0x${hex}`);

/**
 * Generate valid CAIP-2 chain namespaces
 * Constraint: Only generates supported networks
 */
export const caip2NetworkArbitrary = () => fc.constantFrom(...SUPPORTED_NETWORKS);

/**
 * Generate valid UUIDs
 * Constraint: Always produces RFC 4122 compliant UUIDs
 */
export const uuidArbitrary = () => fc.uuid();

/**
 * Generate valid timestamps (ISO 8601 strings)
 * Constraint: Dates between 2020-01-01 and now
 */
export const timestampArbitrary = () => fc.date({
  min: new Date('2020-01-01T00:00:00Z'),
  max: new Date()
}).map(d => {
  // Ensure the date is valid before converting to ISO string
  if (isNaN(d.getTime())) {
    return new Date().toISOString();
  }
  return d.toISOString();
});

/**
 * Generate valid labels for wallets
 * Constraint: 1-50 characters, alphanumeric + spaces
 */
export const walletLabelArbitrary = () => fc.string({
  minLength: 1,
  maxLength: 50,
  unit: fc.oneof(
    fc.integer({ min: 97, max: 122 }), // a-z
    fc.integer({ min: 65, max: 90 }),  // A-Z
    fc.integer({ min: 48, max: 57 }),  // 0-9
    fc.constant(32)                     // space
  )
}).map(s => s.trim()).filter(s => s.length > 0);

// ============================================================================
// SERVER WALLET GENERATORS (Database Row Format)
// ============================================================================

/**
 * Generate a single server wallet row
 * Constraint: Matches database schema exactly
 */
export const serverWalletArbitrary = () => fc.record({
  id: uuidArbitrary(),
  user_id: uuidArbitrary(),
  address: ethereumAddressArbitrary(),
  address_lc: ethereumAddressArbitrary().map(a => a.toLowerCase()),
  chain_namespace: caip2NetworkArbitrary(),
  label: fc.option(walletLabelArbitrary()),
  is_primary: fc.boolean(),
  guardian_scores: fc.record({
    score: fc.nat({ max: 100 }),
    timestamp: timestampArbitrary()
  }, { requiredKeys: [] }),
  balance_cache: fc.record({
    balance: fc.float({ min: 0, max: 1000000 }),
    timestamp: timestampArbitrary()
  }, { requiredKeys: [] }),
  created_at: timestampArbitrary(),
  updated_at: timestampArbitrary(),
});

/**
 * Generate an array of server wallets
 * Constraint: 0-10 wallets, deterministically ordered
 */
export const serverWalletArrayArbitrary = () => fc.array(
  serverWalletArbitrary(),
  { minLength: 0, maxLength: 10 }
).map(wallets => 
  // Sort deterministically: primary first, then by created_at desc, then by id asc
  wallets.sort((a, b) => {
    if (a.is_primary !== b.is_primary) {
      return a.is_primary ? -1 : 1;
    }
    const dateCompare = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.id.localeCompare(b.id);
  })
);

/**
 * Generate server wallets with exactly one primary
 * Constraint: Ensures primary wallet invariant
 */
export const serverWalletsWithPrimaryArbitrary = () => fc.array(
  serverWalletArbitrary(),
  { minLength: 1, maxLength: 10 }
).map(wallets => {
  // Ensure exactly one primary
  const withoutPrimary = wallets.map(w => ({ ...w, is_primary: false }));
  const primaryIndex = Math.floor(Math.random() * withoutPrimary.length);
  withoutPrimary[primaryIndex].is_primary = true;
  
  // Sort deterministically
  return withoutPrimary.sort((a, b) => {
    if (a.is_primary !== b.is_primary) {
      return a.is_primary ? -1 : 1;
    }
    const dateCompare = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.id.localeCompare(b.id);
  });
});

/**
 * Generate server wallets with no primary
 * Constraint: All is_primary = false
 */
export const serverWalletsWithoutPrimaryArbitrary = () => fc.array(
  serverWalletArbitrary(),
  { minLength: 0, maxLength: 10 }
).map(wallets => 
  wallets.map(w => ({ ...w, is_primary: false }))
);

/**
 * Generate server wallets where a specific address exists on a specific network
 * Constraint: Ensures the address-network combination exists
 */
export const serverWalletsWithAddressOnNetworkArbitrary = () => fc.tuple(
  ethereumAddressArbitrary(),
  caip2NetworkArbitrary(),
  fc.array(serverWalletArbitrary(), { minLength: 0, maxLength: 5 })
).map(([address, network, otherWallets]) => {
  // Create a wallet with the specified address and network
  const targetWallet = {
    id: fc.sample(uuidArbitrary(), 1)[0],
    user_id: fc.sample(uuidArbitrary(), 1)[0],
    address,
    address_lc: address.toLowerCase(),
    chain_namespace: network,
    label: null,
    is_primary: true,
    guardian_scores: {},
    balance_cache: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  return [targetWallet, ...otherWallets];
});

// ============================================================================
// CONNECTED WALLET GENERATORS (UI Format)
// ============================================================================

/**
 * Generate a connected wallet (UI format - grouped by address)
 * Constraint: Matches ConnectedWallet interface
 */
export const connectedWalletArbitrary = () => fc.record({
  address: ethereumAddressArbitrary(),
  networks: fc.array(caip2NetworkArbitrary(), { minLength: 1, maxLength: 5 }),
  primaryAddress: fc.boolean(),
  chain: fc.constantFrom('ethereum', 'polygon', 'arbitrum', 'optimism', 'base'),
  supportedNetworks: fc.array(caip2NetworkArbitrary(), { minLength: 1, maxLength: 5 }),
  balancesByNetwork: fc.record({}, { requiredKeys: [] }),
  guardianScoresByNetwork: fc.record({}, { requiredKeys: [] }),
  label: fc.option(walletLabelArbitrary()),
});

// ============================================================================
// LOCALSTORAGE STATE GENERATORS
// ============================================================================

/**
 * Generate localStorage state
 * Constraint: Only contains address and network (UI preferences)
 */
export const localStorageStateArbitrary = () => fc.record({
  address: fc.option(ethereumAddressArbitrary()),
  network: fc.option(caip2NetworkArbitrary()),
});

// ============================================================================
// VALIDATION INPUT GENERATORS
// ============================================================================

/**
 * Generate valid Ethereum addresses (for validation testing)
 */
export const validEthereumAddressGenerator = ethereumAddressArbitrary();

/**
 * Generate valid CAIP-2 chain namespaces
 */
export const validChainNamespaceGenerator = caip2NetworkArbitrary();

/**
 * Generate invalid CAIP-2 chain namespaces
 * Constraint: Generates strings that don't match CAIP-2 format
 */
export const invalidChainNamespaceGenerator = fc.string().filter(
  s => !s.match(/^eip155:\d+$/) || !SUPPORTED_NETWORKS.includes(s as any)
);

/**
 * Generate private key-like patterns (should be rejected)
 * Constraint: 64 hex characters with optional 0x prefix
 */
export const privateKeyPatternGenerator = fc.string({
  minLength: 64,
  maxLength: 64,
  unit: fc.integer({ min: 0, max: 15 }).map(n => '0123456789abcdef'[n])
}).map(hex => `0x${hex}`);

/**
 * Generate seed phrase-like patterns (should be rejected)
 * Constraint: 12-24 space-separated words
 */
export const seedPhrasePatternGenerator = fc.array(
  fc.string({ minLength: 3, maxLength: 10 }),
  { minLength: 12, maxLength: 24 }
).map(words => words.join(' '));

/**
 * Generate valid ENS names
 * Constraint: 3-20 characters + .eth suffix
 */
export const validEnsNameGenerator = fc.string({
  minLength: 3,
  maxLength: 20,
}).map(name => `${name}.eth`);

/**
 * Generate case variations of addresses (for testing case-insensitivity)
 * Constraint: Same address in different cases
 */
export const addressCaseVariationGenerator = ethereumAddressArbitrary().chain(addr => {
  const lowerAddr = addr.toLowerCase();
  const upperAddr = addr.toUpperCase();
  const mixedAddr = addr.substring(0, 2) + 
    addr.substring(2).split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('');
  
  return fc.constantFrom(lowerAddr, upperAddr, mixedAddr);
});

/**
 * Generate valid idempotency keys (UUID format)
 * Constraint: RFC 4122 compliant UUIDs
 */
export const idempotencyKeyGenerator = uuidArbitrary();

// ============================================================================
// SCENARIO GENERATORS (Complex Multi-Component Scenarios)
// ============================================================================

/**
 * Generate quota scenarios
 * Constraint: Realistic quota values
 */
export const quotaScenarioGenerator = fc.record({
  usedAddresses: fc.nat({ max: 100 }),
  totalQuota: fc.nat({ min: 1, max: 100 }),
  planType: fc.constantFrom('free', 'pro', 'enterprise'),
});

/**
 * Generate active selection scenarios
 * Constraint: Valid wallet and network combinations
 */
export const activeSelectionScenarioGenerator = fc.record({
  availableWallets: fc.array(
    fc.record({
      address: ethereumAddressArbitrary(),
      networks: fc.array(caip2NetworkArbitrary(), { minLength: 1, maxLength: 3 }),
      isPrimary: fc.boolean(),
    }),
    { minLength: 1, maxLength: 5 }
  ),
  storedAddress: fc.option(ethereumAddressArbitrary()),
  storedNetwork: fc.option(caip2NetworkArbitrary()),
});

/**
 * Generate network switching scenarios
 * Constraint: Valid network transitions
 */
export const networkSwitchScenarioGenerator = fc.record({
  currentNetwork: caip2NetworkArbitrary(),
  targetNetwork: caip2NetworkArbitrary(),
  activeWallet: ethereumAddressArbitrary(),
  walletNetworks: fc.array(caip2NetworkArbitrary(), { minLength: 1, maxLength: 5 }),
});

/**
 * Generate error scenarios
 * Constraint: Valid error codes
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

// ============================================================================
// LEGACY GENERATORS (For Backward Compatibility)
// ============================================================================

/**
 * Generate wallet data objects (legacy format)
 */
export const walletDataGenerator = fc.record({
  userId: uuidArbitrary(),
  address: ethereumAddressArbitrary(),
  chainNamespace: caip2NetworkArbitrary(),
  label: fc.option(walletLabelArbitrary()),
  isPrimary: fc.boolean(),
});

/**
 * Generate arrays of wallet data (legacy format)
 */
export const walletArrayGenerator = fc.array(walletDataGenerator, {
  minLength: 0,
  maxLength: 10,
});
