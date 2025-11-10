/**
 * Wallet Signals KV Cache
 * 
 * Implements read-through cache for wallet signals (age, tx count, chain presence)
 * to reduce redundant blockchain queries across multiple opportunity cards.
 * 
 * Cache key: wallet_signals:{wallet}:{day}
 * TTL: 20 minutes
 * 
 * Requirements: 6.1-6.8
 */

import { cacheGet, cacheSet } from './redis/cache';
import { RedisKeys, RedisTTL } from './redis/keys';

export interface WalletSignals {
  /** Wallet age in days */
  walletAgeDays: number;
  /** Total transaction count */
  txCount: number;
  /** Chains where wallet has activity */
  activeChains: string[];
  /** Whether wallet holds tokens on the required chain */
  holdsOnChain: boolean;
  /** Whether wallet has allowlist proofs */
  allowlistProofs: boolean;
}

/**
 * Get current day identifier for cache key
 * Format: YYYY-MM-DD
 */
function getCurrentDay(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Fetch wallet signals from blockchain APIs
 * 
 * This is a placeholder that should be replaced with actual blockchain queries.
 * In production, this would call services like Alchemy, Moralis, or similar.
 * 
 * @param walletAddress - Wallet address to fetch signals for
 * @param requiredChain - Required chain for the opportunity
 * @returns Wallet signals or null if unable to fetch
 */
async function fetchWalletSignalsFromBlockchain(
  walletAddress: string,
  requiredChain: string
): Promise<WalletSignals | null> {
  try {
    // TODO: Replace with actual blockchain API calls
    // For now, return mock data to enable testing
    
    // In production, this would:
    // 1. Query wallet creation timestamp to calculate age
    // 2. Count transactions across chains
    // 3. Check token holdings on required chain
    // 4. Verify allowlist membership
    
    // Mock implementation for development
    console.warn('fetchWalletSignalsFromBlockchain: Using mock data. Replace with actual blockchain queries.');
    
    return {
      walletAgeDays: 0,
      txCount: 0,
      activeChains: [],
      holdsOnChain: false,
      allowlistProofs: false,
    };
  } catch (error) {
    console.error('Error fetching wallet signals from blockchain:', error);
    return null;
  }
}

/**
 * Get wallet signals with read-through caching
 * 
 * Checks Redis cache first using wallet_signals:{wallet}:{day} key.
 * If not found, fetches from blockchain and caches for 20 minutes.
 * 
 * @param walletAddress - Wallet address (will be normalized to lowercase)
 * @param requiredChain - Required chain for the opportunity
 * @returns Wallet signals or null if unable to fetch
 */
export async function getCachedWalletSignals(
  walletAddress: string,
  requiredChain: string
): Promise<WalletSignals | null> {
  // Normalize wallet address to lowercase for consistent caching
  const normalizedWallet = walletAddress.toLowerCase();
  
  // Get current day for cache key
  const day = getCurrentDay();
  
  // Generate cache key
  const cacheKey = RedisKeys.walletSignals(normalizedWallet, day);
  
  try {
    // Try to get from cache first
    const cached = await cacheGet<WalletSignals>(cacheKey);
    
    if (cached.hit && cached.data !== null) {
      console.log(`[WalletSignalsCache] Cache hit for wallet ${normalizedWallet}`);
      return cached.data;
    }
    
    console.log(`[WalletSignalsCache] Cache miss for wallet ${normalizedWallet}, fetching from blockchain`);
    
    // Cache miss - fetch from blockchain
    const signals = await fetchWalletSignalsFromBlockchain(normalizedWallet, requiredChain);
    
    if (signals === null) {
      return null;
    }
    
    // Cache the result with 20 minute TTL
    const cached_successfully = await cacheSet(cacheKey, signals, {
      ttl: RedisTTL.walletSignals, // 20 minutes (1200 seconds)
    });
    
    if (cached_successfully) {
      console.log(`[WalletSignalsCache] Cached signals for wallet ${normalizedWallet}`);
    } else {
      console.warn(`[WalletSignalsCache] Failed to cache signals for wallet ${normalizedWallet}`);
    }
    
    return signals;
    
  } catch (error) {
    console.error('[WalletSignalsCache] Error in getCachedWalletSignals:', error);
    
    // On error, try to fetch directly without caching
    return fetchWalletSignalsFromBlockchain(normalizedWallet, requiredChain);
  }
}

/**
 * Invalidate wallet signals cache for a specific wallet
 * Useful when wallet data needs to be refreshed
 * 
 * @param walletAddress - Wallet address to invalidate cache for
 * @returns Success status
 */
export async function invalidateWalletSignalsCache(walletAddress: string): Promise<boolean> {
  const normalizedWallet = walletAddress.toLowerCase();
  const day = getCurrentDay();
  const cacheKey = RedisKeys.walletSignals(normalizedWallet, day);
  
  try {
    const { cacheDel } = await import('./redis/cache');
    const deleted = await cacheDel(cacheKey);
    return deleted > 0;
  } catch (error) {
    console.error('[WalletSignalsCache] Error invalidating cache:', error);
    return false;
  }
}

/**
 * Batch fetch wallet signals for multiple wallets
 * Uses parallel fetching with caching for efficiency
 * 
 * @param wallets - Array of wallet addresses
 * @param requiredChain - Required chain for the opportunities
 * @returns Map of wallet address to signals (null if fetch failed)
 */
export async function batchGetCachedWalletSignals(
  wallets: string[],
  requiredChain: string
): Promise<Map<string, WalletSignals | null>> {
  const results = new Map<string, WalletSignals | null>();
  
  // Fetch all wallets in parallel
  const promises = wallets.map(async (wallet) => {
    const signals = await getCachedWalletSignals(wallet, requiredChain);
    return { wallet: wallet.toLowerCase(), signals };
  });
  
  const settled = await Promise.allSettled(promises);
  
  settled.forEach((result) => {
    if (result.status === 'fulfilled') {
      results.set(result.value.wallet, result.value.signals);
    }
  });
  
  return results;
}

/**
 * Get cache statistics for monitoring
 * 
 * @param walletAddress - Wallet address to check
 * @returns Cache statistics including hit/miss info
 */
export async function getWalletSignalsCacheStats(walletAddress: string): Promise<{
  exists: boolean;
  ttl: number;
  key: string;
}> {
  const normalizedWallet = walletAddress.toLowerCase();
  const day = getCurrentDay();
  const cacheKey = RedisKeys.walletSignals(normalizedWallet, day);
  
  try {
    const { cacheExists, cacheTTL } = await import('./redis/cache');
    const exists = await cacheExists(cacheKey);
    const ttl = await cacheTTL(cacheKey);
    
    return {
      exists,
      ttl,
      key: cacheKey,
    };
  } catch (error) {
    console.error('[WalletSignalsCache] Error getting cache stats:', error);
    return {
      exists: false,
      ttl: -2,
      key: cacheKey,
    };
  }
}
