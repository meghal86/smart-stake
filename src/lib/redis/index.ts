/**
 * Redis utilities for Hunter Screen
 * Centralized exports for Redis client, keys, and cache operations
 * 
 * Requirements: 8.7, 8.8, 8.9
 */

// Client
export { getRedis, withRedisLock, cacheValue, getCachedValue } from './client';

// Keys and TTL constants
export { RedisKeys, RedisKeyPatterns, RedisTTL } from './keys';

// Cache operations
export {
  // Types
  type CacheOptions,
  type CacheResult,
  
  // Basic operations
  cacheGet,
  cacheSet,
  cacheDel,
  cacheExists,
  cacheTTL,
  cacheExpire,
  
  // Advanced operations
  cacheGetOrSet,
  cacheMGet,
  cacheMSet,
  cacheIncr,
  cacheDecr,
  
  // Invalidation
  cacheInvalidatePattern,
  invalidateGuardianScans,
  invalidateEligibility,
  invalidateFeedPages,
  invalidateOpportunityDetail,
  invalidateUserPrefs,
  
  // Utility
  cacheFlushAll,
} from './cache';
