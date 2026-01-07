/**
 * Redis Utility for Edge Functions
 * 
 * Provides a simple interface to Upstash Redis REST API.
 * Used for idempotency caching, rate limiting, and other distributed operations.
 */

const UPSTASH_REDIS_REST_URL = Deno.env.get('UPSTASH_REDIS_REST_URL');
const UPSTASH_REDIS_REST_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

/**
 * Redis client for Upstash REST API
 */
export class RedisClient {
  private url: string;
  private token: string;
  private enabled: boolean;

  constructor() {
    this.url = UPSTASH_REDIS_REST_URL || '';
    this.token = UPSTASH_REDIS_REST_TOKEN || '';
    this.enabled = !!this.url && !!this.token;

    if (!this.enabled) {
      console.warn('Upstash Redis not configured');
    }
  }

  /**
   * Execute a Redis command
   */
  async command(cmd: string[]): Promise<any> {
    if (!this.enabled) {
      console.warn('Redis not available, command skipped:', cmd[0]);
      return null;
    }

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cmd),
      });

      if (!response.ok) {
        console.error(`Redis error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Redis command failed:', error);
      return null;
    }
  }

  /**
   * Get a value from Redis
   */
  async get(key: string): Promise<string | null> {
    const result = await this.command(['GET', key]);
    return result || null;
  }

  /**
   * Set a value in Redis with optional expiration
   */
  async set(key: string, value: string, exSeconds?: number): Promise<boolean> {
    if (exSeconds) {
      const result = await this.command(['SETEX', key, exSeconds.toString(), value]);
      return result === 'OK';
    } else {
      const result = await this.command(['SET', key, value]);
      return result === 'OK';
    }
  }

  /**
   * Set a value only if key doesn't exist (NX flag)
   */
  async setNX(key: string, value: string, exSeconds?: number): Promise<boolean> {
    if (exSeconds) {
      const result = await this.command(['SET', key, value, 'NX', 'EX', exSeconds.toString()]);
      return result === 'OK';
    } else {
      const result = await this.command(['SET', key, value, 'NX']);
      return result === 'OK';
    }
  }

  /**
   * Delete a key from Redis
   */
  async del(key: string): Promise<number> {
    const result = await this.command(['DEL', key]);
    return result || 0;
  }

  /**
   * Increment a value in Redis
   */
  async incr(key: string): Promise<number> {
    const result = await this.command(['INCR', key]);
    return result || 0;
  }

  /**
   * Set expiration on a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.command(['EXPIRE', key, seconds.toString()]);
    return result === 1;
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.command(['EXISTS', key]);
    return result === 1;
  }

  /**
   * Get time to live for a key
   */
  async ttl(key: string): Promise<number> {
    const result = await this.command(['TTL', key]);
    return result || -2; // -2 if key doesn't exist, -1 if no expiration
  }
}

/**
 * Singleton Redis client instance
 */
export const redis = new RedisClient();
