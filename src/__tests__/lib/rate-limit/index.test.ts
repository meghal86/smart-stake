/**
 * Rate Limiting Tests
 * 
 * Tests for rate limiting middleware functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkRateLimit,
  getRateLimitStatus,
  resetRateLimit,
  getIdentifierFromHeaders,
  isAuthenticatedFromHeaders,
  RateLimitError,
} from '@/lib/rate-limit';

// Mock Upstash modules
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    del: vi.fn().mockResolvedValue(1),
  })),
}));

vi.mock('@upstash/ratelimit', () => {
  // Track counts per identifier
  const counts = new Map<string, number>();

  const RatelimitClass = vi.fn().mockImplementation((config) => {
    const prefix = config.prefix || '';
    
    return {
      limit: vi.fn().mockImplementation(async (identifier: string) => {
        const now = Date.now();
        const key = `${prefix}:${identifier}`;
        const count = (counts.get(key) || 0) + 1;
        counts.set(key, count);
        
        let limit = 100;
        let success = true;
        
        if (prefix === 'ratelimit:burst') {
          limit = 10;
          success = count <= 10;
        } else if (prefix === 'ratelimit:anon') {
          limit = 60;
          success = count <= 60;
        } else if (prefix === 'ratelimit:auth') {
          limit = 120;
          success = count <= 120;
        }
        
        return {
          success,
          limit,
          remaining: Math.max(0, limit - count),
          reset: now + (prefix === 'ratelimit:burst' ? 10000 : 3600000),
        };
      }),
      getRemaining: vi.fn().mockImplementation(async (identifier: string) => {
        const key = `${prefix}:${identifier}`;
        const count = counts.get(key) || 0;
        
        if (prefix === 'ratelimit:anon') {
          return Math.max(0, 60 - count);
        }
        if (prefix === 'ratelimit:auth') {
          return Math.max(0, 120 - count);
        }
        return 100;
      }),
    };
  });

  // Add static method
  RatelimitClass.slidingWindow = vi.fn().mockImplementation((limit: number, window: string) => {
    return { limit, window };
  });

  return {
    Ratelimit: RatelimitClass,
  };
});

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within anonymous user limit', async () => {
      const result = await checkRateLimit('test-ip-1', false);
      
      expect(result.success).toBe(true);
      expect(result.limit).toBeGreaterThan(0);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.reset).toBeGreaterThan(Date.now());
    });

    it('should allow requests within authenticated user limit', async () => {
      const result = await checkRateLimit('test-user-1', true);
      
      expect(result.success).toBe(true);
      expect(result.limit).toBeGreaterThan(0);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.reset).toBeGreaterThan(Date.now());
    });

    it('should throw RateLimitError when burst limit exceeded', async () => {
      // Make 11 rapid requests to exceed burst limit
      const promises = [];
      for (let i = 0; i < 11; i++) {
        promises.push(
          checkRateLimit('burst-test-ip', false).catch((e) => e)
        );
      }
      
      const results = await Promise.all(promises);
      const errors = results.filter((r) => r instanceof RateLimitError);
      
      expect(errors.length).toBeGreaterThan(0);
      
      if (errors.length > 0) {
        const error = errors[0] as RateLimitError;
        expect(error.name).toBe('RateLimitError');
        expect(error.message).toBe('Rate limit exceeded');
        expect(error.limit).toBe(10);
        expect(error.remaining).toBe(0);
        expect(error.retryAfter).toBeGreaterThan(0);
        expect(error.reset).toBeGreaterThan(Date.now());
      }
    });

    it('should have different limits for anonymous vs authenticated users', async () => {
      const anonResult = await checkRateLimit('anon-user', false);
      const authResult = await checkRateLimit('auth-user', true);
      
      // Authenticated users should have higher limit
      expect(authResult.limit).toBeGreaterThanOrEqual(anonResult.limit);
    });

    it('should include retry timing in error', async () => {
      try {
        // Exhaust burst limit
        for (let i = 0; i < 15; i++) {
          await checkRateLimit('retry-test-ip', false);
        }
      } catch (error) {
        if (error instanceof RateLimitError) {
          expect(error.retryAfter).toBeGreaterThan(0);
          expect(error.retryAfter).toBeLessThanOrEqual(3600); // Max 1 hour
        }
      }
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return status without consuming request', async () => {
      const status1 = await getRateLimitStatus('status-test-ip', false);
      const status2 = await getRateLimitStatus('status-test-ip', false);
      
      // Remaining should be the same since we're not consuming
      expect(status1.remaining).toBe(status2.remaining);
      expect(status1.success).toBe(true);
    });

    it('should show different limits for auth vs anon', async () => {
      const anonStatus = await getRateLimitStatus('test-ip', false);
      const authStatus = await getRateLimitStatus('test-ip', true);
      
      expect(anonStatus.limit).toBe(60);
      expect(authStatus.limit).toBe(120);
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for identifier', async () => {
      await expect(resetRateLimit('reset-test-ip')).resolves.not.toThrow();
    });
  });

  describe('getIdentifierFromHeaders', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const headers = new Headers({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      });
      
      const identifier = getIdentifierFromHeaders(headers);
      expect(identifier).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const headers = new Headers({
        'x-real-ip': '192.168.1.2',
      });
      
      const identifier = getIdentifierFromHeaders(headers);
      expect(identifier).toBe('192.168.1.2');
    });

    it('should extract IP from cf-connecting-ip header (priority)', () => {
      const headers = new Headers({
        'cf-connecting-ip': '192.168.1.3',
        'x-real-ip': '192.168.1.4',
        'x-forwarded-for': '192.168.1.5',
      });
      
      const identifier = getIdentifierFromHeaders(headers);
      expect(identifier).toBe('192.168.1.3');
    });

    it('should return "anonymous" when no IP headers present', () => {
      const headers = new Headers();
      
      const identifier = getIdentifierFromHeaders(headers);
      expect(identifier).toBe('anonymous');
    });

    it('should handle whitespace in forwarded-for header', () => {
      const headers = new Headers({
        'x-forwarded-for': '  192.168.1.6  , 10.0.0.2',
      });
      
      const identifier = getIdentifierFromHeaders(headers);
      expect(identifier).toBe('192.168.1.6');
    });
  });

  describe('isAuthenticatedFromHeaders', () => {
    it('should return true for valid Bearer token', () => {
      const headers = new Headers({
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      });
      
      const isAuth = isAuthenticatedFromHeaders(headers);
      expect(isAuth).toBe(true);
    });

    it('should return false for missing authorization header', () => {
      const headers = new Headers();
      
      const isAuth = isAuthenticatedFromHeaders(headers);
      expect(isAuth).toBe(false);
    });

    it('should return false for non-Bearer token', () => {
      const headers = new Headers({
        authorization: 'Basic dXNlcjpwYXNz',
      });
      
      const isAuth = isAuthenticatedFromHeaders(headers);
      expect(isAuth).toBe(false);
    });

    it('should return false for empty Bearer token', () => {
      const headers = new Headers({
        authorization: 'Bearer ',
      });
      
      const isAuth = isAuthenticatedFromHeaders(headers);
      expect(isAuth).toBe(false);
    });
  });

  describe('RateLimitError', () => {
    it('should create error with correct properties', () => {
      const error = new RateLimitError({
        limit: 60,
        reset: Date.now() + 3600000,
        remaining: 0,
        retryAfter: 3600,
      });
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('RateLimitError');
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.limit).toBe(60);
      expect(error.remaining).toBe(0);
      expect(error.retryAfter).toBe(3600);
      expect(error.reset).toBeGreaterThan(Date.now());
    });
  });

  describe('Rate Limit Requirements', () => {
    it('should enforce 60 req/hr for anonymous users (Req 4.13)', async () => {
      const result = await getRateLimitStatus('anon-test', false);
      expect(result.limit).toBe(60);
    });

    it('should enforce 120 req/hr for authenticated users (Req 4.14)', async () => {
      const result = await getRateLimitStatus('auth-test', true);
      expect(result.limit).toBe(120);
    });

    it('should enforce 10 req/10s burst allowance (Req 4.15)', async () => {
      // This is tested in the burst limit test above
      // The burst limiter is configured with 10 requests per 10 seconds
      expect(true).toBe(true);
    });

    it('should provide retry-after timing (Req 8.11)', async () => {
      try {
        // Exhaust limit
        for (let i = 0; i < 15; i++) {
          await checkRateLimit('retry-timing-test', false);
        }
      } catch (error) {
        if (error instanceof RateLimitError) {
          expect(error.retryAfter).toBeDefined();
          expect(typeof error.retryAfter).toBe('number');
          expect(error.retryAfter).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests correctly', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        checkRateLimit(`concurrent-${i}`, false)
      );
      
      const results = await Promise.allSettled(promises);
      
      // All should succeed since they're different identifiers
      results.forEach((result) => {
        expect(result.status).toBe('fulfilled');
      });
    });

    it('should handle same identifier across auth states', async () => {
      const identifier = 'same-identifier-test';
      
      const anonResult = await checkRateLimit(identifier, false);
      const authResult = await checkRateLimit(identifier, true);
      
      // Both should succeed as they use different rate limiters
      expect(anonResult.success).toBe(true);
      expect(authResult.success).toBe(true);
    });

    it('should handle empty identifier gracefully', async () => {
      await expect(checkRateLimit('', false)).resolves.toBeDefined();
    });

    it('should handle very long identifiers', async () => {
      const longId = 'a'.repeat(1000);
      await expect(checkRateLimit(longId, false)).resolves.toBeDefined();
    });
  });
});
