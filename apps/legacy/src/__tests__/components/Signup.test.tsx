import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Signup from '../../pages/Signup';
import { supabase } from '../../integrations/supabase/client';

// Mock Supabase
jest.mock('../../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithOAuth: jest.fn(),
    },
  },
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock toast
jest.mock('../../components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const renderSignup = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Signup Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders signup form correctly', () => {
    renderSignup();
    
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByText('Join thousands of traders tracking whale movements')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
  });

  test('renders plan selection cards', () => {
    renderSignup();
    
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });

  test('shows password requirements when typing', () => {
    renderSignup();
    
    const passwordInput = screen.getByPlaceholderText('Create a password');
    fireEvent.change(passwordInput, { target: { value: 'test' } });

    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('One lowercase letter')).toBeInTheDocument();
    expect(screen.getByText('One number')).toBeInTheDocument();
    expect(screen.getByText('One special character')).toBeInTheDocument();
  });

  test('validates password requirements', () => {
    renderSignup();
    
    const passwordInput = screen.getByPlaceholderText('Create a password');
    
    // Test weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    // Requirements should show as not met
    
    // Test strong password
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    // All requirements should be met (green checkmarks)
  });

  test('validates password confirmation', () => {
    renderSignup();
    
    const passwordInput = screen.getByPlaceholderText('Create a password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPass123!' } });

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  test('handles successful signup', async () => {
    const mockSignUp = supabase.auth.signUp as jest.Mock;
    mockSignUp.mockResolvedValue({ 
      data: { user: { id: '123', email: 'test@example.com' } }, 
      error: null 
    });

    renderSignup();
    
    // Fill out form
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Create a password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    const termsCheckbox = screen.getByRole('checkbox');
    const submitButton = screen.getByRole('button', { name: /create.*account/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'StrongPass123!',
        options: {
          data: {
            plan: 'free',
          },
        },
      });
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('handles signup error', async () => {
    const mockSignUp = supabase.auth.signUp as jest.Mock;
    mockSignUp.mockResolvedValue({ 
      data: null, 
      error: { message: 'Email already registered' } 
    });

    renderSignup();
    
    // Fill out form
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Create a password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    const termsCheckbox = screen.getByRole('checkbox');
    const submitButton = screen.getByRole('button', { name: /create.*account/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
  });

  test('prevents submission without terms acceptance', async () => {
    renderSignup();
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Create a password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    const submitButton = screen.getByRole('button', { name: /create.*account/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });
    
    // Don't check terms checkbox
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please accept the Terms of Service and Privacy Policy')).toBeInTheDocument();
    });
  });

  test('handles premium plan selection', () => {
    renderSignup();
    
    const premiumCard = screen.getByText('Premium').closest('div');
    fireEvent.click(premiumCard!);

    // Should show premium features
    expect(screen.getByText('Premium Features')).toBeInTheDocument();
    expect(screen.getByText('• Real-time whale alerts')).toBeInTheDocument();
  });

  test('handles Google OAuth signup', async () => {
    const mockOAuth = supabase.auth.signInWithOAuth as jest.Mock;
    mockOAuth.mockResolvedValue({ error: null });

    renderSignup();
    
    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            plan: 'free',
          },
        },
      });
    });
  });

  test('redirects to subscription for premium signup', async () => {
    const mockSignUp = supabase.auth.signUp as jest.Mock;
    mockSignUp.mockResolvedValue({ 
      data: { user: { id: '123', email: 'test@example.com' } }, 
      error: null 
    });

    renderSignup();
    
    // Select premium plan
    const premiumCard = screen.getByText('Premium').closest('div');
    fireEvent.click(premiumCard!);

    // Fill out form
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Create a password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    const termsCheckbox = screen.getByRole('checkbox');
    const submitButton = screen.getByRole('button', { name: /create premium account/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/subscription?plan=premium');
    });
  });
});