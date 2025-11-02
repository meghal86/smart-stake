import { Redis } from '@upstash/redis';
import { env } from '@/lib/env';

let redisInstance: Redis | null = null;

function createRedisClient(): Redis | null {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  if (!redisInstance) {
    redisInstance = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redisInstance;
}

export function getRedis(): Redis | null {
  return createRedisClient();
}

export async function withRedisLock<T>(
  key: string,
  ttlSeconds: number,
  action: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();

  if (!redis) {
    return action();
  }

  const namespacedKey = `lock:${key}`;
  const locked = await redis.set(namespacedKey, '1', {
    nx: true,
    ex: ttlSeconds,
  });

  if (!locked) {
    throw new Error('Resource is locked, please retry.');
  }

  try {
    return await action();
  } finally {
    await redis.del(namespacedKey);
  }
}

export async function cacheValue<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  await redis.set(key, value, { ex: ttlSeconds });
}

export async function getCachedValue<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  return redis.get<T | null>(key);
}
