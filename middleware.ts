/**
 * Next.js Middleware for Security Headers
 * 
 * Implements comprehensive security headers including:
 * - Content Security Policy (CSP) with per-request nonces
 * - HTTP Strict Transport Security (HSTS)
 * - X-Content-Type-Options
 * - X-Frame-Options
 * - Permissions-Policy
 * - Referrer-Policy
 * 
 * Requirements: 11.7, 11.8, 11.11
 */

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

/**
 * Generate a cryptographically secure nonce for CSP
 */
function generateNonce(): string {
  return nanoid(32);
}

/**
 * Build CSP header with nonce support
 */
function buildCSPHeader(nonce: string, isDevelopment: boolean): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      ...(isDevelopment ? ["'unsafe-eval'", "'unsafe-inline'"] : []),
      'vercel.live',
    ],
    'style-src': [
      "'self'",
      `'nonce-${nonce}'`,
      ...(isDevelopment ? ["'unsafe-inline'"] : []),
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      ...(isDevelopment ? ['https:', 'http://localhost:*'] : []),
    ],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      ...(isDevelopment ? ['http://localhost:*', 'ws://localhost:*'] : []),
    ],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
  };

  return Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Get all security headers
 */
function getSecurityHeaders(nonce: string, isDevelopment: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    // Content Security Policy
    'Content-Security-Policy': buildCSPHeader(nonce, isDevelopment),
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Permissions Policy - disable unnecessary browser features
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    
    // Referrer Policy - control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  // Only add HSTS in production (requires HTTPS)
  if (!isDevelopment) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  return headers;
}

/**
 * Middleware matcher configuration
 * Apply to all routes except static files and API routes that don't need CSP
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

/**
 * Next.js Middleware
 */
export default function middleware(request: NextRequest) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Generate a unique nonce for this request
  const nonce = generateNonce();
  
  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  
  // Get the response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  // Apply security headers
  const securityHeaders = getSecurityHeaders(nonce, isDevelopment);
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}
