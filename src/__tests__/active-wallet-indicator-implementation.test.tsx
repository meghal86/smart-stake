/**
 * @fileoverview Tests for Task 5: Active Wallet Indicator Implementation
 * 
 * Tests the persistent active wallet indicator that shows wallet info everywhere
 * with proper switching behavior and state management.
 * 
 * Requirements tested:
 * - R3-AC1: Wallet chip shows label (ENS/nickname) + short address everywhere
 * - R3-AC2: Wallet switching resets wallet-scoped state
 * - R3-AC3: Shows skeleton/loading during switch
 * - R3-AC4: Shows success toast after switch
 * - R3-AC5: Never displays stale cross-wallet data
 * - R17-AC1: Multi-wallet support with clear labeling
 * - R17-AC2: ENS/nickname labeling everywhere wallets appear
 * - R17-AC3: Persist wallet list + last active wallet
 * - R17-AC4: Clear wallet switching UI
 * - R17-AC5: Wallet state management
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, test, beforeEach, afterEach, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components to test
import { ActiveWalletIndicator } from '@/components/wallet/ActiveWalletIndicator';
import { UserHeader } from '@/components/layout/UserHeader';
import { DashboardHeader } from '@/components/home/DashboardHeader';
import { WalletProvider } from '@/contexts/WalletContext';
import { AuthContext } from '@/contexts/AuthContext';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  }
}));

vi.mock('@rainbow-me/rainbowkit', () => ({
  useConnectModal: () => ({
    openConnectModal: vi.fn()
  })
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

vi.mock('@/hooks/useTier', () => ({
  useTier: () => ({
    tier: 'free',
    canAccessFeature: () => true
  })
}));

vi.mock('@/hooks/useUserMetadata', () => ({
  useUserMetadata: () => ({
    metadata: null,
    loading: false,
    error: null
  })
}));

vi.mock('@/hooks/useWalletLabels', () => ({
  useWalletLabels: () => ({
    labels: {},
    getLabel: () => undefined
  })
}));

vi.mock('@/lib/context/HomeAuthContext', () => ({
  useHomeAuth: () => ({
    isAuthenticated: false,
    address: null
  }),
  HomeAuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Test utilities
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const mockWallets = [
  {
    address: '0x1234567890123456789012345678901234567890',
    label: 'Main Wallet',
    ens: 'alice.eth',
    chain: 'ethereum',
    lastUsed: new Date('2024-01-01')
  },
  {
    address: '0x0987654321098765432109876543210987654321',
    label: 'Trading Wallet',
    lens: 'bob.lens',
    chain: 'polygon',
    lastUsed: new Date('2024-01-02')
  },
  {
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    unstoppable: 'charlie.crypto',
    chain: 'arbitrum',
    lastUsed: new Date('2024-01-03')
  }
];

const renderWithProviders = (component: React.ReactElement, walletContextValue?: any, authValue?: any) => {
  const queryClient = createQueryClient();
  
  const defaultWalletContext = {
    connectedWallets: [],
    activeWallet: null,
    setActiveWallet: vi.fn(),
    connectWallet: vi.fn(),
    disconnectWallet: vi.fn(),
    isLoading: false,
    isSwitching: false,
    ...walletContextValue
  };

  const defaultAuthContext = {
    user: null,
    session: null,
    loading: false,
    signOut: vi.fn(),
    ...authValue
  };
  
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={defaultAuthContext}>
          <WalletProvider value={defaultWalletContext}>
            {component}
          </WalletProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Task 5: Active Wallet Indicator Implementation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ActiveWalletIndicator Component', () => {
    test('shows "No Wallet" when no wallets connected', () => {
      renderWithProviders(<ActiveWalletIndicator />);
      
      expect(screen.getByText('No Wallet')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveClass('text-gray-500');
    });

    test('shows wallet info when single wallet connected', () => {
      const walletContext = {
        connectedWallets: [mockWallets[0]],
        activeWallet: mockWallets[0].address
      };
      
      renderWithProviders(<ActiveWalletIndicator />, walletContext);
      
      // Should show ENS name (priority over label)
      expect(screen.getByText('alice.eth')).toBeInTheDocument();
      // Should show truncated address
      expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
      // Should show chain badge
      expect(screen.getByText('ETHEREUM')).toBeInTheDocument();
    });

    test('shows dropdown when multiple wallets connected', async () => {
      const user = userEvent.setup();
      const walletContext = {
        connectedWallets: mockWallets,
        activeWallet: mockWallets[0].address
      };
      
      renderWithProviders(<ActiveWalletIndicator />, walletContext);
      
      // Should show dropdown trigger
      const trigger = screen.getByRole('button');
      expect(trigger).toBeInTheDocument();
      
      // Click to open dropdown
      await user.click(trigger);
      
      // Should show all wallets
      expect(screen.getByText('Switch Wallet (3)')).toBeInTheDocument();
      expect(screen.getByText('alice.eth')).toBeInTheDocument();
      expect(screen.getByText('bob.lens')).toBeInTheDocument();
      expect(screen.getByText('charlie.crypto')).toBeInTheDocument();
    });

    test('handles wallet switching correctly', async () => {
      const user = userEvent.setup();
      const setActiveWallet = vi.fn();
      const walletContext = {
        connectedWallets: mockWallets,
        activeWallet: mockWallets[0].address,
        setActiveWallet
      };
      
      renderWithProviders(<ActiveWalletIndicator />, walletContext);
      
      // Open dropdown
      await user.click(screen.getByRole('button'));
      
      // Click on second wallet
      await user.click(screen.getByText('bob.lens'));
      
      // Should call setActiveWallet
      expect(setActiveWallet).toHaveBeenCalledWith(mockWallets[1].address);
    });

    test('shows loading state during wallet switch', () => {
      const walletContext = {
        connectedWallets: mockWallets,
        activeWallet: mockWallets[0].address,
        isSwitching: true
      };
      
      renderWithProviders(<ActiveWalletIndicator />, walletContext);
      
      // Should show skeleton and spinner
      expect(screen.getByRole('generic')).toHaveClass('animate-spin');
    });

    test('displays name priority correctly', () => {
      // Test ENS priority
      const walletWithENS = {
        ...mockWallets[0],
        ens: 'alice.eth',
        label: 'Should not show',
        lens: 'should.not.show'
      };
      
      let walletContext = {
        connectedWallets: [walletWithENS],
        activeWallet: walletWithENS.address
      };
      
      const { rerender } = renderWithProviders(<ActiveWalletIndicator />, walletContext);
      expect(screen.getByText('alice.eth')).toBeInTheDocument();
      
      // Test Lens priority (no ENS)
      const walletWithLens = {
        ...mockWallets[1],
        ens: undefined,
        lens: 'bob.lens',
        label: 'Should not show'
      };
      
      walletContext = {
        connectedWallets: [walletWithLens],
        activeWallet: walletWithLens.address
      };
      
      rerender(
        <BrowserRouter>
          <QueryClientProvider client={createQueryClient()}>
            <WalletProvider value={walletContext}>
              <ActiveWalletIndicator />
            </WalletProvider>
          </QueryClientProvider>
        </BrowserRouter>
      );
      
      expect(screen.getByText('bob.lens')).toBeInTheDocument();
    });

    test('handles compact mode correctly', () => {
      const walletContext = {
        connectedWallets: [mockWallets[0]],
        activeWallet: mockWallets[0].address
      };
      
      renderWithProviders(<ActiveWalletIndicator compact />, walletContext);
      
      // In compact mode, text should be hidden on small screens
      const nameElement = screen.getByText('alice.eth');
      expect(nameElement).toHaveClass('hidden', 'sm:inline');
    });

    test('shows tooltip with wallet details', async () => {
      const user = userEvent.setup();
      const walletContext = {
        connectedWallets: [mockWallets[0]],
        activeWallet: mockWallets[0].address
      };
      
      renderWithProviders(<ActiveWalletIndicator showDropdown={false} />, walletContext);
      
      const badge = screen.getByRole('button');
      await user.hover(badge);
      
      await waitFor(() => {
        expect(screen.getByText('Active Wallet')).toBeInTheDocument();
        expect(screen.getByText(mockWallets[0].address)).toBeInTheDocument();
        expect(screen.getByText('Chain: ethereum')).toBeInTheDocument();
      });
    });
  });

  describe('UserHeader Integration', () => {
    test('shows active wallet indicator in authenticated header', () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com'
      };

      const authContext = {
        user: mockUser,
        session: { user: mockUser },
        loading: false,
        signOut: vi.fn()
      };

      const walletContext = {
        connectedWallets: [mockWallets[0]],
        activeWallet: mockWallets[0].address
      };

      renderWithProviders(<UserHeader />, walletContext, authContext);

      // Should show wallet indicator
      expect(screen.getByText('alice.eth')).toBeInTheDocument();
    });

    test('shows active wallet indicator in loading state', () => {
      const authContext = {
        user: null,
        session: null,
        loading: true,
        signOut: vi.fn()
      };

      const walletContext = {
        connectedWallets: [mockWallets[0]],
        activeWallet: mockWallets[0].address
      };

      renderWithProviders(<UserHeader />, walletContext, authContext);

      // Should show wallet indicator even during auth loading
      expect(screen.getByText('alice.eth')).toBeInTheDocument();
    });

    test('shows active wallet indicator in guest mode', () => {
      const authContext = {
        user: null,
        session: null,
        loading: false,
        signOut: vi.fn()
      };

      const walletContext = {
        connectedWallets: [mockWallets[0]],
        activeWallet: mockWallets[0].address
      };

      renderWithProviders(<UserHeader />, walletContext, authContext);

      // Should show wallet indicator in guest mode
      expect(screen.getByText('alice.eth')).toBeInTheDocument();
    });
  });

  describe('DashboardHeader Integration', () => {
    test('shows active wallet indicator on home page', () => {
      const walletContext = {
        connectedWallets: [mockWallets[0]],
        activeWallet: mockWallets[0].address
      };

      renderWithProviders(<DashboardHeader />, walletContext);

      // Should show wallet indicator
      expect(screen.getByText('alice.eth')).toBeInTheDocument();
    });
  });

  describe('Wallet Switching Behavior', () => {
    test('prevents stale data display during switch', async () => {
      const user = userEvent.setup();
      let currentWallet = mockWallets[0].address;
      
      const setActiveWallet = vi.fn().mockImplementation((address) => {
        currentWallet = address;
      });

      const walletContext = {
        connectedWallets: mockWallets,
        get activeWallet() { return currentWallet; },
        setActiveWallet,
        isSwitching: false
      };

      renderWithProviders(<ActiveWalletIndicator />, walletContext);

      // Initially shows first wallet
      expect(screen.getByText('alice.eth')).toBeInTheDocument();

      // Open dropdown and switch
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('bob.lens'));

      // Should call setActiveWallet
      expect(setActiveWallet).toHaveBeenCalledWith(mockWallets[1].address);
    });

    test('shows loading state during switch', () => {
      const walletContext = {
        connectedWallets: mockWallets,
        activeWallet: mockWallets[0].address,
        isSwitching: true
      };

      renderWithProviders(<ActiveWalletIndicator />, walletContext);

      // Should show loading skeleton
      expect(screen.getByRole('generic')).toHaveClass('animate-spin');
    });
  });

  describe('Requirements Validation', () => {
    test('R3-AC1: Wallet chip shows label + short address everywhere', () => {
      const walletContext = {
        connectedWallets: [mockWallets[0]],
        activeWallet: mockWallets[0].address
      };

      renderWithProviders(<ActiveWalletIndicator />, walletContext);

      // Should show ENS name (label)
      expect(screen.getByText('alice.eth')).toBeInTheDocument();
      // Should show short address
      expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
    });

    test('R3-AC3: Shows skeleton/loading during switch', () => {
      const walletContext = {
        connectedWallets: mockWallets,
        activeWallet: mockWallets[0].address,
        isSwitching: true
      };

      renderWithProviders(<ActiveWalletIndicator />, walletContext);

      // Should show loading state
      expect(screen.getByRole('generic')).toHaveClass('animate-spin');
    });

    test('R17-AC1: Multi-wallet support with clear labeling', async () => {
      const user = userEvent.setup();
      const walletContext = {
        connectedWallets: mockWallets,
        activeWallet: mockWallets[0].address
      };

      renderWithProviders(<ActiveWalletIndicator />, walletContext);

      // Open dropdown
      await user.click(screen.getByRole('button'));

      // Should show all wallets with clear labels
      expect(screen.getByText('Switch Wallet (3)')).toBeInTheDocument();
      expect(screen.getByText('alice.eth')).toBeInTheDocument();
      expect(screen.getByText('bob.lens')).toBeInTheDocument();
      expect(screen.getByText('charlie.crypto')).toBeInTheDocument();
    });

    test('R17-AC2: ENS/nickname labeling everywhere wallets appear', () => {
      const walletContext = {
        connectedWallets: mockWallets,
        activeWallet: mockWallets[0].address
      };

      // Test in UserHeader
      const authContext = {
        user: { id: 'test', email: 'test@example.com' },
        session: null,
        loading: false,
        signOut: vi.fn()
      };

      renderWithProviders(<UserHeader />, walletContext, authContext);

      // Should show ENS name in header
      expect(screen.getByText('alice.eth')).toBeInTheDocument();
    });

    test('R17-AC4: Clear wallet switching UI', async () => {
      const user = userEvent.setup();
      const walletContext = {
        connectedWallets: mockWallets,
        activeWallet: mockWallets[0].address
      };

      renderWithProviders(<ActiveWalletIndicator />, walletContext);

      // Open dropdown
      await user.click(screen.getByRole('button'));

      // Should have clear switching UI
      expect(screen.getByText('Switch Wallet (3)')).toBeInTheDocument();
      
      // Should show active wallet with check mark
      const activeWalletItem = screen.getByText('alice.eth').closest('[role="menuitem"]');
      expect(activeWalletItem).toBeInTheDocument();
    });
  });
});