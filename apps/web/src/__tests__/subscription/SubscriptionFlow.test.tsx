import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthProvider } from '@/contexts/AuthContext';
import Subscription from '@/pages/Subscription';
import ManageSubscription from '@/pages/ManageSubscription';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      upsert: vi.fn(),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
      insert: vi.fn(),
    })),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {},
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Subscription Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock authenticated user
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Subscription Page', () => {
    it('should render subscription plans correctly', async () => {
      // Mock user plan fetch
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { plan: 'free' },
              error: null,
            }),
          }),
        }),
      });

      render(
        <TestWrapper>
          <Subscription />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Premium Plans')).toBeInTheDocument();
        expect(screen.getByText('Free')).toBeInTheDocument();
        expect(screen.getByText('Pro')).toBeInTheDocument();
        expect(screen.getByText('Premium')).toBeInTheDocument();
      });
    });

    it('should handle free plan selection', async () => {
      // Mock user plan fetch
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { plan: 'pro' },
              error: null,
            }),
          }),
        }),
        upsert: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      render(
        <TestWrapper>
          <Subscription />
        </TestWrapper>
      );

      await waitFor(() => {
        const freeButton = screen.getByText('Downgrade to Free');
        expect(freeButton).toBeInTheDocument();
      });

      const freeButton = screen.getByText('Downgrade to Free');
      fireEvent.click(freeButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('users');
      });
    });

    it('should handle pro plan upgrade', async () => {
      // Mock user plan fetch
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { plan: 'free' },
              error: null,
            }),
          }),
        }),
      });

      // Mock Stripe checkout session creation
      (supabase.functions.invoke as any).mockResolvedValue({
        data: { url: 'https://checkout.stripe.com/test-session' },
        error: null,
      });

      // Mock window.open
      const mockOpen = vi.fn();
      Object.defineProperty(window, 'open', {
        value: mockOpen,
        writable: true,
      });

      render(
        <TestWrapper>
          <Subscription />
        </TestWrapper>
      );

      await waitFor(() => {
        const proButton = screen.getByText('Upgrade to Pro');
        expect(proButton).toBeInTheDocument();
      });

      const proButton = screen.getByText('Upgrade to Pro');
      fireEvent.click(proButton);

      await waitFor(() => {
        expect(supabase.functions.invoke).toHaveBeenCalledWith('create-checkout-session', {
          body: {
            priceId: 'price_1S0HB3JwuQyqUsks8bKNUt6M',
            successUrl: expect.stringContaining('/subscription/success'),
            cancelUrl: expect.stringContaining('/subscription/cancel'),
          },
        });
        expect(mockOpen).toHaveBeenCalledWith('https://checkout.stripe.com/test-session', '_blank');
      });
    });

    it('should handle premium plan upgrade', async () => {
      // Mock user plan fetch
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { plan: 'free' },
              error: null,
            }),
          }),
        }),
      });

      // Mock Stripe checkout session creation
      (supabase.functions.invoke as any).mockResolvedValue({
        data: { url: 'https://checkout.stripe.com/test-session' },
        error: null,
      });

      // Mock window.open
      const mockOpen = vi.fn();
      Object.defineProperty(window, 'open', {
        value: mockOpen,
        writable: true,
      });

      render(
        <TestWrapper>
          <Subscription />
        </TestWrapper>
      );

      await waitFor(() => {
        const premiumButton = screen.getByText('Upgrade to Premium');
        expect(premiumButton).toBeInTheDocument();
      });

      const premiumButton = screen.getByText('Upgrade to Premium');
      fireEvent.click(premiumButton);

      await waitFor(() => {
        expect(supabase.functions.invoke).toHaveBeenCalledWith('create-checkout-session', {
          body: {
            priceId: 'price_1S0HBOJwuQyqUsksDCs7SbPB',
            successUrl: expect.stringContaining('/subscription/success'),
            cancelUrl: expect.stringContaining('/subscription/cancel'),
          },
        });
        expect(mockOpen).toHaveBeenCalledWith('https://checkout.stripe.com/test-session', '_blank');
      });
    });

    it('should show current plan correctly', async () => {
      // Mock user plan fetch for pro user
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { plan: 'pro' },
              error: null,
            }),
          }),
        }),
      });

      render(
        <TestWrapper>
          <Subscription />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Current Plan')).toBeInTheDocument();
      });
    });
  });

  describe('Manage Subscription Page', () => {
    it('should render manage subscription page correctly', async () => {
      render(
        <TestWrapper>
          <ManageSubscription />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Manage Subscription')).toBeInTheDocument();
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Change Plan')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('should redirect unauthenticated users', () => {
      // Mock unauthenticated user
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(
        <TestWrapper>
          <ManageSubscription />
        </TestWrapper>
      );

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });
});