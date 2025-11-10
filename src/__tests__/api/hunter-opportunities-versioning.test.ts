/**
 * Integration tests for API versioning in Hunter opportunities endpoint
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/hunter/opportunities/route';
import { CURRENT_API_VERSION, MIN_CLIENT_VERSION } from '@/lib/api-version';

// Mock dependencies
vi.mock('@/lib/feed/query', () => ({
  getFeedPage: vi.fn().mockResolvedValue({
    items: [],
    nextCursor: null,
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(undefined),
  getIdentifierFromHeaders: vi.fn().mockReturnValue('test-identifier'),
  isAuthenticatedFromHeaders: vi.fn().mockReturnValue(false),
  RateLimitError: class RateLimitError extends Error {
    constructor(public retryAfter: number, public limit: number, public remaining: number, public reset: number) {
      super('Rate limit exceeded');
    }
  },
}));

describe('Hunter Opportunities API - Versioning', () => {
  describe('X-API-Version header', () => {
    it('should include X-API-Version in successful response', async () => {
      const req = new NextRequest('https://api.example.com/api/hunter/opportunities', {
        headers: {
          'X-Client-Version': '1.0.0',
        },
      });

      const response = await GET(req);
      
      expect(response.headers.get('X-API-Version')).toBe(CURRENT_API_VERSION);
    });

    it('should include X-API-Version in error responses', async () => {
      const req = new NextRequest('https://api.example.com/api/hunter/opportunities?trust_min=invalid', {
        headers: {
          'X-Client-Version': '1.0.0',
        },
      });

      const response = await GET(req);
      
      expect(response.headers.get('X-API-Version')).toBeDefined();
    });

    it('should include X-API-Version in 304 Not Modified response', async () => {
      const req = new NextRequest('https://api.example.com/api/hunter/opportunities', {
        headers: {
          'X-Client-Version': '1.0.0',
          'If-None-Match': '"test-etag"',
        },
      });

      const response = await GET(req);
      
      expect(response.headers.get('X-API-Version')).toBeDefined();
    });
  });

  describe('X-Client-Version validation', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should accept valid client version', async () => {
      const req = new NextRequest('https://api.example.com/api/hunter/opportunities', {
        headers: {
          'X-Client-Version': '1.0.0',
        },
      });

      const response = await GET(req);
      
      expect(response.status).not.toBe(412);
    });

    it('should accept newer client version', async () => {
      const req = new NextRequest('https://api.example.com/api/hunter/opportunities', {
        headers: {
          'X-Client-Version': '2.0.0',
        },
      });

      const response = await GET(req);
      
      expect(response.status).not.toBe(412);
    });

    it('should reject old client version with 412', async () => {
      const req = new NextRequest('https://api.example.com/api/hunter/opportunities', {
        headers: {
          'X-Client-Version': '0.5.0',
        },
      });

      const response = await GET(req);
      const body = await response.json();
      
      expect(response.status).toBe(412);
      expect(body.error.code).toBe('VERSION_UNSUPPORTED');
      expect(body.error.message).toContain('no longer supported');
      expect(body.error.details.client_version).toBe('0.5.0');
      expect(body.error.details.min_version).toBe(MIN_CLIENT_VERSION);
      expect(body.error.details.current_version).toBe(CURRENT_API_VERSION);
    });

    it('should reject invalid client version format with 412', async () => {
      const req = new NextRequest('https://api.example.com/api/hunter/opportunities', {
        headers: {
          'X-Client-Version': 'invalid',
        },
      });

      const response = await GET(req);
      const body = await response.json();
      
      expect(response.status).toBe(412);
      expect(body.error.code).toBe('VERSION_UNSUPPORTED');
      expect(body.error.message).toContain('Invalid client version format');
    });

    it('should reject missing client version in production with 412', async () => {
      const req = new NextRequest('https://api.example.com/api/hunter/opportunities');

      const response = await GET(req);
      const body = await response.json();
      
      expect(response.status).toBe(412);
      expect(body.error.code).toBe('VERSION_UNSUPPORTED');
      expect(body.error.message).toContain('Client version required');
    });

    it('should allow missing client version in development', async () => {
      process.env.NODE_ENV = 'development';
      
      const req = new NextRequest('https://api.example.com/api/hunter/opportunities');

      const response = await GET(req);
      
      expect(response.status).not.toBe(412);
    });
  });

  describe('Query parameter override', () => {
    it('should accept client_version from query parameter', async () => {
      const req = new NextRequest('https://api.example.com/api/hunter/opportunities?client_version=1.0.0');

      const response = await GET(req);
      
      expect(response.status).not.toBe(412);
    });

    it('should prefer query parameter over header', async () => {
      const req = new NextRequest('https://api.example.com/api/hunter/opportunities?client_version=1.0.0', {
        headers: {
          'X-Client-Version': '0.5.0', // Old version in header
        },
      });

      const response = await GET(req);
      
      // Should succeed because query param has valid version
      expect(response.status).not.toBe(412);
    });

    it('should support api_version query parameter for canary testing', async () => {
      const req = new NextRequest('https://api.example.com/api/hunter/opportunities?api_version=1.1.0&client_version=1.0.0');

      const response = await GET(req);
      
      expect(response.headers.get('X-API-Version')).toBe('1.1.0');
    });

    it('should use current version when api_version is invalid', async () => {
      const req = new NextRequest('https://api.example.com/api/hunter/opportunities?api_version=invalid&client_version=1.0.0');

      const response = await GET(req);
      
      expect(response.headers.get('X-API-Version')).toBe(CURRENT_API_VERSION);
    });
  });

  describe('Version enforcement in different environments', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should enforce version in production', async () => {
      process.env.NODE_ENV = 'production';
      
      const req = new NextRequest('https://api.example.com/api/hunter/opportunities');

      const response = await GET(req);
      
      expect(response.status).toBe(412);
    });

    it('should not enforce version in development', async () => {
      process.env.NODE_ENV = 'development';
      
      const req = new NextRequest('https://api.example.com/api/hunter/opportunities');

      const response = await GET(req);
      
      expect(response.status).not.toBe(412);
    });

    it('should not enforce version in test', async () => {
      process.env.NODE_ENV = 'test';
      
      const req = new NextRequest('https://api.example.com/api/hunter/opportunities');

      const response = await GET(req);
      
      expect(response.status).not.toBe(412);
    });
  });

  describe('Version headers in all response types', () => {
    it('should include version in rate limit error', async () => {
      const { checkRateLimit } = await import('@/lib/rate-limit');
      const RateLimitError = (await import('@/lib/rate-limit')).RateLimitError;
      
      vi.mocked(checkRateLimit).mockRejectedValueOnce(
        new RateLimitError(60, 60, 0, Date.now() + 60000)
      );

      const req = new NextRequest('https://api.example.com/api/hunter/opportunities', {
        headers: {
          'X-Client-Version': '1.0.0',
        },
      });

      const response = await GET(req);
      
      expect(response.status).toBe(429);
      expect(response.headers.get('X-API-Version')).toBeDefined();
    });

    it('should include version in validation error', async () => {
      const req = new NextRequest('https://api.example.com/api/hunter/opportunities?trust_min=invalid', {
        headers: {
          'X-Client-Version': '1.0.0',
        },
      });

      const response = await GET(req);
      
      expect(response.status).toBe(400);
      expect(response.headers.get('X-API-Version')).toBeDefined();
    });
  });
});
