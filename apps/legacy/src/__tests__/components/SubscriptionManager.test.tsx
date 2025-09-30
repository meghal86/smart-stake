import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-token' } }
      }),
    },
  },
}));

// Mock fetch
global.fetch = jest.fn();

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

const mockSubscription = {
  id: 'sub_test123',
  status: 'active',
  current_period_start: Math.floor(Date.now() / 1000) - 86400,
  current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
  cancel_at_period_end: false,
  items: {
    data: [{
      price: {
        id: 'price_test123',
        unit_amount: 999,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
      },
    }],
  },
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('SubscriptionManager', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => 
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
  });

  it('renders no subscription message when user has no subscription', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('No active subscription found'));

    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No Active Subscription')).toBeInTheDocument();
    });

    expect(screen.getByText('View Plans')).toBeInTheDocument();
  });

  it('renders subscription details when user has active subscription', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        subscription: mockSubscription,
      }),
    });

    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Current Subscription')).toBeInTheDocument();
    });

    expect(screen.getByText('$9.99/month')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Cancel Subscription')).toBeInTheDocument();
  });

  it('shows reactivate button for canceled subscription', async () => {
    const canceledSubscription = {
      ...mockSubscription,
      cancel_at_period_end: true,
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        subscription: canceledSubscription,
      }),
    });

    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Reactivate Subscription')).toBeInTheDocument();
    });

    expect(screen.queryByText('Cancel Subscription')).not.toBeInTheDocument();
  });

  it('handles subscription cancellation', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          subscription: mockSubscription,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Subscription will be canceled at the end of the current billing period',
        }),
      });

    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Cancel Subscription')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel Subscription');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/manage-subscription'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'cancel' }),
        })
      );
    });
  });

  it('handles manage billing portal', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          subscription: mockSubscription,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          url: 'https://billing.stripe.com/session/test123',
        }),
      });

    // Mock window.open
    const mockOpen = jest.fn();
    Object.defineProperty(window, 'open', {
      value: mockOpen,
      writable: true,
    });

    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Billing')).toBeInTheDocument();
    });

    const manageBillingButton = screen.getByText('Manage Billing');
    fireEvent.click(manageBillingButton);

    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith('https://billing.stripe.com/session/test123', '_blank');
    });
  });

  it('displays error state when API call fails', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(
      <TestWrapper>
        <SubscriptionManager />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });
});