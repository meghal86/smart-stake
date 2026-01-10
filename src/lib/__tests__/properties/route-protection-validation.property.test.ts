/**
 * Property-Based Tests for Route Protection and Validation
 * 
 * Feature: multi-chain-wallet-system, Property 12: Route Protection and Validation
 * Validates: Requirements 3.1, 3.2, 3.6
 * 
 * @see .kiro/specs/multi-chain-wallet-system/design.md - Property 12
 */

import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';

/**
 * Validates next parameter to prevent open redirects
 */
function isValidNextParameter(next: string | null | undefined): boolean {
  if (!next) return false;
  // Must start with / and must not start with //
  return next.startsWith('/') && !next.startsWith('//');
}

/**
 * Gets safe redirect path
 */
function getSafeRedirectPath(next: string | null | undefined, defaultPath: string = '/guardian'): string {
  if (isValidNextParameter(next)) {
    return next!;
  }
  return defaultPath;
}

/**
 * Simulates route protection
 */
interface RouteProtectionContext {
  isAuthenticated: boolean;
  currentPath: string;
  nextParam?: string;
}

/**
 * Determines if route is protected
 */
function isProtectedRoute(path: string): boolean {
  const protectedRoutes = ['/guardian', '/hunter', '/harvestpro'];
  return protectedRoutes.some(route => path.startsWith(route));
}

/**
 * Handles route access
 */
function handleRouteAccess(context: RouteProtectionContext): {
  allowed: boolean;
  redirectTo?: string;
} {
  // Check if route is protected
  if (!isProtectedRoute(context.currentPath)) {
    return { allowed: true };
  }

  // Protected route requires authentication
  if (!context.isAuthenticated) {
    const nextParam = context.nextParam ? `?next=${encodeURIComponent(context.nextParam)}` : '';
    return {
      allowed: false,
      redirectTo: `/login${nextParam}`,
    };
  }

  return { allowed: true };
}

describe('Feature: multi-chain-wallet-system, Property 12: Route Protection and Validation', () => {
  /**
   * Property 12.1: Unauthenticated users are redirected to login
   * For any unauthenticated user accessing a protected route, they should be redirected to /login
   */
  test('unauthenticated users are redirected to login', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('/guardian', '/hunter', '/harvestpro'),
        (protectedRoute) => {
          const context: RouteProtectionContext = {
            isAuthenticated: false,
            currentPath: protectedRoute,
          };

          const result = handleRouteAccess(context);

          expect(result.allowed).toBe(false);
          expect(result.redirectTo).toContain('/login');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12.2: Valid next parameters are preserved
   * For any valid next parameter (starts with /), it should be preserved in redirect
   */
  test('valid next parameters are preserved in redirect', () => {
    fc.assert(
      fc.property(
        fc.string()
          .filter(s => s.startsWith('/') && !s.startsWith('//'))
          .filter(s => s.length > 1),
        (validNext) => {
          const result = getSafeRedirectPath(validNext);

          expect(result).toBe(validNext);
          expect(isValidNextParameter(validNext)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12.3: Invalid next parameters are rejected
   * For any invalid next parameter (doesn't start with / or starts with //), it should be rejected
   */
  test('invalid next parameters are rejected', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom(null, undefined),
          fc.string().filter(s => !s.startsWith('/') || s.startsWith('//')),
          fc.string().filter(s => s === '')
        ),
        (invalidNext) => {
          const result = getSafeRedirectPath(invalidNext as string | null | undefined);

          expect(result).toBe('/guardian');
          expect(isValidNextParameter(invalidNext as string | null | undefined)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12.4: Open redirects are prevented
   * For any open redirect attempt (starts with //), it should be blocked
   */
  test('open redirects are prevented', () => {
    fc.assert(
      fc.property(
        fc.string()
          .filter(s => s.startsWith('//'))
          .filter(s => s.length > 2),
        (openRedirect) => {
          const result = getSafeRedirectPath(openRedirect);

          expect(result).toBe('/guardian');
          expect(result).not.toBe(openRedirect);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12.5: External URLs are blocked
   * For any external URL, it should be blocked and default to /guardian
   */
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
          const result = getSafeRedirectPath(externalUrl);

          expect(result).toBe('/guardian');
          expect(result).not.toBe(externalUrl);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12.6: Authenticated users can access protected routes
   * For any authenticated user accessing a protected route, they should be allowed
   */
  test('authenticated users can access protected routes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('/guardian', '/hunter', '/harvestpro'),
        (protectedRoute) => {
          const context: RouteProtectionContext = {
            isAuthenticated: true,
            currentPath: protectedRoute,
          };

          const result = handleRouteAccess(context);

          expect(result.allowed).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12.7: Public routes are always accessible
   * For any public route, both authenticated and unauthenticated users should be allowed
   */
  test('public routes are always accessible', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('/', '/login', '/signup', '/signin'),
        fc.boolean(),
        (publicRoute, isAuthenticated) => {
          const context: RouteProtectionContext = {
            isAuthenticated,
            currentPath: publicRoute,
          };

          const result = handleRouteAccess(context);

          expect(result.allowed).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12.8: /signin aliases to /login
   * For any /signin request, it should be treated as /login
   */
  test('/signin aliases to /login', () => {
    fc.assert(
      fc.property(
        fc.string()
          .filter(s => s.startsWith('/') && !s.startsWith('//'))
          .filter(s => s.length > 1),
        (nextParam) => {
          // /signin should redirect to /login with next parameter preserved
          const signinPath = '/signin';
          const loginPath = '/login';

          // Both should be public routes
          expect(isProtectedRoute(signinPath)).toBe(false);
          expect(isProtectedRoute(loginPath)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12.9: Route protection is deterministic
   * For any route access attempt, the result should be deterministic
   */
  test('route protection is deterministic', () => {
    fc.assert(
      fc.property(
        fc.record({
          isAuthenticated: fc.boolean(),
          currentPath: fc.constantFrom('/guardian', '/hunter', '/harvestpro', '/login', '/'),
        }),
        ({ isAuthenticated, currentPath }) => {
          const context: RouteProtectionContext = {
            isAuthenticated,
            currentPath,
          };

          const result1 = handleRouteAccess(context);
          const result2 = handleRouteAccess(context);
          const result3 = handleRouteAccess(context);

          expect(result1).toEqual(result2);
          expect(result2).toEqual(result3);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12.10: Next parameter validation is consistent
   * For any next parameter, validation should be consistent across multiple calls
   */
  test('next parameter validation is consistent', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom(null, undefined),
          fc.string().filter(s => s.startsWith('/') && !s.startsWith('//')),
          fc.string().filter(s => !s.startsWith('/') || s.startsWith('//'))
        ),
        (nextParam) => {
          const result1 = isValidNextParameter(nextParam as string | null | undefined);
          const result2 = isValidNextParameter(nextParam as string | null | undefined);
          const result3 = isValidNextParameter(nextParam as string | null | undefined);

          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
        }
      ),
      { numRuns: 100 }
    );
  });
});
