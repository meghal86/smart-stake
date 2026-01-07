/**
 * Multi-Chain EVM Network Configuration
 * 
 * CAIP-2 compliant network definitions for supported EVM chains.
 * Provides configuration-driven network support for extensibility.
 * 
 * @see .kiro/specs/multi-chain-wallet-system/requirements.md - Requirements 1.2, 10.1, 10.2
 * @see .kiro/specs/multi-chain-wallet-system/design.md - Network Configuration System
 */

// ============================================================================
// Types
// ============================================================================

export interface NetworkConfig {
  chainId: number;
  chainNamespace: string;  // CAIP-2 format: eip155:chainId
  name: string;
  shortName: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  badgeColor: string;      // Tailwind classes for UI styling
  guardianSupported: boolean;
  isTestnet?: boolean;
  iconUrl?: string;
}

export interface NetworkValidationResult {
  isValid: boolean;
  chainNamespace?: string;
  error?: string;
}

// ============================================================================
// Supported Networks Configuration (v2.3 EVM Networks)
// ============================================================================

export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  // Ethereum Mainnet
  'eip155:1': {
    chainId: 1,
    chainNamespace: 'eip155:1',
    name: 'Ethereum Mainnet',
    shortName: 'ETH',
    rpcUrls: [
      'https://eth-mainnet.alchemyapi.io/v2/demo',
      'https://mainnet.infura.io/v3/demo',
      'https://rpc.ankr.com/eth',
    ],
    blockExplorerUrls: ['https://etherscan.io'],
    nativeCurrency: { 
      name: 'Ethereum', 
      symbol: 'ETH', 
      decimals: 18 
    },
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    guardianSupported: true,
    iconUrl: '/icons/networks/ethereum.svg',
  },

  // Polygon Mainnet
  'eip155:137': {
    chainId: 137,
    chainNamespace: 'eip155:137',
    name: 'Polygon Mainnet',
    shortName: 'MATIC',
    rpcUrls: [
      'https://polygon-mainnet.alchemyapi.io/v2/demo',
      'https://polygon-mainnet.infura.io/v3/demo',
      'https://rpc.ankr.com/polygon',
    ],
    blockExplorerUrls: ['https://polygonscan.com'],
    nativeCurrency: { 
      name: 'MATIC', 
      symbol: 'MATIC', 
      decimals: 18 
    },
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    guardianSupported: true,
    iconUrl: '/icons/networks/polygon.svg',
  },

  // Arbitrum One
  'eip155:42161': {
    chainId: 42161,
    chainNamespace: 'eip155:42161',
    name: 'Arbitrum One',
    shortName: 'ARB',
    rpcUrls: [
      'https://arb-mainnet.alchemyapi.io/v2/demo',
      'https://arbitrum-mainnet.infura.io/v3/demo',
      'https://rpc.ankr.com/arbitrum',
    ],
    blockExplorerUrls: ['https://arbiscan.io'],
    nativeCurrency: { 
      name: 'Ethereum', 
      symbol: 'ETH', 
      decimals: 18 
    },
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    guardianSupported: true,
    iconUrl: '/icons/networks/arbitrum.svg',
  },

  // Optimism
  'eip155:10': {
    chainId: 10,
    chainNamespace: 'eip155:10',
    name: 'Optimism',
    shortName: 'OP',
    rpcUrls: [
      'https://opt-mainnet.alchemyapi.io/v2/demo',
      'https://optimism-mainnet.infura.io/v3/demo',
      'https://rpc.ankr.com/optimism',
    ],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
    nativeCurrency: { 
      name: 'Ethereum', 
      symbol: 'ETH', 
      decimals: 18 
    },
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    guardianSupported: true,
    iconUrl: '/icons/networks/optimism.svg',
  },

  // Base
  'eip155:8453': {
    chainId: 8453,
    chainNamespace: 'eip155:8453',
    name: 'Base',
    shortName: 'BASE',
    rpcUrls: [
      'https://base-mainnet.alchemyapi.io/v2/demo',
      'https://base-mainnet.infura.io/v3/demo',
      'https://rpc.ankr.com/base',
    ],
    blockExplorerUrls: ['https://basescan.org'],
    nativeCurrency: { 
      name: 'Ethereum', 
      symbol: 'ETH', 
      decimals: 18 
    },
    badgeColor: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
    guardianSupported: false, // Coming soon in v2.4
    iconUrl: '/icons/networks/base.svg',
  },
};

// ============================================================================
// Legacy Networks (for backward compatibility)
// ============================================================================

export const LEGACY_NETWORKS: Record<string, NetworkConfig> = {
  // BSC (for existing data migration)
  'eip155:56': {
    chainId: 56,
    chainNamespace: 'eip155:56',
    name: 'BNB Smart Chain',
    shortName: 'BSC',
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com'],
    nativeCurrency: { 
      name: 'BNB', 
      symbol: 'BNB', 
      decimals: 18 
    },
    badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    guardianSupported: false,
    iconUrl: '/icons/networks/bsc.svg',
  },

  // Avalanche (for existing data migration)
  'eip155:43114': {
    chainId: 43114,
    chainNamespace: 'eip155:43114',
    name: 'Avalanche C-Chain',
    shortName: 'AVAX',
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://snowtrace.io'],
    nativeCurrency: { 
      name: 'AVAX', 
      symbol: 'AVAX', 
      decimals: 18 
    },
    badgeColor: 'bg-red-600/20 text-red-300 border-red-600/30',
    guardianSupported: false,
    iconUrl: '/icons/networks/avalanche.svg',
  },

  // Fantom (for existing data migration)
  'eip155:250': {
    chainId: 250,
    chainNamespace: 'eip155:250',
    name: 'Fantom Opera',
    shortName: 'FTM',
    rpcUrls: ['https://rpc.ftm.tools'],
    blockExplorerUrls: ['https://ftmscan.com'],
    nativeCurrency: { 
      name: 'FTM', 
      symbol: 'FTM', 
      decimals: 18 
    },
    badgeColor: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
    guardianSupported: false,
    iconUrl: '/icons/networks/fantom.svg',
  },
};

// ============================================================================
// All Networks (Supported + Legacy)
// ============================================================================

export const ALL_NETWORKS: Record<string, NetworkConfig> = {
  ...SUPPORTED_NETWORKS,
  ...LEGACY_NETWORKS,
};

// ============================================================================
// Network Utilities
// ============================================================================

/**
 * Get network configuration by CAIP-2 chain namespace
 */
export function getNetworkConfig(chainNamespace: string): NetworkConfig | null {
  return ALL_NETWORKS[chainNamespace] || null;
}

/**
 * Get network configuration by chain ID
 */
export function getNetworkConfigByChainId(chainId: number): NetworkConfig | null {
  const chainNamespace = `eip155:${chainId}`;
  return getNetworkConfig(chainNamespace);
}

/**
 * Validate CAIP-2 chain namespace format
 */
export function validateChainNamespace(chainNamespace: string): NetworkValidationResult {
  // Check CAIP-2 format: eip155:chainId
  const caip2Regex = /^eip155:([0-9]+)$/;
  const match = chainNamespace.match(caip2Regex);
  
  if (!match) {
    return {
      isValid: false,
      error: 'Invalid CAIP-2 format. Expected: eip155:chainId',
    };
  }
  
  const chainId = parseInt(match[1], 10);
  
  // Check if network is configured
  const config = getNetworkConfig(chainNamespace);
  if (!config) {
    return {
      isValid: false,
      chainNamespace,
      error: `Unsupported network: ${chainNamespace}`,
    };
  }
  
  // Verify chain ID matches
  if (config.chainId !== chainId) {
    return {
      isValid: false,
      chainNamespace,
      error: `Chain ID mismatch: expected ${config.chainId}, got ${chainId}`,
    };
  }
  
  return {
    isValid: true,
    chainNamespace,
  };
}

/**
 * Convert legacy chain name to CAIP-2 format
 */
export function legacyChainToCAIP2(legacyChain: string): string {
  const chainMap: Record<string, string> = {
    'ethereum': 'eip155:1',
    'polygon': 'eip155:137',
    'arbitrum': 'eip155:42161',
    'optimism': 'eip155:10',
    'base': 'eip155:8453',
    'bsc': 'eip155:56',
    'avalanche': 'eip155:43114',
    'fantom': 'eip155:250',
  };
  
  return chainMap[legacyChain.toLowerCase()] || 'eip155:1';
}

/**
 * Convert CAIP-2 format to legacy chain name
 */
export function caip2ToLegacyChain(chainNamespace: string): string {
  const config = getNetworkConfig(chainNamespace);
  if (!config) return 'ethereum';
  
  const chainMap: Record<string, string> = {
    'eip155:1': 'ethereum',
    'eip155:137': 'polygon',
    'eip155:42161': 'arbitrum',
    'eip155:10': 'optimism',
    'eip155:8453': 'base',
    'eip155:56': 'bsc',
    'eip155:43114': 'avalanche',
    'eip155:250': 'fantom',
  };
  
  return chainMap[chainNamespace] || 'ethereum';
}

/**
 * Get all supported network chain namespaces
 */
export function getSupportedNetworks(): string[] {
  return Object.keys(SUPPORTED_NETWORKS);
}

/**
 * Get all network chain namespaces (including legacy)
 */
export function getAllNetworks(): string[] {
  return Object.keys(ALL_NETWORKS);
}

/**
 * Check if network supports Guardian scanning
 */
export function isGuardianSupported(chainNamespace: string): boolean {
  const config = getNetworkConfig(chainNamespace);
  return config?.guardianSupported || false;
}

/**
 * Get networks that support Guardian scanning
 */
export function getGuardianSupportedNetworks(): NetworkConfig[] {
  return Object.values(ALL_NETWORKS).filter(config => config.guardianSupported);
}

/**
 * Get primary RPC URL for a network
 */
export function getPrimaryRpcUrl(chainNamespace: string): string | null {
  const config = getNetworkConfig(chainNamespace);
  return config?.rpcUrls[0] || null;
}

/**
 * Get all RPC URLs for a network (for fallback)
 */
export function getAllRpcUrls(chainNamespace: string): string[] {
  const config = getNetworkConfig(chainNamespace);
  return config?.rpcUrls || [];
}

/**
 * Get block explorer URL for a network
 */
export function getBlockExplorerUrl(chainNamespace: string): string | null {
  const config = getNetworkConfig(chainNamespace);
  return config?.blockExplorerUrls[0] || null;
}

/**
 * Format address for block explorer link
 */
export function getAddressExplorerUrl(chainNamespace: string, address: string): string | null {
  const explorerUrl = getBlockExplorerUrl(chainNamespace);
  if (!explorerUrl) return null;
  
  return `${explorerUrl}/address/${address}`;
}

/**
 * Format transaction for block explorer link
 */
export function getTxExplorerUrl(chainNamespace: string, txHash: string): string | null {
  const explorerUrl = getBlockExplorerUrl(chainNamespace);
  if (!explorerUrl) return null;
  
  return `${explorerUrl}/tx/${txHash}`;
}

// ============================================================================
// Network Detection Utilities
// ============================================================================

/**
 * Detect network from window.ethereum
 */
export async function detectCurrentNetwork(): Promise<NetworkConfig | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const numericChainId = parseInt(chainId, 16);
    return getNetworkConfigByChainId(numericChainId);
  } catch (error) {
    console.error('Failed to detect current network:', error);
    return null;
  }
}

/**
 * Request network switch in wallet
 */
export async function requestNetworkSwitch(chainNamespace: string): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }
  
  const config = getNetworkConfig(chainNamespace);
  if (!config) {
    console.error(`Network not configured: ${chainNamespace}`);
    return false;
  }
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${config.chainId.toString(16)}` }],
    });
    return true;
  } catch (switchError: unknown) {
    const errorCode =
      typeof switchError === 'object' && switchError !== null && 'code' in switchError
        ? (switchError as { code?: number | string }).code
        : undefined;

    // This error code indicates that the chain has not been added to MetaMask
    if (errorCode === 4902 || errorCode === '4902') {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${config.chainId.toString(16)}`,
            chainName: config.name,
            nativeCurrency: config.nativeCurrency,
            rpcUrls: config.rpcUrls,
            blockExplorerUrls: config.blockExplorerUrls,
          }],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add network:', addError);
        return false;
      }
    }
    console.error('Failed to switch network:', switchError);
    return false;
  }
}

// ============================================================================
// Constants for UI
// ============================================================================

export const NETWORK_COLORS = {
  ethereum: 'blue',
  polygon: 'purple',
  arbitrum: 'cyan',
  optimism: 'red',
  base: 'blue',
  bsc: 'yellow',
  avalanche: 'red',
  fantom: 'blue',
} as const;

export const DEFAULT_NETWORK = 'eip155:1'; // Ethereum Mainnet

// ============================================================================
// Type Guards
// ============================================================================

export function isValidChainNamespace(value: string): value is keyof typeof ALL_NETWORKS {
  return value in ALL_NETWORKS;
}

export function isSupportedNetwork(chainNamespace: string): boolean {
  return chainNamespace in SUPPORTED_NETWORKS;
}

export function isLegacyNetwork(chainNamespace: string): boolean {
  return chainNamespace in LEGACY_NETWORKS;
}
