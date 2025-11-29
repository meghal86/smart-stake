import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { FooterNav } from '../FooterNav';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('FooterNav', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Rendering', () => {
    test('renders all 4 navigation icons', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FooterNav />
        </MemoryRouter>
      );

      // Check for all 4 navigation items by their labels
      expect(screen.getByText('Guardian')).toBeInTheDocument();
      expect(screen.getByText('Hunter')).toBeInTheDocument();
      expect(screen.getByText('HarvestPro')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    test('renders with proper ARIA labels', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FooterNav />
        </MemoryRouter>
      );

      expect(screen.getByLabelText('Navigate to Guardian security scanner')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Hunter opportunities')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to HarvestPro tax optimization')).toBeInTheDocument();
      expect(screen.getByLabelText('Navigate to Settings')).toBeInTheDocument();
    });

    test('renders as navigation landmark', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FooterNav />
        </MemoryRouter>
      );

      const nav = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('navigates to /guardian when Guardian icon is clicked', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FooterNav />
        </MemoryRouter>
      );

      const guardianButton = screen.getByLabelText('Navigate to Guardian security scanner');
      fireEvent.click(guardianButton);

      expect(mockNavigate).toHaveBeenCalledWith('/guardian');
    });

    test('navigates to /hunter when Hunter icon is clicked', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FooterNav />
        </MemoryRouter>
      );

      const hunterButton = screen.getByLabelText('Navigate to Hunter opportunities');
      fireEvent.click(hunterButton);

      expect(mockNavigate).toHaveBeenCalledWith('/hunter');
    });

    test('navigates to /harvestpro when HarvestPro icon is clicked', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FooterNav />
        </MemoryRouter>
      );

      const harvestButton = screen.getByLabelText('Navigate to HarvestPro tax optimization');
      fireEvent.click(harvestButton);

      expect(mockNavigate).toHaveBeenCalledWith('/harvestpro');
    });

    test('navigates to /settings when Settings icon is clicked', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FooterNav />
        </MemoryRouter>
      );

      const settingsButton = screen.getByLabelText('Navigate to Settings');
      fireEvent.click(settingsButton);

      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });
  });

  describe('Active Route Highlighting', () => {
    test('highlights Guardian when on /guardian route', () => {
      render(
        <MemoryRouter initialEntries={['/guardian']}>
          <FooterNav />
        </MemoryRouter>
      );

      const guardianButton = screen.getByLabelText('Navigate to Guardian security scanner');
      expect(guardianButton).toHaveClass('text-cyan-400');
      expect(guardianButton).toHaveAttribute('aria-current', 'page');
    });

    test('highlights Hunter when on /hunter route', () => {
      render(
        <MemoryRouter initialEntries={['/hunter']}>
          <FooterNav />
        </MemoryRouter>
      );

      const hunterButton = screen.getByLabelText('Navigate to Hunter opportunities');
      expect(hunterButton).toHaveClass('text-cyan-400');
      expect(hunterButton).toHaveAttribute('aria-current', 'page');
    });

    test('highlights HarvestPro when on /harvestpro route', () => {
      render(
        <MemoryRouter initialEntries={['/harvestpro']}>
          <FooterNav />
        </MemoryRouter>
      );

      const harvestButton = screen.getByLabelText('Navigate to HarvestPro tax optimization');
      expect(harvestButton).toHaveClass('text-cyan-400');
      expect(harvestButton).toHaveAttribute('aria-current', 'page');
    });

    test('highlights Settings when on /settings route', () => {
      render(
        <MemoryRouter initialEntries={['/settings']}>
          <FooterNav />
        </MemoryRouter>
      );

      const settingsButton = screen.getByLabelText('Navigate to Settings');
      expect(settingsButton).toHaveClass('text-cyan-400');
      expect(settingsButton).toHaveAttribute('aria-current', 'page');
    });

    test('highlights active route when on sub-route', () => {
      render(
        <MemoryRouter initialEntries={['/guardian/scan']}>
          <FooterNav />
        </MemoryRouter>
      );

      const guardianButton = screen.getByLabelText('Navigate to Guardian security scanner');
      expect(guardianButton).toHaveClass('text-cyan-400');
      expect(guardianButton).toHaveAttribute('aria-current', 'page');
    });

    test('does not highlight inactive routes', () => {
      render(
        <MemoryRouter initialEntries={['/guardian']}>
          <FooterNav />
        </MemoryRouter>
      );

      const hunterButton = screen.getByLabelText('Navigate to Hunter opportunities');
      expect(hunterButton).toHaveClass('text-gray-400');
      expect(hunterButton).not.toHaveAttribute('aria-current');
    });

    test('uses provided currentRoute prop over location', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FooterNav currentRoute="/hunter" />
        </MemoryRouter>
      );

      const hunterButton = screen.getByLabelText('Navigate to Hunter opportunities');
      expect(hunterButton).toHaveClass('text-cyan-400');
      expect(hunterButton).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Touch Target Sizes', () => {
    test('all navigation buttons have minimum 44px height', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FooterNav />
        </MemoryRouter>
      );

      const guardianButton = screen.getByLabelText('Navigate to Guardian security scanner');
      const hunterButton = screen.getByLabelText('Navigate to Hunter opportunities');
      const harvestButton = screen.getByLabelText('Navigate to HarvestPro tax optimization');
      const settingsButton = screen.getByLabelText('Navigate to Settings');

      // Check that all buttons have min-h-[44px] class
      expect(guardianButton).toHaveClass('min-h-[44px]');
      expect(hunterButton).toHaveClass('min-h-[44px]');
      expect(harvestButton).toHaveClass('min-h-[44px]');
      expect(settingsButton).toHaveClass('min-h-[44px]');
    });

    test('all navigation buttons have minimum 44px width', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FooterNav />
        </MemoryRouter>
      );

      const guardianButton = screen.getByLabelText('Navigate to Guardian security scanner');
      const hunterButton = screen.getByLabelText('Navigate to Hunter opportunities');
      const harvestButton = screen.getByLabelText('Navigate to HarvestPro tax optimization');
      const settingsButton = screen.getByLabelText('Navigate to Settings');

      // Check that all buttons have min-w-[44px] class
      expect(guardianButton).toHaveClass('min-w-[44px]');
      expect(hunterButton).toHaveClass('min-w-[44px]');
      expect(harvestButton).toHaveClass('min-w-[44px]');
      expect(settingsButton).toHaveClass('min-w-[44px]');
    });
  });

  describe('Keyboard Navigation', () => {
    test('navigates when Enter key is pressed', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FooterNav />
        </MemoryRouter>
      );

      const guardianButton = screen.getByLabelText('Navigate to Guardian security scanner');
      fireEvent.keyDown(guardianButton, { key: 'Enter' });

      expect(mockNavigate).toHaveBeenCalledWith('/guardian');
    });

    test('navigates when Space key is pressed', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FooterNav />
        </MemoryRouter>
      );

      const hunterButton = screen.getByLabelText('Navigate to Hunter opportunities');
      fireEvent.keyDown(hunterButton, { key: ' ' });

      expect(mockNavigate).toHaveBeenCalledWith('/hunter');
    });

    test('does not navigate on other key presses', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FooterNav />
        </MemoryRouter>
      );

      const guardianButton = screen.getByLabelText('Navigate to Guardian security scanner');
      fireEvent.keyDown(guardianButton, { key: 'a' });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('all buttons are keyboard focusable', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FooterNav />
        </MemoryRouter>
      );

      const guardianButton = screen.getByLabelText('Navigate to Guardian security scanner');
      const hunterButton = screen.getByLabelText('Navigate to Hunter opportunities');
      const harvestButton = screen.getByLabelText('Navigate to HarvestPro tax optimization');
      const settingsButton = screen.getByLabelText('Navigate to Settings');

      // All buttons should be focusable (button elements are focusable by default)
      expect(guardianButton.tagName).toBe('BUTTON');
      expect(hunterButton.tagName).toBe('BUTTON');
      expect(harvestButton.tagName).toBe('BUTTON');
      expect(settingsButton.tagName).toBe('BUTTON');
    });

    test('buttons have visible focus indicators', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FooterNav />
        </MemoryRouter>
      );

      const guardianButton = screen.getByLabelText('Navigate to Guardian security scanner');
      
      // Check for focus ring classes
      expect(guardianButton).toHaveClass('focus:outline-none');
      expect(guardianButton).toHaveClass('focus:ring-2');
      expect(guardianButton).toHaveClass('focus:ring-cyan-500');
    });
  });

  describe('Styling', () => {
    test('footer has fixed positioning on mobile', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FooterNav />
        </MemoryRouter>
      );

      // The footer element itself has the fixed positioning classes
      const footer = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(footer).toHaveClass('fixed');
      expect(footer).toHaveClass('bottom-0');
      expect(footer).toHaveClass('left-0');
      expect(footer).toHaveClass('right-0');
    });

    test('footer has glassmorphism styling', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <FooterNav />
        </MemoryRouter>
      );

      // Get the nav element inside the footer (not the footer itself which also has role="navigation")
      const footer = screen.getByRole('navigation', { name: 'Main navigation' });
      const nav = footer.querySelector('nav');
      expect(nav).toHaveClass('backdrop-blur-md');
      expect(nav).toHaveClass('bg-slate-900/95');
    });

    test('active button has cyan color', () => {
      render(
        <MemoryRouter initialEntries={['/guardian']}>
          <FooterNav />
        </MemoryRouter>
      );

      const guardianButton = screen.getByLabelText('Navigate to Guardian security scanner');
      expect(guardianButton).toHaveClass('text-cyan-400');
    });

    test('inactive buttons have gray color', () => {
      render(
        <MemoryRouter initialEntries={['/guardian']}>
          <FooterNav />
        </MemoryRouter>
      );

      const hunterButton = screen.getByLabelText('Navigate to Hunter opportunities');
      expect(hunterButton).toHaveClass('text-gray-400');
    });
  });
});
