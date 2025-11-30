import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { FooterNav } from '../FooterNav';

// Mock useLocation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/guardian' }),
  };
});

const renderFooterNav = () => {
  return render(
    <BrowserRouter>
      <FooterNav />
    </BrowserRouter>
  );
};

describe('FooterNav', () => {
  describe('Rendering', () => {
    test('renders all 4 navigation items', () => {
      renderFooterNav();
      
      expect(screen.getByLabelText('Navigate to Guardian security scanner')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Hunter opportunities')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to HarvestPro tax optimization')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Portfolio tracker')).toBeInTheDocument();
    });

    test('renders all labels', () => {
      renderFooterNav();
      
      expect(screen.getByText('Guardian')).toBeInTheDocument();
      expect(screen.getByText('Hunter')).toBeInTheDocument();
      expect(screen.getByText('HarvestPro')).toBeInTheDocument();
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
      
      expect(screen.getByLabelText('Navigate to Guardian security scanner')).toHaveAttribute('href', '/guardian');
      expect(screen.getByLabelText('Navigate to Hunter opportunities')).toHaveAttribute('href', '/hunter');
      expect(screen.getByLabelText('Navigate to HarvestPro tax optimization')).toHaveAttribute('href', '/harvest');
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
