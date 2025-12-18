/**
 * FooterNav Integration Tests
 * 
 * Requirements: R9.NAV.ACTIVE_VISUAL, R9.NAV.BROWSER_SYNC, R9.NAV.SMOOTH_TRANSITIONS
 * Design: Navigation Architecture → Active Navigation State System
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { FooterNav } from '../FooterNav';

// Mock NavigationRouter
vi.mock('@/lib/navigation/NavigationRouter', () => {
  const mockInitializeBrowserNavigation = vi.fn();
  const mockCanonicalize = vi.fn();
  
  return {
    NavigationRouter: {
      initializeBrowserNavigation: mockInitializeBrowserNavigation,
      canonicalize: mockCanonicalize,
    },
  };
});

const renderFooterNavWithRouter = (initialPath = '/guardian') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <FooterNav />
    </MemoryRouter>
  );
};

describe('FooterNav Integration Tests', () => {
  let mockInitializeBrowserNavigation: any;
  let mockCanonicalize: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked functions
    const { NavigationRouter } = await import('@/lib/navigation/NavigationRouter');
    mockInitializeBrowserNavigation = NavigationRouter.initializeBrowserNavigation;
    mockCanonicalize = NavigationRouter.canonicalize;
    
    // Setup default mock behavior
    mockCanonicalize.mockImplementation((path: string) => {
      if (path.includes('/guardian')) return { id: 'guardian' };
      if (path.includes('/hunter')) return { id: 'hunter' };
      if (path.includes('/harvestpro')) return { id: 'harvestpro' };
      if (path.includes('/portfolio')) return { id: 'portfolio' };
      if (path === '/') return { id: 'home' };
      return { id: 'home' };
    });
  });

  describe('Browser Navigation Integration - R9.NAV.BROWSER_SYNC', () => {
    test('initializes NavigationRouter on mount', () => {
      renderFooterNavWithRouter();
      
      expect(mockInitializeBrowserNavigation).toHaveBeenCalledTimes(1);
      expect(mockInitializeBrowserNavigation).toHaveBeenCalledWith(expect.any(Function));
    });

    test('active state reflects current route correctly', () => {
      // Test Guardian route
      const { unmount } = renderFooterNavWithRouter('/guardian');
      const guardianLink = screen.getByLabelText('Navigate to Guardian security scanner');
      expect(guardianLink).toHaveClass('text-white', 'opacity-100');
      unmount();

      // Test Hunter route
      mockCanonicalize.mockImplementation((path: string) => {
        if (path.includes('/hunter')) return { id: 'hunter' };
        return { id: 'home' };
      });

      renderFooterNavWithRouter('/hunter');
      const hunterLink = screen.getByLabelText('Navigate to Hunter opportunities');
      expect(hunterLink).toHaveClass('text-white', 'opacity-100');
    });
  });

  describe('Active Visual Indicators - R9.NAV.ACTIVE_VISUAL', () => {
    test('shows 2px top border for active navigation item', () => {
      const { container } = renderFooterNavWithRouter('/guardian');
      
      // Look for the top border element (should be present for active guardian)
      const topBorder = container.querySelector('.absolute.top-0');
      expect(topBorder).toBeInTheDocument();
      expect(topBorder).toHaveClass('h-0.5'); // 2px border
      expect(topBorder).toHaveClass('bg-gradient-to-r');
    });

    test('applies bold text to active navigation item', () => {
      renderFooterNavWithRouter('/guardian');
      
      const guardianLabel = screen.getByText('Guardian');
      expect(guardianLabel).toHaveClass('font-bold');
    });

    test('applies reduced opacity to non-active items', () => {
      renderFooterNavWithRouter('/guardian');
      
      // Non-active items should have reduced opacity
      const hunterLink = screen.getByLabelText('Navigate to Hunter opportunities');
      const harvestLink = screen.getByLabelText('Navigate to Harvest tax optimization');
      const portfolioLink = screen.getByLabelText('Navigate to Portfolio tracker');
      
      expect(hunterLink).toHaveClass('opacity-60');
      expect(harvestLink).toHaveClass('opacity-60');
      expect(portfolioLink).toHaveClass('opacity-60');
    });

    test('active item has full opacity and special styling', () => {
      renderFooterNavWithRouter('/guardian');
      
      const guardianLink = screen.getByLabelText('Navigate to Guardian security scanner');
      expect(guardianLink).toHaveClass('text-white', 'opacity-100');
    });
  });

  describe('Smooth Transitions - R9.NAV.SMOOTH_TRANSITIONS', () => {
    test('applies smooth transition classes to navigation items', () => {
      renderFooterNavWithRouter();
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveClass('transition-all');
        expect(link).toHaveClass('duration-150');
        expect(link).toHaveClass('ease-out');
      });
    });

    test('icon containers have smooth transitions', () => {
      const { container } = renderFooterNavWithRouter();
      
      // Check that icon containers have transition classes
      const iconContainers = container.querySelectorAll('[class*="p-3 rounded-xl"]');
      iconContainers.forEach(iconContainer => {
        expect(iconContainer).toHaveClass('transition-all');
        expect(iconContainer).toHaveClass('duration-150');
        expect(iconContainer).toHaveClass('ease-out');
      });
    });

    test('labels have smooth transitions', () => {
      const { container } = renderFooterNavWithRouter();
      
      // Check that labels have transition classes
      const labels = container.querySelectorAll('span');
      labels.forEach(label => {
        expect(label).toHaveClass('transition-all');
        expect(label).toHaveClass('duration-150');
        expect(label).toHaveClass('ease-out');
      });
    });
  });

  describe('Route-Specific Active States', () => {
    test('home route shows correct active state', () => {
      renderFooterNavWithRouter('/');
      
      const homeLink = screen.getByLabelText('Navigate to Home dashboard');
      expect(homeLink).toHaveClass('text-white', 'opacity-100');
    });

    test('hunter route shows correct active state', () => {
      mockCanonicalize.mockImplementation(() => ({ id: 'hunter' }));
      renderFooterNavWithRouter('/hunter');
      
      const hunterLink = screen.getByLabelText('Navigate to Hunter opportunities');
      expect(hunterLink).toHaveClass('text-white', 'opacity-100');
    });

    test('harvestpro route shows correct active state', () => {
      mockCanonicalize.mockImplementation(() => ({ id: 'harvestpro' }));
      renderFooterNavWithRouter('/harvestpro');
      
      const harvestLink = screen.getByLabelText('Navigate to Harvest tax optimization');
      expect(harvestLink).toHaveClass('text-white', 'opacity-100');
    });

    test('portfolio route shows correct active state', () => {
      mockCanonicalize.mockImplementation(() => ({ id: 'portfolio' }));
      renderFooterNavWithRouter('/portfolio');
      
      const portfolioLink = screen.getByLabelText('Navigate to Portfolio tracker');
      expect(portfolioLink).toHaveClass('text-white', 'opacity-100');
    });
  });

  describe('Accessibility with Active States', () => {
    test('active navigation item has aria-current="page"', () => {
      renderFooterNavWithRouter('/guardian');
      
      const guardianLink = screen.getByLabelText('Navigate to Guardian security scanner');
      expect(guardianLink).toHaveAttribute('aria-current', 'page');
    });

    test('non-active navigation items do not have aria-current', () => {
      renderFooterNavWithRouter('/guardian');
      
      const hunterLink = screen.getByLabelText('Navigate to Hunter opportunities');
      const harvestLink = screen.getByLabelText('Navigate to Harvest tax optimization');
      
      expect(hunterLink).not.toHaveAttribute('aria-current');
      expect(harvestLink).not.toHaveAttribute('aria-current');
    });

    test('focus indicators work correctly with active states', () => {
      renderFooterNavWithRouter('/guardian');
      
      const guardianLink = screen.getByLabelText('Navigate to Guardian security scanner');
      expect(guardianLink).toHaveClass('focus:outline-none');
      expect(guardianLink).toHaveClass('focus:ring-2');
      expect(guardianLink).toHaveClass('focus:ring-cyan-500');
    });
  });
});