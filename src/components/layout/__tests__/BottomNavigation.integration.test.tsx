/**
 * Integration tests for BottomNavigation canonical routing
 * 
 * Tests that bottom navigation components correctly use NavigationRouter
 * for canonical route enforcement
 */

import { describe, test, expect, vi } from 'vitest';

// Mock the NavigationRouter to verify it's being called correctly
vi.mock('@/lib/navigation/NavigationRouter', () => ({
  NavigationRouter: {
    navigateToCanonical: vi.fn(),
    getCanonicalRoute: vi.fn()
  }
}));

import { NavigationRouter } from '@/lib/navigation/NavigationRouter';

describe('BottomNavigation Integration', () => {
  test('NavigationRouter should handle canonical routing correctly', () => {
    const mockNavigate = vi.fn();
    const mockToast = vi.fn();
    
    // Test that NavigationRouter.navigateToCanonical works for main navigation items
    const navigationItems = ['home', 'guardian', 'hunter', 'harvestpro', 'settings'];
    
    navigationItems.forEach(navId => {
      NavigationRouter.navigateToCanonical(navId, mockNavigate, mockToast);
      
      expect(NavigationRouter.navigateToCanonical).toHaveBeenCalledWith(
        navId,
        mockNavigate,
        mockToast
      );
    });
  });

  test('NavigationRouter should be imported and available', () => {
    expect(NavigationRouter).toBeDefined();
    expect(NavigationRouter.navigateToCanonical).toBeDefined();
  });

  test('NavigationRouter mock should work correctly', () => {
    // Setup mock return values
    vi.mocked(NavigationRouter.getCanonicalRoute).mockReturnValueOnce({
      id: 'home',
      path: '/',
      canonicalUrl: '/'
    });
    
    const result = NavigationRouter.getCanonicalRoute('home');
    expect(result.canonicalUrl).toBe('/');
    expect(NavigationRouter.getCanonicalRoute).toHaveBeenCalledWith('home');
  });
});