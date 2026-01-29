/**
 * Unit Tests for Hunter Sync Endpoints - CRON_SECRET Validation
 * 
 * Tests the CRON_SECRET authorization logic in sync endpoints.
 * 
 * Requirements: 2.1, 2.2, 2.8
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST as airdropsPost } from '@/app/api/sync/airdrops/route';
import { POST as yieldPost } from '@/app/api/sync/yield/route';
import { NextRequest } from 'next/server';

// Mock the sync functions
vi.mock('@/lib/hunter/sync/airdrops', () => ({
  syncAllAirdrops: vi.fn().mockResolvedValue({
    count: 12,
    sources: ['galxe', 'defillama', 'admin'],
    breakdown: { galxe: 5, defillama: 4, admin: 3 },
  }),
}));

vi.mock('@/lib/hunter/sync/defillama', () => ({
  syncYieldOpportunities: vi.fn().mockResolvedValue({
    count: 25,
    source: 'defillama',
    duration_ms: 1500,
  }),
}));

describe('Hunter Sync Endpoints - CRON_SECRET Validation', () => {
  const VALID_SECRET = 'test-secret-12345678901234567890';
  const originalEnv = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = VALID_SECRET;
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.CRON_SECRET = originalEnv;
    } else {
      delete process.env.CRON_SECRET;
    }
  });

  describe('POST /api/sync/airdrops', () => {
    test('rejects request without CRON_SECRET header', async () => {
      const req = new NextRequest('http://localhost:3000/api/sync/airdrops', {
        method: 'POST',
      });

      const response = await airdropsPost(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toContain('Invalid cron secret');
    });

    test('rejects request with invalid CRON_SECRET', async () => {
      const req = new NextRequest('http://localhost:3000/api/sync/airdrops', {
        method: 'POST',
        headers: {
          'x-cron-secret': 'invalid-secret-12345',
        },
      });

      const response = await airdropsPost(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    test('rejects request with empty CRON_SECRET', async () => {
      const req = new NextRequest('http://localhost:3000/api/sync/airdrops', {
        method: 'POST',
        headers: {
          'x-cron-secret': '',
        },
      });

      const response = await airdropsPost(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    test('rejects request with whitespace-only CRON_SECRET', async () => {
      const req = new NextRequest('http://localhost:3000/api/sync/airdrops', {
        method: 'POST',
        headers: {
          'x-cron-secret': '   ',
        },
      });

      const response = await airdropsPost(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    test('accepts request with valid CRON_SECRET', async () => {
      const req = new NextRequest('http://localhost:3000/api/sync/airdrops', {
        method: 'POST',
        headers: {
          'x-cron-secret': VALID_SECRET,
        },
      });

      const response = await airdropsPost(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('count');
      expect(data).toHaveProperty('sources');
      expect(data).toHaveProperty('breakdown');
    });

    test('is case-sensitive for CRON_SECRET', async () => {
      const uppercaseSecret = VALID_SECRET.toUpperCase();

      // Only test if uppercase is different
      if (uppercaseSecret !== VALID_SECRET) {
        const req = new NextRequest('http://localhost:3000/api/sync/airdrops', {
          method: 'POST',
          headers: {
            'x-cron-secret': uppercaseSecret,
          },
        });

        const response = await airdropsPost(req);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error.code).toBe('UNAUTHORIZED');
      }
    });

    test('HTTP headers automatically trim whitespace (expected behavior)', async () => {
      // Note: HTTP headers automatically trim leading/trailing whitespace
      // This is standard HTTP behavior, not a security issue
      const reqLeading = new NextRequest('http://localhost:3000/api/sync/airdrops', {
        method: 'POST',
        headers: {
          'x-cron-secret': ` ${VALID_SECRET}`,
        },
      });

      const responseLeading = await airdropsPost(reqLeading);
      
      // HTTP spec trims whitespace, so this will actually match
      expect(responseLeading.status).toBe(200);

      const reqTrailing = new NextRequest('http://localhost:3000/api/sync/airdrops', {
        method: 'POST',
        headers: {
          'x-cron-secret': `${VALID_SECRET} `,
        },
      });

      const responseTrailing = await airdropsPost(reqTrailing);
      
      // HTTP spec trims whitespace, so this will actually match
      expect(responseTrailing.status).toBe(200);
    });

    test('returns 500 when CRON_SECRET is not configured', async () => {
      delete process.env.CRON_SECRET;

      const req = new NextRequest('http://localhost:3000/api/sync/airdrops', {
        method: 'POST',
        headers: {
          'x-cron-secret': 'any-secret',
        },
      });

      const response = await airdropsPost(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('MISCONFIGURED');
      expect(data.error.message).toContain('CRON_SECRET not configured');
    });

    test('does not expose secret value in error messages', async () => {
      const req = new NextRequest('http://localhost:3000/api/sync/airdrops', {
        method: 'POST',
        headers: {
          'x-cron-secret': 'invalid',
        },
      });

      const response = await airdropsPost(req);
      const data = await response.json();

      const errorMessage = JSON.stringify(data).toLowerCase();
      expect(errorMessage).not.toContain(VALID_SECRET.toLowerCase());
    });
  });

  describe('POST /api/sync/yield', () => {
    test('rejects request without CRON_SECRET header', async () => {
      const req = new NextRequest('http://localhost:3000/api/sync/yield', {
        method: 'POST',
      });

      const response = await yieldPost(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    test('rejects request with invalid CRON_SECRET', async () => {
      const req = new NextRequest('http://localhost:3000/api/sync/yield', {
        method: 'POST',
        headers: {
          'x-cron-secret': 'wrong-secret',
        },
      });

      const response = await yieldPost(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    test('accepts request with valid CRON_SECRET', async () => {
      const req = new NextRequest('http://localhost:3000/api/sync/yield', {
        method: 'POST',
        headers: {
          'x-cron-secret': VALID_SECRET,
        },
      });

      const response = await yieldPost(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('count');
      expect(data).toHaveProperty('source');
      expect(data).toHaveProperty('duration_ms');
      expect(data).toHaveProperty('ts');
    });

    test('returns 500 when CRON_SECRET is not configured', async () => {
      delete process.env.CRON_SECRET;

      const req = new NextRequest('http://localhost:3000/api/sync/yield', {
        method: 'POST',
        headers: {
          'x-cron-secret': 'any-secret',
        },
      });

      const response = await yieldPost(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('CONFIGURATION_ERROR');
    });
  });

  describe('Response Format Validation', () => {
    test('airdrops sync returns correct response structure', async () => {
      const req = new NextRequest('http://localhost:3000/api/sync/airdrops', {
        method: 'POST',
        headers: {
          'x-cron-secret': VALID_SECRET,
        },
      });

      const response = await airdropsPost(req);
      const data = await response.json();

      expect(data).toHaveProperty('count');
      expect(data).toHaveProperty('sources');
      expect(data).toHaveProperty('breakdown');
      expect(typeof data.count).toBe('number');
      expect(Array.isArray(data.sources)).toBe(true);
      expect(typeof data.breakdown).toBe('object');
    });

    test('yield sync returns correct response structure', async () => {
      const req = new NextRequest('http://localhost:3000/api/sync/yield', {
        method: 'POST',
        headers: {
          'x-cron-secret': VALID_SECRET,
        },
      });

      const response = await yieldPost(req);
      const data = await response.json();

      expect(data).toHaveProperty('count');
      expect(data).toHaveProperty('source');
      expect(data).toHaveProperty('duration_ms');
      expect(data).toHaveProperty('ts');
      expect(typeof data.count).toBe('number');
      expect(typeof data.source).toBe('string');
      expect(typeof data.duration_ms).toBe('number');
      expect(typeof data.ts).toBe('string');
    });

    test('error responses include error object with code and message', async () => {
      const req = new NextRequest('http://localhost:3000/api/sync/airdrops', {
        method: 'POST',
        headers: {
          'x-cron-secret': 'invalid',
        },
      });

      const response = await airdropsPost(req);
      const data = await response.json();

      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
      expect(typeof data.error.code).toBe('string');
      expect(typeof data.error.message).toBe('string');
    });
  });

  describe('Security', () => {
    test('authorization check is deterministic', async () => {
      const req1 = new NextRequest('http://localhost:3000/api/sync/airdrops', {
        method: 'POST',
        headers: {
          'x-cron-secret': VALID_SECRET,
        },
      });

      const req2 = new NextRequest('http://localhost:3000/api/sync/airdrops', {
        method: 'POST',
        headers: {
          'x-cron-secret': VALID_SECRET,
        },
      });

      const response1 = await airdropsPost(req1);
      const response2 = await airdropsPost(req2);

      expect(response1.status).toBe(response2.status);
      expect(response1.status).toBe(200);
    });

    test('logs warning for unauthorized attempts', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const req = new NextRequest('http://localhost:3000/api/sync/airdrops', {
        method: 'POST',
        headers: {
          'x-cron-secret': 'invalid',
        },
      });

      await airdropsPost(req);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unauthorized airdrop sync attempt')
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
