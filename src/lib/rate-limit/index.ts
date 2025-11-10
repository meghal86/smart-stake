/**
 * Rate Limiting Middleware
 * 
 * Implements rate limiting using Upstash Redis with sliding window algorithm.
 * Supports different limits for authenticated vs anonymous users.
 * 
 * Requirements:
 * - 4.13: Rate limit 60 req/hr for anonymous users
 * - 4.14: Rate limit 120 req/hr for authenticated users
 * - 4.15: Burst allowance of 10 req/10s
 * - 8.6: Rate limiting enforcement
 * - 8.11: Retry-After header on 429
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiters for different user types
// Anonymous users: 60 requests per hour
const anonRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 h'),
  analytics: true,
  prefix: 'ratelimit:anon',
});

// Authenticated users: 120 requests per hour
const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(120, '1 h'),
  analytics: true,
  prefix: 'ratelimit:auth',
});

// Burst limiter: 10 requests per 10 seconds (applies to all users)
const burstRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: 'ratelimit:burst',
});

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  public readonly limit: number;
  public readonly reset: number;
  public readonly remaining: number;
  public readonly retryAfter: number;

  constructor(data: {
    limit: number;
    reset: number;
    remaining: number;
    retryAfter: number;
  }) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
    this.limit = data.limit;
    this.reset = data.reset;
    this.remaining = data.remaining;
    this.retryAfter = data.retryAfter;
  }
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Check rate limit for a given identifier
 * 
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param isAuthenticated - Whether the user is authenticated
 * @returns Rate limit result
 * @throws RateLimitError if rate limit is exceeded
 */
export async function checkRateLimit(
  identifier: string,
  isAuthenticated: boolean = false
): Promise<RateLimitResult> {
  // Check burst limit first (applies to all users)
  const burstResult = await burstRateLimiter.limit(identifier);
  
  if (!burstResult.success) {
    const retryAfter = Math.ceil((burstResult.reset - Date.now()) / 1000);
    throw new RateLimitError({
      limit: burstResult.limit,
      reset: burstResult.reset,
      remaining: burstResult.remaining,
      retryAfter,
    });
  }

  // Check hourly limit based on authentication status
  const limiter = isAuthenticated ? authRateLimiter : anonRateLimiter;
  const result = await limiter.limit(identifier);

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
    throw new RateLimitError({
      limit: result.limit,
      reset: result.reset,
      remaining: result.remaining,
      retryAfter,
    });
  }

  return {
    success: true,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Get rate limit status without incrementing the counter
 * Useful for checking limits without consuming a request
 * 
 * @param identifier - Unique identifier
 * @param isAuthenticated - Whether the user is authenticated
 * @returns Current rate limit status
 */
export async function getRateLimitStatus(
  identifier: string,
  isAuthenticated: boolean = false
): Promise<RateLimitResult> {
  const limiter = isAuthenticated ? authRateLimiter : anonRateLimiter;
  
  // Use getRemaining to check without incrementing
  const remaining = await limiter.getRemaining(identifier);
  
  return {
    success: remaining > 0,
    limit: isAuthenticated ? 120 : 60,
    remaining,
    reset: Date.now() + (60 * 60 * 1000), // Approximate reset time
  };
}

/**
 * Reset rate limit for a given identifier
 * Useful for testing or administrative purposes
 * 
 * @param identifier - Unique identifier
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  await Promise.all([
    redis.del(`ratelimit:anon:${identifier}`),
    redis.del(`ratelimit:auth:${identifier}`),
    redis.del(`ratelimit:burst:${identifier}`),
  ]);
}

/**
 * Extract identifier from request
 * Uses X-Forwarded-For header or falls back to a default
 * 
 * @param headers - Request headers
 * @returns Identifier string
 */
export function getIdentifierFromHeaders(headers: Headers): string {
  // Try to get IP from various headers
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const cfConnectingIp = headers.get('cf-connecting-ip');
  
  // Use the first available IP
  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0]?.trim();
  
  return ip || 'anonymous';
}

/**
 * Check if user is authenticated from headers
 * 
 * @param headers - Request headers
 * @returns Whether user is authenticated
 */
export function isAuthenticatedFromHeaders(headers: Headers): boolean {
  const authHeader = headers.get('authorization');
  return !!authHeader && authHeader.startsWith('Bearer ');
}
