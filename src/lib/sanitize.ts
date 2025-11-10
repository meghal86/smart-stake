/**
 * Content Sanitization Utilities
 * 
 * Provides server-side HTML/Markdown sanitization using DOMPurify with JSDOM
 * and safe link creation for external URLs.
 * 
 * Requirements:
 * - 5.20: External links SHALL use target="_blank" and pass through safe redirector
 * - 5.21: Markdown/HTML SHALL be sanitized with strict allowlist
 * - 11.2: Content SHALL be sanitized to prevent XSS
 */

import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

// Create a DOMPurify instance with JSDOM window for server-side sanitization
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as unknown as Window);

/**
 * Allowed HTML tags for sanitized content
 * Requirement 5.21: Strict allowlist for markdown/HTML rendering
 */
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'a',
  'ul',
  'ol',
  'li',
  'code',
  'pre',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
];

/**
 * Allowed HTML attributes per tag
 * Requirement 5.21: Only safe attributes allowed
 */
const ALLOWED_ATTR = ['href', 'rel', 'target'];

/**
 * Sanitize HTML content to prevent XSS attacks
 * 
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering
 * 
 * @example
 * ```typescript
 * const userInput = '<script>alert("xss")</script><p>Safe content</p>';
 * const safe = sanitizeHtml(userInput);
 * // Returns: '<p>Safe content</p>'
 * ```
 * 
 * Requirements:
 * - 5.21: Apply strict sanitizer with allowlist tags/attrs
 * - 11.2: Sanitize protocol/site names and content
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
  });
}

/**
 * Create a safe link that passes through the redirector
 * 
 * @param url - External URL to make safe
 * @returns Safe redirector URL or empty string if invalid
 * 
 * @example
 * ```typescript
 * const externalUrl = 'https://example.com/opportunity';
 * const safeUrl = createSafeLink(externalUrl);
 * // Returns: '/r?u=https%3A%2F%2Fexample.com%2Fopportunity'
 * ```
 * 
 * Requirements:
 * - 5.19: External links SHALL use safe redirector (/r?u=...)
 * - 5.20: External links SHALL use target="_blank" with rel="noopener noreferrer"
 */
export function createSafeLink(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Validate URL format
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }

    // Encode the URL for safe passage through query parameter
    const encoded = encodeURIComponent(url);
    return `/r?u=${encoded}`;
  } catch (error) {
    // Invalid URL format
    return '';
  }
}

/**
 * Sanitize and process markdown/HTML content with safe links
 * 
 * This function combines sanitization with safe link processing,
 * ensuring all external links go through the redirector.
 * 
 * @param html - Raw HTML/Markdown content
 * @returns Sanitized HTML with safe links
 * 
 * @example
 * ```typescript
 * const markdown = '<p>Check out <a href="https://example.com">this link</a></p>';
 * const safe = sanitizeWithSafeLinks(markdown);
 * // Returns sanitized HTML with links routed through /r?u=...
 * ```
 * 
 * Requirements:
 * - 5.21: Links inside markdown obey safe-link rules
 * - 11.2: Content sanitization
 */
export function sanitizeWithSafeLinks(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // First sanitize the HTML
  const sanitized = sanitizeHtml(html);

  // Parse the sanitized HTML to process links
  const dom = new JSDOM(sanitized);
  const document = dom.window.document;
  const links = document.querySelectorAll('a[href]');

  // Process each link
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (href) {
      try {
        const url = new URL(href);
        // Only process external links (http/https)
        if (['http:', 'https:'].includes(url.protocol)) {
          const safeUrl = createSafeLink(href);
          if (safeUrl) {
            link.setAttribute('href', safeUrl);
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
          }
        }
      } catch {
        // Relative or invalid URL, leave as-is
      }
    }
  });

  return document.body.innerHTML;
}

/**
 * Sanitize plain text to prevent any HTML injection
 * 
 * @param text - Plain text to sanitize
 * @returns Escaped text safe for HTML rendering
 * 
 * @example
 * ```typescript
 * const userInput = '<script>alert("xss")</script>';
 * const safe = sanitizeText(userInput);
 * // Returns: '&lt;script&gt;alert("xss")&lt;/script&gt;'
 * ```
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize a URL
 * 
 * @param url - URL to validate and sanitize
 * @returns Sanitized URL or empty string if invalid
 * 
 * @example
 * ```typescript
 * const url = 'javascript:alert("xss")';
 * const safe = sanitizeUrl(url);
 * // Returns: ''
 * ```
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    const parsed = new URL(url);
    
    // Only allow safe protocols
    const safeProtocols = ['http:', 'https:', 'mailto:'];
    if (!safeProtocols.includes(parsed.protocol)) {
      return '';
    }

    return parsed.toString();
  } catch {
    // Invalid URL
    return '';
  }
}
