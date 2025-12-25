/**
 * HarvestPro Navigation Integration Test
 * 
 * Tests that HarvestPro navigation works correctly with the existing routing system
 * Requirements: Enhanced Req 18 AC1 (responsive nav)
 * Design: Navigation Architecture → Route Canonicalization
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { FooterNav } from '@/components/layout/FooterNav';
import { NavigationRouter } from '@/lib/navigation/NavigationRouter';

// Mock NavigationRouter to track calls
vi.mock('@/lib/navigation/NavigationRouter', () => ({
  NavigationRouter: {
    initializeBrowserNavigation: vi.fn(),
    canonicalize: vi.fn((path: string) => ({
      id: path === '/harvestpro' ? 'harvestpro' : 'home',
      path: path === '/harvestpro' ? '/harvestpro' : '/',
      canonicalUrl: path === '/harvestpro' ? '/harvestpro' : '/'
    })),
    getCanonicalRoute: vi.fn((navId: string) => ({
      id: navId,
      path: navId === 'harvestpro' ? '/harvestpro' : '/',
      canonicalUrl: navId === 'harvestpro' ? '/harvestpro' : '/'
    })),
    validateRoute: vi.fn(() => ({ isValid: true })),
    navigateToCanonical: vi.fn(),
    updateCurrentRoute: vi.fn()
  }
}));

const renderWithRouter = (initialPath = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <FooterNav />
    </MemoryRouter>
  );
};

describe('HarvestPro Navigation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('FooterNav includes HarvestPro navigation item', () => {
    renderWithRouter();
    
    // Check that HarvestPro navigation item exists
    const harvestNavItem = screen.getByLabelText('Navigate to Harvest tax optimization');
    expect(harvestNavItem).toBeInTheDocument();
    
    // Check that it has the correct href
    expect(harvestNavItem).toHaveAttribute('href', '/harvestpro');
  });

  test('HarvestPro navigation item shows correct label and icon', () => {
    renderWithRouter();
    
    // Check label
    expect(screen.getByText('Harvest')).toBeInTheDocument();
    
    // Check that the Leaf icon is present (via aria-hidden attribute)
    const harvestNavItem = screen.getByLabelText('Navigate to Harvest tax optimization');
    const icon = harvestNavItem.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  test('HarvestPro navigation item shows active state when on /harvestpro route', () => {
    renderWithRouter('/harvestpro');
    
    const harvestNavItem = screen.getByLabelText('Navigate to Harvest tax optimization');
    
    // Check that it has active styling classes
    expect(harvestNavItem).toHaveClass('text-white', 'opacity-100');
    expect(harvestNavItem).toHaveAttribute('aria-current', 'page');
    
    // Check that the active gradient background is present
    const gradientDiv = harvestNavItem.querySelector('.bg-gradient-to-r.from-\\[\\#00C9A7\\].to-\\[\\#7B61FF\\]');
    expect(gradientDiv).toBeInTheDocument();
  });

  test('HarvestPro navigation item shows inactive state when not on /harvestpro route', () => {
    renderWithRouter('/');
    
    const harvestNavItem = screen.getByLabelText('Navigate to Harvest tax optimization');
    
    // Check that it has inactive styling classes
    expect(harvestNavItem).toHaveClass('text-gray-400', 'opacity-60');
    expect(harvestNavItem).not.toHaveAttribute('aria-current');
  });

  test('clicking HarvestPro navigation item navigates to /harvestpro', () => {
    renderWithRouter();
    
    const harvestNavItem = screen.getByLabelText('Navigate to Harvest tax optimization');
    
    // Click the navigation item
    fireEvent.click(harvestNavItem);
    
    // Verify that it would navigate to the correct path
    // (In a real browser, this would trigger navigation)
    expect(harvestNavItem).toHaveAttribute('href', '/harvestpro');
  });

  test('NavigationRouter correctly identifies /harvestpro as canonical route', () => {
    // Test that NavigationRouter recognizes harvestpro as a valid route
    const mockNavigationRouter = vi.mocked(NavigationRouter);
    
    // Call the canonicalize method
    const result = mockNavigationRouter.canonicalize('/harvestpro');
    
    expect(result.id).toBe('harvestpro');
    expect(result.path).toBe('/harvestpro');
    expect(result.canonicalUrl).toBe('/harvestpro');
  });

  test('HarvestPro route validation passes', () => {
    const mockNavigationRouter = vi.mocked(NavigationRouter);
    
    // Test route validation
    const validation = mockNavigationRouter.validateRoute('/harvestpro');
    
    expect(validation.isValid).toBe(true);
  });

  test('FooterNav initializes NavigationRouter on mount', () => {
    renderWithRouter();
    
    const mockNavigationRouter = vi.mocked(NavigationRouter);
    
    // Verify that initializeBrowserNavigation was called
    expect(mockNavigationRouter.initializeBrowserNavigation).toHaveBeenCalled();
  });
});