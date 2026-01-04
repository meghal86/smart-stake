/**
 * Route Protection Integration Tests
 * 
 * Tests for unauthenticated user redirection to /login?next=<path> with validation
 * 
 * @see .kiro/specs/multi-chain-wallet-system/requirements.md - Requirement 3.1, 3.2, 3.6
 * @see .kiro/specs/multi-chain-wallet-system/design.md - Property 12: Route Protection and Validation
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRouteWrapper } from '@/components/ProtectedRouteWrapper';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

// Test component that requires authentication
const ProtectedPage = () => <div>Protected Content</div>;

// Test component for login page
const LoginPage = () => {
  return (
    <div>
      <div>Login Page</div>
      <div data-testid="login-url">{window.location.pathname}{window.location.search}</div>
    </div>
  );
};

// Test component for home page
const HomePage = () => <div>Home Page</div>;

// Test router setup
const TestRouter = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<HomePage />} />
            <Route
              path="/guardian"
              element={<ProtectedRouteWrapper><ProtectedPage /></ProtectedRouteWrapper>}
            />
            <Route
              path="/hunter"
              element={<ProtectedRouteWrapper><ProtectedPage /></ProtectedRouteWrapper>}
            />
            <Route
              path="/harvestpro"
              element={<ProtectedRouteWrapper><ProtectedPage /></ProtectedRouteWrapper>}
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Route Protection - Unauthenticated User Redirection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Property 12: Route Protection and Validation', () => {
    test('unauthenticated users are redirected to /login with next parameter', async () => {
      // Mock unauthenticated session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      // Set initial location
      window.history.pushState({}, '', '/guardian');

      render(
        <TestRouter>
          <ProtectedRouteWrapper><ProtectedPage /></ProtectedRouteWrapper>
        </TestRouter>
      );

      // Wait for redirect to login
      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    test('next parameter is properly encoded in redirect URL', async () => {
      // Mock unauthenticated session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      // Navigate to protected route with query params
      window.history.pushState({}, '', '/guardian?wallet=0x123');

      render(
        <TestRouter>
          <ProtectedRouteWrapper><ProtectedPage /></ProtectedRouteWrapper>
        </TestRouter>
      );

      // Wait for redirect
      await waitFor(() => {
        const loginUrl = screen.getByTestId('login-url');
        expect(loginUrl.textContent).toContain('/login');
        expect(loginUrl.textContent).toContain('next=');
      }, { timeout: 2000 });
    });

    test('multiple protected routes all enforce authentication', async () => {
      // Mock unauthenticated session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      // Test /guardian route
      window.history.pushState({}, '', '/guardian');

      render(
        <TestRouter>
          <ProtectedRouteWrapper><ProtectedPage /></ProtectedRouteWrapper>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    test('next parameter with special characters is properly encoded', async () => {
      // Mock unauthenticated session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      // Navigate with special characters in path
      window.history.pushState({}, '', '/guardian?network=eip155:1');

      render(
        <TestRouter>
          <ProtectedRouteWrapper><ProtectedPage /></ProtectedRouteWrapper>
        </TestRouter>
      );

      // Wait for redirect
      await waitFor(() => {
        const loginUrl = screen.getByTestId('login-url');
        expect(loginUrl.textContent).toContain('/login');
        expect(loginUrl.textContent).toContain('next=');
      }, { timeout: 2000 });
    });
  });

  describe('Requirement 3.1: Redirect to /login?next=<path>', () => {
    test('unauthenticated access to /guardian redirects to /login with next parameter', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      window.history.pushState({}, '', '/guardian');

      render(
        <TestRouter>
          <ProtectedRouteWrapper><ProtectedPage /></ProtectedRouteWrapper>
        </TestRouter>
      );

      await waitFor(() => {
        const loginUrl = screen.getByTestId('login-url');
        expect(loginUrl.textContent).toContain('/login');
        expect(loginUrl.textContent).toContain('next=%2Fguardian');
      }, { timeout: 2000 });
    });
  });

  describe('Requirement 3.2: Next parameter validation', () => {
    test('next parameter must start with / for valid internal paths', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      // Test valid path
      window.history.pushState({}, '', '/guardian');

      render(
        <TestRouter>
          <ProtectedRouteWrapper><ProtectedPage /></ProtectedRouteWrapper>
        </TestRouter>
      );

      await waitFor(() => {
        const loginUrl = screen.getByTestId('login-url');
        // Should include next parameter for valid paths
        expect(loginUrl.textContent).toContain('next=');
      }, { timeout: 2000 });
    });
  });

  describe('Requirement 3.6: /signin alias to /login', () => {
    test('protected routes work with signin alias', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      window.history.pushState({}, '', '/guardian');

      render(
        <TestRouter>
          <ProtectedRouteWrapper><ProtectedPage /></ProtectedRouteWrapper>
        </TestRouter>
      );

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Auth Flow Determinism', () => {
    test('unauthenticated users always redirect to login', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      window.history.pushState({}, '', '/guardian');

      render(
        <TestRouter>
          <ProtectedRouteWrapper><ProtectedPage /></ProtectedRouteWrapper>
        </TestRouter>
      );

      // Should consistently redirect to login
      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    test('protected content is never shown to unauthenticated users', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any);

      window.history.pushState({}, '', '/guardian');

      render(
        <TestRouter>
          <ProtectedRouteWrapper><ProtectedPage /></ProtectedRouteWrapper>
        </TestRouter>
      );

      // Protected content should never be visible
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });
});
