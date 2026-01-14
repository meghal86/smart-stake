/**
 * Property-Based Test: Context Configuration Consistency
 * 
 * Feature: unified-header-system, Property 5: Context Configuration Consistency
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 * 
 * This property test verifies that route context configuration is consistent,
 * deterministic, and correctly handles all route patterns including nested routes.
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { getRouteContextKey, HEADER_CONTEXT_MAP } from '@/lib/header';
import type { HeaderContext } from '@/types/header';

describe('Property 5: Context Configuration Consistency', () => {
  // Generator for valid route keys from HEADER_CONTEXT_MAP
  const validRouteKeyGen = fc.constantFrom(...Object.keys(HEADER_CONTEXT_MAP));

  // Generator for route segments (alphanumeric with hyphens)
  const routeSegmentGen = fc.stringMatching(/^[a-z0-9-]+$/);

  // Generator for nested routes based on valid keys
  const nestedRouteGen = fc.tuple(validRouteKeyGen, fc.array(routeSegmentGen, { minLength: 1, maxLength: 3 }))
    .map(([baseRoute, segments]) => {
      if (baseRoute === '/') return '/' + segments.join('/');
      return baseRoute + '/' + segments.join('/');
    });

  test('route context lookup is deterministic', () => {
    fc.assert(
      fc.property(
        fc.oneof(validRouteKeyGen, nestedRouteGen, fc.string()),
        (pathname) => {
          // Property: Same pathname always returns same context
          const result1 = getRouteContextKey(pathname);
          const result2 = getRouteContextKey(pathname);
          
          expect(result1.key).toBe(result2.key);
          expect(result1.context).toEqual(result2.context);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('all configured routes are reachable', () => {
    // Property: Every route in HEADER_CONTEXT_MAP can be matched
    const configuredRoutes = Object.keys(HEADER_CONTEXT_MAP);
    
    configuredRoutes.forEach(route => {
      const result = getRouteContextKey(route);
      
      expect(result.key).toBe(route);
      expect(result.context).toEqual(HEADER_CONTEXT_MAP[route]);
    });
  });

  test('nested routes inherit parent context', () => {
    fc.assert(
      fc.property(
        fc.tuple(validRouteKeyGen, fc.array(routeSegmentGen, { minLength: 1, maxLength: 3 })),
        ([baseRoute, segments]) => {
          if (baseRoute === '/') return true; // Skip home route
          
          const nestedPath = baseRoute + '/' + segments.join('/');
          const result = getRouteContextKey(nestedPath);
          
          // Property: Nested routes should match parent route key
          expect(result.key).toBe(baseRoute);
          expect(result.context).toEqual(HEADER_CONTEXT_MAP[baseRoute]);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('unknown routes fall back to home context', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => {
          // Filter out strings that match configured routes
          return !Object.keys(HEADER_CONTEXT_MAP).some(route => 
            s === route || (route !== '/' && s.startsWith(route + '/'))
          );
        }),
        (pathname) => {
          const result = getRouteContextKey(pathname);
          
          // Property: Unknown routes should fall back to home
          expect(result.key).toBe('/');
          expect(result.context).toEqual(HEADER_CONTEXT_MAP['/']);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('context always has required fields', () => {
    fc.assert(
      fc.property(
        fc.oneof(validRouteKeyGen, nestedRouteGen, fc.string()),
        (pathname) => {
          const result = getRouteContextKey(pathname);
          
          // Property: Context always has title
          expect(result.context.title).toBeDefined();
          expect(typeof result.context.title).toBe('string');
          expect(result.context.title.length).toBeGreaterThan(0);
          
          // Property: Optional fields have correct types when present
          if (result.context.subtitle !== undefined) {
            expect(typeof result.context.subtitle).toBe('string');
          }
          if (result.context.showModeSwitcher !== undefined) {
            expect(typeof result.context.showModeSwitcher).toBe('boolean');
          }
          if (result.context.showBadges !== undefined) {
            expect(typeof result.context.showBadges).toBe('boolean');
          }
          if (result.context.enableWalletSelector !== undefined) {
            expect(typeof result.context.enableWalletSelector).toBe('boolean');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('route key is always a valid route or home', () => {
    fc.assert(
      fc.property(
        fc.oneof(validRouteKeyGen, nestedRouteGen, fc.string()),
        (pathname) => {
          const result = getRouteContextKey(pathname);
          
          // Property: Key is always a configured route
          expect(Object.keys(HEADER_CONTEXT_MAP)).toContain(result.key);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('longest-prefix matching is consistent', () => {
    fc.assert(
      fc.property(
        fc.tuple(validRouteKeyGen, fc.array(routeSegmentGen, { minLength: 1, maxLength: 3 })),
        ([baseRoute, segments]) => {
          if (baseRoute === '/') return true;
          
          // Create nested path
          const nestedPath = baseRoute + '/' + segments.join('/');
          const result = getRouteContextKey(nestedPath);
          
          // Property: Should match the longest prefix (base route)
          expect(result.key).toBe(baseRoute);
          
          // Property: Should not match a shorter prefix if longer exists
          const allRoutes = Object.keys(HEADER_CONTEXT_MAP).filter(r => r !== '/');
          const matchingRoutes = allRoutes.filter(r => nestedPath.startsWith(r + '/'));
          
          if (matchingRoutes.length > 0) {
            const longestMatch = matchingRoutes.sort((a, b) => b.length - a.length)[0];
            expect(result.key).toBe(longestMatch);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('portfolio route enables wallet selector', () => {
    fc.assert(
      fc.property(
        fc.array(routeSegmentGen, { minLength: 0, maxLength: 3 }),
        (segments) => {
          const pathname = segments.length > 0 
            ? '/portfolio/' + segments.join('/')
            : '/portfolio';
          
          const result = getRouteContextKey(pathname);
          
          // Property: Portfolio routes should enable wallet selector
          expect(result.key).toBe('/portfolio');
          expect(result.context.enableWalletSelector).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('non-portfolio routes do not enable wallet selector', () => {
    fc.assert(
      fc.property(
        validRouteKeyGen.filter(route => route !== '/portfolio'),
        (route) => {
          const result = getRouteContextKey(route);
          
          // Property: Non-portfolio routes should not enable wallet selector
          expect(result.context.enableWalletSelector).not.toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('context is immutable (no side effects)', () => {
    fc.assert(
      fc.property(
        fc.oneof(validRouteKeyGen, nestedRouteGen),
        (pathname) => {
          const result1 = getRouteContextKey(pathname);
          const contextBefore = { ...result1.context };
          
          // Call again
          const result2 = getRouteContextKey(pathname);
          
          // Property: First result should not be modified
          expect(result1.context).toEqual(contextBefore);
          expect(result2.context).toEqual(contextBefore);
        }
      ),
      { numRuns: 100 }
    );
  });

  describe('specific route requirements', () => {
    test('home route has correct context', () => {
      const result = getRouteContextKey('/');
      
      expect(result.key).toBe('/');
      expect(result.context.title).toBe('AlphaWhale');
      expect(result.context.subtitle).toBe('Institutional-Grade DeFi Risk Management');
    });

    test('guardian routes have correct context', () => {
      fc.assert(
        fc.property(
          fc.array(routeSegmentGen, { minLength: 0, maxLength: 3 }),
          (segments) => {
            const pathname = segments.length > 0 
              ? '/guardian/' + segments.join('/')
              : '/guardian';
            
            const result = getRouteContextKey(pathname);
            
            expect(result.key).toBe('/guardian');
            expect(result.context.title).toBe('Guardian');
            expect(result.context.subtitle).toBe('Trust & Safety');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('hunter routes have correct context', () => {
      fc.assert(
        fc.property(
          fc.array(routeSegmentGen, { minLength: 0, maxLength: 3 }),
          (segments) => {
            const pathname = segments.length > 0 
              ? '/hunter/' + segments.join('/')
              : '/hunter';
            
            const result = getRouteContextKey(pathname);
            
            expect(result.key).toBe('/hunter');
            expect(result.context.title).toBe('Hunter');
            expect(result.context.subtitle).toBe('High-confidence opportunities');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('harvestpro routes have correct context', () => {
      fc.assert(
        fc.property(
          fc.array(routeSegmentGen, { minLength: 0, maxLength: 3 }),
          (segments) => {
            const pathname = segments.length > 0 
              ? '/harvestpro/' + segments.join('/')
              : '/harvestpro';
            
            const result = getRouteContextKey(pathname);
            
            expect(result.key).toBe('/harvestpro');
            expect(result.context.title).toBe('Harvest');
            expect(result.context.subtitle).toBe('Tax-optimized outcomes');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
