/**
 * Tests for Redis cache operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Redis } from '@upstash/redis';
import * as clientModule from '@/lib/redis/client';
import {
  cacheGet,
  cacheSet,
  cacheDel,
  cacheExists,
  cacheTTL,
  cacheExpire,
  cacheGetOrSet,
  cacheInvalidatePattern,
  cacheMGet,
  cacheMSet,
  cacheIncr,
  cacheDecr,
  invalidateGuardianScans,
  invalidateEligibility,
  invalidateFeedPages,
  invalidateOpportunityDetail,
  invalidateUserPrefs,
} from '@/lib/redis/cache';
import { RedisKeys } from '@/lib/redis/keys';

// Mock Redis client
vi.mock('@/lib/redis/client', () => ({
  getRedis: vi.fn(),
}));

describe('Redis Cache Operations', () => {
  let mockRedis: Partial<Redis>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock Redis instance
    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      exists: vi.fn(),
      ttl: vi.fn(),
      expire: vi.fn(),
      scan: vi.fn(),
      mget: vi.fn(),
      pipeline: vi.fn(),
      incr: vi.fn(),
      incrby: vi.fn(),
      decr: vi.fn(),
      decrby: vi.fn(),
      flushall: vi.fn(),
    };

    // Mock getRedis to return our mock
    vi.mocked(clientModule.getRedis).mockReturnValue(mockRedis as Redis);
  });

  describe('cacheGet', () => {
    it('should get value from cache', async () => {
      const testData = { foo: 'bar' };
      vi.mocked(mockRedis.get!).mockResolvedValue(testData);

      const result = await cacheGet('test-key');

      expect(result.hit).toBe(true);
      expect(result.data).toEqual(testData);
      expect(result.error).toBeUndefined();
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return cache miss when key does not exist', async () => {
      vi.mocked(mockRedis.get!).mockResolvedValue(null);

      const result = await cacheGet('missing-key');

      expect(result.hit).toBe(false);
      expect(result.data).toBeNull();
    });

    it('should handle Redis unavailable', async () => {
      vi.mocked(clientModule.getRedis).mockReturnValue(null);

      const result = await cacheGet('test-key');

      expect(result.hit).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Redis error');
      vi.mocked(mockRedis.get!).mockRejectedValue(error);

      const result = await cacheGet('test-key');

      expect(result.hit).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('cacheSet', () => {
    it('should set value with TTL', async () => {
      vi.mocked(mockRedis.set!).mockResolvedValue('OK');

      const success = await cacheSet('test-key', { foo: 'bar' }, { ttl: 300 });

      expect(success).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        { foo: 'bar' },
        { ex: 300 }
      );
    });

    it('should set value without TTL', async () => {
      vi.mocked(mockRedis.set!).mockResolvedValue('OK');

      const success = await cacheSet('test-key', 'value');

      expect(success).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith('test-key', 'value', {});
    });

    it('should support NX option', async () => {
      vi.mocked(mockRedis.set!).mockResolvedValue('OK');

      await cacheSet('test-key', 'value', { nx: true });

      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        'value',
        { nx: true }
      );
    });

    it('should support XX option', async () => {
      vi.mocked(mockRedis.set!).mockResolvedValue('OK');

      await cacheSet('test-key', 'value', { xx: true });

      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        'value',
        { xx: true }
      );
    });

    it('should handle Redis unavailable', async () => {
      vi.mocked(clientModule.getRedis).mockReturnValue(null);

      const success = await cacheSet('test-key', 'value');

      expect(success).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(mockRedis.set!).mockRejectedValue(new Error('Redis error'));

      const success = await cacheSet('test-key', 'value');

      expect(success).toBe(false);
    });
  });

  describe('cacheDel', () => {
    it('should delete single key', async () => {
      vi.mocked(mockRedis.del!).mockResolvedValue(1);

      const count = await cacheDel('test-key');

      expect(count).toBe(1);
      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('should delete multiple keys', async () => {
      vi.mocked(mockRedis.del!).mockResolvedValue(3);

      const count = await cacheDel(['key1', 'key2', 'key3']);

      expect(count).toBe(3);
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
    });

    it('should handle empty array', async () => {
      const count = await cacheDel([]);

      expect(count).toBe(0);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should handle Redis unavailable', async () => {
      vi.mocked(clientModule.getRedis).mockReturnValue(null);

      const count = await cacheDel('test-key');

      expect(count).toBe(0);
    });
  });

  describe('cacheExists', () => {
    it('should return true when key exists', async () => {
      vi.mocked(mockRedis.exists!).mockResolvedValue(1);

      const exists = await cacheExists('test-key');

      expect(exists).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      vi.mocked(mockRedis.exists!).mockResolvedValue(0);

      const exists = await cacheExists('test-key');

      expect(exists).toBe(false);
    });

    it('should handle Redis unavailable', async () => {
      vi.mocked(clientModule.getRedis).mockReturnValue(null);

      const exists = await cacheExists('test-key');

      expect(exists).toBe(false);
    });
  });

  describe('cacheTTL', () => {
    it('should return TTL in seconds', async () => {
      vi.mocked(mockRedis.ttl!).mockResolvedValue(300);

      const ttl = await cacheTTL('test-key');

      expect(ttl).toBe(300);
    });

    it('should return -1 for keys without expiry', async () => {
      vi.mocked(mockRedis.ttl!).mockResolvedValue(-1);

      const ttl = await cacheTTL('test-key');

      expect(ttl).toBe(-1);
    });

    it('should return -2 for non-existent keys', async () => {
      vi.mocked(mockRedis.ttl!).mockResolvedValue(-2);

      const ttl = await cacheTTL('missing-key');

      expect(ttl).toBe(-2);
    });

    it('should handle Redis unavailable', async () => {
      vi.mocked(clientModule.getRedis).mockReturnValue(null);

      const ttl = await cacheTTL('test-key');

      expect(ttl).toBe(-2);
    });
  });

  describe('cacheExpire', () => {
    it('should set expiry on existing key', async () => {
      vi.mocked(mockRedis.expire!).mockResolvedValue(1);

      const success = await cacheExpire('test-key', 600);

      expect(success).toBe(true);
      expect(mockRedis.expire).toHaveBeenCalledWith('test-key', 600);
    });

    it('should return false for non-existent key', async () => {
      vi.mocked(mockRedis.expire!).mockResolvedValue(0);

      const success = await cacheExpire('missing-key', 600);

      expect(success).toBe(false);
    });

    it('should handle Redis unavailable', async () => {
      vi.mocked(clientModule.getRedis).mockReturnValue(null);

      const success = await cacheExpire('test-key', 600);

      expect(success).toBe(false);
    });
  });

  describe('cacheGetOrSet', () => {
    it('should return cached value if exists', async () => {
      const cachedData = { foo: 'bar' };
      vi.mocked(mockRedis.get!).mockResolvedValue(cachedData);

      const fetcher = vi.fn().mockResolvedValue({ foo: 'baz' });
      const result = await cacheGetOrSet('test-key', fetcher, 300);

      expect(result).toEqual(cachedData);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should fetch and cache if not exists', async () => {
      vi.mocked(mockRedis.get!).mockResolvedValue(null);
      vi.mocked(mockRedis.set!).mockResolvedValue('OK');

      const fetchedData = { foo: 'baz' };
      const fetcher = vi.fn().mockResolvedValue(fetchedData);
      const result = await cacheGetOrSet('test-key', fetcher, 300);

      expect(result).toEqual(fetchedData);
      expect(fetcher).toHaveBeenCalled();
      
      // Wait for async cache set
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        fetchedData,
        { ex: 300 }
      );
    });
  });

  describe('cacheInvalidatePattern', () => {
    it('should invalidate keys matching pattern', async () => {
      // Mock SCAN to return keys in batches
      vi.mocked(mockRedis.scan!)
        .mockResolvedValueOnce([10, ['key1', 'key2']])
        .mockResolvedValueOnce([0, ['key3']]);
      
      vi.mocked(mockRedis.del!).mockResolvedValue(3);

      const count = await cacheInvalidatePattern('test:*');

      expect(count).toBe(3);
      expect(mockRedis.scan).toHaveBeenCalledTimes(2);
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
    });

    it('should handle no matching keys', async () => {
      vi.mocked(mockRedis.scan!).mockResolvedValue([0, []]);

      const count = await cacheInvalidatePattern('test:*');

      expect(count).toBe(0);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should handle Redis unavailable', async () => {
      vi.mocked(clientModule.getRedis).mockReturnValue(null);

      const count = await cacheInvalidatePattern('test:*');

      expect(count).toBe(0);
    });
  });

  describe('Specific invalidation functions', () => {
    it('should invalidate guardian scans', async () => {
      vi.mocked(mockRedis.scan!).mockResolvedValue([0, ['guardian:scan:1']]);
      vi.mocked(mockRedis.del!).mockResolvedValue(1);

      const count = await invalidateGuardianScans();

      expect(count).toBe(1);
      expect(mockRedis.scan).toHaveBeenCalledWith(
        0,
        expect.objectContaining({ match: 'guardian:scan:*' })
      );
    });

    it('should invalidate eligibility for opportunity', async () => {
      vi.mocked(mockRedis.scan!).mockResolvedValue([0, ['elig:op:123:wa:abc']]);
      vi.mocked(mockRedis.del!).mockResolvedValue(1);

      const count = await invalidateEligibility('123');

      expect(count).toBe(1);
      expect(mockRedis.scan).toHaveBeenCalledWith(
        0,
        expect.objectContaining({ match: 'elig:op:123:*' })
      );
    });

    it('should invalidate feed pages', async () => {
      vi.mocked(mockRedis.scan!).mockResolvedValue([0, ['feed:page:hash:cursor']]);
      vi.mocked(mockRedis.del!).mockResolvedValue(1);

      const count = await invalidateFeedPages();

      expect(count).toBe(1);
      expect(mockRedis.scan).toHaveBeenCalledWith(
        0,
        expect.objectContaining({ match: 'feed:page:*' })
      );
    });

    it('should invalidate opportunity detail', async () => {
      vi.mocked(mockRedis.del!).mockResolvedValue(1);

      const count = await invalidateOpportunityDetail('aave-staking');

      expect(count).toBe(1);
      expect(mockRedis.del).toHaveBeenCalledWith('opp:detail:aave-staking');
    });

    it('should invalidate user preferences', async () => {
      vi.mocked(mockRedis.del!).mockResolvedValue(1);

      const count = await invalidateUserPrefs('user-123');

      expect(count).toBe(1);
      expect(mockRedis.del).toHaveBeenCalledWith('user:prefs:user-123');
    });
  });

  describe('cacheMGet', () => {
    it('should batch get multiple keys', async () => {
      const values = ['value1', 'value2', null];
      vi.mocked(mockRedis.mget!).mockResolvedValue(values);

      const result = await cacheMGet(['key1', 'key2', 'key3']);

      expect(result.size).toBe(3);
      expect(result.get('key1')).toBe('value1');
      expect(result.get('key2')).toBe('value2');
      expect(result.get('key3')).toBeNull();
    });

    it('should handle empty keys array', async () => {
      const result = await cacheMGet([]);

      expect(result.size).toBe(0);
      expect(mockRedis.mget).not.toHaveBeenCalled();
    });

    it('should handle Redis unavailable', async () => {
      vi.mocked(clientModule.getRedis).mockReturnValue(null);

      const result = await cacheMGet(['key1', 'key2']);

      expect(result.size).toBe(0);
    });
  });

  describe('cacheMSet', () => {
    it('should batch set multiple keys', async () => {
      const mockPipeline = {
        set: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(['OK', 'OK', 'OK']),
      };
      vi.mocked(mockRedis.pipeline!).mockReturnValue(mockPipeline as any);

      const entries: Array<[string, any, number?]> = [
        ['key1', 'value1', 300],
        ['key2', 'value2', 600],
        ['key3', 'value3'],
      ];

      const count = await cacheMSet(entries);

      expect(count).toBe(3);
      expect(mockPipeline.set).toHaveBeenCalledTimes(3);
    });

    it('should handle empty entries array', async () => {
      const count = await cacheMSet([]);

      expect(count).toBe(0);
      expect(mockRedis.pipeline).not.toHaveBeenCalled();
    });

    it('should handle Redis unavailable', async () => {
      vi.mocked(clientModule.getRedis).mockReturnValue(null);

      const count = await cacheMSet([['key1', 'value1']]);

      expect(count).toBe(0);
    });
  });

  describe('cacheIncr', () => {
    it('should increment by 1 by default', async () => {
      vi.mocked(mockRedis.incr!).mockResolvedValue(5);

      const result = await cacheIncr('counter');

      expect(result).toBe(5);
      expect(mockRedis.incr).toHaveBeenCalledWith('counter');
    });

    it('should increment by custom amount', async () => {
      vi.mocked(mockRedis.incrby!).mockResolvedValue(15);

      const result = await cacheIncr('counter', 10);

      expect(result).toBe(15);
      expect(mockRedis.incrby).toHaveBeenCalledWith('counter', 10);
    });

    it('should handle Redis unavailable', async () => {
      vi.mocked(clientModule.getRedis).mockReturnValue(null);

      const result = await cacheIncr('counter');

      expect(result).toBe(0);
    });
  });

  describe('cacheDecr', () => {
    it('should decrement by 1 by default', async () => {
      vi.mocked(mockRedis.decr!).mockResolvedValue(3);

      const result = await cacheDecr('counter');

      expect(result).toBe(3);
      expect(mockRedis.decr).toHaveBeenCalledWith('counter');
    });

    it('should decrement by custom amount', async () => {
      vi.mocked(mockRedis.decrby!).mockResolvedValue(5);

      const result = await cacheDecr('counter', 10);

      expect(result).toBe(5);
      expect(mockRedis.decrby).toHaveBeenCalledWith('counter', 10);
    });

    it('should handle Redis unavailable', async () => {
      vi.mocked(clientModule.getRedis).mockReturnValue(null);

      const result = await cacheDecr('counter');

      expect(result).toBe(0);
    });
  });
});
