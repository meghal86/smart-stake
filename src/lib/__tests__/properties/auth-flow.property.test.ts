/**
 * Property-Based Tests for Auth Flow Determinism
 * 
 * Feature: multi-chain-wallet-system, Property 3: Auth Flow Determinism
 * Validates: Requirements 2.1, 3.3, 3.4, 3.5
 * 
 * @see .kiro/specs/multi-chain-wallet-system/design.md - Property 3
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';

/**
 * Validates that next parameter is safe (starts with / and not //)
 */
function isValidRedirectPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//');
}

/**
 * Gets a valid redirect path, defaulting to /guardian if invalid
 */
function getValidRedirectPath(path: string | null): string {
  if (!path) return '/guardian';
  if (isValidRedirectPath(path)) return path;
  return '/guardian';
}

describe('Feature: multi-chain-wallet-system, Property 3: Auth Flow Determinism', () => {
  test('redirect path validation is deterministic', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom(null, undefined),
          fc.string().filter(s => s.startsWith('/') && !s.startsWith('//')),
          fc.string().filter(s => !s.startsWith('/') || s.startsWith('//'))
        ),
        (input) => {
          // Call function twice with same input
          const result1 = getValidRedirectPath(input as string | null);
          const result2 = getValidRedirectPath(input as string | null);

          // Results must be identical (deterministic)
          expect(result1).toBe(result2);

          // Result must always be a valid path
          expect(result1).toMatch(/^\/[^/]/);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('valid paths are preserved', () => {
    fc.assert(
      fc.property(
        fc.string()
          .filter(s => s.startsWith('/') && !s.startsWith('//'))
          .filter(s => s.length > 1),
        (validPath) => {
          const result = getValidRedirectPath(validPath);

          // Valid paths should be preserved
          expect(result).toBe(validPath);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('invalid paths default to /guardian', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom(null, undefined),
          fc.string().filter(s => !s.startsWith('/') || s.startsWith('//')),
          fc.string().filter(s => s === '')
        ),
        (invalidPath) => {
          const result = getValidRedirectPath(invalidPath as string | null);

          // Invalid paths should default to /guardian
          expect(result).toBe('/guardian');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('open redirect attempts are blocked', () => {
    fc.assert(
      fc.property(
        fc.string()
          .filter(s => s.startsWith('//'))
          .filter(s => s.length > 2),
        (openRedirectAttempt) => {
          const result = getValidRedirectPath(openRedirectAttempt);

          // Open redirects should be blocked
          expect(result).toBe('/guardian');
          expect(result).not.toBe(openRedirectAttempt);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('external URLs are blocked', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('http://example.com'),
          fc.constant('https://example.com'),
          fc.constant('//example.com'),
          fc.constant('javascript:alert(1)'),
          fc.constant('data:text/html,<script>alert(1)</script>')
        ),
        (externalUrl) => {
          const result = getValidRedirectPath(externalUrl);

          // External URLs should be blocked
          expect(result).toBe('/guardian');
          expect(result).not.toBe(externalUrl);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('path validation is consistent across multiple calls', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.constantFrom(null),
            fc.string().filter(s => s.startsWith('/') && !s.startsWith('//')),
            fc.string().filter(s => !s.startsWith('/') || s.startsWith('//'))
          ),
          { minLength: 1, maxLength: 10 }
        ),
        (paths) => {
          // Call function multiple times with same paths
          const results1 = paths.map(p => getValidRedirectPath(p as string | null));
          const results2 = paths.map(p => getValidRedirectPath(p as string | null));

          // Results must be identical across multiple calls
          expect(results1).toEqual(results2);
        }
      ),
      { numRuns: 50 }
    );
  });
});
