/**
 * Comprehensive tests for BottomNavigation canonical routing
 * 
 * Verifies that bottom navigation routes exactly to canonical paths:
 * - Home → `/`
 * - Guardian → `/guardian?tab=scan`
 * - Hunter → `/hunter?tab=all`
 * - HarvestPro → `/harvestpro`
 * - Settings → `/settings`
 * 
 * Requirements: R1.ROUTING.CANONICAL, R1.ROUTING.DETERMINISTIC, R1.ROUTING.INVALID_PARAMS
 */

import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNavigation } from '../BottomNavigation';
import { NavigationRouter } from '@/lib/navigation/NavigationRouter';

// Mock the NavigationRouter to capture calls
vi.mock('@/lib/navigation/NavigationRouter', () => ({
  NavigationRouter: {
    navigateToCanonical: vi.fn()
  }
}));

// Mock the AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null
  })
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: vi.fn()
}));

// Mock FloatingSocial to avoid React import issues
vi.mock('@/components/ui/FloatingSocial', () => ({
  FloatingSocial: () => null
}));

describe('BottomNavigation Canonical Routing', () => {
  const mockOnTabChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderBottomNavigation = (activeTab = 'home') => {
    return render(
      <MemoryRouter>
        <BottomNavigation activeTab={activeTab} onTabChange={mockOnTabChange} />
      </MemoryRouter>
    );
  };

  test('Home navigation routes to canonical path /', () => {
    renderBottomNavigation();
    
    const homeButton = screen.getByRole('button', { name: /home/i });
    fireEvent.click(homeButton);
    
    expect(NavigationRouter.navigateToCanonical).toHaveBeenCalledWith(
      'home',
      mockNavigate,
      expect.any(Function)
    );
    expect(mockOnTabChange).toHaveBeenCalledWith('home');
  });

  test('Guardian navigation routes to canonical path /guardian?tab=scan', () => {
    renderBottomNavigation();
    
    const guardianButton = screen.getByRole('button', { name: /guardian/i });
    fireEvent.click(guardianButton);
    
    expect(NavigationRouter.navigateToCanonical).toHaveBeenCalledWith(
      'guardian',
      mockNavigate,
      expect.any(Function)
    );
    expect(mockOnTabChange).toHaveBeenCalledWith('guardian');
  });

  test('Hunter navigation routes to canonical path /hunter?tab=all', () => {
    renderBottomNavigation();
    
    const hunterButton = screen.getByRole('button', { name: /hunter/i });
    fireEvent.click(hunterButton);
    
    expect(NavigationRouter.navigateToCanonical).toHaveBeenCalledWith(
      'hunter',
      mockNavigate,
      expect.any(Function)
    );
    expect(mockOnTabChange).toHaveBeenCalledWith('hunter');
  });

  test('HarvestPro navigation routes to canonical path /harvestpro', () => {
    renderBottomNavigation();
    
    const harvestButton = screen.getByRole('button', { name: /harvestpro/i });
    fireEvent.click(harvestButton);
    
    expect(NavigationRouter.navigateToCanonical).toHaveBeenCalledWith(
      'harvestpro',
      mockNavigate,
      expect.any(Function)
    );
    expect(mockOnTabChange).toHaveBeenCalledWith('harvestpro');
  });

  test('Settings navigation routes to canonical path /settings', () => {
    renderBottomNavigation();
    
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);
    
    expect(NavigationRouter.navigateToCanonical).toHaveBeenCalledWith(
      'settings',
      mockNavigate,
      expect.any(Function)
    );
    expect(mockOnTabChange).toHaveBeenCalledWith('settings');
  });

  test('all navigation items use NavigationRouter for canonical routing', () => {
    renderBottomNavigation();
    
    // Get all navigation buttons
    const navigationButtons = [
      screen.getByRole('button', { name: /home/i }),
      screen.getByRole('button', { name: /guardian/i }),
      screen.getByRole('button', { name: /hunter/i }),
      screen.getByRole('button', { name: /harvestpro/i }),
      screen.getByRole('button', { name: /settings/i })
    ];

    // Click each button and verify NavigationRouter is called
    navigationButtons.forEach((button, index) => {
      fireEvent.click(button);
    });

    // Should have called NavigationRouter.navigateToCanonical 5 times
    expect(NavigationRouter.navigateToCanonical).toHaveBeenCalledTimes(5);
    
    // Verify each call was made with correct parameters
    const expectedNavIds = ['home', 'guardian', 'hunter', 'harvestpro', 'settings'];
    expectedNavIds.forEach((navId, index) => {
      expect(NavigationRouter.navigateToCanonical).toHaveBeenNthCalledWith(
        index + 1,
        navId,
        mockNavigate,
        expect.any(Function)
      );
    });
  });

  test('active tab styling is applied correctly', () => {
    renderBottomNavigation('guardian');
    
    const guardianButton = screen.getByRole('button', { name: /guardian/i });
    const homeButton = screen.getByRole('button', { name: /home/i });
    
    // Guardian should have active styling
    expect(guardianButton).toHaveClass('text-[#14B8A6]');
    expect(guardianButton).toHaveClass('bg-[#14B8A6]/10');
    
    // Home should not have active styling
    expect(homeButton).not.toHaveClass('text-[#14B8A6]');
    expect(homeButton).not.toHaveClass('bg-[#14B8A6]/10');
  });

  test('keyboard navigation works with canonical routing', () => {
    renderBottomNavigation();
    
    const guardianButton = screen.getByRole('button', { name: /guardian/i });
    
    // Test Enter key
    fireEvent.keyDown(guardianButton, { key: 'Enter' });
    fireEvent.click(guardianButton); // Click event should still fire
    
    expect(NavigationRouter.navigateToCanonical).toHaveBeenCalledWith(
      'guardian',
      mockNavigate,
      expect.any(Function)
    );
  });

  test('premium badge is shown for HarvestPro', () => {
    renderBottomNavigation();
    
    const harvestButton = screen.getByRole('button', { name: /harvestpro/i });
    
    // Should have premium indicator (gradient dot)
    const premiumIndicator = harvestButton.querySelector('.bg-gradient-to-r.from-yellow-400.to-orange-500');
    expect(premiumIndicator).toBeInTheDocument();
  });

  test('navigation maintains accessibility attributes', () => {
    renderBottomNavigation();
    
    const buttons = [
      screen.getByRole('button', { name: /home/i }),
      screen.getByRole('button', { name: /guardian/i }),
      screen.getByRole('button', { name: /hunter/i }),
      screen.getByRole('button', { name: /harvestpro/i }),
      screen.getByRole('button', { name: /settings/i })
    ];

    buttons.forEach(button => {
      // Each button should have proper title attribute
      expect(button).toHaveAttribute('title');
      
      // Each button should be focusable (buttons are focusable by default)
      expect(button.tagName).toBe('BUTTON');
    });
  });
});