/**
 * Name Resolution Service
 * 
 * Resolves wallet addresses to human-readable names using:
 * 1. ENS (Ethereum Name Service) - Primary
 * 2. Lens Protocol - Fallback 1
 * 3. Unstoppable Domains - Fallback 2
 * 
 * Features:
 * - Multi-provider resolution with fallback chain
 * - Caching with TTL (24 hours)
 * - Batch resolution support
 * - Error handling and retry logic
 * - Type-safe interfaces
 * 
 * @see .kiro/specs/hunter-screen-feed/requirements.md - Requirement 18.19
 * @see .kiro/specs/hunter-screen-feed/tasks.md - Task 50
 */

import { ethers } from 'ethers';

// ============================================================================
// Types
// ============================================================================

export interface ResolvedName {
  name: string;
  provider: 'ens' | 'lens' | 'unstoppable' | null;
  avatar?: string;
  resolvedAt: Date;
}

export interface NameResolutionCache {
  [address: string]: ResolvedName;
}

// ============================================================================
// Constants
// ============================================================================

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESOLUTION_TIMEOUT_MS = 5000; // 5 seconds per provider

// Lens Protocol contract address (Polygon mainnet)
const LENS_HUB_PROXY = '0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d';

// Unstoppable Domains resolver (Polygon mainnet)
const UD_RESOLVER = '0xa9a6A3626993D487d2Dbda3173cf58cA1a9D9e9f';

// ============================================================================
// Cache Management
// ============================================================================

class NameCache {
  private cache: Map<string, { data: ResolvedName; expiresAt: number }> = new Map();

  set(address: string, name: ResolvedName): void {
    const normalizedAddress = address.toLowerCase();
    this.cache.set(normalizedAddress, {
      data: name,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }

  get(address: string): ResolvedName | null {
    const normalizedAddress = address.toLowerCase();
    const entry = this.cache.get(normalizedAddress);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(normalizedAddress);
      return null;
    }
    
    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const nameCache = new NameCache();

// ============================================================================
// Provider Setup
// ============================================================================

let provider: ethers.providers.Provider | null = null;

/**
 * Initialize provider (call once on app startup)
 */
export function initializeProvider(rpcUrl?: string): void {
  if (provider) return;
  
  try {
    if (rpcUrl) {
      provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    } else if (typeof window !== 'undefined' && window.ethereum) {
      provider = new ethers.providers.Web3Provider(window.ethereum);
    } else {
      // Fallback to public RPC (rate-limited)
      provider = new ethers.providers.JsonRpcProvider('https://eth.llamarpc.com');
    }
  } catch (error) {
    console.error('Failed to initialize provider:', error);
  }
}

/**
 * Get or initialize provider
 */
function getProvider(): ethers.providers.Provider {
  if (!provider) {
    initializeProvider();
  }
  if (!provider) {
    throw new Error('Provider not initialized');
  }
  return provider;
}

// ============================================================================
// ENS Resolution
// ============================================================================

/**
 * Resolve ENS name for an address
 */
async function resolveENS(address: string): Promise<ResolvedName | null> {
  try {
    const provider = getProvider();
    
    // Resolve ENS name with timeout
    const namePromise = provider.lookupAddress(address);
    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => resolve(null), RESOLUTION_TIMEOUT_MS)
    );
    
    const name = await Promise.race([namePromise, timeoutPromise]);
    
    if (!name) return null;
    
    // Try to get avatar
    let avatar: string | undefined;
    try {
      const resolver = await provider.getResolver(name);
      if (resolver) {
        avatar = await resolver.getText('avatar');
      }
    } catch {
      // Avatar resolution failed, continue without it
    }
    
    return {
      name,
      provider: 'ens',
      avatar,
      resolvedAt: new Date(),
    };
  } catch (error) {
    console.debug('ENS resolution failed:', error);
    return null;
  }
}

// ============================================================================
// Lens Protocol Resolution
// ============================================================================

/**
 * Resolve Lens Protocol handle for an address
 */
async function resolveLens(address: string): Promise<ResolvedName | null> {
  try {
    // Lens Protocol uses Polygon, so we need a Polygon provider
    const polygonProvider = new ethers.providers.JsonRpcProvider(
      'https://polygon-rpc.com'
    );
    
    // Lens Hub contract ABI (simplified - just the method we need)
    const lensHubAbi = [
      'function defaultProfile(address wallet) view returns (uint256)',
      'function getProfile(uint256 profileId) view returns (tuple(uint256 pubCount, address followModule, address followNFT, string handle, string imageURI, address followNFTURI))',
    ];
    
    const lensHub = new ethers.Contract(LENS_HUB_PROXY, lensHubAbi, polygonProvider);
    
    // Get default profile ID with timeout
    const profileIdPromise = lensHub.defaultProfile(address);
    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => resolve(null), RESOLUTION_TIMEOUT_MS)
    );
    
    const profileId = await Promise.race([profileIdPromise, timeoutPromise]);
    
    if (!profileId || profileId.toString() === '0') return null;
    
    // Get profile data
    const profile = await lensHub.getProfile(profileId);
    
    if (!profile || !profile.handle) return null;
    
    return {
      name: profile.handle,
      provider: 'lens',
      avatar: profile.imageURI || undefined,
      resolvedAt: new Date(),
    };
  } catch (error) {
    console.debug('Lens resolution failed:', error);
    return null;
  }
}

// ============================================================================
// Unstoppable Domains Resolution
// ============================================================================

/**
 * Resolve Unstoppable Domains name for an address
 */
async function resolveUnstoppable(address: string): Promise<ResolvedName | null> {
  try {
    // Unstoppable Domains uses Polygon
    const polygonProvider = new ethers.providers.JsonRpcProvider(
      'https://polygon-rpc.com'
    );
    
    // UD Resolver ABI (simplified)
    const udResolverAbi = [
      'function reverseOf(address addr) view returns (string)',
    ];
    
    const udResolver = new ethers.Contract(UD_RESOLVER, udResolverAbi, polygonProvider);
    
    // Resolve domain with timeout
    const domainPromise = udResolver.reverseOf(address);
    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => resolve(null), RESOLUTION_TIMEOUT_MS)
    );
    
    const domain = await Promise.race([domainPromise, timeoutPromise]);
    
    if (!domain) return null;
    
    return {
      name: domain,
      provider: 'unstoppable',
      resolvedAt: new Date(),
    };
  } catch (error) {
    console.debug('Unstoppable Domains resolution failed:', error);
    return null;
  }
}

// ============================================================================
// Main Resolution Function
// ============================================================================

/**
 * Resolve name for a wallet address
 * Tries ENS first, then Lens, then Unstoppable Domains
 * 
 * @param address - Ethereum address to resolve
 * @param options - Resolution options
 * @returns Resolved name or null if not found
 */
export async function resolveName(
  address: string,
  options: {
    skipCache?: boolean;
    providers?: ('ens' | 'lens' | 'unstoppable')[];
  } = {}
): Promise<ResolvedName | null> {
  if (!address || !ethers.utils.isAddress(address)) {
    return null;
  }

  const normalizedAddress = address.toLowerCase();

  // Check cache first
  if (!options.skipCache) {
    const cached = nameCache.get(normalizedAddress);
    if (cached) {
      return cached;
    }
  }

  // Determine which providers to try
  const providers = options.providers || ['ens', 'lens', 'unstoppable'];

  // Try each provider in order
  for (const providerName of providers) {
    let result: ResolvedName | null = null;

    try {
      switch (providerName) {
        case 'ens':
          result = await resolveENS(normalizedAddress);
          break;
        case 'lens':
          result = await resolveLens(normalizedAddress);
          break;
        case 'unstoppable':
          result = await resolveUnstoppable(normalizedAddress);
          break;
      }

      if (result) {
        // Cache the result
        nameCache.set(normalizedAddress, result);
        return result;
      }
    } catch (error) {
      console.debug(`${providerName} resolution failed:`, error);
      // Continue to next provider
    }
  }

  // No name found - don't cache null results to allow retry later
  return null;
}

// ============================================================================
// Batch Resolution
// ============================================================================

/**
 * Resolve names for multiple addresses in parallel
 * 
 * @param addresses - Array of addresses to resolve
 * @param options - Resolution options
 * @returns Map of address to resolved name
 */
export async function resolveNames(
  addresses: string[],
  options: {
    skipCache?: boolean;
    providers?: ('ens' | 'lens' | 'unstoppable')[];
  } = {}
): Promise<Map<string, ResolvedName | null>> {
  const results = new Map<string, ResolvedName | null>();

  // Resolve all addresses in parallel
  const promises = addresses.map(async (address) => {
    const result = await resolveName(address, options);
    results.set(address.toLowerCase(), result);
  });

  await Promise.all(promises);

  return results;
}

// ============================================================================
// Cache Utilities
// ============================================================================

/**
 * Clear the name resolution cache
 */
export function clearCache(): void {
  nameCache.clear();
}

/**
 * Get cache size
 */
export function getCacheSize(): number {
  return nameCache.size();
}

/**
 * Preload names for addresses (useful for wallet list)
 */
export async function preloadNames(addresses: string[]): Promise<void> {
  await resolveNames(addresses);
}

// ============================================================================
// Exports
// ============================================================================

export default {
  resolveName,
  resolveNames,
  clearCache,
  getCacheSize,
  preloadNames,
  initializeProvider,
};
