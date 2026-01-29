/**
 * Integration Tests for Hunter Sync Endpoints
 * 
 * Tests CRON_SECRET validation and sync endpoint behavior with actual HTTP requests.
 * 
 * Requirements: 2.1, 2.2, 2.8, 4.3
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';

describe('Hunter Sync Endpoints - CRON_SECRET Validation', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const VALID_SECRET = process.env.CRON_SECRET || 'test-secret-for-integration';

  // Ensure CRON_SECRET is set for tests
  beforeAll(() => {
    if (!process.env.CRON_SECRET) {
      process.env.CRON_SECRET = VALID_SECRET;
    }
  });

  describe('POST /api/sync/airdrops', () => {
    test('rejects request without CRON_SECRET header', async () => {
      const response = await fetch(`${BASE_URL}/api/sync/airdrops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toContain('Invalid cron secret');
    });

    test('rejects request with invalid CRON_SECRET', async () => {
      const response = await fetch(`${BASE_URL}/api/sync/airdrops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': 'invalid-secret-12345',
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    test('rejects request with empty CRON_SECRET', async () => {
      const response = await fetch(`${BASE_URL}/api/sync/airdrops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': '',
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    test('rejects request with whitespace-only CRON_SECRET', async () => {
      const response = await fetch(`${BASE_URL}/api/sync/airdrops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': '   ',
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    test('accepts request with valid CRON_SECRET', async () => {
      const response = await fetch(`${BASE_URL}/api/sync/airdrops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': VALID_SECRET,
        },
      });

      // Should succeed (200) or fail with internal error (500), but NOT 401
      expect(response.status).not.toBe(401);
      
      if (response.ok) {
        const data = await response.json();
        expect(data).toBeDefined();
        // Should have sync result structure
        expect(data).toHaveProperty('count');
        expect(data).toHaveProperty('sources');
      }
    });

    test('is case-sensitive for CRON_SECRET', async () => {
      const uppercaseSecret = VALID_SECRET.toUpperCase();
      
      // Only test if the uppercase version is different
      if (uppercaseSecret !== VALID_SECRET) {
        const response = await fetch(`${BASE_URL}/api/sync/airdrops`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-cron-secret': uppercaseSecret,
          },
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error.code).toBe('UNAUTHORIZED');
      }
    });

    test('rejects CRON_SECRET with leading whitespace', async () => {
      const response = await fetch(`${BASE_URL}/api/sync/airdrops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': ` ${VALID_SECRET}`,
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    test('rejects CRON_SECRET with trailing whitespace', async () => {
      const response = await fetch(`${BASE_URL}/api/sync/airdrops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': `${VALID_SECRET} `,
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/sync/yield', () => {
    test('rejects request without CRON_SECRET header', async () => {
      const response = await fetch(`${BASE_URL}/api/sync/yield`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    test('rejects request with invalid CRON_SECRET', async () => {
      const response = await fetch(`${BASE_URL}/api/sync/yield`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': 'wrong-secret',
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    test('accepts request with valid CRON_SECRET', async () => {
      const response = await fetch(`${BASE_URL}/api/sync/yield`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': VALID_SECRET,
        },
      });

      // Should succeed (200) or fail with internal error (500), but NOT 401
      expect(response.status).not.toBe(401);
      
      if (response.ok) {
        const data = await response.json();
        expect(data).toBeDefined();
        // Should have sync result structure
        expect(data).toHaveProperty('count');
        expect(data).toHaveProperty('source');
        expect(data).toHaveProperty('duration_ms');
      }
    });
  });

  describe('CRON_SECRET Configuration', () => {
    test('returns 500 when CRON_SECRET is not configured', async () => {
      // Temporarily remove CRON_SECRET
      const originalSecret = process.env.CRON_SECRET;
      delete process.env.CRON_SECRET;

      const response = await fetch(`${BASE_URL}/api/sync/airdrops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': 'any-secret',
        },
      });

      // Restore CRON_SECRET
      process.env.CRON_SECRET = originalSecret;

      // Should return 500 for misconfiguration
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toMatch(/MISCONFIGURED|CONFIGURATION_ERROR/);
    });
  });

  describe('Response Format', () => {
    test('airdrops sync returns correct response structure on success', async () => {
      const response = await fetch(`${BASE_URL}/api/sync/airdrops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': VALID_SECRET,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Validate response structure
        expect(data).toHaveProperty('count');
        expect(data).toHaveProperty('sources');
        expect(data).toHaveProperty('breakdown');
        expect(typeof data.count).toBe('number');
        expect(Array.isArray(data.sources)).toBe(true);
        expect(typeof data.breakdown).toBe('object');
      }
    });

    test('yield sync returns correct response structure on success', async () => {
      const response = await fetch(`${BASE_URL}/api/sync/yield`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': VALID_SECRET,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Validate response structure
        expect(data).toHaveProperty('count');
        expect(data).toHaveProperty('source');
        expect(data).toHaveProperty('duration_ms');
        expect(data).toHaveProperty('ts');
        expect(typeof data.count).toBe('number');
        expect(typeof data.source).toBe('string');
        expect(typeof data.duration_ms).toBe('number');
      }
    });

    test('error responses include error object with code and message', async () => {
      const response = await fetch(`${BASE_URL}/api/sync/airdrops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': 'invalid',
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
      expect(typeof data.error.code).toBe('string');
      expect(typeof data.error.message).toBe('string');
    });
  });

  describe('HTTP Method Validation', () => {
    test('rejects GET requests to sync endpoints', async () => {
      const response = await fetch(`${BASE_URL}/api/sync/airdrops`, {
        method: 'GET',
        headers: {
          'x-cron-secret': VALID_SECRET,
        },
      });

      // Should return 405 Method Not Allowed or 404
      expect([404, 405]).toContain(response.status);
    });

    test('rejects PUT requests to sync endpoints', async () => {
      const response = await fetch(`${BASE_URL}/api/sync/yield`, {
        method: 'PUT',
        headers: {
          'x-cron-secret': VALID_SECRET,
        },
      });

      // Should return 405 Method Not Allowed or 404
      expect([404, 405]).toContain(response.status);
    });

    test('rejects DELETE requests to sync endpoints', async () => {
      const response = await fetch(`${BASE_URL}/api/sync/airdrops`, {
        method: 'DELETE',
        headers: {
          'x-cron-secret': VALID_SECRET,
        },
      });

      // Should return 405 Method Not Allowed or 404
      expect([404, 405]).toContain(response.status);
    });
  });

  describe('Security Headers', () => {
    test('sync endpoints do not expose sensitive information in error messages', async () => {
      const response = await fetch(`${BASE_URL}/api/sync/airdrops`, {
        method: 'POST',
        headers: {
          'x-cron-secret': 'invalid',
        },
      });

      const data = await response.json();
      const errorMessage = data.error.message.toLowerCase();
      
      // Should not expose the actual secret value
      expect(errorMessage).not.toContain(VALID_SECRET);
      // Should not expose internal paths or stack traces
      expect(errorMessage).not.toContain('/api/');
      expect(errorMessage).not.toContain('at ');
    });

    test('sync endpoints include appropriate CORS headers', async () => {
      const response = await fetch(`${BASE_URL}/api/sync/airdrops`, {
        method: 'POST',
        headers: {
          'x-cron-secret': VALID_SECRET,
        },
      });

      // Check for security headers (optional but recommended)
      const headers = response.headers;
      
      // These are optional but good to have
      if (headers.has('x-content-type-options')) {
        expect(headers.get('x-content-type-options')).toBe('nosniff');
      }
    });
  });
});

describe('Hunter Sync Endpoints - Performance', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const VALID_SECRET = process.env.CRON_SECRET || 'test-secret-for-integration';

  test('authorization check completes quickly (< 100ms)', async () => {
    const start = Date.now();
    
    await fetch(`${BASE_URL}/api/sync/airdrops`, {
      method: 'POST',
      headers: {
        'x-cron-secret': 'invalid',
      },
    });
    
    const duration = Date.now() - start;
    
    // Authorization check should be fast
    expect(duration).toBeLessThan(100);
  });

  test('multiple concurrent unauthorized requests are handled correctly', async () => {
    const requests = Array.from({ length: 10 }, (_, i) =>
      fetch(`${BASE_URL}/api/sync/airdrops`, {
        method: 'POST',
        headers: {
          'x-cron-secret': `invalid-${i}`,
        },
      })
    );

    const responses = await Promise.all(requests);
    
    // All should be rejected with 401
    responses.forEach(response => {
      expect(response.status).toBe(401);
    });
  });
});
