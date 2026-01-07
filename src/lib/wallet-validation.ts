/**
 * Wallet validation utilities for multi-chain wallet system
 * 
 * These utilities are used by both the client and Edge Functions
 * to validate wallet addresses, ENS names, and detect security issues.
 */

/**
 * Validate CAIP-2 chain namespace format
 * Format: eip155:<chainId>
 * Examples: eip155:1, eip155:137, eip155:42161
 */
export function validateChainNamespace(chainNamespace: string): boolean {
  const caip2Pattern = /^eip155:\d+$/
  return caip2Pattern.test(chainNamespace)
}

/**
 * Check if input matches private key pattern
 * Private keys are 64 hex characters with optional 0x prefix
 * Examples: 0x1234...abcd (64 hex chars), 1234...abcd (64 hex chars)
 */
export function isPrivateKeyPattern(input: string): boolean {
  return /^(0x)?[a-fA-F0-9]{64}$/.test(input)
}

/**
 * Check if input matches seed phrase pattern
 * Seed phrases are 12 or more space-separated words
 * Examples: "word1 word2 word3 ... word12"
 */
export function isSeedPhrasePattern(input: string): boolean {
  const words = input.trim().split(/\s+/).filter(word => word.length > 0)
  return words.length >= 12
}

/**
 * Validate Ethereum address format
 * Valid format: 0x followed by 40 hex characters
 * Examples: 0x1234567890123456789012345678901234567890
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Check if input is an ENS name
 * ENS names end with .eth and have at least one character before .eth
 * Examples: vitalik.eth, alice.eth
 */
export function isENSName(input: string): boolean {
  return input.endsWith('.eth') && input.length > 4
}

/**
 * Normalize Ethereum address to lowercase
 * This is important for case-insensitive comparisons
 */
export function normalizeAddress(address: string): string {
  return address.toLowerCase()
}

/**
 * Validate wallet input (address or ENS)
 * Returns validation result with error details if invalid
 */
export function validateWalletInput(input: string): {
  valid: boolean
  type?: 'address' | 'ens'
  error?: { code: string; message: string }
} {
  // Check for private key pattern
  if (isPrivateKeyPattern(input)) {
    return {
      valid: false,
      error: {
        code: 'PRIVATE_KEY_DETECTED',
        message: 'Private keys are not allowed. Please provide a wallet address or ENS name.',
      },
    }
  }

  // Check for seed phrase pattern
  if (isSeedPhrasePattern(input)) {
    return {
      valid: false,
      error: {
        code: 'SEED_PHRASE_DETECTED',
        message: 'Seed phrases are not allowed. Please provide a wallet address or ENS name.',
      },
    }
  }

  // Check if it's an ENS name
  if (isENSName(input)) {
    return { valid: true, type: 'ens' }
  }

  // Check if it's a valid Ethereum address
  if (isValidEthereumAddress(input)) {
    return { valid: true, type: 'address' }
  }

  return {
    valid: false,
    error: {
      code: 'INVALID_ADDRESS',
      message: 'Invalid Ethereum address or ENS name format',
    },
  }
}

/**
 * Supported EVM networks (CAIP-2 format)
 */
export const SUPPORTED_NETWORKS = {
  'eip155:1': { name: 'Ethereum Mainnet', chainId: 1 },
  'eip155:137': { name: 'Polygon', chainId: 137 },
  'eip155:42161': { name: 'Arbitrum One', chainId: 42161 },
  'eip155:10': { name: 'Optimism', chainId: 10 },
  'eip155:8453': { name: 'Base', chainId: 8453 },
} as const

/**
 * Check if a chain namespace is supported
 */
export function isSupportedNetwork(chainNamespace: string): boolean {
  return chainNamespace in SUPPORTED_NETWORKS
}

/**
 * Get network name from chain namespace
 */
export function getNetworkName(chainNamespace: string): string | null {
  const network = SUPPORTED_NETWORKS[chainNamespace as keyof typeof SUPPORTED_NETWORKS]
  return network?.name || null
}
