import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserMenu from '../UserMenu';

// Mock the auth context and hooks
const mockUseAuth = vi.fn();
const mockUseTier = vi.fn();
const mockUseUserMetadata = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

vi.mock('@/hooks/useTier', () => ({
  useTier: () => mockUseTier()
}));

vi.mock('@/hooks/useUserMetadata', () => ({
  useUserMetadata: () => mockUseUserMetadata()
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      signOut: vi.fn()
    });
    
    mockUseTier.mockReturnValue({
      isPremium: false,
      isEnterprise: false
    });
    
    mockUseUserMetadata.mockReturnValue({
      metadata: {
        profile: {
          name: 'John Doe',
          avatar_url: 'https://example.com/avatar.jpg'
        }
      }
    });
  });

  it('renders user avatar and name', () => {
    const mockUser = {
      id: '1',
      email: 'john@example.com',
      user_metadata: {
        full_name: 'John Doe'
      }
    };
    
    renderWithRouter(<UserMenu user={mockUser} tier="premium" />);
    
    // Click to open menu
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('shows tier badge correctly', () => {
    const mockUser = {
      id: '1',
      email: 'john@example.com'
    };
    
    renderWithRouter(<UserMenu user={mockUser} tier="premium" />);
    
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    expect(screen.getByText('premium')).toBeInTheDocument();
  });

  it('shows enterprise features for enterprise users', () => {
    mockUseTier.mockReturnValue({
      isPremium: true,
      isEnterprise: true
    });
    
    const mockUser = {
      id: '1',
      email: 'john@example.com'
    };
    
    renderWithRouter(<UserMenu user={mockUser} tier="enterprise" />);
    
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    expect(screen.getByText('API Keys')).toBeInTheDocument();
  });

  it('handles sign out correctly', async () => {
    const mockSignOut = vi.fn();
    mockUseAuth.mockReturnValue({
      signOut: mockSignOut
    });
    
    const mockUser = {
      id: '1',
      email: 'john@example.com'
    };
    
    renderWithRouter(<UserMenu user={mockUser} tier="free" />);
    
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    const signOutButton = screen.getByText('Sign out');
    fireEvent.click(signOutButton);
    
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('shows loading state during sign out', async () => {
    const mockSignOut = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    mockUseAuth.mockReturnValue({
      signOut: mockSignOut
    });
    
    const mockUser = {
      id: '1',
      email: 'john@example.com'
    };
    
    renderWithRouter(<UserMenu user={mockUser} tier="free" />);
    
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    const signOutButton = screen.getByText('Sign out');
    fireEvent.click(signOutButton);
    
    expect(screen.getByText('Signing out...')).toBeInTheDocument();
  });

  it('navigates to correct routes on menu item click', () => {
    const mockUser = {
      id: '1',
      email: 'john@example.com'
    };
    
    renderWithRouter(<UserMenu user={mockUser} tier="free" />);
    
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    // Check that menu items are present
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Plans & Billing')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('handles missing user metadata gracefully', () => {
    mockUseUserMetadata.mockReturnValue({
      metadata: null
    });
    
    const mockUser = {
      id: '1',
      email: 'john@example.com'
    };
    
    renderWithRouter(<UserMenu user={mockUser} tier="free" />);
    
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    // Should show fallback name from email
    expect(screen.getByText('john')).toBeInTheDocument();
  });
});
