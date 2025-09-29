import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProtectedRoute from '../ProtectedRoute';

// Mock the auth context and hooks
const mockUseAuth = vi.fn();
const mockUseTier = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

vi.mock('@/hooks/useTier', () => ({
  useTier: () => mockUseTier()
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false
    });
    
    mockUseTier.mockReturnValue({
      tier: 'free',
      isPremium: false,
      isEnterprise: false,
      loading: false
    });
  });

  it('renders children when no requirements', () => {
    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows sign in prompt when auth required but no user', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false
    });
    
    renderWithRouter(
      <ProtectedRoute requireAuth>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(screen.getByText('Sign In Required')).toBeInTheDocument();
    expect(screen.getByText('You need to sign in to access this feature.')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('renders children when auth required and user exists', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      loading: false
    });
    
    renderWithRouter(
      <ProtectedRoute requireAuth>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows upgrade prompt when plan required but insufficient', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      loading: false
    });
    
    mockUseTier.mockReturnValue({
      tier: 'free',
      isPremium: false,
      isEnterprise: false,
      loading: false
    });
    
    renderWithRouter(
      <ProtectedRoute requirePlan="premium">
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(screen.getByText('Upgrade Required')).toBeInTheDocument();
    expect(screen.getByText('This feature requires a premium plan or higher.')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to premium')).toBeInTheDocument();
  });

  it('renders children when plan required and user has sufficient plan', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      loading: false
    });
    
    mockUseTier.mockReturnValue({
      tier: 'premium',
      isPremium: true,
      isEnterprise: false,
      loading: false
    });
    
    renderWithRouter(
      <ProtectedRoute requirePlan="premium">
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows enterprise upgrade for enterprise features', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      loading: false
    });
    
    mockUseTier.mockReturnValue({
      tier: 'premium',
      isPremium: true,
      isEnterprise: false,
      loading: false
    });
    
    renderWithRouter(
      <ProtectedRoute requirePlan="enterprise">
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(screen.getByText('Upgrade Required')).toBeInTheDocument();
    expect(screen.getByText('This feature requires a enterprise plan or higher.')).toBeInTheDocument();
  });

  it('shows loading state while checking auth', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true
    });
    
    renderWithRouter(
      <ProtectedRoute requireAuth>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    // Should show loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows loading state while checking tier', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      loading: false
    });
    
    mockUseTier.mockReturnValue({
      tier: 'free',
      isPremium: false,
      isEnterprise: false,
      loading: true
    });
    
    renderWithRouter(
      <ProtectedRoute requirePlan="premium">
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    // Should show loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('uses fallback when provided', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false
    });
    
    renderWithRouter(
      <ProtectedRoute 
        requireAuth 
        fallback={<div>Custom Fallback</div>}
      >
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('handles role requirements', () => {
    mockUseAuth.mockReturnValue({
      user: { 
        id: '1', 
        email: 'test@example.com',
        app_metadata: { role: 'user' }
      },
      loading: false
    });
    
    renderWithRouter(
      <ProtectedRoute requireRole="admin">
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText("You don't have the required permissions to access this feature.")).toBeInTheDocument();
  });

  it('allows access when role requirement is met', () => {
    mockUseAuth.mockReturnValue({
      user: { 
        id: '1', 
        email: 'test@example.com',
        app_metadata: { role: 'admin' }
      },
      loading: false
    });
    
    renderWithRouter(
      <ProtectedRoute requireRole="admin">
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
