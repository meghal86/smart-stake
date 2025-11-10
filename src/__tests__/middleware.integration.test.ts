/**
 * Integration Tests for Security Middleware
 * 
 * Tests the middleware with actual HTTP-like scenarios
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import middleware from '../../middleware';

describe('Security Middleware Integration', () => {
  describe('Real-world Scenarios', () => {
    it('should apply all security headers to API routes', () => {
      const request = new NextRequest('http://localhost:3000/api/hunter/opportunities');
      const response = middleware(request);

      // Verify all critical security headers are present
      expect(response.headers.has('Content-Security-Policy')).toBe(true);
      expect(response.headers.has('X-Content-Type-Options')).toBe(true);
      expect(response.headers.has('X-Frame-Options')).toBe(true);
      expect(response.headers.has('Permissions-Policy')).toBe(true);
      expect(response.headers.has('Referrer-Policy')).toBe(true);
    });

    it('should apply all security headers to page routes', () => {
      const request = new NextRequest('http://localhost:3000/hunter');
      const response = middleware(request);

      // Verify all critical security headers are present
      expect(response.headers.has('Content-Security-Policy')).toBe(true);
      expect(response.headers.has('X-Content-Type-Options')).toBe(true);
      expect(response.headers.has('X-Frame-Options')).toBe(true);
      expect(response.headers.has('Permissions-Policy')).toBe(true);
      expect(response.headers.has('Referrer-Policy')).toBe(true);
    });

    it('should handle root path', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should handle nested paths', () => {
      const request = new NextRequest('http://localhost:3000/app/guardian/scan/123');
      const response = middleware(request);

      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should handle query parameters', () => {
      const request = new NextRequest('http://localhost:3000/hunter?type=airdrop&chain=ethereum');
      const response = middleware(request);

      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should handle hash fragments', () => {
      const request = new NextRequest('http://localhost:3000/hunter#filters');
      const response = middleware(request);

      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });
  });

  describe('CSP Nonce Uniqueness', () => {
    it('should generate different nonces for concurrent requests', () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        new NextRequest(`http://localhost:3000/page${i}`)
      );

      const responses = requests.map(req => middleware(req));
      const csps = responses.map(res => res.headers.get('Content-Security-Policy'));
      
      // Extract nonces from CSP headers
      const nonces = csps.map(csp => {
        const match = csp?.match(/'nonce-([^']+)'/);
        return match ? match[1] : null;
      });

      // All nonces should be present
      expect(nonces.every(n => n !== null)).toBe(true);
      
      // All nonces should be unique (in practice, with nanoid this is virtually guaranteed)
      const uniqueNonces = new Set(nonces);
      expect(uniqueNonces.size).toBe(nonces.length);
    });
  });

  describe('Header Combinations', () => {
    it('should have compatible CSP and X-Frame-Options', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      const xFrameOptions = response.headers.get('X-Frame-Options');

      // Both should prevent framing
      expect(csp).toContain("frame-ancestors 'none'");
      expect(xFrameOptions).toBe('DENY');
    });

    it('should have compatible CSP and Referrer-Policy', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      const referrerPolicy = response.headers.get('Referrer-Policy');

      // Both should be present and configured
      expect(csp).toBeTruthy();
      expect(referrerPolicy).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('Environment-specific Behavior', () => {
    it('should be more restrictive in production', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Development
      process.env.NODE_ENV = 'development';
      const devRequest = new NextRequest('http://localhost:3000/');
      const devResponse = middleware(devRequest);
      const devCSP = devResponse.headers.get('Content-Security-Policy');

      // Production
      process.env.NODE_ENV = 'production';
      const prodRequest = new NextRequest('https://alphawhale.com/');
      const prodResponse = middleware(prodRequest);
      const prodCSP = prodResponse.headers.get('Content-Security-Policy');

      // Development should have unsafe-eval
      expect(devCSP).toContain("'unsafe-eval'");
      
      // Production should not have unsafe-eval
      expect(prodCSP).not.toContain("'unsafe-eval'");

      // Production should have HSTS
      expect(prodResponse.headers.has('Strict-Transport-Security')).toBe(true);
      
      // Development should not have HSTS
      expect(devResponse.headers.has('Strict-Transport-Security')).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Security Header Values', () => {
    it('should have correct HSTS configuration in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const request = new NextRequest('https://alphawhale.com/');
      const response = middleware(request);

      const hsts = response.headers.get('Strict-Transport-Security');
      expect(hsts).toContain('max-age=31536000'); // 1 year
      expect(hsts).toContain('includeSubDomains');
      expect(hsts).toContain('preload');

      process.env.NODE_ENV = originalEnv;
    });

    it('should disable dangerous browser features', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      const permissionsPolicy = response.headers.get('Permissions-Policy');
      expect(permissionsPolicy).toContain('camera=()');
      expect(permissionsPolicy).toContain('microphone=()');
      expect(permissionsPolicy).toContain('geolocation=()');
    });

    it('should prevent MIME sniffing', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should prevent clickjacking', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });
  });

  describe('CSP Directive Coverage', () => {
    it('should have all required CSP directives', () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = middleware(request);

      const csp = response.headers.get('Content-Security-Policy') || '';

      const requiredDirectives = [
        'default-src',
        'script-src',
        'style-src',
        'img-src',
        'font-src',
        'connect-src',
        'frame-ancestors',
        'base-uri',
        'form-action',
        'object-src',
        'media-src',
      ];

      requiredDirectives.forEach(directive => {
        expect(csp).toContain(directive);
      });
    });

    it('should restrict dangerous directives', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const request = new NextRequest('https://alphawhale.com/');
      const response = middleware(request);

      const csp = response.headers.get('Content-Security-Policy') || '';

      // Should not allow object embeds
      expect(csp).toContain("object-src 'none'");
      
      // Should restrict frame ancestors
      expect(csp).toContain("frame-ancestors 'none'");
      
      // Should restrict base URI
      expect(csp).toContain("base-uri 'self'");
      
      // Should restrict form actions
      expect(csp).toContain("form-action 'self'");

      process.env.NODE_ENV = originalEnv;
    });
  });
});
