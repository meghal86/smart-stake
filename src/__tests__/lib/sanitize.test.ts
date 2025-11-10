/**
 * Tests for Content Sanitization Utilities
 * 
 * Requirements tested:
 * - 5.20: External links use safe redirector
 * - 5.21: Content sanitization with allowlist
 * - 11.2: XSS prevention
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  createSafeLink,
  sanitizeWithSafeLinks,
  sanitizeText,
  sanitizeUrl,
} from '../../lib/sanitize';

describe('sanitizeHtml', () => {
  it('should allow safe HTML tags', () => {
    const input = '<p>Hello <strong>world</strong></p>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p>Hello <strong>world</strong></p>');
  });

  it('should remove script tags', () => {
    const input = '<p>Safe content</p><script>alert("xss")</script>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('<p>Safe content</p>');
  });

  it('should remove onclick handlers', () => {
    const input = '<p onclick="alert(\'xss\')">Click me</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onclick');
    expect(result).toContain('Click me');
  });

  it('should remove iframe tags', () => {
    const input = '<p>Content</p><iframe src="evil.com"></iframe>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<iframe');
    expect(result).toContain('<p>Content</p>');
  });

  it('should remove style tags', () => {
    const input = '<p>Content</p><style>body { display: none; }</style>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<style>');
    expect(result).toContain('<p>Content</p>');
  });

  it('should allow safe link attributes', () => {
    const input = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener"');
  });

  it('should remove javascript: protocol links', () => {
    const input = '<a href="javascript:alert(\'xss\')">Click</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('javascript:');
  });

  it('should remove data: protocol links', () => {
    const input = '<a href="data:text/html,<script>alert(\'xss\')</script>">Click</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('data:');
  });

  it('should allow code and pre tags', () => {
    const input = '<pre><code>const x = 1;</code></pre>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<pre>');
    expect(result).toContain('<code>');
    expect(result).toContain('const x = 1;');
  });

  it('should allow lists', () => {
    const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Item 1</li>');
    expect(result).toContain('<li>Item 2</li>');
  });

  it('should allow headings', () => {
    const input = '<h1>Title</h1><h2>Subtitle</h2>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<h1>Title</h1>');
    expect(result).toContain('<h2>Subtitle</h2>');
  });

  it('should remove data attributes', () => {
    const input = '<p data-secret="value">Content</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('data-secret');
    expect(result).toContain('Content');
  });

  it('should handle empty input', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null as any)).toBe('');
    expect(sanitizeHtml(undefined as any)).toBe('');
  });

  it('should handle non-string input', () => {
    expect(sanitizeHtml(123 as any)).toBe('');
    expect(sanitizeHtml({} as any)).toBe('');
    expect(sanitizeHtml([] as any)).toBe('');
  });

  it('should remove SVG with embedded scripts', () => {
    const input = '<svg><script>alert("xss")</script></svg>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<svg>');
    expect(result).not.toContain('<script>');
  });

  it('should remove object and embed tags', () => {
    const input = '<object data="evil.swf"></object><embed src="evil.swf">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<object');
    expect(result).not.toContain('<embed');
  });
});

describe('createSafeLink', () => {
  it('should create safe redirector link for https URL', () => {
    const url = 'https://example.com/opportunity';
    const result = createSafeLink(url);
    expect(result).toBe('/r?u=https%3A%2F%2Fexample.com%2Fopportunity');
  });

  it('should create safe redirector link for http URL', () => {
    const url = 'http://example.com/page';
    const result = createSafeLink(url);
    expect(result).toBe('/r?u=http%3A%2F%2Fexample.com%2Fpage');
  });

  it('should properly encode URL with query parameters', () => {
    const url = 'https://example.com/page?foo=bar&baz=qux';
    const result = createSafeLink(url);
    expect(result).toContain('/r?u=');
    expect(result).toContain('https%3A%2F%2Fexample.com');
    expect(result).toContain('foo%3Dbar');
  });

  it('should properly encode URL with hash', () => {
    const url = 'https://example.com/page#section';
    const result = createSafeLink(url);
    expect(result).toContain('/r?u=');
    expect(result).toContain('%23section');
  });

  it('should reject javascript: protocol', () => {
    const url = 'javascript:alert("xss")';
    const result = createSafeLink(url);
    expect(result).toBe('');
  });

  it('should reject data: protocol', () => {
    const url = 'data:text/html,<script>alert("xss")</script>';
    const result = createSafeLink(url);
    expect(result).toBe('');
  });

  it('should reject file: protocol', () => {
    const url = 'file:///etc/passwd';
    const result = createSafeLink(url);
    expect(result).toBe('');
  });

  it('should reject ftp: protocol', () => {
    const url = 'ftp://example.com/file';
    const result = createSafeLink(url);
    expect(result).toBe('');
  });

  it('should handle empty input', () => {
    expect(createSafeLink('')).toBe('');
    expect(createSafeLink(null as any)).toBe('');
    expect(createSafeLink(undefined as any)).toBe('');
  });

  it('should handle invalid URLs', () => {
    expect(createSafeLink('not a url')).toBe('');
    expect(createSafeLink('://invalid')).toBe('');
    expect(createSafeLink('http://')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(createSafeLink(123 as any)).toBe('');
    expect(createSafeLink({} as any)).toBe('');
    expect(createSafeLink([] as any)).toBe('');
  });

  it('should properly encode special characters', () => {
    const url = 'https://example.com/path?q=hello world&x=<>&y="quotes"';
    const result = createSafeLink(url);
    expect(result).toContain('/r?u=');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('"');
  });
});

describe('sanitizeWithSafeLinks', () => {
  it('should sanitize HTML and convert external links to safe redirector', () => {
    const input = '<p>Check out <a href="https://example.com">this link</a></p>';
    const result = sanitizeWithSafeLinks(input);
    
    expect(result).toContain('<p>');
    expect(result).toContain('this link');
    expect(result).toContain('/r?u=https%3A%2F%2Fexample.com');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('should remove dangerous content and process safe links', () => {
    const input = '<p>Safe <a href="https://example.com">link</a></p><script>alert("xss")</script>';
    const result = sanitizeWithSafeLinks(input);
    
    expect(result).not.toContain('<script>');
    expect(result).toContain('/r?u=https%3A%2F%2Fexample.com');
    expect(result).toContain('target="_blank"');
  });

  it('should leave relative links unchanged', () => {
    const input = '<p><a href="/internal/page">Internal link</a></p>';
    const result = sanitizeWithSafeLinks(input);
    
    expect(result).toContain('href="/internal/page"');
    expect(result).not.toContain('/r?u=');
  });

  it('should remove javascript: links', () => {
    const input = '<p><a href="javascript:alert(\'xss\')">Bad link</a></p>';
    const result = sanitizeWithSafeLinks(input);
    
    expect(result).not.toContain('javascript:');
  });

  it('should handle multiple external links', () => {
    const input = `
      <p>
        <a href="https://example1.com">Link 1</a>
        <a href="https://example2.com">Link 2</a>
      </p>
    `;
    const result = sanitizeWithSafeLinks(input);
    
    expect(result).toContain('/r?u=https%3A%2F%2Fexample1.com');
    expect(result).toContain('/r?u=https%3A%2F%2Fexample2.com');
    
    // Count target="_blank" occurrences
    const targetBlankCount = (result.match(/target="_blank"/g) || []).length;
    expect(targetBlankCount).toBe(2);
  });

  it('should handle mixed internal and external links', () => {
    const input = `
      <p>
        <a href="/internal">Internal</a>
        <a href="https://external.com">External</a>
      </p>
    `;
    const result = sanitizeWithSafeLinks(input);
    
    expect(result).toContain('href="/internal"');
    expect(result).toContain('/r?u=https%3A%2F%2Fexternal.com');
    expect(result).toContain('target="_blank"');
  });

  it('should handle empty input', () => {
    expect(sanitizeWithSafeLinks('')).toBe('');
    expect(sanitizeWithSafeLinks(null as any)).toBe('');
    expect(sanitizeWithSafeLinks(undefined as any)).toBe('');
  });

  it('should handle content without links', () => {
    const input = '<p>Just some <strong>text</strong> content</p>';
    const result = sanitizeWithSafeLinks(input);
    expect(result).toBe('<p>Just some <strong>text</strong> content</p>');
  });
});

describe('sanitizeText', () => {
  it('should escape HTML entities', () => {
    const input = '<script>alert("xss")</script>';
    const result = sanitizeText(input);
    expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
  });

  it('should escape ampersands', () => {
    const input = 'Tom & Jerry';
    const result = sanitizeText(input);
    expect(result).toBe('Tom &amp; Jerry');
  });

  it('should escape quotes', () => {
    const input = 'He said "hello"';
    const result = sanitizeText(input);
    expect(result).toBe('He said &quot;hello&quot;');
  });

  it('should escape single quotes', () => {
    const input = "It's a test";
    const result = sanitizeText(input);
    expect(result).toBe('It&#x27;s a test');
  });

  it('should escape forward slashes', () => {
    const input = '</script>';
    const result = sanitizeText(input);
    expect(result).toBe('&lt;&#x2F;script&gt;');
  });

  it('should handle empty input', () => {
    expect(sanitizeText('')).toBe('');
    expect(sanitizeText(null as any)).toBe('');
    expect(sanitizeText(undefined as any)).toBe('');
  });

  it('should handle non-string input', () => {
    expect(sanitizeText(123 as any)).toBe('');
    expect(sanitizeText({} as any)).toBe('');
  });

  it('should handle plain text without special characters', () => {
    const input = 'Hello World';
    const result = sanitizeText(input);
    expect(result).toBe('Hello World');
  });
});

describe('sanitizeUrl', () => {
  it('should allow https URLs', () => {
    const url = 'https://example.com/page';
    const result = sanitizeUrl(url);
    expect(result).toBe('https://example.com/page');
  });

  it('should allow http URLs', () => {
    const url = 'http://example.com/page';
    const result = sanitizeUrl(url);
    expect(result).toBe('http://example.com/page');
  });

  it('should allow mailto URLs', () => {
    const url = 'mailto:test@example.com';
    const result = sanitizeUrl(url);
    expect(result).toBe('mailto:test@example.com');
  });

  it('should reject javascript: protocol', () => {
    const url = 'javascript:alert("xss")';
    const result = sanitizeUrl(url);
    expect(result).toBe('');
  });

  it('should reject data: protocol', () => {
    const url = 'data:text/html,<script>alert("xss")</script>';
    const result = sanitizeUrl(url);
    expect(result).toBe('');
  });

  it('should reject file: protocol', () => {
    const url = 'file:///etc/passwd';
    const result = sanitizeUrl(url);
    expect(result).toBe('');
  });

  it('should handle invalid URLs', () => {
    expect(sanitizeUrl('not a url')).toBe('');
    expect(sanitizeUrl('://invalid')).toBe('');
  });

  it('should handle empty input', () => {
    expect(sanitizeUrl('')).toBe('');
    expect(sanitizeUrl(null as any)).toBe('');
    expect(sanitizeUrl(undefined as any)).toBe('');
  });

  it('should normalize URLs', () => {
    const url = 'https://example.com:443/page?foo=bar#section';
    const result = sanitizeUrl(url);
    expect(result).toContain('https://example.com');
    expect(result).toContain('/page');
    expect(result).toContain('?foo=bar');
    expect(result).toContain('#section');
  });
});

describe('XSS Prevention - Real-world attack vectors', () => {
  it('should prevent XSS via img onerror', () => {
    const input = '<img src="x" onerror="alert(\'xss\')">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('alert');
  });

  it('should prevent XSS via svg onload', () => {
    const input = '<svg onload="alert(\'xss\')"></svg>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onload');
    expect(result).not.toContain('alert');
  });

  it('should prevent XSS via form action', () => {
    const input = '<form action="javascript:alert(\'xss\')"><input type="submit"></form>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<form');
    expect(result).not.toContain('javascript:');
  });

  it('should prevent XSS via meta refresh', () => {
    const input = '<meta http-equiv="refresh" content="0;url=javascript:alert(\'xss\')">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<meta');
    expect(result).not.toContain('javascript:');
  });

  it('should prevent XSS via base href', () => {
    const input = '<base href="javascript:alert(\'xss\')">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<base');
    expect(result).not.toContain('javascript:');
  });

  it('should prevent XSS via link href', () => {
    const input = '<link rel="stylesheet" href="javascript:alert(\'xss\')">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<link');
    expect(result).not.toContain('javascript:');
  });
});
