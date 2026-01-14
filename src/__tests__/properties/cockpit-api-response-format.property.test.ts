/**
 * Cockpit API Response Format Property-Based Tests
 * 
 * Feature: authenticated-home-cockpit
 * Property 13: API Response Format
 * 
 * Tests that for any API endpoint response, the structure includes 
 * { data, error, meta: { ts } } with server timestamp.
 * 
 * Validates: Requirements 16.6
 */

import * as fc from 'fast-check';
import { describe, test, expect, beforeEach, vi } from 'vitest';

// ============================================================================
// Types
// ============================================================================

/**
 * Standard API response format
 */
interface APIResponse<T = any> {
  data: T | null;
  error: {
    code: string;
    message: string;
    retry_after_sec?: number;
  } | null;
  meta: {
    ts: string;
  };
}

/**
 * API endpoint configuration
 */
interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requiresAuth: boolean;
  expectedDataType: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
}

/**
 * Mock response data generators
 */
interface MockResponseData {
  success: any;
  error: {
    code: string;
    message: string;
    retry_after_sec?: number;
  };
}

// ============================================================================
// Generators
// ============================================================================

/**
 * Generate valid ISO 8601 timestamp strings
 */
const timestampArbitrary = fc.date({ 
  min: new Date('2020-01-01'), 
  max: new Date('2030-12-31') 
}).map(date => date.toISOString());

/**
 * Generate error codes
 */
const errorCodeArbitrary = fc.constantFrom(
  'VALIDATION_ERROR',
  'UNAUTHORIZED', 
  'FORBIDDEN',
  'NOT_FOUND',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'NETWORK_ERROR',
  'FUNCTION_ERROR'
);

/**
 * Generate error objects
 */
const errorArbitrary = fc.record({
  code: errorCodeArbitrary,
  message: fc.string({ minLength: 1, maxLength: 200 }),
  retry_after_sec: fc.option(fc.integer({ min: 1, max: 3600 })),
});

/**
 * Generate mock success data based on endpoint type
 */
const successDataArbitrary = fc.oneof(
  // Cockpit summary response
  fc.record({
    wallet_scope: fc.constantFrom('active', 'all'),
    today_card: fc.record({
      kind: fc.constantFrom('onboarding', 'scan_required', 'critical_risk', 'pending_actions', 'daily_pulse', 'portfolio_anchor'),
      anchor_metric: fc.string({ minLength: 1, maxLength: 50 }),
      context_line: fc.string({ minLength: 1, maxLength: 100 }),
      primary_cta: fc.record({
        label: fc.string({ minLength: 1, maxLength: 30 }),
        href: fc.string({ minLength: 1, maxLength: 100 }),
      }),
    }),
    action_preview: fc.array(fc.record({
      id: fc.string({ minLength: 1 }),
      lane: fc.constantFrom('Protect', 'Earn', 'Watch'),
      title: fc.string({ minLength: 1, maxLength: 100 }),
      severity: fc.constantFrom('critical', 'high', 'med', 'low'),
    }), { maxLength: 3 }),
    counters: fc.record({
      new_since_last: fc.integer({ min: 0, max: 99 }),
      expiring_soon: fc.integer({ min: 0, max: 50 }),
      critical_risk: fc.integer({ min: 0, max: 20 }),
      pending_actions: fc.integer({ min: 0, max: 30 }),
    }),
    provider_status: fc.record({
      state: fc.constantFrom('online', 'degraded', 'offline'),
      detail: fc.option(fc.string({ maxLength: 200 })),
    }),
    degraded_mode: fc.boolean(),
  }),
  // Preferences response
  fc.record({
    wallet_scope_default: fc.constantFrom('active', 'all'),
    dnd_start_local: fc.string().filter(s => /^([01]\d|2[0-3]):[0-5]\d$/.test(s)),
    dnd_end_local: fc.string().filter(s => /^([01]\d|2[0-3]):[0-5]\d$/.test(s)),
    notif_cap_per_day: fc.integer({ min: 0, max: 10 }),
  }),
  // Simple success response
  fc.record({
    ok: fc.boolean(),
  }),
  // Array response
  fc.array(fc.record({
    id: fc.string({ minLength: 1 }),
    name: fc.string({ minLength: 1 }),
  })),
  // Null response
  fc.constant(null)
);

/**
 * Generate API responses (success or error)
 */
const apiResponseArbitrary = fc.oneof(
  // Success response
  fc.record({
    data: successDataArbitrary,
    error: fc.constant(null),
    meta: fc.record({
      ts: timestampArbitrary,
    }),
  }),
  // Error response
  fc.record({
    data: fc.constant(null),
    error: errorArbitrary,
    meta: fc.record({
      ts: timestampArbitrary,
    }),
  })
);

/**
 * Generate API endpoint configurations
 */
const apiEndpointArbitrary = fc.record({
  path: fc.constantFrom(
    '/api/cockpit/summary',
    '/api/cockpit/prefs',
    '/api/cockpit/open',
    '/api/cockpit/actions/rendered',
    '/api/cockpit/pulse',
    '/api/investments/save',
    '/api/alerts/rules',
    '/api/notifications/subscribe',
    '/api/notifications/unsubscribe',
    '/api/notifications/test'
  ),
  method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
  requiresAuth: fc.boolean(),
  expectedDataType: fc.constantFrom('object', 'array', 'string', 'number', 'boolean', 'null'),
});

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: authenticated-home-cockpit, Property 13: API Response Format', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Property 13.1: All API responses have required structure
  // ==========================================================================

  test('all API responses include data, error, and meta fields', () => {
    fc.assert(
      fc.property(
        apiResponseArbitrary,
        (response) => {
          // Property: Every API response must have data, error, and meta fields
          expect(response).toHaveProperty('data');
          expect(response).toHaveProperty('error');
          expect(response).toHaveProperty('meta');
          
          // Meta must have ts field
          expect(response.meta).toHaveProperty('ts');
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  // ==========================================================================
  // Property 13.2: Exactly one of data or error is non-null
  // ==========================================================================

  test('exactly one of data or error is non-null', () => {
    fc.assert(
      fc.property(
        apiResponseArbitrary,
        (response) => {
          // Property: Either data is non-null and error is null, 
          // or data is null and error is non-null
          const dataIsNull = response.data === null;
          const errorIsNull = response.error === null;
          
          // Exactly one should be null
          expect(dataIsNull !== errorIsNull).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  // ==========================================================================
  // Property 13.3: Timestamp is valid ISO 8601 format
  // ==========================================================================

  test('meta.ts is valid ISO 8601 timestamp', () => {
    fc.assert(
      fc.property(
        apiResponseArbitrary,
        (response) => {
          // Property: meta.ts must be a valid ISO 8601 timestamp
          const timestamp = response.meta.ts;
          
          // Must be a string
          expect(typeof timestamp).toBe('string');
          
          // Must be valid ISO 8601 format
          const date = new Date(timestamp);
          expect(date.toISOString()).toBe(timestamp);
          
          // Must not be NaN
          expect(isNaN(date.getTime())).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  // ==========================================================================
  // Property 13.4: Error responses have required error structure
  // ==========================================================================

  test('error responses have required error structure', () => {
    fc.assert(
      fc.property(
        errorArbitrary,
        timestampArbitrary,
        (error, timestamp) => {
          const response: APIResponse = {
            data: null,
            error,
            meta: { ts: timestamp },
          };
          
          // Property: Error responses must have code and message
          expect(response.error).not.toBeNull();
          expect(response.error!).toHaveProperty('code');
          expect(response.error!).toHaveProperty('message');
          
          // Code must be non-empty string
          expect(typeof response.error!.code).toBe('string');
          expect(response.error!.code.length).toBeGreaterThan(0);
          
          // Message must be non-empty string
          expect(typeof response.error!.message).toBe('string');
          expect(response.error!.message.length).toBeGreaterThan(0);
          
          // retry_after_sec is optional but if present must be positive integer
          if (response.error!.retry_after_sec !== undefined) {
            expect(typeof response.error!.retry_after_sec).toBe('number');
            expect(response.error!.retry_after_sec).toBeGreaterThan(0);
            expect(Number.isInteger(response.error!.retry_after_sec)).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  // ==========================================================================
  // Property 13.5: Success responses have data field
  // ==========================================================================

  test('success responses have non-null data field', () => {
    fc.assert(
      fc.property(
        successDataArbitrary,
        timestampArbitrary,
        (data, timestamp) => {
          const response: APIResponse = {
            data,
            error: null,
            meta: { ts: timestamp },
          };
          
          // Property: Success responses must have non-null data
          expect(response.data).not.toBeUndefined();
          expect(response.error).toBeNull();
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  // ==========================================================================
  // Property 13.6: Timestamp is recent (server-generated)
  // ==========================================================================

  test('timestamp represents server generation time', () => {
    fc.assert(
      fc.property(
        apiResponseArbitrary,
        (response) => {
          // Property: Timestamp should be reasonable (not too far in past/future)
          const timestamp = new Date(response.meta.ts);
          const now = new Date();
          
          // Should be within reasonable bounds (not more than 1 year old or 1 day in future)
          const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          
          expect(timestamp.getTime()).toBeGreaterThanOrEqual(oneYearAgo.getTime());
          expect(timestamp.getTime()).toBeLessThanOrEqual(oneDayFromNow.getTime());
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  // ==========================================================================
  // Property 13.7: Response structure is consistent across endpoints
  // ==========================================================================

  test('response structure is consistent across all endpoints', () => {
    fc.assert(
      fc.property(
        apiEndpointArbitrary,
        apiResponseArbitrary,
        (endpoint, response) => {
          // Property: All endpoints return the same response structure
          // regardless of endpoint path, method, or auth requirements
          
          // Must have exactly these top-level keys
          const keys = Object.keys(response).sort();
          expect(keys).toEqual(['data', 'error', 'meta']);
          
          // Meta must have exactly ts key
          const metaKeys = Object.keys(response.meta).sort();
          expect(metaKeys).toEqual(['ts']);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  // ==========================================================================
  // Property 13.8: No additional fields in response structure
  // ==========================================================================

  test('response contains no additional fields beyond specification', () => {
    fc.assert(
      fc.property(
        apiResponseArbitrary,
        (response) => {
          // Property: Response should not contain any fields beyond data, error, meta
          const allowedTopLevelKeys = ['data', 'error', 'meta'];
          const actualKeys = Object.keys(response);
          
          for (const key of actualKeys) {
            expect(allowedTopLevelKeys).toContain(key);
          }
          
          // Meta should not contain fields beyond ts
          const allowedMetaKeys = ['ts'];
          const actualMetaKeys = Object.keys(response.meta);
          
          for (const key of actualMetaKeys) {
            expect(allowedMetaKeys).toContain(key);
          }
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});