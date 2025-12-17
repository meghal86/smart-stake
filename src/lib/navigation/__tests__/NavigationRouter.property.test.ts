/**
 * Property-Based Tests for NavigationRouter
 * 
 * Feature: ux-gap-requirements, Property 1: Navigation Route Consistency
 * Validates: Requirements R1.ROUTING.CANONICAL, R1.ROUTING.DETERMINISTIC, R1.ROUTING.INVALID_PARAMS
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { NavigationRouter, CANONICAL_ROUTES, NAV_ITEM_TO_ROUTE } from '../NavigationRouter';

describe('Feature: ux-gap-requirements, Property 1: Navigation Route Consistency', () => {
  test('navigation always routes to correct canonical paths', () => {
    fc.assert(
      fc.property(
        fc.oneof(...Object.keys(NAV_ITEM_TO_ROUTE).map(fc.constant)),
        (navItemId) => {
          const canonicalRoute = NavigationRouter.getCanonicalRoute(navItemId);
          const expectedRouteId = NAV_ITEM_TO_ROUTE[navItemId] || 'home';
          const expectedConfig = CANONICAL_ROUTES[expectedRouteId as keyof typeof CANONICAL_ROUTES];
          
          // Property: Navigation always produces canonical routes
          expect(canonicalRoute.id).toBe(expectedRouteId);
          expect(canonicalRoute.path).toBe(expectedConfig.path);
          
          // Property: Canonical URL is always valid
          expect(canonicalRoute.canonicalUrl).toMatch(/^\/[a-z]*(\?tab=[a-z]+)?$/);
          
          // Property: Route validation always succeeds for canonical routes
          const validation = NavigationRouter.validateRoute(canonicalRoute.canonicalUrl);
          expect(validation.isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('route canonicalization is deterministic', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('/'),
          fc.constant('/guardian'),
          fc.constant('/hunter'),
          fc.constant('/harvestpro'),
          fc.constant('/portfolio'),
          fc.constant('/settings'),
          fc.string().map(s => `/${s}`), // Random paths
          fc.record({
            path: fc.oneof(fc.constant('/guardian'), fc.constant('/hunter')),
            tab: fc.string()
          }).map(({ path, tab }) => `${path}?tab=${tab}`)
        ),
        (inputPath) => {
          // Property: Canonicalization is deterministic
          const result1 = NavigationRouter.canonicalize(inputPath);
          const result2 = NavigationRouter.canonicalize(inputPath);
          
          expect(result1).toEqual(result2);
          
          // Property: Canonicalized routes are always valid
          const validation = NavigationRouter.validateRoute(result1.canonicalUrl);
          expect(validation.isValid).toBe(true);
          
          // Property: Canonical URL matches expected format
          expect(result1.canonicalUrl).toMatch(/^\/[a-z]*(\?tab=[a-z]+)?$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('invalid route parameters always redirect to valid canonical routes', () => {
    fc.assert(
      fc.property(
        fc.record({
          basePath: fc.oneof(fc.constant('/guardian'), fc.constant('/hunter')),
          invalidTab: fc.string().filter(s => {
            // Generate invalid tabs (not in allowed lists)
            const guardianTabs = ['scan', 'risks', 'alerts', 'history'];
            const hunterTabs = ['all', 'airdrops', 'quests', 'yield'];
            return ![...guardianTabs, ...hunterTabs].includes(s);
          })
        }),
        ({ basePath, invalidTab }) => {
          const invalidUrl = `${basePath}?tab=${invalidTab}`;
          
          // Property: Invalid parameters always result in valid canonical routes
          const canonicalized = NavigationRouter.canonicalize(invalidUrl);
          const validation = NavigationRouter.validateRoute(canonicalized.canonicalUrl);
          
          expect(validation.isValid).toBe(true);
          expect(canonicalized.canonicalUrl).toMatch(/^\/[a-z]+\?tab=[a-z]+$/);
          
          // Property: Invalid tabs fall back to default tabs
          if (basePath === '/guardian') {
            expect(canonicalized.tab).toBe('scan');
          } else if (basePath === '/hunter') {
            expect(canonicalized.tab).toBe('all');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('navigation state transitions are consistent', () => {
    fc.assert(
      fc.property(
        fc.array(fc.oneof(...Object.keys(NAV_ITEM_TO_ROUTE).map(fc.constant)), { minLength: 1, maxLength: 10 }),
        (navigationSequence) => {
          const results = navigationSequence.map(navItem => 
            NavigationRouter.getCanonicalRoute(navItem)
          );
          
          // Property: Each navigation step produces valid canonical route
          results.forEach(result => {
            expect(result.id).toMatch(/^(home|guardian|hunter|harvestpro|portfolio|settings)$/);
            expect(result.path).toMatch(/^\/[a-z]*$/);
            expect(result.canonicalUrl).toMatch(/^\/[a-z]*(\?tab=[a-z]+)?$/);
          });
          
          // Property: Navigation sequence is deterministic
          const secondRun = navigationSequence.map(navItem => 
            NavigationRouter.getCanonicalRoute(navItem)
          );
          
          expect(results).toEqual(secondRun);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('browser navigation state updates are deterministic', () => {
    fc.assert(
      fc.property(
        fc.array(fc.oneof(
          fc.constant('/'),
          fc.constant('/guardian'),
          fc.constant('/hunter'),
          fc.constant('/harvestpro'),
          fc.constant('/portfolio'),
          fc.constant('/settings'),
          fc.record({
            path: fc.oneof(fc.constant('/guardian'), fc.constant('/hunter')),
            tab: fc.oneof(fc.constant('scan'), fc.constant('risks'), fc.constant('all'), fc.constant('quests'))
          }).map(({ path, tab }) => `${path}?tab=${tab}`)
        ), { minLength: 1, maxLength: 5 }),
        (pathSequence) => {
          // Property: Route updates are deterministic
          const results = pathSequence.map(path => {
            NavigationRouter.updateCurrentRoute(path);
            return NavigationRouter.getCurrentCanonicalRoute();
          });
          
          // Property: Each update produces a valid canonical route
          results.forEach(result => {
            if (result) {
              expect(result.id).toMatch(/^(home|guardian|hunter|harvestpro|portfolio|settings)$/);
              expect(result.path).toMatch(/^\/[a-z]*$/);
              expect(result.canonicalUrl).toMatch(/^\/[a-z]*(\?tab=[a-z]+)?$/);
            }
          });
          
          // Property: Same sequence produces same results
          const secondRun = pathSequence.map(path => {
            NavigationRouter.updateCurrentRoute(path);
            return NavigationRouter.getCurrentCanonicalRoute();
          });
          
          expect(results).toEqual(secondRun);
        }
      ),
      { numRuns: 30 }
    );
  });
});