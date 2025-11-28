/**
 * Redis caching utilities for Hunter Screen
 * Provides cache get/set helpers with TTL and invalidation utilities
 * 
 * Requirements: 8.7, 8.8, 8.9
 */

import { getRedis } from './client';
import { RedisKeys, RedisTTL } from './keys';

export interface CacheOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Whether to use NX (only set if not exists) */
  nx?: boolean;
  /** Whether to use XX (only set if exists) */
  xx?: boolean;
}

export interface CacheResult<T> {
  data: T | null;
  hit: boolean;
  error?: Error;
}

/**
 * Get a value from cache
 * @param key - Redis key
 * @returns Cache result with data and hit status
 */
export async function cacheGet<T>(key: string): Promise<CacheResult<T>> {
  const redis = getRedis();
  
  if (!redis) {
    return { data: null, hit: false, error: new Error('Redis not available') };
  }

  try {
    const data = await redis.get<T>(key);
    return {
      data,
      hit: data !== null,
    };
  } catch (error) {
    console.error(`[Redis] Error getting key ${key}:`, error);
    return {
      data: null,
      hit: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Set a value in cache with TTL
 * @param key - Redis key
 * @param value - Value to cache
 * @param options - Cache options including TTL
 * @returns Success status
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> {
  const redis = getRedis();
  
  if (!redis) {
    console.warn('[Redis] Redis not available, skipping cache set');
    return false;
  }

  try {
    const setOptions: Record<string, unknown> = {};
    
    if (options.ttl !== undefined) {
      setOptions.ex = options.ttl;
    }
    
    if (options.nx) {
      setOptions.nx = true;
    }
    
    if (options.xx) {
      setOptions.xx = true;
    }

    const result = await redis.set(key, value, setOptions);
    return result !== null;
  } catch (error) {
    console.error(`[Redis] Error setting key ${key}:`, error);
    return false;
  }
}

/**
 * Delete a key from cache
 * @param key - Redis key or array of keys
 * @returns Number of keys deleted
 */
export async function cacheDel(key: string | string[]): Promise<number> {
  const redis = getRedis();
  
  if (!redis) {
    return 0;
  }

  try {
    const keys = Array.isArray(key) ? key : [key];
    if (keys.length === 0) return 0;
    
    return await redis.del(...keys);
  } catch (error) {
    console.error(`[Redis] Error deleting key(s):`, error);
    return 0;
  }
}

/**
 * Check if a key exists in cache
 * @param key - Redis key
 * @returns True if key exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  const redis = getRedis();
  
  if (!redis) {
    return false;
  }

  try {
    const result = await redis.exists(key);
    return result > 0;
  } catch (error) {
    console.error(`[Redis] Error checking existence of key ${key}:`, error);
    return false;
  }
}

/**
 * Get remaining TTL for a key
 * @param key - Redis key
 * @returns TTL in seconds, -1 if no expiry, -2 if key doesn't exist
 */
export async function cacheTTL(key: string): Promise<number> {
  const redis = getRedis();
  
  if (!redis) {
    return -2;
  }

  try {
    return await redis.ttl(key);
  } catch (error) {
    console.error(`[Redis] Error getting TTL for key ${key}:`, error);
    return -2;
  }
}

/**
 * Set expiry on an existing key
 * @param key - Redis key
 * @param ttl - Time to live in seconds
 * @returns Success status
 */
export async function cacheExpire(key: string, ttl: number): Promise<boolean> {
  const redis = getRedis();
  
  if (!redis) {
    return false;
  }

  try {
    const result = await redis.expire(key, ttl);
    return result === 1;
  } catch (error) {
    console.error(`[Redis] Error setting expiry for key ${key}:`, error);
    return false;
  }
}

/**
 * Get or set pattern: fetch from cache or compute and cache
 * @param key - Redis key
 * @param fetcher - Function to compute value if not in cache
 * @param ttl - Time to live in seconds
 * @returns Cached or computed value
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);
  
  if (cached.hit && cached.data !== null) {
    return cached.data;
  }

  // Compute value
  const value = await fetcher();

  // Cache the result (fire and forget)
  cacheSet(key, value, { ttl }).catch(err => {
    console.error(`[Redis] Failed to cache value for key ${key}:`, err);
  });

  return value;
}

/**
 * Invalidate cache by pattern
 * @param pattern - Redis key pattern (e.g., "feed:page:*")
 * @returns Number of keys deleted
 */
export async function cacheInvalidatePattern(pattern: string): Promise<number> {
  const redis = getRedis();
  
  if (!redis) {
    return 0;
  }

  try {
    // Note: SCAN is more efficient than KEYS for production
    // Upstash Redis supports SCAN
    const keys: string[] = [];
    let cursor = 0;

    do {
      const result = await redis.scan(cursor, {
        match: pattern,
        count: 100,
      });
      
      cursor = result[0];
      keys.push(...result[1]);
    } while (cursor !== 0);

    if (keys.length === 0) {
      return 0;
    }

    return await cacheDel(keys);
  } catch (error) {
    console.error(`[Redis] Error invalidating pattern ${pattern}:`, error);
    return 0;
  }
}

/**
 * Invalidate all guardian scan caches
 */
export async function invalidateGuardianScans(): Promise<number> {
  return cacheInvalidatePattern('guardian:scan:*');
}

/**
 * Invalidate eligibility cache for a specific opportunity
 * @param opportunityId - Opportunity UUID
 */
export async function invalidateEligibility(opportunityId: string): Promise<number> {
  return cacheInvalidatePattern(`elig:op:${opportunityId}:*`);
}

/**
 * Invalidate all feed page caches
 */
export async function invalidateFeedPages(): Promise<number> {
  return cacheInvalidatePattern('feed:page:*');
}

/**
 * Invalidate opportunity detail cache
 * @param slug - Opportunity slug
 */
export async function invalidateOpportunityDetail(slug: string): Promise<number> {
  return cacheDel(RedisKeys.opportunityDetail(slug));
}

/**
 * Invalidate user preferences cache
 * @param userId - User UUID
 */
export async function invalidateUserPrefs(userId: string): Promise<number> {
  return cacheDel(RedisKeys.userPrefs(userId));
}

/**
 * Batch get multiple keys
 * @param keys - Array of Redis keys
 * @returns Map of key to value
 */
export async function cacheMGet<T>(keys: string[]): Promise<Map<string, T | null>> {
  const redis = getRedis();
  const result = new Map<string, T | null>();
  
  if (!redis || keys.length === 0) {
    return result;
  }

  try {
    const values = await redis.mget<(T | null)[]>(...keys);
    
    keys.forEach((key, index) => {
      result.set(key, values[index]);
    });
    
    return result;
  } catch (error) {
    console.error(`[Redis] Error batch getting keys:`, error);
    return result;
  }
}

/**
 * Batch set multiple keys
 * @param entries - Array of [key, value, ttl] tuples
 * @returns Number of successful sets
 */
export async function cacheMSet<T>(
  entries: Array<[string, T, number?]>
): Promise<number> {
  const redis = getRedis();
  
  if (!redis || entries.length === 0) {
    return 0;
  }

  let successCount = 0;

  try {
    // Use pipeline for better performance
    const pipeline = redis.pipeline();
    
    for (const [key, value, ttl] of entries) {
      if (ttl !== undefined) {
        pipeline.set(key, value, { ex: ttl });
      } else {
        pipeline.set(key, value);
      }
    }
    
    const results = await pipeline.exec();
    successCount = results.filter(r => r !== null).length;
  } catch (error) {
    console.error(`[Redis] Error batch setting keys:`, error);
  }

  return successCount;
}

/**
 * Increment a counter
 * @param key - Redis key
 * @param amount - Amount to increment (default: 1)
 * @returns New value after increment
 */
export async function cacheIncr(key: string, amount: number = 1): Promise<number> {
  const redis = getRedis();
  
  if (!redis) {
    return 0;
  }

  try {
    if (amount === 1) {
      return await redis.incr(key);
    } else {
      return await redis.incrby(key, amount);
    }
  } catch (error) {
    console.error(`[Redis] Error incrementing key ${key}:`, error);
    return 0;
  }
}

/**
 * Decrement a counter
 * @param key - Redis key
 * @param amount - Amount to decrement (default: 1)
 * @returns New value after decrement
 */
export async function cacheDecr(key: string, amount: number = 1): Promise<number> {
  const redis = getRedis();
  
  if (!redis) {
    return 0;
  }

  try {
    if (amount === 1) {
      return await redis.decr(key);
    } else {
      return await redis.decrby(key, amount);
    }
  } catch (error) {
    console.error(`[Redis] Error decrementing key ${key}:`, error);
    return 0;
  }
}

/**
 * Flush all keys (use with caution!)
 * @returns Success status
 */
export async function cacheFlushAll(): Promise<boolean> {
  const redis = getRedis();
  
  if (!redis) {
    return false;
  }

  try {
    await redis.flushall();
    return true;
  } catch (error) {
    console.error(`[Redis] Error flushing all keys:`, error);
    return false;
  }
}
