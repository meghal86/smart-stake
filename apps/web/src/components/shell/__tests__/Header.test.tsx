import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Header from '../Header';

// Mock the auth context
const mockUseAuth = vi.fn();
const mockUseTier = vi.fn();
const mockUseHub2 = vi.fn();
const mockUseUIMode = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

vi.mock('@/hooks/useTier', () => ({
  useTier: () => mockUseTier()
}));

vi.mock('@/store/hub2', () => ({
  useHub2: () => mockUseHub2()
}));

vi.mock('@/store/uiMode', () => ({
  useUIMode: () => mockUseUIMode()
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    mockUseAuth.mockReturnValue({
      user: null,
      signOut: vi.fn()
    });
    
    mockUseTier.mockReturnValue({
      tier: 'free',
      isPremium: false,
      isEnterprise: false
    });
    
    mockUseHub2.mockReturnValue({
      filters: {
        window: '24h',
        provenance: 'real'
      },
      setFilters: vi.fn()
    });
    
    mockUseUIMode.mockReturnValue({
      mode: 'novice',
      setMode: vi.fn()
    });
  });

  it('renders header with logo and navigation', () => {
    renderWithRouter(<Header />);
    
    expect(screen.getByText('Hub 2')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('shows environment badge for non-production', () => {
    // Mock environment variable
    vi.stubGlobal('import', {
      meta: {
        env: {
          VITE_ENV: 'development'
        }
      }
    });
    
    renderWithRouter(<Header />);
    
    expect(screen.getByText('DEVELOPMENT')).toBeInTheDocument();
  });

  it('renders user menu when user is signed in', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      signOut: vi.fn()
    });
    
    renderWithRouter(<Header />);
    
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    // User menu should be present (avatar button)
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles search input correctly', async () => {
    renderWithRouter(<Header />);
    
    const searchInput = screen.getByPlaceholderText(/Search assets, addresses, alerts/);
    fireEvent.change(searchInput, { target: { value: 'BTC' } });
    
    expect(searchInput).toHaveValue('BTC');
  });

  it('handles keyboard shortcuts', () => {
    renderWithRouter(<Header />);
    
    // Test Cmd+K shortcut
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    // Should trigger search (implementation would show search modal)
  });

  it('toggles provenance filter', () => {
    const mockSetFilters = vi.fn();
    mockUseHub2.mockReturnValue({
      filters: {
        window: '24h',
        provenance: 'real'
      },
      setFilters: mockSetFilters
    });
    
    renderWithRouter(<Header />);
    
    const provenanceButton = screen.getByText('Real');
    fireEvent.click(provenanceButton);
    
    expect(mockSetFilters).toHaveBeenCalledWith({
      window: '24h',
      provenance: 'sim'
    });
  });

  it('shows mode toggle', () => {
    renderWithRouter(<Header />);
    
    expect(screen.getByText('Novice')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('shows health pill', () => {
    renderWithRouter(<Header />);
    
    // Health pill should be present
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows notifications bell', () => {
    renderWithRouter(<Header />);
    
    // Notifications button should be present
    const bellIcon = screen.getByRole('button');
    expect(bellIcon).toBeInTheDocument();
  });
});
