/**
 * MEV Protection Utilities
 * 
 * Handles MEV-protected transaction routing and chain support detection.
 * V1.1 Feature: Requirement 14.3
 */

import type { MevProtectedMode } from '@/types/portfolio';

/**
 * Chains that support MEV protection via Flashbots, Eden, or similar services
 */
export const MEV_SUPPORTED_CHAINS = new Set([
  1,     // Ethereum Mainnet
  5,     // Goerli (testnet)
  11155111, // Sepolia (testnet)
  // Add more chains as MEV protection becomes available
]);

/**
 * MEV protection providers by chain
 */
export const MEV_PROVIDERS_BY_CHAIN: Record<number, string[]> = {
  1: ['flashbots', 'eden', 'bloxroute'],
  5: ['flashbots'],
  11155111: ['flashbots'],
};

/**
 * Check if a chain supports MEV protection
 */
export function isMevSupportedChain(chainId: number): boolean {
  return MEV_SUPPORTED_CHAINS.has(chainId);
}

/**
 * Get available MEV protection providers for a chain
 */
export function getMevProviders(chainId: number): string[] {
  return MEV_PROVIDERS_BY_CHAIN[chainId] || [];
}

/**
 * Determine if MEV protection should be used based on mode and chain support
 */
export function shouldUseMevProtection(
  mode: MevProtectedMode,
  chainId: number
): boolean {
  switch (mode) {
    case 'off':
      return false;
    case 'force':
      // Force mode requires MEV support on the chain
      if (!isMevSupportedChain(chainId)) {
        throw new Error(`MEV protection forced but not supported on chain ${chainId}`);
      }
      return true;
    case 'auto':
      // Auto mode uses MEV protection when available
      return isMevSupportedChain(chainId);
    default:
      return false;
  }
}

/**
 * Get MEV protection status for display
 */
export function getMevProtectionStatus(
  mode: MevProtectedMode,
  chainId: number
): {
  enabled: boolean;
  available: boolean;
  provider?: string;
  reason?: string;
} {
  const available = isMevSupportedChain(chainId);
  const providers = getMevProviders(chainId);

  switch (mode) {
    case 'off':
      return {
        enabled: false,
        available,
        reason: 'MEV protection disabled by user'
      };
    case 'force':
      if (!available) {
        return {
          enabled: false,
          available: false,
          reason: `MEV protection not supported on chain ${chainId}`
        };
      }
      return {
        enabled: true,
        available: true,
        provider: providers[0],
        reason: 'MEV protection forced by user'
      };
    case 'auto':
      if (!available) {
        return {
          enabled: false,
          available: false,
          reason: `MEV protection not available on chain ${chainId}`
        };
      }
      return {
        enabled: true,
        available: true,
        provider: providers[0],
        reason: 'MEV protection enabled automatically'
      };
    default:
      return {
        enabled: false,
        available,
        reason: 'Invalid MEV protection mode'
      };
  }
}

/**
 * Validate MEV protection configuration
 */
export function validateMevConfig(
  mode: MevProtectedMode,
  chainId: number
): {
  valid: boolean;
  error?: string;
} {
  if (mode === 'force' && !isMevSupportedChain(chainId)) {
    return {
      valid: false,
      error: `Cannot force MEV protection on unsupported chain ${chainId}. Supported chains: ${Array.from(MEV_SUPPORTED_CHAINS).join(', ')}`
    };
  }

  return { valid: true };
}
