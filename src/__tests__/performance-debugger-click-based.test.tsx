/**
 * Performance Debugger Click-Based Implementation Test
 * 
 * Tests that the PerformanceDebugger component is now click-based
 * and can be opened from the Settings page
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, test, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import { PerformanceDebugger } from '@/components/performance/PerformanceDebugger';
import SettingsPage from '@/pages/Settings';
import { AuthContext } from '@/contexts/AuthContext';

// Mock the performance monitoring modules
vi.mock('@/lib/performance/monitor', () => ({
  performanceMonitor: {
    getMetrics: vi.fn(() => []),
    clear: vi.fn(),
  },
}));

vi.mock('@/lib/performance/memory-monitor', () => ({
  useMemoryMonitor: vi.fn(() => ({
    memoryStats: {
      current: { usagePercent: 45, used: 100 * 1024 * 1024, limit: 200 * 1024 * 1024 },
      trend: { growth: 5 * 1024 * 1024 },
    },
    forceGarbageCollection: vi.fn(),
  })),
}));

vi.mock('@/lib/performance/interval-manager', () => ({
  intervalManager: {
    getStats: vi.fn(() => ({
      total: 5,
      activeIntervals: 3,
      activeTimeouts: 2,
    })),
    clearAll: vi.fn(),
  },
}));

// Mock hooks
vi.mock('@/hooks/useTier', () => ({
  useTier: () => ({
    tier: 'free',
    isPremium: false,
    isEnterprise: false,
  }),
}));

vi.mock('@/hooks/useUserMetadata', () => ({
  useUserMetadata: () => ({
    metadata: null,
    loading: false,
  }),
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock FooterNav
vi.mock('@/components/layout/FooterNav', () => ({
  FooterNav: () => <div data-testid="footer-nav">Footer Nav</div>,
}));

// Set NODE_ENV to development for these tests
const originalEnv = process.env.NODE_ENV;

describe('PerformanceDebugger Click-Based Implementation', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'development';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  beforeEach(() => {
    // Clear any global functions
    delete (window as any).openPerformanceDebugger;
  });

  describe('PerformanceDebugger Component', () => {
    test('shows floating trigger button when closed in development mode', () => {
      render(<PerformanceDebugger />);
      
      // Should show the floating trigger button
      const triggerButton = screen.getByTitle('Open Performance Debugger');
      expect(triggerButton).toBeInTheDocument();
      
      // Should not show the full debugger panel initially
      expect(screen.queryByText('Performance Debug')).not.toBeInTheDocument();
    });

    test('opens debugger panel when trigger button is clicked', async () => {
      render(<PerformanceDebugger />);
      
      // Click the trigger button
      const triggerButton = screen.getByTitle('Open Performance Debugger');
      fireEvent.click(triggerButton);
      
      // Should now show the full debugger panel
      await waitFor(() => {
        expect(screen.getByText('Performance Debug')).toBeInTheDocument();
      });
      
      // Should show memory usage section
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('Active Timers')).toBeInTheDocument();
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    });

    test('can minimize and restore debugger panel', async () => {
      render(<PerformanceDebugger />);
      
      // Open the debugger
      const triggerButton = screen.getByTitle('Open Performance Debugger');
      fireEvent.click(triggerButton);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Debug')).toBeInTheDocument();
      });
      
      // Minimize the debugger
      const minimizeButton = screen.getByTitle('Minimize');
      fireEvent.click(minimizeButton);
      
      // Should show minimized state
      await waitFor(() => {
        expect(screen.getByText('Performance')).toBeInTheDocument();
        expect(screen.queryByText('Memory Usage')).not.toBeInTheDocument();
      });
    });

    test('can close debugger panel', async () => {
      render(<PerformanceDebugger />);
      
      // Open the debugger
      const triggerButton = screen.getByTitle('Open Performance Debugger');
      fireEvent.click(triggerButton);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Debug')).toBeInTheDocument();
      });
      
      // Close the debugger
      const closeButton = screen.getByTitle('Close');
      fireEvent.click(closeButton);
      
      // Should return to trigger button state
      await waitFor(() => {
        expect(screen.queryByText('Performance Debug')).not.toBeInTheDocument();
        expect(screen.getByTitle('Open Performance Debugger')).toBeInTheDocument();
      });
    });

    test('exposes global function to open debugger', () => {
      render(<PerformanceDebugger />);
      
      // Should expose global function
      expect((window as any).openPerformanceDebugger).toBeDefined();
      expect(typeof (window as any).openPerformanceDebugger).toBe('function');
    });

    test('does not render in production mode', () => {
      // Temporarily set to production
      process.env.NODE_ENV = 'production';
      
      const { container } = render(<PerformanceDebugger />);
      
      // Should not render anything
      expect(container.firstChild).toBeNull();
      
      // Reset to development
      process.env.NODE_ENV = 'development';
    });
  });

  describe('Settings Page Integration', () => {
    const mockUser = {
      id: 'test-user',
      email: 'test@example.com',
      created_at: '2023-01-01T00:00:00Z',
      user_metadata: {
        full_name: 'Test User',
      },
    };

    const mockAuthContext = {
      user: mockUser,
      signOut: vi.fn(),
      loading: false,
    };

    const renderSettingsPage = () => {
      return render(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <SettingsPage />
          </AuthContext.Provider>
        </BrowserRouter>
      );
    };

    test('shows Performance Debugger button in About tab in development mode', async () => {
      renderSettingsPage();
      
      // Navigate to About tab
      const aboutTab = screen.getByRole('button', { name: /about/i });
      fireEvent.click(aboutTab);
      
      // Should show Developer Tools section
      await waitFor(() => {
        expect(screen.getByText('Developer Tools')).toBeInTheDocument();
      });
      
      // Should show Performance Debugger button
      expect(screen.getByText('Performance Debugger')).toBeInTheDocument();
      expect(screen.getByText('Monitor memory usage and performance metrics')).toBeInTheDocument();
    });

    test('Performance Debugger button calls global function when clicked', async () => {
      // Mock the global function
      const mockOpenDebugger = vi.fn();
      (window as any).openPerformanceDebugger = mockOpenDebugger;
      
      renderSettingsPage();
      
      // Navigate to About tab
      const aboutTab = screen.getByRole('button', { name: /about/i });
      fireEvent.click(aboutTab);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Debugger')).toBeInTheDocument();
      });
      
      // Click the Performance Debugger button
      const debuggerButton = screen.getByText('Performance Debugger').closest('button');
      expect(debuggerButton).toBeInTheDocument();
      
      fireEvent.click(debuggerButton!);
      
      // Should call the global function
      expect(mockOpenDebugger).toHaveBeenCalledTimes(1);
    });

    test('does not show Developer Tools section in production mode', async () => {
      // Temporarily set to production
      process.env.NODE_ENV = 'production';
      
      renderSettingsPage();
      
      // Navigate to About tab
      const aboutTab = screen.getByRole('button', { name: /about/i });
      fireEvent.click(aboutTab);
      
      await waitFor(() => {
        expect(screen.getByText('Additional Information')).toBeInTheDocument();
      });
      
      // Should not show Developer Tools section
      expect(screen.queryByText('Developer Tools')).not.toBeInTheDocument();
      expect(screen.queryByText('Performance Debugger')).not.toBeInTheDocument();
      
      // Reset to development
      process.env.NODE_ENV = 'development';
    });
  });

  describe('Integration Test', () => {
    test('complete flow: Settings → Performance Debugger → Open → Use', async () => {
      const mockUser = {
        id: 'test-user',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
        user_metadata: {
          full_name: 'Test User',
        },
      };

      const mockAuthContext = {
        user: mockUser,
        signOut: vi.fn(),
        loading: false,
      };

      render(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <div>
              <SettingsPage />
              <PerformanceDebugger />
            </div>
          </AuthContext.Provider>
        </BrowserRouter>
      );
      
      // 1. Navigate to About tab in Settings
      const aboutTab = screen.getByRole('button', { name: /about/i });
      fireEvent.click(aboutTab);
      
      await waitFor(() => {
        expect(screen.getByText('Performance Debugger')).toBeInTheDocument();
      });
      
      // 2. Click Performance Debugger button in Settings
      const debuggerButton = screen.getByText('Performance Debugger').closest('button');
      fireEvent.click(debuggerButton!);
      
      // 3. Performance debugger should open
      await waitFor(() => {
        expect(screen.getByText('Performance Debug')).toBeInTheDocument();
      });
      
      // 4. Verify debugger functionality
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('Active Timers')).toBeInTheDocument();
      expect(screen.getByText('45.0%')).toBeInTheDocument(); // Memory usage from mock
    });
  });
});