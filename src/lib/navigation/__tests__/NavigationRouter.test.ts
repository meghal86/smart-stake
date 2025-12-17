/**
 * NavigationRouter Tests
 * 
 * Tests canonical route enforcement and navigation mapping
 * Requirements: R1.ROUTING.CANONICAL, R1.ROUTING.DETERMINISTIC, R1.ROUTING.INVALID_PARAMS
 */

import { describe, test, expect, vi } from 'vitest';
import { NavigationRouter, CANONICAL_ROUTES, NAV_ITEM_TO_ROUTE } from '../NavigationRouter';

describe('NavigationRouter', () => {
  describe('getCanonicalRoute', () => {
    test('should return correct canonical route for home', () => {
      const route = NavigationRouter.getCanonicalRoute('home');
      expect(route).toEqual({
        id: 'home',
        path: '/',
        tab: undefined,
        canonicalUrl: '/'
      });
    });

    test('should return correct canonical route for guardian', () => {
      const route = NavigationRouter.getCanonicalRoute('guardian');
      expect(route).toEqual({
        id: 'guardian',
        path: '/guardian',
        tab: 'scan',
        canonicalUrl: '/guardian?tab=scan'
      });
    });

    test('should return correct canonical route for hunter', () => {
      const route = NavigationRouter.getCanonicalRoute('hunter');
      expect(route).toEqual({
        id: 'hunter',
        path: '/hunter',
        tab: 'all',
        canonicalUrl: '/hunter?tab=all'
      });
    });

    test('should default to home for unknown nav items', () => {
      const route = NavigationRouter.getCanonicalRoute('unknown');
      expect(route).toEqual({
        id: 'home',
        path: '/',
        tab: undefined,
        canonicalUrl: '/'
      });
    });
  });

  describe('validateRoute', () => {
    test('should validate canonical home route', () => {
      const result = NavigationRouter.validateRoute('/');
      expect(result).toEqual({
        isValid: true,
        canonicalPath: '/'
      });
    });

    test('should validate canonical guardian route with valid tab', () => {
      const result = NavigationRouter.validateRoute('/guardian?tab=risks');
      expect(result).toEqual({
        isValid: true,
        canonicalPath: '/guardian?tab=risks'
      });
    });

    test('should invalidate guardian route with invalid tab', () => {
      const result = NavigationRouter.validateRoute('/guardian?tab=invalid');
      expect(result.isValid).toBe(false);
      expect(result.canonicalPath).toBe('/guardian?tab=scan');
      expect(result.redirectRequired).toBe(true);
      expect(result.errorMessage).toContain('Invalid tab "invalid"');
    });

    test('should invalidate completely unknown route', () => {
      const result = NavigationRouter.validateRoute('/unknown');
      expect(result.isValid).toBe(false);
      expect(result.canonicalPath).toBe('/');
      expect(result.redirectRequired).toBe(true);
      expect(result.errorMessage).toContain('Invalid route: /unknown');
    });
  });

  describe('canonicalize', () => {
    test('should canonicalize guardian route without tab to default tab', () => {
      const route = NavigationRouter.canonicalize('/guardian');
      expect(route).toEqual({
        id: 'guardian',
        path: '/guardian',
        tab: 'scan',
        canonicalUrl: '/guardian?tab=scan'
      });
    });

    test('should preserve valid tab in guardian route', () => {
      const route = NavigationRouter.canonicalize('/guardian?tab=alerts');
      expect(route).toEqual({
        id: 'guardian',
        path: '/guardian',
        tab: 'alerts',
        canonicalUrl: '/guardian?tab=alerts'
      });
    });

    test('should fallback to default tab for invalid tab', () => {
      const route = NavigationRouter.canonicalize('/guardian?tab=invalid');
      expect(route).toEqual({
        id: 'guardian',
        path: '/guardian',
        tab: 'scan',
        canonicalUrl: '/guardian?tab=scan'
      });
    });

    test('should default to home for unknown route', () => {
      const route = NavigationRouter.canonicalize('/unknown');
      expect(route).toEqual({
        id: 'home',
        path: '/',
        canonicalUrl: '/'
      });
    });
  });

  describe('navigateToCanonical', () => {
    test('should navigate to canonical route', () => {
      const mockNavigate = vi.fn();
      const mockToast = vi.fn();

      NavigationRouter.navigateToCanonical('guardian', mockNavigate, mockToast);

      expect(mockNavigate).toHaveBeenCalledWith('/guardian?tab=scan');
      expect(mockToast).not.toHaveBeenCalled(); // No redirect message for direct mapping
    });

    test('should show toast for redirected items', () => {
      const mockNavigate = vi.fn();
      const mockToast = vi.fn();

      // 'signals' maps to 'home' so should show redirect toast
      NavigationRouter.navigateToCanonical('signals', mockNavigate, mockToast);

      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(mockToast).toHaveBeenCalledWith('Redirected to Home');
    });
  });

  describe('canonical routes configuration', () => {
    test('should have all required canonical routes', () => {
      const requiredRoutes = ['home', 'guardian', 'hunter', 'harvestpro', 'portfolio', 'settings'];
      
      requiredRoutes.forEach(routeId => {
        expect(CANONICAL_ROUTES).toHaveProperty(routeId);
        expect(CANONICAL_ROUTES[routeId as keyof typeof CANONICAL_ROUTES]).toHaveProperty('path');
      });
    });

    test('should have correct paths for canonical routes', () => {
      expect(CANONICAL_ROUTES.home.path).toBe('/');
      expect(CANONICAL_ROUTES.guardian.path).toBe('/guardian');
      expect(CANONICAL_ROUTES.hunter.path).toBe('/hunter');
      expect(CANONICAL_ROUTES.harvestpro.path).toBe('/harvestpro');
      expect(CANONICAL_ROUTES.portfolio.path).toBe('/portfolio');
      expect(CANONICAL_ROUTES.settings.path).toBe('/settings');
    });

    test('should have navigation item mappings', () => {
      expect(NAV_ITEM_TO_ROUTE.home).toBe('home');
      expect(NAV_ITEM_TO_ROUTE.guardian).toBe('guardian');
      expect(NAV_ITEM_TO_ROUTE.hunter).toBe('hunter');
      expect(NAV_ITEM_TO_ROUTE.harvestpro).toBe('harvestpro');
      expect(NAV_ITEM_TO_ROUTE.portfolio).toBe('portfolio');
      expect(NAV_ITEM_TO_ROUTE.settings).toBe('settings');
    });
  });
});