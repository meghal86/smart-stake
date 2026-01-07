/**
 * Rate Limiting Utility for Edge Functions
 * 
 * Implements rate limiting using Upstash Redis with sliding window algorithm.
 * Supports per-user rate limiting for wallet mutations.
 * 
 * Requirements:
 * - Wallet mutation endpoints rate limited at 10/min per user
 * - Return 429 with RATE_LIMITED code on limit exceeded
 * - Include Retry-After header in response
 */

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  public readonly retryAfter: number;

  constructor(retryAfter: number) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Check rate limit for a given user
 * 
 * Uses Upstash Redis to track requests per user with sliding window algorithm.
 * Wallet mutations are limited to 10 requests per minute per user.
 * 
 * @param userId - User ID to rate limit
 * @param limit - Maximum requests per window (default: 10)
 * @param windowSeconds - Time window in seconds (default: 60)
 * @throws RateLimitError if rate limit is exceeded
 */
export async function checkWalletRateLimit(
  userId: string,
  limit: number = 10,
  windowSeconds: number = 60
): Promise<void> {
  const redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

  if (!redisUrl || !redisToken) {
    // If Redis is not configured, skip rate limiting
    console.warn('Rate limiting disabled: Upstash Redis not configured');
    return;
  }

  const key = `ratelimit:wallet:${userId}`;
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);

  try {
    // Use Redis ZREMRANGEBYSCORE to remove old entries outside the window
    await fetch(redisUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: ['ZREMRANGEBYSCORE', key, '-inf', windowStart],
      }),
    });

    // Count requests in the current window
    const countResponse = await fetch(redisUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: ['ZCARD', key],
      }),
    });

    const countData = await countResponse.json() as { result?: number };
    const requestCount = countData.result || 0;

    if (requestCount >= limit) {
      // Get the oldest request timestamp to calculate retry-after
      const oldestResponse = await fetch(redisUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: ['ZRANGE', key, '0', '0'],
        }),
      });

      const oldestData = await oldestResponse.json() as { result?: string[] };
      const oldestTimestamp = oldestData.result?.[0] ? parseInt(oldestData.result[0]) : now;
      const retryAfter = Math.ceil((oldestTimestamp + (windowSeconds * 1000) - now) / 1000);

      throw new RateLimitError(Math.max(1, retryAfter));
    }

    // Add current request to the window
    await fetch(redisUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: ['ZADD', key, now, now.toString()],
      }),
    });

    // Set expiration on the key (window + 1 second buffer)
    await fetch(redisUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: ['EXPIRE', key, windowSeconds + 1],
      }),
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    // If Redis operation fails, log but don't block the request
    console.error('Rate limit check failed:', error);
  }
}

/**
 * Create a 429 rate limit error response
 */
export function createRateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
        retry_after_sec: retryAfter,
      },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}
