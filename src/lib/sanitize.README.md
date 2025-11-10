# Content Sanitization Utilities

This module provides server-side HTML/Markdown sanitization and safe link creation to prevent XSS attacks and ensure secure content rendering.

## Overview

The sanitization utilities use DOMPurify with JSDOM for server-side sanitization, ensuring that all user-generated content is safe before rendering.

## Requirements Addressed

- **Requirement 5.20**: External links use target="_blank" and pass through safe redirector
- **Requirement 5.21**: Markdown/HTML sanitized with strict allowlist
- **Requirement 11.2**: Content sanitization to prevent XSS

## Installation

Dependencies are already installed:
- `dompurify` - HTML sanitization library
- `isomorphic-dompurify` - Isomorphic wrapper for DOMPurify
- `jsdom` - JavaScript implementation of DOM for Node.js
- `@types/dompurify` - TypeScript types

## API Reference

### `sanitizeHtml(html: string): string`

Sanitizes HTML content to prevent XSS attacks using a strict allowlist of tags and attributes.

**Allowed Tags:**
- Text formatting: `p`, `br`, `strong`, `em`
- Links: `a`
- Lists: `ul`, `ol`, `li`
- Code: `code`, `pre`
- Quotes: `blockquote`
- Headings: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`

**Allowed Attributes:**
- `href`, `rel`, `target` (on anchor tags)

**Example:**
```typescript
import { sanitizeHtml } from '@/lib/sanitize';

const userInput = '<script>alert("xss")</script><p>Safe content</p>';
const safe = sanitizeHtml(userInput);
// Returns: '<p>Safe content</p>'
```

### `createSafeLink(url: string): string`

Creates a safe link that passes through the redirector for abuse auditing and security.

**Allowed Protocols:**
- `http:`
- `https:`

**Returns:**
- Safe redirector URL (`/r?u=...`) for valid URLs
- Empty string for invalid or dangerous URLs

**Example:**
```typescript
import { createSafeLink } from '@/lib/sanitize';

const externalUrl = 'https://example.com/opportunity';
const safeUrl = createSafeLink(externalUrl);
// Returns: '/r?u=https%3A%2F%2Fexample.com%2Fopportunity'

const dangerousUrl = 'javascript:alert("xss")';
const blocked = createSafeLink(dangerousUrl);
// Returns: ''
```

### `sanitizeWithSafeLinks(html: string): string`

Combines HTML sanitization with safe link processing. All external links are automatically routed through the redirector and configured with proper security attributes.

**Features:**
- Sanitizes HTML content
- Converts external links to safe redirector URLs
- Adds `target="_blank"` to external links
- Adds `rel="noopener noreferrer"` for security
- Preserves relative/internal links

**Example:**
```typescript
import { sanitizeWithSafeLinks } from '@/lib/sanitize';

const markdown = '<p>Check out <a href="https://example.com">this link</a></p>';
const safe = sanitizeWithSafeLinks(markdown);
// Returns: '<p>Check out <a href="/r?u=https%3A%2F%2Fexample.com" target="_blank" rel="noopener noreferrer">this link</a></p>'
```

### `sanitizeText(text: string): string`

Escapes plain text to prevent any HTML injection. Use this for rendering user input as plain text.

**Example:**
```typescript
import { sanitizeText } from '@/lib/sanitize';

const userInput = '<script>alert("xss")</script>';
const safe = sanitizeText(userInput);
// Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
```

### `sanitizeUrl(url: string): string`

Validates and sanitizes a URL, ensuring only safe protocols are allowed.

**Allowed Protocols:**
- `http:`
- `https:`
- `mailto:`

**Example:**
```typescript
import { sanitizeUrl } from '@/lib/sanitize';

const url = 'javascript:alert("xss")';
const safe = sanitizeUrl(url);
// Returns: ''

const validUrl = 'https://example.com';
const sanitized = sanitizeUrl(validUrl);
// Returns: 'https://example.com'
```

## Usage Guidelines

### When to Use Each Function

1. **`sanitizeHtml()`** - Use when rendering user-generated HTML/Markdown content that should support basic formatting
   - Opportunity descriptions
   - Protocol information
   - User comments

2. **`createSafeLink()`** - Use when creating individual external links
   - CTA buttons
   - External protocol links
   - Opportunity URLs

3. **`sanitizeWithSafeLinks()`** - Use when rendering rich content with embedded links
   - Full opportunity descriptions with links
   - Markdown content from external sources
   - User-submitted content with links

4. **`sanitizeText()`** - Use when rendering plain text that should not contain any HTML
   - User names
   - Protocol names
   - Search queries

5. **`sanitizeUrl()`** - Use when validating URLs before use
   - Form inputs
   - API responses
   - Configuration values

## Security Considerations

### XSS Prevention

The sanitization utilities prevent common XSS attack vectors:

- **Script injection**: `<script>` tags are removed
- **Event handlers**: `onclick`, `onerror`, etc. are removed
- **Dangerous protocols**: `javascript:`, `data:`, `file:` are blocked
- **Embedded content**: `iframe`, `object`, `embed` are removed
- **Style injection**: `<style>` tags are removed
- **Data attributes**: Custom data attributes are removed

### Safe Link Redirector

External links are routed through `/r?u=...` for:
- Abuse auditing
- Security monitoring
- Link validation
- User protection

### Content Security Policy (CSP)

The sanitization utilities work in conjunction with CSP headers to provide defense-in-depth:
- No `unsafe-inline` scripts allowed
- No `unsafe-eval` allowed
- External resources restricted to allowlist

## Testing

Comprehensive test coverage includes:

- ✅ Safe HTML tag allowlist
- ✅ Dangerous content removal (scripts, iframes, etc.)
- ✅ Event handler removal
- ✅ Protocol validation (javascript:, data:, file:)
- ✅ Link attribute handling
- ✅ Safe link creation and encoding
- ✅ Combined sanitization with safe links
- ✅ Edge cases (empty input, invalid URLs, etc.)
- ✅ Real-world XSS attack vectors

Run tests:
```bash
npm test -- src/__tests__/lib/sanitize.test.ts
```

## Performance

- **Server-side only**: Sanitization runs on the server to prevent client-side overhead
- **Cached results**: Consider caching sanitized content for frequently accessed items
- **Efficient parsing**: JSDOM is optimized for server-side HTML parsing

## Integration Example

```typescript
// In an API route or component
import { sanitizeWithSafeLinks } from '@/lib/sanitize';

// Fetch opportunity from database
const opportunity = await getOpportunity(id);

// Sanitize description before sending to client
const safeOpportunity = {
  ...opportunity,
  description: sanitizeWithSafeLinks(opportunity.description),
};

return safeOpportunity;
```

## Related Documentation

- [Hunter Screen Requirements](../../.kiro/specs/hunter-screen-feed/requirements.md)
- [Hunter Screen Design](../../.kiro/specs/hunter-screen-feed/design.md)
- [Security Best Practices](../../docs/security-policies.md)

## Maintenance

When updating the allowlist:

1. Review security implications
2. Update `ALLOWED_TAGS` and `ALLOWED_ATTR` constants
3. Add corresponding tests
4. Document changes in this README
5. Review with security team

## Support

For questions or issues:
- Check test cases for usage examples
- Review requirements documentation
- Consult security team for allowlist changes
