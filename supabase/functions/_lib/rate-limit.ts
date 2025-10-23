/**
 * Upstash Redis Rate Limiting
 * Distributed rate limiting for Edge Functions
 */

const UPSTASH_REDIS_REST_URL = Deno.env.get('UPSTASH_REDIS_REST_URL');
const UPSTASH_REDIS_REST_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  retryAfterSec?: number;
}

async function redisCommand(command: string[]): Promise<any> {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    console.warn('Upstash not configured, rate limiting disabled');
    return null;
  }

  const response = await fetch(`${UPSTASH_REDIS_REST_URL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error(`Redis command failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const windowKey = `ratelimit:${key}:${Math.floor(now / windowSec)}`;

    // Increment counter
    const count = await redisCommand(['INCR', windowKey]);

    if (count === null) {
      // Fallback when Redis not available
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: now + windowSec,
      };
    }

    // Set expiry on first increment
    if (count === 1) {
      await redisCommand(['EXPIRE', windowKey, windowSec.toString()]);
    }

    const remaining = Math.max(0, limit - count);
    const success = count <= limit;
    const reset = (Math.floor(now / windowSec) + 1) * windowSec;

    const result: RateLimitResult = {
      success,
      limit,
      remaining,
      reset,
    };

    if (!success) {
      result.retryAfterSec = reset - now;
    }

    return result;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow request if rate limiting fails
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.floor(Date.now() / 1000) + windowSec,
    };
  }
}

export async function checkRateLimits(
  ip: string,
  userId?: string
): Promise<RateLimitResult> {
  // Per-IP limit: 10 req/min
  const ipLimit = await checkRateLimit(`ip:${ip}`, 10, 60);

  if (!ipLimit.success) {
    return ipLimit;
  }

  // Per-user limit: 20 req/min
  if (userId) {
    const userLimit = await checkRateLimit(`user:${userId}`, 20, 60);
    if (!userLimit.success) {
      return userLimit;
    }
  }

  return ipLimit;
}

// Idempotency key management
export async function checkIdempotency(
  key: string,
  ttlSec: number = 300 // 5 minutes
): Promise<boolean> {
  try {
    const result = await redisCommand(['SET', `idempotency:${key}`, '1', 'NX', 'EX', ttlSec.toString()]);
    return result === 'OK';
  } catch (error) {
    console.error('Idempotency check failed:', error);
    // Fail closed - reject if idempotency check fails
    return false;
  }
}

export async function getIdempotency(key: string): Promise<boolean> {
  try {
    const result = await redisCommand(['GET', `idempotency:${key}`]);
    return result !== null;
  } catch (error) {
    console.error('Idempotency get failed:', error);
    return false;
  }
}

