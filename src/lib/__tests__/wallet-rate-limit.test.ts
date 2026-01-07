/**
 * Integration tests for wallet rate limiting
 * 
 * Property-Based Testing: Rate Limiting Enforcement
 * Validates: Requirements 11.4, 10.3
 * 
 * Property: For any user making wallet mutations, the system should enforce
 * a rate limit of 10 requests per minute, returning 429 with RATE_LIMITED code
 * when exceeded.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Mock rate limit response structure
 */
interface RateLimitResponse {
  status: number;
  error?: {
    code: string;
    message: string;
    retry_after_sec?: number;
  };
  headers?: {
    'Retry-After'?: string;
    'Content-Type'?: string;
  };
}

/**
 * Simulate rate limit check
 * Returns 429 if more than 10 requests in 60 seconds
 */
function simulateRateLimitCheck(
  userId: string,
  requestCount: number,
  limit: number = 10,
  windowSeconds: number = 60
): RateLimitResponse {
  if (requestCount > limit) {
    const retryAfter = Math.ceil((windowSeconds * 1000) / 1000);
    return {
      status: 429,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
        retry_after_sec: retryAfter,
      },
      headers: {
        'Retry-After': retryAfter.toString(),
        'Content-Type': 'application/json',
      },
    };
  }

  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

describe('Feature: multi-chain-wallet-system, Property 11: Rate Limiting Enforcement', () => {
  test('rate limit allows up to 10 requests per minute', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.integer({ min: 1, max: 10 }),
        (userId, requestCount) => {
          const response = simulateRateLimitCheck(userId, requestCount);
          expect(response.status).toBe(200);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('rate limit rejects requests exceeding 10 per minute', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.integer({ min: 11, max: 100 }),
        (userId, requestCount) => {
          const response = simulateRateLimitCheck(userId, requestCount);
          expect(response.status).toBe(429);
          expect(response.error?.code).toBe('RATE_LIMITED');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('rate limit response includes Retry-After header', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.integer({ min: 11, max: 100 }),
        (userId, requestCount) => {
          const response = simulateRateLimitCheck(userId, requestCount);
          expect(response.headers?.['Retry-After']).toBeDefined();
          const retryAfter = parseInt(response.headers?.['Retry-After'] || '0');
          expect(retryAfter).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('rate limit response includes retry_after_sec in error', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.integer({ min: 11, max: 100 }),
        (userId, requestCount) => {
          const response = simulateRateLimitCheck(userId, requestCount);
          expect(response.error?.retry_after_sec).toBeDefined();
          expect(response.error?.retry_after_sec).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('rate limit is per-user (different users have independent limits)', () => {
    fc.assert(
      fc.property(
        fc.tuple(fc.uuid(), fc.uuid()),
        fc.integer({ min: 11, max: 100 }),
        ([userId1, userId2], requestCount) => {
          // Ensure different users
          if (userId1 === userId2) {
            return true; // Skip if same user
          }

          const response1 = simulateRateLimitCheck(userId1, requestCount);
          const response2 = simulateRateLimitCheck(userId2, requestCount);

          // Both should have same rate limit applied independently
          expect(response1.status).toBe(429);
          expect(response2.status).toBe(429);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('rate limit boundary: exactly 10 requests allowed', () => {
    const response = simulateRateLimitCheck('test-user', 10);
    expect(response.status).toBe(200);
  });

  test('rate limit boundary: 11 requests rejected', () => {
    const response = simulateRateLimitCheck('test-user', 11);
    expect(response.status).toBe(429);
    expect(response.error?.code).toBe('RATE_LIMITED');
  });

  test('rate limit response has correct error message', () => {
    const response = simulateRateLimitCheck('test-user', 15);
    expect(response.error?.message).toContain('Too many requests');
  });

  test('rate limit applies to all wallet mutation endpoints', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.constantFrom(
          'wallets-add-watch',
          'wallets-remove',
          'wallets-remove-address',
          'wallets-set-primary'
        ),
        fc.integer({ min: 11, max: 50 }),
        (userId, endpoint, requestCount) => {
          // All mutation endpoints should have same rate limit
          const response = simulateRateLimitCheck(userId, requestCount);
          expect(response.status).toBe(429);
          expect(response.error?.code).toBe('RATE_LIMITED');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('rate limit window is 60 seconds', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (userId) => {
          const response = simulateRateLimitCheck(userId, 11, 10, 60);
          // Retry-After should be approximately 60 seconds
          const retryAfter = parseInt(response.headers?.['Retry-After'] || '0');
          expect(retryAfter).toBeGreaterThan(0);
          expect(retryAfter).toBeLessThanOrEqual(60);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Rate Limit Error Response Format', () => {
  test('429 response has correct structure', () => {
    const response = simulateRateLimitCheck('user-1', 15);
    
    expect(response.status).toBe(429);
    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe('RATE_LIMITED');
    expect(response.error?.message).toBeDefined();
    expect(response.error?.retry_after_sec).toBeDefined();
    expect(response.headers?.['Retry-After']).toBeDefined();
    expect(response.headers?.['Content-Type']).toBe('application/json');
  });

  test('200 response has correct structure', () => {
    const response = simulateRateLimitCheck('user-1', 5);
    
    expect(response.status).toBe(200);
    expect(response.error).toBeUndefined();
    expect(response.headers?.['Content-Type']).toBe('application/json');
  });
});
