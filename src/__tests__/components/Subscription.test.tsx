import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Subscription from '../../pages/Subscription';
import { supabase } from '../../integrations/supabase/client';

// Mock Supabase
jest.mock('../../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      upsert: jest.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams()],
}));

// Mock toast
jest.mock('../../components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

const renderSubscription = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Subscription />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Subscription Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: '123', email: 'test@example.com' } },
    });
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { access_token: 'mock-token' } },
    });
  });

  test('renders subscription page correctly', () => {
    renderSubscription();
    
    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to unlock premium features')).toBeInTheDocument();
    expect(screen.getByText('Unlock the Power of Whale Tracking')).toBeInTheDocument();
  });

  test('displays pricing plans', () => {
    renderSubscription();
    
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('Premium Annual')).toBeInTheDocument();
    
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('$9.99/month')).toBeInTheDocument();
    expect(screen.getByText('$99.99/year')).toBeInTheDocument();
  });

  test('shows plan features correctly', () => {
    renderSubscription();
    
    // Free plan features
    expect(screen.getByText('Basic whale alerts')).toBeInTheDocument();
    expect(screen.getByText('Limited to 10 alerts per day')).toBeInTheDocument();
    
    // Premium features
    expect(screen.getByText('Unlimited whale alerts')).toBeInTheDocument();
    expect(screen.getByText('Real-time notifications')).toBeInTheDocument();
    expect(screen.getByText('Advanced filtering & search')).toBeInTheDocument();
  });

  test('handles free plan selection', async () => {
    renderSubscription();
    
    const freeButton = screen.getByText('Get Started Free');
    fireEvent.click(freeButton);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('users');
    });
  });

  test('handles premium plan checkout', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      }),
    });

    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: '' };

    renderSubscription();
    
    const premiumButtons = screen.getAllByText('Subscribe Now');
    fireEvent.click(premiumButtons[0]); // Click first premium button

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/create-checkout-session'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });
  });

  test('handles checkout error', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Payment failed' }),
    });

    renderSubscription();
    
    const premiumButtons = screen.getAllByText('Subscribe Now');
    fireEvent.click(premiumButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Payment failed')).toBeInTheDocument();
    });
  });

  test('redirects unauthenticated users to login', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
    });

    renderSubscription();
    
    const premiumButtons = screen.getAllByText('Subscribe Now');
    fireEvent.click(premiumButtons[0]);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('displays feature highlights', () => {
    renderSubscription();
    
    expect(screen.getByText('Why Choose Premium?')).toBeInTheDocument();
    expect(screen.getByText('Real-time Alerts')).toBeInTheDocument();
    expect(screen.getByText('Risk Analysis')).toBeInTheDocument();
    expect(screen.getByText('Advanced Filtering')).toBeInTheDocument();
    expect(screen.getByText('Priority Support')).toBeInTheDocument();
  });

  test('shows popular badge on premium monthly', () => {
    renderSubscription();
    
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  test('handles back to home navigation', () => {
    renderSubscription();
    
    const backButton = screen.getByText('Back to Home');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('displays security information', () => {
    renderSubscription();
    
    expect(screen.getByText(/All plans include a 7-day free trial/)).toBeInTheDocument();
    expect(screen.getByText(/Secure payments powered by Stripe/)).toBeInTheDocument();
  });

  test('handles loading states correctly', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderSubscription();
    
    const premiumButtons = screen.getAllByText('Subscribe Now');
    fireEvent.click(premiumButtons[0]);

    // Should show loading state
    expect(screen.getByText('Executing...')).toBeInTheDocument();
  });

  test('handles network errors gracefully', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockRejectedValue(new Error('Network error'));

    renderSubscription();
    
    const premiumButtons = screen.getAllByText('Subscribe Now');
    fireEvent.click(premiumButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Failed to start subscription process')).toBeInTheDocument();
    });
  });
});