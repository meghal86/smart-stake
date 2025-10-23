/**
 * Guardian-specific caching utilities
 * Uses in-memory cache with TTL
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  set(key: string, value: T, ttlMs: number): void {
    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instances
const contractMetaCache = new MemoryCache<any>();
const honeypotCache = new MemoryCache<any>();
const priceCache = new MemoryCache<number>();
const reputationCache = new MemoryCache<any>();

// Periodic cleanup (every 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    contractMetaCache.cleanup();
    honeypotCache.cleanup();
    priceCache.cleanup();
    reputationCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Cache wrapper for contract metadata
 */
export async function cachedContractMeta<T>(
  address: string,
  fetcher: () => Promise<T>,
  ttlMs = 60 * 60 * 1000 // 1 hour
): Promise<T> {
  const key = `contract:${address.toLowerCase()}`;
  const cached = contractMetaCache.get(key);
  if (cached !== null) return cached;

  const data = await fetcher();
  contractMetaCache.set(key, data, ttlMs);
  return data;
}

/**
 * Cache wrapper for honeypot checks
 */
export async function cachedHoneypot<T>(
  address: string,
  chain: string,
  fetcher: () => Promise<T>,
  ttlMs = 30 * 60 * 1000 // 30 minutes
): Promise<T> {
  const key = `honeypot:${chain}:${address.toLowerCase()}`;
  const cached = honeypotCache.get(key);
  if (cached !== null) return cached;

  const data = await fetcher();
  honeypotCache.set(key, data, ttlMs);
  return data;
}

/**
 * Cache wrapper for token prices
 */
export async function cachedPrice(
  tokenAddress: string,
  fetcher: () => Promise<number>,
  ttlMs = 5 * 60 * 1000 // 5 minutes
): Promise<number> {
  const key = `price:${tokenAddress.toLowerCase()}`;
  const cached = priceCache.get(key);
  if (cached !== null) return cached;

  const price = await fetcher();
  priceCache.set(key, price, ttlMs);
  return price;
}

/**
 * Cache wrapper for reputation checks
 */
export async function cachedReputation<T>(
  address: string,
  fetcher: () => Promise<T>,
  ttlMs = 2 * 60 * 60 * 1000 // 2 hours
): Promise<T> {
  const key = `reputation:${address.toLowerCase()}`;
  const cached = reputationCache.get(key);
  if (cached !== null) return cached;

  const data = await fetcher();
  reputationCache.set(key, data, ttlMs);
  return data;
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  contractMetaCache.clear();
  honeypotCache.clear();
  priceCache.clear();
  reputationCache.clear();
}

/**
 * Clear specific cache entries
 */
export function clearCacheEntry(type: 'contract' | 'honeypot' | 'price' | 'reputation', key: string): void {
  switch (type) {
    case 'contract':
      contractMetaCache.delete(`contract:${key.toLowerCase()}`);
      break;
    case 'honeypot':
      honeypotCache.delete(`honeypot:${key.toLowerCase()}`);
      break;
    case 'price':
      priceCache.delete(`price:${key.toLowerCase()}`);
      break;
    case 'reputation':
      reputationCache.delete(`reputation:${key.toLowerCase()}`);
      break;
  }
}

