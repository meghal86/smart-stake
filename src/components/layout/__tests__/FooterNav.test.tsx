import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { FooterNav } from '../FooterNav';

// Mock useLocation and useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/guardian', search: '' }),
    useNavigate: () => mockNavigate,
  };
});

// Mock NavigationRouter
vi.mock('@/lib/navigation/NavigationRouter', () => ({
  NavigationRouter: {
    initializeBrowserNavigation: vi.fn(),
    canonicalize: vi.fn((path: string) => {
      if (path.includes('/guardian')) return { id: 'guardian' };
      if (path.includes('/hunter')) return { id: 'hunter' };
      if (path.includes('/harvestpro')) return { id: 'harvestpro' };
      if (path.includes('/portfolio')) return { id: 'portfolio' };
      return { id: 'home' };
    }),
  },
}));

const renderFooterNav = () => {
  return render(
    <BrowserRouter>
      <FooterNav />
    </BrowserRouter>
  );
};

describe('FooterNav', () => {
  describe('Rendering', () => {
    test('renders all 5 navigation items', () => {
      renderFooterNav();
      
      expect(screen.getByLabelText('Navigate to Home dashboard')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Guardian security scanner')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Hunter opportunities')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Harvest tax optimization')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Portfolio tracker')).toBeInTheDocument();
    });

    test('renders all labels', () => {
      renderFooterNav();
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Guardian')).toBeInTheDocument();
      expect(screen.getByText('Hunter')).toBeInTheDocument();
      expect(screen.getByText('Harvest')).toBeInTheDocument();
      expect(screen.getByText('Portfolio')).toBeInTheDocument();
    });

    test('renders with proper ARIA navigation role', () => {
      renderFooterNav();
      
      const footer = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(footer).toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    test('highlights active route with aria-current', () => {
      renderFooterNav();
      
      const guardianLink = screen.getByLabelText('Navigate to Guardian security scanner');
      expect(guardianLink).toHaveAttribute('aria-current', 'page');
    });

    test('applies active styling to current route', () => {
      renderFooterNav();
      
      const guardianLink = screen.getByLabelText('Navigate to Guardian security scanner');
      expect(guardianLink).toHaveClass('text-white');
      expect(guardianLink).toHaveClass('opacity-100');
    });

    test('shows 2px top border for active navigation item - R9.NAV.ACTIVE_VISUAL', () => {
      const { container } = renderFooterNav();
      
      // Look for the top border element
      const topBorder = container.querySelector('.absolute.top-0');
      expect(topBorder).toBeInTheDocument();
      expect(topBorder).toHaveClass('h-0.5'); // 2px border
      expect(topBorder).toHaveClass('bg-gradient-to-r');
    });

    test('applies bold text to active navigation item - R9.NAV.ACTIVE_VISUAL', () => {
      renderFooterNav();
      
      const guardianLabel = screen.getByText('Guardian');
      expect(guardianLabel).toHaveClass('font-bold');
    });

    test('applies reduced opacity to non-active items - R9.NAV.ACTIVE_VISUAL', () => {
      renderFooterNav();
      
      const hunterLink = screen.getByLabelText('Navigate to Hunter opportunities');
      expect(hunterLink).toHaveClass('opacity-60');
    });

    test('uses smooth transitions - R9.NAV.SMOOTH_TRANSITIONS', () => {
      renderFooterNav();
      
      const guardianLink = screen.getByLabelText('Navigate to Guardian security scanner');
      expect(guardianLink).toHaveClass('transition-all');
      expect(guardianLink).toHaveClass('duration-150');
      expect(guardianLink).toHaveClass('ease-out');
    });
  });

  describe('Accessibility', () => {
    test('all links have aria-labels', () => {
      renderFooterNav();
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('aria-label');
      });
    });

    test('icons have aria-hidden', () => {
      const { container } = renderFooterNav();
      
      const icons = container.querySelectorAll('svg');
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    test('touch targets are at least 44px', () => {
      renderFooterNav();
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveClass('min-h-[44px]');
        expect(link).toHaveClass('min-w-[44px]');
      });
    });

    test('has focus indicators', () => {
      renderFooterNav();
      
      const guardianLink = screen.getByLabelText('Navigate to Guardian security scanner');
      expect(guardianLink).toHaveClass('focus:outline-none');
      expect(guardianLink).toHaveClass('focus:ring-2');
      expect(guardianLink).toHaveClass('focus:ring-cyan-500');
    });
  });

  describe('Navigation', () => {
    test('links have correct href attributes', () => {
      renderFooterNav();
      
      expect(screen.getByLabelText('Navigate to Home dashboard')).toHaveAttribute('href', '/');
      expect(screen.getByLabelText('Navigate to Guardian security scanner')).toHaveAttribute('href', '/guardian');
      expect(screen.getByLabelText('Navigate to Hunter opportunities')).toHaveAttribute('href', '/hunter');
      expect(screen.getByLabelText('Navigate to Harvest tax optimization')).toHaveAttribute('href', '/harvestpro');
      expect(screen.getByLabelText('Navigate to Portfolio tracker')).toHaveAttribute('href', '/portfolio');
    });
  });

  describe('Styling', () => {
    test('has fixed positioning', () => {
      const { container } = renderFooterNav();
      
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('fixed');
      expect(footer).toHaveClass('bottom-0');
    });

    test('has glassmorphism backdrop', () => {
      const { container } = renderFooterNav();
      
      const backdrop = container.querySelector('.backdrop-blur-md');
      expect(backdrop).toBeInTheDocument();
    });

    test('has proper z-index for overlay', () => {
      const { container } = renderFooterNav();
      
      const footer = container.querySelector('footer');
      expect(footer).toHaveClass('z-40');
    });
  });

  describe('Responsive Design', () => {
    test('uses flex layout for equal spacing', () => {
      const { container } = renderFooterNav();
      
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('flex');
      expect(nav).toHaveClass('justify-around');
    });

    test('items have flex-1 for equal width', () => {
      renderFooterNav();
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveClass('flex-1');
      });
    });
  });
});
