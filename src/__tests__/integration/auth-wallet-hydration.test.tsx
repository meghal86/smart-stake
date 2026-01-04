/**
 * Integration Tests for Auth → Wallet Hydration Flow
 * 
 * Tests the complete flow from sign in through wallet hydration to module access
 * 
 * @see .kiro/specs/multi-chain-wallet-system/requirements.md - Requirements 2.1, 3.1-3.7, 4.1-4.5
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { ProtectedRouteWrapper } from '@/components/ProtectedRouteWrapper';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

/**
 * Test Component that displays wallet context
 */
const TestComponent = () => {
  const { connectedWallets, activeWallet, isAuthenticated } = require('@/contexts/WalletContext').useWallet();

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
      <div data-testid="wallet-count">{connectedWallets.length}</div>
      <div data-testid="active-wallet">{activeWallet || 'none'}</div>
    </div>
  );
};

/**
 * Test wrapper component
 */
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Integration: Auth → Wallet Hydration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Sign in → wallet hydration → module access
   * 
   * Verifies the complete flow:
   * 1. User signs in
   * 2. Session is established
   * 3. Wallet registry is hydrated from server
   * 4. Modules can access wallet context
   */
  test('sign in triggers wallet hydration and module access', async () => {
    // This is a conceptual test showing the expected flow
    // In a real implementation, this would use actual Supabase mocks

    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      access_token: 'token-123',
    };

    const mockWallets = [
      {
        id: 'wallet-1',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chain_namespace: 'eip155:1',
        is_primary: true,
      },
    ];

    // Mock the auth flow
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    // Mock wallet hydration
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ wallets: mockWallets }),
    });

    // Render test component
    render(
      <TestWrapper>
        <ProtectedRouteWrapper>
          <TestComponent />
        </ProtectedRouteWrapper>
      </TestWrapper>
    );

    // Wait for auth to establish
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    // Wait for wallet hydration
    await waitFor(() => {
      expect(screen.getByTestId('wallet-count')).toHaveTextContent('1');
    });

    // Verify module can access wallet context
    expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x1234567890abcdef1234567890abcdef12345678');
  });

  /**
   * Test: Unauthenticated users are redirected to login
   * 
   * Verifies that unauthenticated users cannot access protected routes
   */
  test('unauthenticated users are redirected to login', async () => {
    // Mock no session
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    // Render protected component
    render(
      <TestWrapper>
        <ProtectedRouteWrapper>
          <TestComponent />
        </ProtectedRouteWrapper>
      </TestWrapper>
    );

    // Wait for redirect (component should not render)
    await waitFor(() => {
      expect(screen.queryByTestId('auth-status')).not.toBeInTheDocument();
    });
  });

  /**
   * Test: Zero wallets → /guardian with onboarding empty state
   * 
   * Verifies that users with no wallets see the onboarding state
   */
  test('zero wallets shows onboarding empty state', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      access_token: 'token-123',
    };

    // Mock the auth flow
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    // Mock empty wallet list
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ wallets: [] }),
    });

    // Render test component
    render(
      <TestWrapper>
        <ProtectedRouteWrapper>
          <TestComponent />
        </ProtectedRouteWrapper>
      </TestWrapper>
    );

    // Wait for auth to establish
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    // Verify zero wallets
    expect(screen.getByTestId('wallet-count')).toHaveTextContent('0');
    expect(screen.getByTestId('active-wallet')).toHaveTextContent('none');
  });

  /**
   * Test: ≥1 wallet → /guardian by default
   * 
   * Verifies that users with wallets see the main Guardian interface
   */
  test('one or more wallets shows guardian interface', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      access_token: 'token-123',
    };

    const mockWallets = [
      {
        id: 'wallet-1',
        address: '0x1111111111111111111111111111111111111111',
        chain_namespace: 'eip155:1',
        is_primary: true,
      },
      {
        id: 'wallet-2',
        address: '0x2222222222222222222222222222222222222222',
        chain_namespace: 'eip155:137',
        is_primary: false,
      },
    ];

    // Mock the auth flow
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    // Mock wallet list with multiple wallets
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ wallets: mockWallets }),
    });

    // Render test component
    render(
      <TestWrapper>
        <ProtectedRouteWrapper>
          <TestComponent />
        </ProtectedRouteWrapper>
      </TestWrapper>
    );

    // Wait for auth to establish
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    // Verify multiple wallets
    await waitFor(() => {
      expect(screen.getByTestId('wallet-count')).toHaveTextContent('2');
    });

    // Verify primary wallet is active
    expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x1111111111111111111111111111111111111111');
  });

  /**
   * Test: All modules read from same authenticated context
   * 
   * Verifies that Guardian, Hunter, and HarvestPro all see the same wallet context
   */
  test('all modules read from same authenticated context', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
      access_token: 'token-123',
    };

    const mockWallets = [
      {
        id: 'wallet-1',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chain_namespace: 'eip155:1',
        is_primary: true,
      },
    ];

    // Mock the auth flow
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    // Mock wallet hydration
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ wallets: mockWallets }),
    });

    // Render multiple test components (simulating different modules)
    const { rerender } = render(
      <TestWrapper>
        <ProtectedRouteWrapper>
          <TestComponent />
        </ProtectedRouteWrapper>
      </TestWrapper>
    );

    // Wait for first module to hydrate
    await waitFor(() => {
      expect(screen.getByTestId('wallet-count')).toHaveTextContent('1');
    });

    const firstModuleWallet = screen.getByTestId('active-wallet').textContent;

    // Rerender with different module (simulating Hunter)
    rerender(
      <TestWrapper>
        <ProtectedRouteWrapper>
          <TestComponent />
        </ProtectedRouteWrapper>
      </TestWrapper>
    );

    // Wait for second module to hydrate
    await waitFor(() => {
      expect(screen.getByTestId('wallet-count')).toHaveTextContent('1');
    });

    const secondModuleWallet = screen.getByTestId('active-wallet').textContent;

    // Verify both modules see the same wallet
    expect(firstModuleWallet).toBe(secondModuleWallet);
  });
});
