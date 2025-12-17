/**
 * Verification tests for canonical routing implementation
 * 
 * These tests verify that the bottom navigation correctly routes to canonical paths
 * as required by the UX gap requirements.
 */

import { describe, test, expect } from 'vitest';
import { NavigationRouter, CANONICAL_ROUTES } from '../NavigationRouter';

describe('Canonical Routing Verification', () => {
  test('bottom navigation items route to correct canonical paths', () => {
    // Test the exact canonical routes as specified in requirements
    const expectedRoutes = {
      home: '/',
      guardian: '/guardian?tab=scan',
      hunter: '/hunter?tab=all', 
      harvestpro: '/harvestpro',
      portfolio: '/portfolio',
      settings: '/settings'
    };

    Object.entries(expectedRoutes).forEach(([navId, expectedUrl]) => {
      const canonicalRoute = NavigationRouter.getCanonicalRoute(navId);
      expect(canonicalRoute.canonicalUrl).toBe(expectedUrl);
    });
  });

  test('canonical routes table matches requirements specification', () => {
    // Verify the canonical routes table matches the requirements document
    expect(CANONICAL_ROUTES.home.path).toBe('/');
    expect(CANONICAL_ROUTES.guardian.path).toBe('/guardian');
    expect(CANONICAL_ROUTES.guardian.defaultTab).toBe('scan');
    expect(CANONICAL_ROUTES.hunter.path).toBe('/hunter');
    expect(CANONICAL_ROUTES.hunter.defaultTab).toBe('all');
    expect(CANONICAL_ROUTES.harvestpro.path).toBe('/harvestpro');
    expect(CANONICAL_ROUTES.portfolio.path).toBe('/portfolio');
    expect(CANONICAL_ROUTES.settings.path).toBe('/settings');
  });

  test('route validation enforces canonical paths', () => {
    // Test that route validation correctly identifies canonical vs non-canonical routes
    const validRoutes = [
      '/',
      '/guardian?tab=scan',
      '/guardian?tab=risks',
      '/guardian?tab=alerts', 
      '/guardian?tab=history',
      '/hunter?tab=all',
      '/hunter?tab=airdrops',
      '/hunter?tab=quests',
      '/hunter?tab=yield',
      '/harvestpro',
      '/portfolio',
      '/settings'
    ];

    validRoutes.forEach(route => {
      const validation = NavigationRouter.validateRoute(route);
      expect(validation.isValid).toBe(true);
    });

    // Test invalid routes
    const invalidRoutes = [
      '/guardian?tab=invalid',
      '/hunter?tab=invalid',
      '/nonexistent'
    ];

    invalidRoutes.forEach(route => {
      const validation = NavigationRouter.validateRoute(route);
      expect(validation.isValid).toBe(false);
      expect(validation.redirectRequired).toBe(true);
      expect(validation.canonicalPath).toBeDefined();
    });
  });

  test('route canonicalization handles edge cases', () => {
    // Test that canonicalization handles missing tabs correctly
    const guardianWithoutTab = NavigationRouter.canonicalize('/guardian');
    expect(guardianWithoutTab.canonicalUrl).toBe('/guardian?tab=scan');

    const hunterWithoutTab = NavigationRouter.canonicalize('/hunter');
    expect(hunterWithoutTab.canonicalUrl).toBe('/hunter?tab=all');

    // Test that canonicalization handles invalid tabs correctly
    const guardianInvalidTab = NavigationRouter.canonicalize('/guardian?tab=invalid');
    expect(guardianInvalidTab.canonicalUrl).toBe('/guardian?tab=scan');

    const hunterInvalidTab = NavigationRouter.canonicalize('/hunter?tab=invalid');
    expect(hunterInvalidTab.canonicalUrl).toBe('/hunter?tab=all');
  });

  test('navigation router provides deterministic results', () => {
    // Test that multiple calls to the same navigation item return consistent results
    const testItems = ['home', 'guardian', 'hunter', 'harvestpro', 'portfolio', 'settings'];
    
    testItems.forEach(navId => {
      const result1 = NavigationRouter.getCanonicalRoute(navId);
      const result2 = NavigationRouter.getCanonicalRoute(navId);
      
      expect(result1).toEqual(result2);
      expect(result1.canonicalUrl).toBe(result2.canonicalUrl);
    });
  });
});