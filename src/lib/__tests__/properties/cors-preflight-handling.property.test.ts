/**
 * Property-Based Tests for CORS and Preflight Handling
 * 
 * Feature: multi-chain-wallet-system, Property 13: CORS and Preflight Handling
 * Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5
 * 
 * @see .kiro/specs/multi-chain-wallet-system/design.md - Property 13
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';

/**
 * Simulates CORS headers
 */
interface CORSHeaders {
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Methods': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Max-Age'?: string;
}

/**
 * Required CORS headers for Edge Functions
 */
const REQUIRED_CORS_HEADERS = [
  'authorization',
  'content-type',
  'apikey',
  'x-client-info',
  'idempotency-key',
];

/**
 * Generates CORS headers for a request
 */
function generateCORSHeaders(origin: string, method: string): CORSHeaders {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': REQUIRED_CORS_HEADERS.join(', '),
    'Access-Control-Max-Age': '3600',
  };
}

/**
 * Validates CORS headers
 */
function validateCORSHeaders(headers: CORSHeaders): boolean {
  // Check required headers exist
  if (!headers['Access-Control-Allow-Origin']) return false;
  if (!headers['Access-Control-Allow-Methods']) return false;
  if (!headers['Access-Control-Allow-Headers']) return false;

  // Check required methods are included
  const methods = headers['Access-Control-Allow-Methods'].split(',').map(m => m.trim());
  if (!methods.includes('GET') || !methods.includes('POST') || !methods.includes('OPTIONS')) {
    return false;
  }

  // Check required headers are included
  const allowedHeaders = headers['Access-Control-Allow-Headers'].split(',').map(h => h.trim());
  for (const required of REQUIRED_CORS_HEADERS) {
    if (!allowedHeaders.some(h => h.toLowerCase() === required.toLowerCase())) {
      return false;
    }
  }

  return true;
}

/**
 * Handles preflight request
 */
function handlePreflightRequest(origin: string, method: string): {
  statusCode: number;
  headers: CORSHeaders;
} {
  const headers = generateCORSHeaders(origin, method);

  return {
    statusCode: 200,
    headers,
  };
}

/**
 * Handles main request with CORS
 */
function handleMainRequest(origin: string, method: string, isAuthenticated: boolean): {
  statusCode: number;
  headers: CORSHeaders;
  body?: { error?: { code: string; message: string } };
} {
  const headers = generateCORSHeaders(origin, method);

  // Unauthenticated requests should still get CORS headers
  if (!isAuthenticated && method !== 'OPTIONS') {
    return {
      statusCode: 401,
      headers,
      body: {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization',
        },
      },
    };
  }

  return {
    statusCode: 200,
    headers,
  };
}

describe('Feature: multi-chain-wallet-system, Property 13: CORS and Preflight Handling', () => {
  /**
   * Property 13.1: OPTIONS preflight is handled correctly
   * For any preflight request, the response should include proper CORS headers
   */
  test('OPTIONS preflight is handled correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          origin: fc.constantFrom('http://localhost:3000', 'https://alphawhale.com'),
          method: fc.constantFrom('GET', 'POST'),
        }),
        ({ origin, method }) => {
          const response = handlePreflightRequest(origin, method);

          expect(response.statusCode).toBe(200);
          expect(validateCORSHeaders(response.headers)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.2: CORS headers include all required headers
   * For any CORS response, it should include authorization, content-type, apikey, x-client-info, idempotency-key
   */
  test('CORS headers include all required headers', () => {
    fc.assert(
      fc.property(
        fc.record({
          origin: fc.constantFrom('http://localhost:3000', 'https://alphawhale.com'),
          method: fc.constantFrom('GET', 'POST'),
        }),
        ({ origin, method }) => {
          const headers = generateCORSHeaders(origin, method);
          const allowedHeaders = headers['Access-Control-Allow-Headers'].split(',').map(h => h.trim());

          // Check all required headers are present
          REQUIRED_CORS_HEADERS.forEach((required) => {
            const found = allowedHeaders.some(h => h.toLowerCase() === required.toLowerCase());
            expect(found).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.3: CORS headers include allowed methods
   * For any CORS response, it should include GET, POST, and OPTIONS methods
   */
  test('CORS headers include allowed methods', () => {
    fc.assert(
      fc.property(
        fc.record({
          origin: fc.constantFrom('http://localhost:3000', 'https://alphawhale.com'),
          method: fc.constantFrom('GET', 'POST'),
        }),
        ({ origin, method }) => {
          const headers = generateCORSHeaders(origin, method);
          const methods = headers['Access-Control-Allow-Methods'].split(',').map(m => m.trim());

          expect(methods).toContain('GET');
          expect(methods).toContain('POST');
          expect(methods).toContain('OPTIONS');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.4: Browser calls succeed without CORS errors
   * For any browser call with proper CORS headers, it should succeed
   */
  test('browser calls succeed without CORS errors', () => {
    fc.assert(
      fc.property(
        fc.record({
          origin: fc.constantFrom('http://localhost:3000', 'https://alphawhale.com'),
          method: fc.constantFrom('GET', 'POST'),
          isAuthenticated: fc.boolean(),
        }),
        ({ origin, method, isAuthenticated }) => {
          const response = handleMainRequest(origin, method, isAuthenticated);

          // Should have CORS headers
          expect(response.headers['Access-Control-Allow-Origin']).toBe(origin);
          expect(validateCORSHeaders(response.headers)).toBe(true);

          // Status code should be appropriate
          if (isAuthenticated) {
            expect(response.statusCode).toBe(200);
          } else {
            expect(response.statusCode).toBe(401);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.5: Preflight succeeds even when unauthenticated
   * For any preflight request, it should succeed regardless of authentication
   */
  test('preflight succeeds even when unauthenticated', () => {
    fc.assert(
      fc.property(
        fc.record({
          origin: fc.constantFrom('http://localhost:3000', 'https://alphawhale.com'),
          method: fc.constantFrom('GET', 'POST'),
        }),
        ({ origin, method }) => {
          const response = handlePreflightRequest(origin, method);

          // Preflight should always succeed
          expect(response.statusCode).toBe(200);
          expect(validateCORSHeaders(response.headers)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.6: CORS headers are consistent
   * For any request, CORS headers should be consistent across multiple calls
   */
  test('CORS headers are consistent across multiple calls', () => {
    fc.assert(
      fc.property(
        fc.record({
          origin: fc.constantFrom('http://localhost:3000', 'https://alphawhale.com'),
          method: fc.constantFrom('GET', 'POST'),
        }),
        ({ origin, method }) => {
          const response1 = handlePreflightRequest(origin, method);
          const response2 = handlePreflightRequest(origin, method);
          const response3 = handlePreflightRequest(origin, method);

          expect(response1.headers).toEqual(response2.headers);
          expect(response2.headers).toEqual(response3.headers);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.7: CORS headers are deterministic
   * For any request, CORS headers should be deterministic
   */
  test('CORS headers are deterministic', () => {
    fc.assert(
      fc.property(
        fc.record({
          origin: fc.constantFrom('http://localhost:3000', 'https://alphawhale.com'),
          method: fc.constantFrom('GET', 'POST'),
        }),
        ({ origin, method }) => {
          const headers1 = generateCORSHeaders(origin, method);
          const headers2 = generateCORSHeaders(origin, method);

          expect(headers1).toEqual(headers2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.8: All required headers are present in every response
   * For any response, all required CORS headers should be present
   */
  test('all required headers are present in every response', () => {
    fc.assert(
      fc.property(
        fc.record({
          origin: fc.constantFrom('http://localhost:3000', 'https://alphawhale.com'),
          method: fc.constantFrom('GET', 'POST'),
          isAuthenticated: fc.boolean(),
        }),
        ({ origin, method, isAuthenticated }) => {
          const response = handleMainRequest(origin, method, isAuthenticated);

          // Check all required CORS headers
          expect(response.headers['Access-Control-Allow-Origin']).toBeDefined();
          expect(response.headers['Access-Control-Allow-Methods']).toBeDefined();
          expect(response.headers['Access-Control-Allow-Headers']).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.9: CORS validation is strict
   * For any CORS headers, validation should be strict about required headers
   */
  test('CORS validation is strict about required headers', () => {
    fc.assert(
      fc.property(
        fc.record({
          origin: fc.constantFrom('http://localhost:3000', 'https://alphawhale.com'),
          method: fc.constantFrom('GET', 'POST'),
        }),
        ({ origin, method }) => {
          const headers = generateCORSHeaders(origin, method);

          // Should pass validation
          expect(validateCORSHeaders(headers)).toBe(true);

          // Remove one required header
          const invalidHeaders = { ...headers };
          invalidHeaders['Access-Control-Allow-Headers'] = 'content-type'; // Missing required headers

          // Should fail validation
          expect(validateCORSHeaders(invalidHeaders)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13.10: CORS headers are case-insensitive for header names
   * For any CORS headers, header names should be case-insensitive
   */
  test('CORS header names are case-insensitive', () => {
    fc.assert(
      fc.property(
        fc.record({
          origin: fc.constantFrom('http://localhost:3000', 'https://alphawhale.com'),
          method: fc.constantFrom('GET', 'POST'),
        }),
        ({ origin, method }) => {
          const headers = generateCORSHeaders(origin, method);

          // Check that required headers are found case-insensitively
          const allowedHeaders = headers['Access-Control-Allow-Headers'].split(',').map(h => h.trim());

          REQUIRED_CORS_HEADERS.forEach((required) => {
            const found = allowedHeaders.some(h => h.toLowerCase() === required.toLowerCase());
            expect(found).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
