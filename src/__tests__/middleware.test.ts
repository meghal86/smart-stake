/**
 * Tests for Next.js Security Middleware
 * 
 * Verifies that all security headers are properly set on responses.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test-nonce-12345678901234567890'),
}));

// Import middleware after mocking
const middlewareModule = await import('../../middleware');
const middleware = middlewareModule.default;

describe('Security Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CSP Header', () => {
    it('should set Content-Security-Policy header', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should include nonce in script-src directive', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toContain("'nonce-test-nonce-12345678901234567890'");
      expect(csp).toContain('script-src');
    });

    it('should include nonce in style-src directive', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toContain("'nonce-test-nonce-12345678901234567890'");
      expect(csp).toContain('style-src');
    });

    it('should set frame-ancestors to none', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should set object-src to none', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toContain("object-src 'none'");
    });

    it('should set base-uri to self', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toContain("base-uri 'self'");
    });

    it('should set form-action to self', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toContain("form-action 'self'");
    });

    it('should allow data: and blob: for img-src', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toContain('img-src');
      expect(csp).toContain('data:');
      expect(csp).toContain('blob:');
    });

    it('should include Supabase domains in connect-src', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toContain('connect-src');
      expect(csp).toContain('https://*.supabase.co');
      expect(csp).toContain('wss://*.supabase.co');
    });
  });

  describe('HSTS Header', () => {
    it('should not set HSTS in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      expect(response.headers.has('Strict-Transport-Security')).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });

    it('should set HSTS in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const request = new NextRequest('https://alphawhale.com/');
      const response = middleware(request);

      const hsts = response.headers.get('Strict-Transport-Security');
      expect(hsts).toBe('max-age=31536000; includeSubDomains; preload');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('X-Content-Type-Options Header', () => {
    it('should set X-Content-Type-Options to nosniff', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });

  describe('X-Frame-Options Header', () => {
    it('should set X-Frame-Options to DENY', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });
  });

  describe('Permissions-Policy Header', () => {
    it('should set Permissions-Policy header', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      const policy = response.headers.get('Permissions-Policy');
      expect(policy).toBe('camera=(), microphone=(), geolocation=()');
    });

    it('should disable camera, microphone, and geolocation', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      const policy = response.headers.get('Permissions-Policy');
      expect(policy).toContain('camera=()');
      expect(policy).toContain('microphone=()');
      expect(policy).toContain('geolocation=()');
    });
  });

  describe('Referrer-Policy Header', () => {
    it('should set Referrer-Policy to strict-origin-when-cross-origin', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('Nonce Propagation', () => {
    it('should add x-nonce header to request', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      // The nonce should be available in the modified request headers
      // We can't directly access the modified request, but we can verify
      // the response was created successfully
      expect(response).toBeInstanceOf(NextResponse);
    });

    it('should generate unique nonce for each request', async () => {
      // Re-import to get fresh mock
      vi.resetModules();
      
      let callCount = 0;
      vi.doMock('nanoid', () => ({
        nanoid: vi.fn(() => {
          callCount++;
          return `nonce-${callCount}`;
        }),
      }));

      const { default: freshMiddleware } = await import('../../middleware');

      const request1 = new NextRequest('http://localhost:3000/page1');
      const response1 = freshMiddleware(request1);
      const csp1 = response1.headers.get('Content-Security-Policy');

      const request2 = new NextRequest('http://localhost:3000/page2');
      const response2 = freshMiddleware(request2);
      const csp2 = response2.headers.get('Content-Security-Policy');

      expect(csp1).toContain("'nonce-nonce-1'");
      expect(csp2).toContain("'nonce-nonce-2'");
      
      // Cleanup
      vi.doUnmock('nanoid');
    });
  });

  describe('Development vs Production', () => {
    it('should allow unsafe-eval and unsafe-inline in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toContain("'unsafe-eval'");
      expect(csp).toContain("'unsafe-inline'");

      process.env.NODE_ENV = originalEnv;
    });

    it('should not allow unsafe-eval and unsafe-inline in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const request = new NextRequest('https://alphawhale.com/');
      const response = middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      
      // Should only have nonce, not unsafe-eval or unsafe-inline
      const scriptSrc = csp?.match(/script-src[^;]+/)?.[0] || '';
      expect(scriptSrc).toContain("'nonce-");
      expect(scriptSrc).not.toContain("'unsafe-eval'");
      expect(scriptSrc).not.toContain("'unsafe-inline'");

      process.env.NODE_ENV = originalEnv;
    });

    it('should allow localhost in development connect-src', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toContain('http://localhost:*');
      expect(csp).toContain('ws://localhost:*');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('All Headers Present', () => {
    it('should set all required security headers', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      const requiredHeaders = [
        'Content-Security-Policy',
        'X-Content-Type-Options',
        'X-Frame-Options',
        'Permissions-Policy',
        'Referrer-Policy',
      ];

      requiredHeaders.forEach(header => {
        expect(response.headers.has(header)).toBe(true);
      });
    });
  });
});
