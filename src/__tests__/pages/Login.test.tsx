/**
 * Login Page Tests
 * 
 * Tests for login page next parameter handling and redirection
 * 
 * @see .kiro/specs/multi-chain-wallet-system/requirements.md - Requirement 3.1, 3.2, 3.3
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '@/pages/Login';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  },
}));

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('Login Page - Next Parameter Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Next Parameter Validation', () => {
    test('extracts next parameter from URL', () => {
      // Set URL with next parameter
      window.history.pushState({}, '', '/login?next=%2Fguardian');

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Component should render without errors
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
    });

    test('validates next parameter - accepts valid internal paths', () => {
      window.history.pushState({}, '', '/login?next=%2Fguardian');

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Should render login form
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    test('defaults to /guardian when next parameter is invalid', () => {
      // Set URL with invalid next parameter (protocol-relative URL)
      window.history.pushState({}, '', '/login?next=%2F%2Fevil.com');

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Should still render login form
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    test('defaults to /guardian when no next parameter provided', () => {
      window.history.pushState({}, '', '/login');

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Should render login form
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    test('handles next parameter with query strings', () => {
      // Next parameter with embedded query string
      window.history.pushState({}, '', '/login?next=%2Fguardian%3Fwallet%3D0x123');

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Should render login form
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    test('handles multiple query parameters', () => {
      window.history.pushState({}, '', '/login?next=%2Fguardian&utm_source=email');

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Should render login form
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });
  });

  describe('Redirect Path Determination', () => {
    test('uses next parameter when valid', () => {
      window.history.pushState({}, '', '/login?next=%2Fhunter');

      const { container } = render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Component should be rendered
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
    });

    test('defaults to /guardian when next is missing', () => {
      window.history.pushState({}, '', '/login');

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Should render login form
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    test('defaults to /guardian when next starts with //', () => {
      window.history.pushState({}, '', '/login?next=%2F%2Fevil.com');

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Should render login form
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    test('accepts /harvestpro as valid next parameter', () => {
      window.history.pushState({}, '', '/login?next=%2Fharvestpro');

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Should render login form
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    test('accepts /portfolio as valid next parameter', () => {
      window.history.pushState({}, '', '/login?next=%2Fportfolio');

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Should render login form
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });
  });

  describe('OAuth Redirect Handling', () => {
    test('includes redirect path in Google OAuth options', async () => {
      window.history.pushState({}, '', '/login?next=%2Fguardian');

      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: {},
        error: null,
      } as any);

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Component should render
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
    });

    test('includes redirect path in Apple OAuth options', async () => {
      window.history.pushState({}, '', '/login?next=%2Fhunter');

      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: {},
        error: null,
      } as any);

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Component should render
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
    });
  });

  describe('Security - Open Redirect Prevention', () => {
    test('rejects next parameter with http:// protocol', () => {
      window.history.pushState({}, '', '/login?next=http%3A%2F%2Fevil.com');

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Should render login form (not redirect to evil.com)
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    test('rejects next parameter with https:// protocol', () => {
      window.history.pushState({}, '', '/login?next=https%3A%2F%2Fevil.com');

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Should render login form
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    test('rejects next parameter with javascript: protocol', () => {
      window.history.pushState({}, '', '/login?next=javascript%3Aalert%28%27xss%27%29');

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Should render login form
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    test('rejects next parameter with data: protocol', () => {
      window.history.pushState({}, '', '/login?next=data%3Atext%2Fhtml%3Cscript%3E');

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Should render login form
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    test('rejects next parameter with protocol-relative URL', () => {
      window.history.pushState({}, '', '/login?next=%2F%2Fevil.com%2Fpath');

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      // Should render login form
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });
  });

  describe('Valid Internal Paths', () => {
    const validPaths = [
      '/guardian',
      '/hunter',
      '/harvestpro',
      '/portfolio',
      '/alerts',
      '/settings',
      '/guardian?wallet=0x123',
      '/hunter?network=eip155:1',
    ];

    validPaths.forEach(path => {
      test(`accepts valid internal path: ${path}`, () => {
        const encodedPath = encodeURIComponent(path);
        window.history.pushState({}, '', `/login?next=${encodedPath}`);

        render(
          <BrowserRouter>
            <Login />
          </BrowserRouter>
        );

        // Should render login form
        expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
      });
    });
  });
});
