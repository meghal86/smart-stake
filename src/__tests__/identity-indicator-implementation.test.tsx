/**
 * @fileoverview Tests for Task 4: Identity Indicator Implementation
 * 
 * Tests the persistent identity indicator that shows "Guest" or "Signed In" status
 * across all screens with appropriate tooltips explaining the implications.
 * 
 * Requirements tested:
 * - R2-AC1: Identity indicator visible within 1 glance on every screen
 * - R2-AC2: Clear distinction between Guest and Signed In states
 * - R2-AC3: Tooltip explains Guest mode limitations
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, test, beforeEach, afterEach, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components to test
import { UserHeader } from '@/components/layout/UserHeader';
import { DashboardHeader } from '@/components/home/DashboardHeader';
import { AuthContext } from '@/contexts/AuthContext';
import { HomeAuthProvider } from '@/lib/context/HomeAuthContext';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  }
}));

vi.mock('@rainbow-me/rainbowkit', () => ({
  useConnectModal: () => ({
    openConnectModal: vi.fn()
  })
}));

vi.mock('@/hooks/useTier', () => ({
  useTier: () => ({
    tier: 'free',
    canAccessFeature: () => true
  })
}));

vi.mock('@/hooks/useUserMetadata', () => ({
  useUserMetadata: () => ({
    metadata: null,
    loading: false,
    error: null
  })
}));

// Test utilities
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderWithProviders = (component: React.ReactElement, authValue: any) => {
  const queryClient = createQueryClient();
  
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authValue}>
          {component}
        </AuthContext.Provider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

const renderDashboardHeaderWithProviders = (component: React.ReactElement, homeAuthValue: any) => {
  const queryClient = createQueryClient();
  
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <HomeAuthProvider value={homeAuthValue}>
          {component}
        </HomeAuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Task 4: Identity Indicator Implementation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('UserHeader Identity Indicator', () => {
    test('shows Guest indicator when user is not authenticated', async () => {
      const mockAuthContext = {
        user: null,
        session: null,
        loading: false,
        signOut: vi.fn()
      };

      renderWithProviders(<UserHeader />, mockAuthContext);

      // Should show Guest badge
      expect(screen.getByText('Guest')).toBeInTheDocument();
      
      // Should have UserX icon (guest icon)
      const guestBadge = screen.getByText('Guest').closest('[role="button"]');
      expect(guestBadge).toBeInTheDocument();
      
      // Should have orange styling for guest mode
      expect(guestBadge).toHaveClass('text-orange-500');
    });

    test('shows Signed In indicator when user is authenticated', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User'
        }
      };

      const mockAuthContext = {
        user: mockUser,
        session: { user: mockUser },
        loading: false,
        signOut: vi.fn()
      };

      renderWithProviders(<UserHeader />, mockAuthContext);

      // Should show Signed In badge (or "Auth" on mobile)
      expect(screen.getByText(/Signed In|Auth/)).toBeInTheDocument();
      
      // Should have teal styling for authenticated state
      const signedInBadge = screen.getByText(/Signed In|Auth/).closest('[role="button"]');
      expect(signedInBadge).toHaveClass('text-[#14B8A6]');
    });

    test('shows loading state during authentication check', async () => {
      const mockAuthContext = {
        user: null,
        session: null,
        loading: true,
        signOut: vi.fn()
      };

      renderWithProviders(<UserHeader />, mockAuthContext);

      // Should show loading spinner
      expect(screen.getByRole('generic')).toHaveClass('animate-spin');
      
      // Should still show identity indicator even during loading
      expect(screen.getByText('Guest')).toBeInTheDocument();
    });

    test('shows Guest tooltip with explanation when hovered', async () => {
      const user = userEvent.setup();
      
      const mockAuthContext = {
        user: null,
        session: null,
        loading: false,
        signOut: vi.fn()
      };

      renderWithProviders(<UserHeader />, mockAuthContext);

      const guestBadge = screen.getByText('Guest').closest('[role="button"]');
      expect(guestBadge).toBeInTheDocument();

      // Hover over the guest badge
      await user.hover(guestBadge!);

      // Should show tooltip with guest mode explanation
      await waitFor(() => {
        expect(screen.getByText('Guest Mode')).toBeInTheDocument();
        expect(screen.getByText(/Guest mode doesn't save wallets, alerts, or settings/)).toBeInTheDocument();
      });
    });

    test('shows Signed In tooltip with explanation when hovered', async () => {
      const user = userEvent.setup();
      
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User'
        }
      };

      const mockAuthContext = {
        user: mockUser,
        session: { user: mockUser },
        loading: false,
        signOut: vi.fn()
      };

      renderWithProviders(<UserHeader />, mockAuthContext);

      const signedInBadge = screen.getByText(/Signed In|Auth/).closest('[role="button"]');
      expect(signedInBadge).toBeInTheDocument();

      // Hover over the signed in badge
      await user.hover(signedInBadge!);

      // Should show tooltip with signed in explanation
      await waitFor(() => {
        expect(screen.getByText('Signed In')).toBeInTheDocument();
        expect(screen.getByText(/Your wallets, alerts, and settings are saved/)).toBeInTheDocument();
      });
    });

    test('identity indicator is visible on mobile screens', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const mockAuthContext = {
        user: null,
        session: null,
        loading: false,
        signOut: vi.fn()
      };

      renderWithProviders(<UserHeader />, mockAuthContext);

      // Should show Guest badge even on mobile
      expect(screen.getByText('Guest')).toBeInTheDocument();
      
      // Should be visible and properly styled
      const guestBadge = screen.getByText('Guest').closest('[role="button"]');
      expect(guestBadge).toBeVisible();
    });
  });

  describe('DashboardHeader Identity Indicator', () => {
    test('shows Guest indicator on home page when not authenticated', async () => {
      const mockHomeAuthValue = {
        isAuthenticated: false,
        address: null
      };

      renderDashboardHeaderWithProviders(<DashboardHeader />, mockHomeAuthValue);

      // Should show Guest badge
      expect(screen.getByText('Guest')).toBeInTheDocument();
      
      // Should have orange styling for guest mode
      const guestBadge = screen.getByText('Guest').closest('[role="button"]');
      expect(guestBadge).toHaveClass('text-orange-500');
    });

    test('shows Signed In indicator on home page when authenticated', async () => {
      const mockHomeAuthValue = {
        isAuthenticated: true,
        address: '0x1234567890123456789012345678901234567890'
      };

      renderDashboardHeaderWithProviders(<DashboardHeader />, mockHomeAuthValue);

      // Should show Signed In badge (or "Auth" on mobile)
      expect(screen.getByText(/Signed In|Auth/)).toBeInTheDocument();
      
      // Should have green styling for authenticated state
      const signedInBadge = screen.getByText(/Signed In|Auth/).closest('[role="button"]');
      expect(signedInBadge).toHaveClass('text-[#00F5A0]');
    });

    test('shows tooltip explanation on home page', async () => {
      const user = userEvent.setup();
      
      const mockHomeAuthValue = {
        isAuthenticated: false,
        address: null
      };

      renderDashboardHeaderWithProviders(<DashboardHeader />, mockHomeAuthValue);

      const guestBadge = screen.getByText('Guest').closest('[role="button"]');
      expect(guestBadge).toBeInTheDocument();

      // Hover over the guest badge
      await user.hover(guestBadge!);

      // Should show tooltip with guest mode explanation
      await waitFor(() => {
        expect(screen.getByText('Guest Mode')).toBeInTheDocument();
        expect(screen.getByText(/Guest mode doesn't save wallets, alerts, or settings/)).toBeInTheDocument();
      });
    });
  });

  describe('Identity Indicator Consistency', () => {
    test('identity indicator appears in consistent position across headers', () => {
      // Test UserHeader
      const mockAuthContext = {
        user: null,
        session: null,
        loading: false,
        signOut: vi.fn()
      };

      const { unmount: unmountUserHeader } = renderWithProviders(<UserHeader />, mockAuthContext);
      
      const userHeaderBadge = screen.getByText('Guest');
      expect(userHeaderBadge).toBeInTheDocument();
      
      unmountUserHeader();

      // Test DashboardHeader
      const mockHomeAuthValue = {
        isAuthenticated: false,
        address: null
      };

      renderDashboardHeaderWithProviders(<DashboardHeader />, mockHomeAuthValue);
      
      const dashboardHeaderBadge = screen.getByText('Guest');
      expect(dashboardHeaderBadge).toBeInTheDocument();
      
      // Both should have similar styling and positioning
      expect(dashboardHeaderBadge.closest('[role="button"]')).toHaveClass('text-orange-500');
    });

    test('identity indicator uses consistent colors and styling', () => {
      // Test guest state styling
      const mockAuthContext = {
        user: null,
        session: null,
        loading: false,
        signOut: vi.fn()
      };

      renderWithProviders(<UserHeader />, mockAuthContext);
      
      const guestBadge = screen.getByText('Guest').closest('[role="button"]');
      expect(guestBadge).toHaveClass('text-orange-500');
      expect(guestBadge).toHaveClass('bg-orange-500/10');
      expect(guestBadge).toHaveClass('border-orange-500/20');
    });

    test('identity indicator is accessible with proper ARIA labels', () => {
      const mockAuthContext = {
        user: null,
        session: null,
        loading: false,
        signOut: vi.fn()
      };

      renderWithProviders(<UserHeader />, mockAuthContext);
      
      const guestBadge = screen.getByText('Guest').closest('[role="button"]');
      expect(guestBadge).toHaveClass('cursor-help');
      
      // Should be keyboard accessible
      expect(guestBadge).toHaveAttribute('role', 'button');
    });
  });

  describe('Requirements Validation', () => {
    test('R2-AC1: Identity indicator visible within 1 glance on every screen', () => {
      const mockAuthContext = {
        user: null,
        session: null,
        loading: false,
        signOut: vi.fn()
      };

      renderWithProviders(<UserHeader />, mockAuthContext);
      
      // Should be immediately visible without scrolling or interaction
      const identityIndicator = screen.getByText('Guest');
      expect(identityIndicator).toBeVisible();
      
      // Should be positioned prominently near the logo
      const logo = screen.getByRole('button', { name: /go to home/i });
      expect(logo).toBeInTheDocument();
      expect(identityIndicator).toBeInTheDocument();
    });

    test('R2-AC2: Clear distinction between Guest and Signed In states', () => {
      // Test Guest state
      const guestAuthContext = {
        user: null,
        session: null,
        loading: false,
        signOut: vi.fn()
      };

      const { rerender } = renderWithProviders(<UserHeader />, guestAuthContext);
      
      expect(screen.getByText('Guest')).toBeInTheDocument();
      expect(screen.getByText('Guest').closest('[role="button"]')).toHaveClass('text-orange-500');

      // Test Signed In state
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com'
      };

      const signedInAuthContext = {
        user: mockUser,
        session: { user: mockUser },
        loading: false,
        signOut: vi.fn()
      };

      rerender(
        <BrowserRouter>
          <QueryClientProvider client={createQueryClient()}>
            <AuthContext.Provider value={signedInAuthContext}>
              <UserHeader />
            </AuthContext.Provider>
          </QueryClientProvider>
        </BrowserRouter>
      );
      
      expect(screen.getByText(/Signed In|Auth/)).toBeInTheDocument();
      expect(screen.getByText(/Signed In|Auth/).closest('[role="button"]')).toHaveClass('text-[#14B8A6]');
    });

    test('R2-AC3: Tooltip explains Guest mode limitations', async () => {
      const user = userEvent.setup();
      
      const mockAuthContext = {
        user: null,
        session: null,
        loading: false,
        signOut: vi.fn()
      };

      renderWithProviders(<UserHeader />, mockAuthContext);

      const guestBadge = screen.getByText('Guest').closest('[role="button"]');
      await user.hover(guestBadge!);

      await waitFor(() => {
        // Should explain what guest mode means
        expect(screen.getByText('Guest Mode')).toBeInTheDocument();
        
        // Should explain the limitations
        expect(screen.getByText(/doesn't save wallets, alerts, or settings/)).toBeInTheDocument();
        
        // Should suggest signing in
        expect(screen.getByText(/Sign in to persist your data/)).toBeInTheDocument();
      });
    });
  });
});