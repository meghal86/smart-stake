/**
 * Content Security Policy Configuration
 * 
 * Implements strict CSP to prevent XSS and ensure all external images
 * are routed through the image proxy.
 */

export interface CSPConfig {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'frame-ancestors': string[];
  'base-uri': string[];
  'form-action': string[];
  'object-src': string[];
  'media-src': string[];
}

/**
 * Production CSP configuration
 * Blocks direct external images - all must go through /api/img proxy
 */
export const PRODUCTION_CSP: CSPConfig = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-eval'", // Required for Next.js
    "'unsafe-inline'", // Required for Next.js (use nonces in production)
    'vercel.live',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components/emotion
  ],
  'img-src': [
    "'self'",
    'data:', // Allow data URIs for inline images
    'blob:', // Allow blob URLs for client-side generated images
    // Block direct external images - must use /api/img proxy
  ],
  'font-src': [
    "'self'",
    'data:',
  ],
  'connect-src': [
    "'self'",
    'https://api.alphawhale.com',
    'https://*.supabase.co',
    'https://analytics.alphawhale.com',
    'wss://*.supabase.co', // WebSocket for Realtime
  ],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'object-src': ["'none'"],
  'media-src': ["'self'"],
};

/**
 * Development CSP configuration
 * More permissive for local development
 */
export const DEVELOPMENT_CSP: CSPConfig = {
  ...PRODUCTION_CSP,
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:', // Allow all HTTPS images in development
    'http://localhost:*',
  ],
  'connect-src': [
    "'self'",
    'http://localhost:*',
    'ws://localhost:*',
    'https://*.supabase.co',
    'wss://*.supabase.co',
  ],
};

/**
 * Converts CSP config object to CSP header string
 */
export function buildCSPHeader(config: CSPConfig): string {
  return Object.entries(config)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Gets the appropriate CSP configuration based on environment
 */
export function getCSPConfig(): CSPConfig {
  return process.env.NODE_ENV === 'production' ? PRODUCTION_CSP : DEVELOPMENT_CSP;
}

/**
 * Generates CSP header string for current environment
 */
export function getCSPHeader(): string {
  return buildCSPHeader(getCSPConfig());
}

/**
 * Helper to create image proxy URL
 * Use this to route all external images through the proxy
 */
export function createProxyImageUrl(
  src: string,
  options?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    format?: 'webp' | 'png' | 'jpeg';
  }
): string {
  const params = new URLSearchParams();
  params.set('src', src);
  
  if (options?.width) params.set('w', String(options.width));
  if (options?.height) params.set('h', String(options.height));
  if (options?.fit) params.set('fit', options.fit);
  if (options?.format) params.set('format', options.format);
  
  return `/api/img?${params.toString()}`;
}

/**
 * Checks if a URL needs to be proxied
 */
export function shouldProxyImage(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Don't proxy data URIs or blob URLs
    if (parsed.protocol === 'data:' || parsed.protocol === 'blob:') {
      return false;
    }
    
    // Don't proxy same-origin images
    if (parsed.origin === window.location.origin) {
      return false;
    }
    
    // Proxy all other external images
    return true;
  } catch {
    // Invalid URL, don't proxy
    return false;
  }
}
